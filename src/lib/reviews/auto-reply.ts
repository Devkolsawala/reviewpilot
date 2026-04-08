import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";
import { generateReply } from "@/lib/ai/reply-generator";
import { replyToPlayStoreReview } from "@/lib/google/playstore";
import { publishGBPReply } from "@/lib/google/gbp";

export type ConnectionRow = {
  id: string;
  type: string;
  credentials: Record<string, unknown> | null;
  external_id: string | null;
};

function ratingMatches(rating: number, ctx: AppContext): boolean {
  const min = ctx.auto_reply_min_rating ?? 1;
  const max = ctx.auto_reply_max_rating ?? 5;
  return rating >= min && rating <= max;
}

function effectiveMode(ctx: AppContext): "manual" | "draft_for_review" | "auto_publish" {
  const m = ctx.auto_reply_mode;
  if (m === "draft_for_review" || m === "auto_publish" || m === "manual") return m;
  if (ctx.auto_reply_enabled) return "draft_for_review";
  return "manual";
}

/** In auto_publish mode, optionally still draft 1–2★ when safety is on. */
function shouldSaveAsDraftOnly(
  rating: number,
  mode: "manual" | "draft_for_review" | "auto_publish",
  draftLowRatings: boolean
): boolean {
  if (mode === "draft_for_review") return true;
  if (mode === "auto_publish" && draftLowRatings && rating <= 2) return true;
  return false;
}

function buildFullReview(
  row: {
    id: string;
    source: Review["source"];
    external_review_id: string;
    author_name: string;
    rating: number;
    review_text: string;
    review_language?: string;
    sentiment?: Review["sentiment"];
    keywords?: string[];
    review_created_at: string;
  },
  overrides?: Partial<Review>
): Review {
  return {
    id: row.id,
    source: row.source,
    external_review_id: row.external_review_id,
    author_name: row.author_name,
    rating: row.rating,
    review_text: row.review_text,
    review_language: row.review_language ?? "en",
    reply_status: "pending",
    sentiment: row.sentiment ?? "neutral",
    keywords: row.keywords ?? [],
    is_read: false,
    review_created_at: row.review_created_at,
    ...overrides,
  };
}

/**
 * Generate and optionally publish an AI reply for a single review row.
 * Used after sync inserts and by cron for pending rows.
 */
export async function processAutoReplyForReview(
  supabase: SupabaseClient,
  connection: ConnectionRow,
  row: {
    id: string;
    source: Review["source"];
    external_review_id: string;
    author_name: string;
    rating: number;
    review_text: string;
    review_language?: string;
    sentiment?: Review["sentiment"];
    keywords?: string[];
    review_created_at: string;
  },
  appContext: AppContext,
  options?: { fromScheduledCron?: boolean }
): Promise<"skipped" | "drafted" | "published" | "failed"> {
  const mode = effectiveMode(appContext);
  const scheduledOk =
    options?.fromScheduledCron === true && appContext.schedule_enabled === true;

  if (!scheduledOk && (!appContext.auto_reply_enabled || mode === "manual")) {
    console.log("[auto-reply] skip — manual or disabled", { reviewId: row.id });
    return "skipped";
  }

  let replyMode = mode;
  if (options?.fromScheduledCron && replyMode === "manual") {
    replyMode = "draft_for_review";
  }

  if (!ratingMatches(row.rating, appContext)) {
    console.log("[auto-reply] skip — rating out of range", {
      reviewId: row.id,
      rating: row.rating,
    });
    return "skipped";
  }

  const draftLow = appContext.auto_reply_draft_low_ratings !== false;
  const draftOnly = shouldSaveAsDraftOnly(row.rating, replyMode, draftLow);

  const fullReview = buildFullReview(row);
  console.log("[auto-reply] generating", { reviewId: row.id, replyMode, draftOnly });

  const replyText = await generateReply({
    appContext,
    review: fullReview,
    source: row.source,
    tone: appContext.tone,
  });

  if (draftOnly) {
    const { error } = await supabase
      .from("reviews")
      .update({
        reply_text: replyText,
        reply_status: "drafted",
        is_auto_replied: true,
      })
      .eq("id", row.id);
    if (error) {
      console.error("[auto-reply] draft update error:", error.message);
      return "failed";
    }
    console.log("[auto-reply] saved draft", { reviewId: row.id });
    return "drafted";
  }

  let publishedOk = false;
  // connection.credentials is null for Invite Email method → lib falls back to shared env credentials
  if (row.source === "play_store" && connection.external_id) {
    const result = await replyToPlayStoreReview(
      connection.external_id,
      row.external_review_id,
      replyText,
      connection.credentials
    );
    publishedOk = result.success;
    if (!publishedOk) {
      console.error("[auto-reply] Play publish failed:", result.error);
      await supabase
        .from("reviews")
        .update({
          reply_text: replyText,
          reply_status: "failed",
          is_auto_replied: true,
        })
        .eq("id", row.id);
      return "failed";
    }
  } else if (row.source === "google_business" && connection.credentials) {
    publishedOk = await publishGBPReply(
      connection.credentials,
      "",
      connection.external_id || "",
      row.external_review_id,
      replyText
    );
    if (!publishedOk) {
      await supabase
        .from("reviews")
        .update({
          reply_text: replyText,
          reply_status: "failed",
          is_auto_replied: true,
        })
        .eq("id", row.id);
      return "failed";
    }
  } else {
    publishedOk = true;
  }

  const { error: upErr } = await supabase
    .from("reviews")
    .update({
      reply_text: replyText,
      reply_status: "published",
      reply_published_at: new Date().toISOString(),
      is_auto_replied: true,
    })
    .eq("id", row.id);

  if (upErr) {
    console.error("[auto-reply] published row update error:", upErr.message);
    return "failed";
  }
  console.log("[auto-reply] published", { reviewId: row.id });
  return "published";
}
