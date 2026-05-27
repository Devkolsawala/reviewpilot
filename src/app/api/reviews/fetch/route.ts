import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPlayStoreReviews } from "@/lib/google/playstore";
import { processAutoReplyForReview } from "@/lib/reviews/auto-reply";
import { GBP_ENABLED, GBP_COMING_SOON_MESSAGE } from "@/lib/feature-flags";
import { extractCountryFromLocale } from "@/lib/utils/locale-to-country";
import type { AppContext } from "@/types/database";

// Hobby plan: opt into the 60s function budget. The Worker-triggered sync can
// take time when there are many new reviews to draft + publish — 10s default
// is too tight for the full pipeline.
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { connectionId } = body;

  if (!connectionId) {
    return NextResponse.json(
      { error: "connectionId is required" },
      { status: 400 }
    );
  }

  const { data: connection, error: connError } = await supabase
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (connError || !connection) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  if (connection.type === "google_business" && !GBP_ENABLED) {
    return NextResponse.json(
      { error: GBP_COMING_SOON_MESSAGE },
      { status: 503 }
    );
  }
  if (connection.type !== "play_store") {
    return NextResponse.json(
      { error: "Only Play Store sync supported currently" },
      { status: 400 }
    );
  }

  // Fetch app context BEFORE credential check — needed for auto-reply even if sync fails
  const { data: appContextRow } = await supabase
    .from("app_contexts")
    .select("*")
    .eq("connection_id", connectionId)
    .maybeSingle();

  // ── Step 1: Sync new reviews from Play Store (non-fatal if package name missing) ──
  let fetchedReviews: Awaited<ReturnType<typeof fetchPlayStoreReviews>> = [];
  let syncError: string | null = null;

  console.log(`[FETCH] Starting sync for connection ${connectionId}`);
  console.log(`[FETCH] Connection type: ${connection.type}, package: ${connection.external_id || "MISSING"}`);
  console.log(`[FETCH] Credentials: ${connection.credentials ? "user-provided" : "shared env fallback"}`);

  if (!connection.external_id) {
    syncError = "Connection is missing a package name. Re-connect to enable syncing.";
    console.log("[FETCH] No package name — skipping Play Store fetch, will still process pending reviews.");
  } else {
    try {
      // connection.credentials is null for Invite Email method → lib falls back to shared env credentials
      fetchedReviews = await fetchPlayStoreReviews(
        connection.external_id,
        connection.credentials as Record<string, unknown> | null
      );
      console.log(`[FETCH] Received ${fetchedReviews.length} reviews from Play Store`);
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      console.error("[FETCH] Play Store fetch error:", e);
      if (e.code === 403) {
        syncError =
          "Permission denied. Make sure the service account is invited in Play Console with 'Reply to reviews' permission.";
      } else if (e.code === 401) {
        syncError =
          "Authentication failed. The service account credentials may be invalid or revoked.";
      } else if (e.code === 404) {
        syncError = `App not found. Double-check the package name '${connection.external_id}'.`;
      } else if (e.message) {
        syncError = `Play Store API error: ${e.message}`;
      } else {
        syncError = "Failed to fetch reviews from Play Store.";
      }
    }
  }

  // ── Step 2: Upsert fetched reviews and auto-reply new unanswered ones ────────
  let newUnansweredCount = 0;  // new reviews without a Play Store reply
  let alreadyRepliedCount = 0; // new reviews that already had a developer reply on Play Store
  let updatedCount = 0;
  let autoDrafted = 0;
  let autoPublished = 0;

  const nowIso = new Date().toISOString();

  for (const review of fetchedReviews) {
    // Look up existing row purely to drive bookkeeping (newUnanswered vs
    // updated counts and auto-reply triggering). The actual write is an
    // upsert on (connection_id, external_review_id) so a corrected
    // external_review_id naturally dedupes against the gp: row instead of
    // creating a duplicate the way the old select-then-insert path did.
    const { data: existing } = await supabase
      .from("reviews")
      .select("id, review_text, author_name, rating, sentiment, reply_status, reply_text, reply_published_at, is_auto_replied, is_read, original_rating, recovery_status")
      .eq("connection_id", connectionId)
      .eq("external_review_id", review.external_review_id)
      .maybeSingle();

    // Decide which Google-side fields are safe to overwrite. NEVER clobber
    // our own derived / drafted state: sentiment, keywords, is_read, or a
    // reply_text we drafted/published ourselves.
    const ourDraftOrReply = !!existing && (
      existing.reply_status === "drafted"
      || (existing.reply_status === "published" && existing.is_auto_replied)
    );
    const shouldPullGoogleReply =
      !!review.reply_text
      && !ourDraftOrReply
      && review.reply_text !== existing?.reply_text;

    const upsertRow: Record<string, unknown> = {
      connection_id: connectionId,
      source: review.source,
      external_review_id: review.external_review_id,
      author_name: review.author_name,
      rating: review.rating,
      review_text: review.review_text,
      review_language: review.review_language,
      reviewer_country: extractCountryFromLocale(review.review_language),
      device_info: review.device_info ?? null,
      review_created_at: review.review_created_at,
      last_seen_in_api_at: nowIso,
      // App version (migration 039). Carried on every upsert (new and existing
      // rows) so the column backfills naturally as the cron re-sees reviews,
      // and updates if the user upgraded the app + re-edited the review.
      // Pure data plumbing — no orchestration change. Both may be NULL when
      // Google's API didn't return version metadata (per their docs).
      app_version_name: review.app_version_name ?? null,
      app_version_code: review.app_version_code ?? null,
    };
    // Detect upstream edit BEFORE the upsert (since the upsert will overwrite
    // rating / review_text). If the reviewer changed text or rating on the
    // store side, we stamp edited_at and realign sentiment further down.
    const textChanged =
      !!existing && (existing.review_text || "") !== (review.review_text || "");
    const ratingChanged =
      !!existing &&
      typeof review.rating === "number" &&
      existing.rating !== review.rating;
    const wasEdited = textChanged || ratingChanged;

    if (!existing) {
      // First time we've seen this review — set sentiment/keywords/reply state
      // from the transformed row, AND snapshot the baseline rating for
      // passive recovery detection. original_rating must NEVER change after
      // this point, so we only set it here in the !existing branch.
      upsertRow.sentiment = review.sentiment;
      upsertRow.keywords = review.keywords;
      upsertRow.reply_status = review.reply_status;
      upsertRow.reply_text = review.reply_text ?? null;
      upsertRow.reply_published_at = review.reply_published_at ?? null;
      upsertRow.is_read = review.is_read ?? false;
      upsertRow.original_rating = review.rating;
    } else if (shouldPullGoogleReply) {
      upsertRow.reply_text = review.reply_text;
      upsertRow.reply_status = review.reply_status;
      upsertRow.reply_published_at = review.reply_published_at ?? null;
    }
    if (wasEdited) {
      // Stamp + realign sentiment in the same upsert so the inbox row reflects
      // the new state immediately. Keep 'mixed' if it was deliberately set.
      upsertRow.edited_at = nowIso;
      if (ratingChanged && typeof review.rating === "number") {
        upsertRow.sentiment =
          existing!.sentiment === "mixed"
            ? "mixed"
            : review.rating >= 4
              ? "positive"
              : review.rating <= 2
                ? "negative"
                : "neutral";
      }
    }

    const { data: upserted, error: upsertError } = await supabase
      .from("reviews")
      .upsert(upsertRow, { onConflict: "connection_id,external_review_id" })
      .select(
        "id, source, external_review_id, author_name, rating, review_text, review_language, sentiment, keywords, review_created_at, reply_status"
      )
      .single();

    if (upsertError || !upserted) {
      if (upsertError) console.error(`[FETCH] Upsert error for ${review.external_review_id}:`, upsertError.message);
      continue;
    }

    if (existing) {
      const reviewTextChanged = existing.review_text !== review.review_text;
      if (reviewTextChanged || shouldPullGoogleReply) updatedCount++;
      continue;
    }

    if (upserted.reply_status === "pending") {
      newUnansweredCount++;
      console.log(`[FETCH] Inserted unanswered review by ${review.author_name} (${review.rating}★, id: ${review.external_review_id})`);

      // Only auto-reply for reviews that are actually unanswered
      if (appContextRow) {
        const outcome = await processAutoReplyForReview(
          supabase,
          {
            id: connection.id,
            type: connection.type,
            credentials: connection.credentials as Record<string, unknown> | null,
            external_id: connection.external_id,
          },
          upserted,
          appContextRow as AppContext
        );
        if (outcome === "drafted") autoDrafted++;
        if (outcome === "published") autoPublished++;
      }
    } else {
      alreadyRepliedCount++;
      console.log(`[FETCH] Inserted already-replied review by ${review.author_name} (${review.rating}★, id: ${review.external_review_id})`);
    }
  }

  // ── Step 2.5: PASSIVE RECOVERY DETECTION ─────────────────────────────────────
  // Mirror of the cron poll-reviews logic. For every fetched review that's
  // already in our DB at recovery_status='monitoring', check whether its
  // current rating has climbed to 4+. If so, flip to 'recovered' and realign
  // sentiment. Absence from the API isn't a signal — Play only returns ~1
  // week — so this is strictly a "saw it again" check.
  try {
    const fetchedIds = fetchedReviews.map((r) => r.external_review_id);
    if (fetchedIds.length > 0) {
      const { data: monitoredRows } = await supabase
        .from("reviews")
        .select("id, external_review_id, original_rating")
        .eq("connection_id", connectionId)
        .eq("recovery_status", "monitoring")
        .in("external_review_id", fetchedIds);

      if (monitoredRows && monitoredRows.length > 0) {
        const fetchedByExt = new Map(
          fetchedReviews.map((r) => [r.external_review_id, r])
        );
        let recoveredCount = 0;
        for (const row of monitoredRows) {
          const live = fetchedByExt.get(row.external_review_id);
          if (!live) continue;
          const newRating = live.rating;
          const baseline = row.original_rating;
          if (
            typeof newRating === "number" &&
            newRating >= 4 &&
            typeof baseline === "number" &&
            baseline <= 3
          ) {
            const { error: upErr } = await supabase
              .from("reviews")
              .update({
                rating: newRating,
                sentiment: "positive",
                recovery_status: "recovered",
                recovery_detected_at: nowIso,
              })
              .eq("id", row.id);
            if (!upErr) recoveredCount++;
          }
        }
        if (recoveredCount > 0) {
          console.log(
            `[FETCH] Recovery detected: ${recoveredCount} review(s) climbed to 4+ stars`
          );
        }
      }
    }
  } catch (recErr: unknown) {
    const re = recErr as { message?: string };
    console.error("[FETCH] Recovery detection error (non-fatal):", re.message);
  }

  // ── Step 3: Process EXISTING pending reviews when auto-reply is enabled ───────
  // This is the critical fix: reviews already in Supabase but never auto-replied
  // (e.g. from before auto-reply was enabled, or from a manual sync that predates this feature).
  const autoReplyMode = appContextRow?.auto_reply_mode ?? "manual";
  if (appContextRow?.auto_reply_enabled && autoReplyMode !== "manual") {
    console.log("[sync] Auto-reply ON — processing existing pending reviews...");

    const { data: pendingRows, error: pendErr } = await supabase
      .from("reviews")
      .select(
        "id, source, external_review_id, author_name, rating, review_text, review_language, sentiment, keywords, review_created_at, reply_text"
      )
      .eq("connection_id", connectionId)
      .eq("reply_status", "pending")
      .limit(50);

    if (pendErr) {
      console.error("[sync] Pending query error:", pendErr.message);
    } else {
      for (const row of pendingRows ?? []) {
        // Skip if already has draft reply text
        if (row.reply_text && String(row.reply_text).trim()) continue;

        try {
          const outcome = await processAutoReplyForReview(
            supabase,
            {
              id: connection.id,
              type: connection.type,
              credentials: connection.credentials as Record<string, unknown> | null,
              external_id: connection.external_id,
            },
            row,
            appContextRow as AppContext
          );
          if (outcome === "drafted") autoDrafted++;
          if (outcome === "published") autoPublished++;
        } catch (e: unknown) {
          const err = e as { message?: string };
          console.error("[sync] Auto-reply for pending row failed:", err.message);
        }
      }
    }
  }

  // ── Step 4: Update connection metadata ───────────────────────────────────────
  const connectionUpdate: Record<string, unknown> = {
    last_synced_at: nowIso,
    review_count: (connection.review_count ?? 0) + newUnansweredCount,
  };
  // Stamp first-sync timestamp once, on the first successful full sweep.
  if (!connection.initial_sync_completed_at && !syncError) {
    connectionUpdate.initial_sync_completed_at = nowIso;
  }
  await supabase
    .from("connections")
    .update(connectionUpdate)
    .eq("id", connectionId);

  // ── Step 5: Fire-and-forget auto-classification kickoff ─────────────────────
  // Runs ONLY at the end of the handler, AFTER all critical sync work. Feature-
  // flagged off by default so the code ships dark. Uses `void fetch(...)` so
  // Vercel keeps the function alive just long enough to send the request, but
  // we never wait for it — classification runs in a separate function
  // invocation with its own 60s budget and self-chains for large batches.
  //
  // CRITICAL: under no circumstances may this block alter the response shape
  // returned to the Cloudflare Worker, add latency, or surface errors.
  const AUTO_CLASSIFY_ENABLED = process.env.AUTO_CLASSIFY_ON_SYNC === "true";
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  const shouldKickClassify =
    AUTO_CLASSIFY_ENABLED && !isMockMode && newUnansweredCount > 0;

  if (shouldKickClassify) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const cronSecret = process.env.CRON_SECRET;
    if (appUrl && cronSecret) {
      try {
        void fetch(`${appUrl}/api/internal/classify-insights`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cronSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            batchSize: 15,
            userId: connection.user_id,
            chainCount: 0,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              console.error(
                "[auto_classify_kickoff] non-ok response",
                res.status
              );
            }
          })
          .catch((err) =>
            console.error("[auto_classify_kickoff] failed", err)
          );
      } catch (err) {
        // Defense-in-depth — `void fetch` shouldn't throw synchronously, but
        // if anything does we swallow it so the sync response is unaffected.
        console.error("[auto_classify_kickoff] threw", err);
      }
    }
  }

  console.log(
    `[play_store_sync] connection=${connectionId} reviews_seen=${fetchedReviews.length} new=${newUnansweredCount} updated=${updatedCount} auto_drafted=${autoDrafted} auto_published=${autoPublished} auto_classify_kicked=${shouldKickClassify ? "yes" : "no"}`
  );

  // Return sync error only if nothing was processed at all
  if (syncError && newUnansweredCount === 0 && autoDrafted === 0 && autoPublished === 0) {
    return NextResponse.json({ error: syncError, fetchedCount: 0, autoDrafted, autoPublished });
  }

  return NextResponse.json({
    success: true,
    totalFetched: fetchedReviews.length,
    newReviews: newUnansweredCount,
    alreadyReplied: alreadyRepliedCount,
    updatedReviews: updatedCount,
    autoDrafted,
    autoPublished,
    syncError: syncError ?? undefined,
    message: `Found ${newUnansweredCount} new unanswered review${newUnansweredCount === 1 ? "" : "s"}`,
  });
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");
  const source = searchParams.get("source");
  const status = searchParams.get("status");
  const rating = searchParams.get("rating");

  let query = supabase
    .from("reviews")
    .select("*")
    .order("review_created_at", { ascending: false })
    .limit(100);

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }
  if (source && source !== "all") {
    query = query.eq("source", source);
  }
  if (status && status !== "all") {
    query = query.eq("reply_status", status);
  }
  if (rating && rating !== "all") {
    query = query.eq("rating", parseInt(rating));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data });
}
