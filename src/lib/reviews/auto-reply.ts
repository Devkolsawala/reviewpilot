import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";
import { generateReplyWithRecovery } from "@/lib/ai/reply-generator";
import { replyToPlayStoreReview } from "@/lib/google/playstore";
import { publishGBPReply } from "@/lib/google/gbp";
import { linkRecoverableReview } from "@/lib/reviews/issues";

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

  const aiResult = await generateReplyWithRecovery({
    appContext,
    review: fullReview,
    source: row.source,
    tone: appContext.tone,
  });
  const replyText = aiResult.reply;

  // Persist recovery classification on the review. Best-effort — failures are
  // logged but do not block the reply flow. classification_at is stamped so
  // the poll-reviews cron classifier pass skips this row (it's already done).
  const recoveryUpdate: Record<string, unknown> = {
    is_recoverable: aiResult.recoverable,
    issue_label: aiResult.issue_label,
    classification_at: new Date().toISOString(),
  };
  try {
    await supabase.from("reviews").update(recoveryUpdate).eq("id", row.id);
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[auto-reply] recovery field update failed:", err.message);
  }

  // Cluster into an issue + start monitoring if the AI flagged a concrete fix.
  if (aiResult.recoverable && aiResult.issue_label) {
    try {
      const { data: connRow } = await supabase
        .from("connections")
        .select("user_id")
        .eq("id", connection.id)
        .single();
      if (connRow?.user_id) {
        await linkRecoverableReview(supabase, {
          userId: connRow.user_id,
          connectionId: connection.id,
          reviewId: row.id,
          rating: row.rating,
          issueLabel: aiResult.issue_label,
        });
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error("[auto-reply] issue linking failed:", err.message);
    }
  }

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
    if (!result.success) {
      console.error("[auto-reply] Play publish failed:", result.code, result.error);
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
