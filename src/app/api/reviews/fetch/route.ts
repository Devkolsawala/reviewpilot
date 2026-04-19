import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPlayStoreReviews } from "@/lib/google/playstore";
import { processAutoReplyForReview } from "@/lib/reviews/auto-reply";
import { GBP_ENABLED, GBP_COMING_SOON_MESSAGE } from "@/lib/feature-flags";
import type { AppContext } from "@/types/database";

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
    const { data: existing } = await supabase
      .from("reviews")
      .select("id, review_text, author_name, reply_status, reply_text, reply_published_at, is_auto_replied")
      .eq("connection_id", connectionId)
      .eq("external_review_id", review.external_review_id)
      .maybeSingle();

    if (existing) {
      // Re-seeing a stored review. Update only Google-sourced fields that can
      // legitimately change. NEVER overwrite our own derived/drafted fields:
      // sentiment, keywords, is_read, or a reply_text we drafted ourselves.
      const update: Record<string, unknown> = { last_seen_in_api_at: nowIso };
      let changed = false;
      if (existing.review_text !== review.review_text) {
        update.review_text = review.review_text;
        update.rating = review.rating;
        update.review_created_at = review.review_created_at;
        changed = true;
      }
      if (existing.author_name !== review.author_name && review.author_name) {
        update.author_name = review.author_name;
        changed = true;
      }
      // Only pull in Google-side reply changes if WE didn't draft/publish it ourselves.
      const ourDraftOrReply = existing.reply_status === "drafted"
        || (existing.reply_status === "published" && existing.is_auto_replied);
      if (!ourDraftOrReply) {
        if (review.reply_text && review.reply_text !== existing.reply_text) {
          update.reply_text = review.reply_text;
          update.reply_status = review.reply_status;
          update.reply_published_at = review.reply_published_at ?? null;
          changed = true;
        }
      }
      await supabase
        .from("reviews")
        .update(update)
        .eq("id", existing.id);
      if (changed) updatedCount++;
      continue;
    }

    // Include reply_status, reply_text, reply_published_at, is_read so that
    // reviews already answered on Play Store are stored as 'published' (not 'pending').
    const { data: inserted, error: insertError } = await supabase
      .from("reviews")
      .insert({
        connection_id: connectionId,
        source: review.source,
        external_review_id: review.external_review_id,
        author_name: review.author_name,
        rating: review.rating,
        review_text: review.review_text,
        review_language: review.review_language,
        device_info: review.device_info ?? null,
        sentiment: review.sentiment,
        keywords: review.keywords,
        review_created_at: review.review_created_at,
        reply_status: review.reply_status,
        reply_text: review.reply_text ?? null,
        reply_published_at: review.reply_published_at ?? null,
        is_read: review.is_read ?? false,
        last_seen_in_api_at: nowIso,
      })
      .select(
        "id, source, external_review_id, author_name, rating, review_text, review_language, sentiment, keywords, review_created_at, reply_status"
      )
      .single();

    if (insertError || !inserted) {
      if (insertError) console.error(`[FETCH] Insert error for ${review.external_review_id}:`, insertError.message);
      continue;
    }

    if (inserted.reply_status === "pending") {
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
          inserted,
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

  console.log(
    `[play_store_sync] connection=${connectionId} reviews_seen=${fetchedReviews.length} new=${newUnansweredCount} updated=${updatedCount} auto_drafted=${autoDrafted} auto_published=${autoPublished}`
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
