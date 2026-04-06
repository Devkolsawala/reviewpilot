import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPlayStoreReviews } from "@/lib/google/playstore";
import { processAutoReplyForReview } from "@/lib/reviews/auto-reply";
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

  // ── Step 1: Sync new reviews from Play Store (non-fatal if credentials missing) ──
  let fetchedReviews: Awaited<ReturnType<typeof fetchPlayStoreReviews>> = [];
  let syncError: string | null = null;

  if (!connection.credentials || !connection.external_id) {
    syncError = "Connection is missing credentials or package name. Re-connect to enable syncing.";
    console.log("[sync] No credentials — skipping Play Store fetch, will still process pending reviews.");
  } else {
    try {
      fetchedReviews = await fetchPlayStoreReviews(
        connection.credentials,
        connection.external_id
      );
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      console.error("[sync] Play Store fetch error:", e);
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

  // ── Step 2: Upsert fetched reviews and auto-reply new ones ───────────────────
  let newCount = 0;
  let updatedCount = 0;
  let autoDrafted = 0;
  let autoPublished = 0;

  for (const review of fetchedReviews) {
    const { data: existing } = await supabase
      .from("reviews")
      .select("id, review_text")
      .eq("connection_id", connectionId)
      .eq("external_review_id", review.external_review_id)
      .maybeSingle();

    if (existing) {
      if (existing.review_text !== review.review_text) {
        await supabase
          .from("reviews")
          .update({
            review_text: review.review_text,
            rating: review.rating,
            review_created_at: review.review_created_at,
          })
          .eq("id", existing.id);
        updatedCount++;
      }
      continue;
    }

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
      })
      .select(
        "id, source, external_review_id, author_name, rating, review_text, review_language, sentiment, keywords, review_created_at"
      )
      .single();

    if (insertError || !inserted) {
      if (insertError) console.error("[sync] Insert error:", insertError.message);
      continue;
    }

    newCount++;

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
  await supabase
    .from("connections")
    .update({
      last_synced_at: new Date().toISOString(),
      review_count: (connection.review_count ?? 0) + newCount,
    })
    .eq("id", connectionId);

  // Return sync error only if nothing was processed at all
  if (syncError && newCount === 0 && autoDrafted === 0 && autoPublished === 0) {
    return NextResponse.json({ error: syncError, fetchedCount: 0, autoDrafted, autoPublished });
  }

  return NextResponse.json({
    success: true,
    totalFetched: fetchedReviews.length,
    fetchedCount: newCount,
    newReviews: newCount,
    updatedReviews: updatedCount,
    autoDrafted,
    autoPublished,
    syncError: syncError ?? undefined,
    message: `Synced ${fetchedReviews.length} reviews (${newCount} new, ${updatedCount} updated)`,
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
