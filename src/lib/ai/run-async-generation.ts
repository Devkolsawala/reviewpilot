import { createAdminClient } from "@/lib/supabase/admin";
import { generateReplyWithRecovery } from "@/lib/ai/reply-generator";
import { incrementUsage } from "@/lib/usage";
import { linkRecoverableReview } from "@/lib/reviews/issues";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

/**
 * Server-side, persisted AI reply generation for the inbox loader flow.
 *
 * This runs OUT of the user's request lifecycle — it is invoked either by the
 * internal worker route (triggered fire-and-forget from /api/ai/generate-reply
 * with mode:"async") or, as a local-dev fallback, directly. It uses the admin
 * (service-role) client so it can finish even after the originating client
 * disconnects on refresh.
 *
 * Race guard: every Generate/Regenerate click stamps a fresh generation_id on
 * the row. All terminal writes here are gated on `.eq("generation_id", …)` so
 * an older job can never overwrite the result of a newer Regenerate.
 *
 * Usage counting is intentionally identical to the synchronous path: increment
 * `ai_replies_used` (pooled to the workspace owner via incrementUsage) only
 * after a successful generation — never on failure.
 */

const EMPTY_CONTEXT = (tone: string): AppContext => ({
  id: "",
  connection_id: "",
  description: "",
  key_features: [],
  common_questions: [],
  known_issues: [],
  tone: (tone as AppContext["tone"]) || "friendly",
  auto_reply_enabled: false,
  auto_reply_mode: "manual",
  auto_reply_draft_low_ratings: true,
  auto_reply_min_rating: 1,
  auto_reply_max_rating: 5,
  schedule_enabled: false,
  schedule_time: "08:00",
  schedule_timezone: "UTC",
  schedule_days: [true, true, true, true, true, true, true],
  schedule_review_age_hours: 24,
  schedule_safety_toggle: true,
  updated_at: new Date().toISOString(),
});

export interface RunAsyncGenerationParams {
  reviewId: string;
  generationId: string;
  tone: string;
  userId: string;
}

/**
 * Loads the review + its app context, calls Grok, and writes the result back
 * to the row guarded by generation_id. Best-effort: all failures are caught and
 * recorded as generation_status='failed' so the client never spins forever.
 */
export async function runAsyncGeneration(
  params: RunAsyncGenerationParams
): Promise<void> {
  const { reviewId, generationId, tone, userId } = params;
  const admin = createAdminClient();

  try {
    const { data: review, error: reviewErr } = await admin
      .from("reviews")
      .select(
        "id, connection_id, source, external_review_id, author_name, rating, review_text, review_language, sentiment, keywords, review_created_at, generation_id"
      )
      .eq("id", reviewId)
      .single();

    if (reviewErr || !review) {
      console.error("[async-generate] review not found", reviewId, reviewErr?.message);
      await markFailed(admin, reviewId, generationId);
      return;
    }

    // If a newer Regenerate already replaced our generation_id, abandon quietly.
    if (review.generation_id !== generationId) {
      console.log("[async-generate] superseded before start — skipping", { reviewId });
      return;
    }

    let context: AppContext = EMPTY_CONTEXT(tone || "friendly");
    if (review.connection_id) {
      const { data: ctx } = await admin
        .from("app_contexts")
        .select("*")
        .eq("connection_id", review.connection_id)
        .single();
      if (ctx) context = { ...context, ...ctx } as AppContext;
    }

    const reviewData: Review = {
      id: review.id,
      source: (review.source as Review["source"]) || "play_store",
      external_review_id: review.external_review_id || "",
      author_name: review.author_name || "User",
      rating: review.rating ?? 3,
      review_text: review.review_text || "",
      review_language: review.review_language || "en",
      reply_status: "pending",
      sentiment: (review.sentiment as Review["sentiment"]) || "neutral",
      keywords: review.keywords || [],
      is_read: false,
      review_created_at: review.review_created_at || new Date().toISOString(),
    };

    const aiResult = await generateReplyWithRecovery({
      appContext: context,
      review: reviewData,
      source: reviewData.source,
      tone: tone || context.tone,
    });

    // Count usage after successful generation — same semantics as the sync
    // path: pooled to the workspace owner, only on success. Pass the admin
    // client so owner resolution + upsert run without a user session.
    try {
      await incrementUsage(userId, "ai_replies_used", 1, admin);
    } catch (e) {
      const err = e as { message?: string };
      console.error("[async-generate] usage increment failed:", err.message);
    }

    // Terminal success write — GUARDED by generation_id so a newer Regenerate
    // is never clobbered by this (older) job.
    const { data: written, error: writeErr } = await admin
      .from("reviews")
      .update({
        reply_text: aiResult.reply,
        reply_status: "drafted",
        generation_status: "completed",
        is_recoverable: aiResult.recoverable,
        issue_label: aiResult.issue_label,
        classification_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("generation_id", generationId)
      .select("id")
      .maybeSingle();

    if (writeErr) {
      console.error("[async-generate] terminal write failed:", writeErr.message);
      await markFailed(admin, reviewId, generationId);
      return;
    }

    if (!written) {
      // No row matched → a newer generation_id won the race. Leave it alone.
      console.log("[async-generate] superseded at write — skipping", { reviewId });
      return;
    }

    console.log(`[gen] worker done reviewId=${reviewId} status=completed`);

    // Cluster into an Active Issue when the AI flagged a concrete problem.
    // Best-effort — never affects generation status.
    if (
      aiResult.recoverable &&
      aiResult.issue_label &&
      reviewData.rating != null &&
      review.connection_id
    ) {
      try {
        await linkRecoverableReview(admin, {
          userId,
          connectionId: review.connection_id,
          reviewId,
          rating: reviewData.rating,
          issueLabel: aiResult.issue_label,
        });
      } catch (e) {
        const err = e as { message?: string };
        console.error("[async-generate] recovery link failed:", err.message);
      }
    }
  } catch (error) {
    const err = error as { message?: string };
    console.error("[async-generate] generation failed:", err.message || error);
    await markFailed(admin, reviewId, generationId);
  }
}

async function markFailed(
  admin: ReturnType<typeof createAdminClient>,
  reviewId: string,
  generationId: string
): Promise<void> {
  try {
    console.log(`[gen] worker done reviewId=${reviewId} status=failed`);
    await admin
      .from("reviews")
      .update({ generation_status: "failed" })
      .eq("id", reviewId)
      .eq("generation_id", generationId);
  } catch (e) {
    const err = e as { message?: string };
    console.error("[async-generate] markFailed failed:", err.message);
  }
}
