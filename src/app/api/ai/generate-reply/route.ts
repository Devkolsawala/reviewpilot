import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReplyWithRecovery } from "@/lib/ai/reply-generator";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { linkRecoverableReview } from "@/lib/reviews/issues";
import { runAsyncGeneration } from "@/lib/ai/run-async-generation";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

// Grok call (sync path) plus retries needs more than the 10s default.
export const maxDuration = 60;

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

export async function POST(request: Request) {
  const body = await request.json();
  const { review, tone, source, appContext: bodyContext, connectionId, reviewId, mode } = body;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Enforce usage limit for authenticated users
  if (user) {
    const usageCheck = await checkUsageLimit(user.id, "ai_replies", supabase);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "limit_exceeded",
          message: `You've used all ${usageCheck.limit} AI replies for this ${usageCheck.periodLabel}. Resets on ${usageCheck.resetDate.toLocaleDateString()}.`,
          current: usageCheck.current,
          limit: usageCheck.limit,
          resetDate: usageCheck.resetDate.toISOString(),
          upgradeNeeded: true,
          planName: usageCheck.planName,
        },
        { status: 429 }
      );
    }
  }

  // ── Async (persisted) path ──────────────────────────────────────────────
  // Opt-in via mode:"async" from the inbox loader flow. Unlike the synchronous
  // default below (used by mock "Reply All", BulkReplyModal, AppContextForm —
  // all of which depend on the { reply } response shape and pass no reviewId),
  // this branch persists the in-flight status + result server-side so a refresh
  // can rehydrate. The usage check above has already run; the actual Grok call
  // + usage increment happen in the worker (runAsyncGeneration), never blocking
  // this response. Disabled in mock mode (no real rows to persist to).
  if (
    user &&
    reviewId &&
    mode === "async" &&
    process.env.NEXT_PUBLIC_USE_MOCK !== "true"
  ) {
    // RLS-scoped ownership check — the user can only select their own reviews.
    const { data: ownRow, error: ownErr } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", reviewId)
      .maybeSingle();
    if (ownErr) {
      return NextResponse.json({ error: ownErr.message }, { status: 500 });
    }
    if (!ownRow) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const generationId = crypto.randomUUID();

    // Stamp the in-flight state. Clearing reply_text ensures a mid-flight
    // refresh shows the loader (driven by generation_status) rather than a
    // stale prior draft. reply_status is intentionally left untouched.
    const { error: stampErr } = await supabase
      .from("reviews")
      .update({
        generation_status: "generating",
        generation_id: generationId,
        generation_started_at: new Date().toISOString(),
        generation_tone: tone || "friendly",
        reply_text: null,
      })
      .eq("id", reviewId);
    if (stampErr) {
      return NextResponse.json({ error: stampErr.message }, { status: 500 });
    }
    console.log(`[gen] async stamp reviewId=${reviewId} genId=${generationId}`);

    // Kick the worker fire-and-forget so the Grok call survives a client
    // disconnect. Same pattern as auto-classification. Falls back to running
    // inline (still non-blocking) when the worker env isn't configured, e.g.
    // local dev — the long-lived dev server keeps the promise alive.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const cronSecret = process.env.CRON_SECRET;
    const payload = { reviewId, generationId, tone: tone || "friendly", userId: user.id };
    if (appUrl && cronSecret) {
      try {
        void fetch(`${appUrl}/api/internal/generate-reply-worker`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cronSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (!res.ok) {
              console.error("[ai-generate-async] worker non-ok", res.status);
            }
          })
          .catch((err) => console.error("[ai-generate-async] worker kick failed", err));
      } catch (err) {
        console.error("[ai-generate-async] worker kick threw", err);
        void runAsyncGeneration(payload);
      }
    } else {
      console.warn(
        "[ai-generate-async] NEXT_PUBLIC_APP_URL/CRON_SECRET unset — running inline fallback"
      );
      void runAsyncGeneration(payload);
    }

    return NextResponse.json({ generationId, status: "generating" });
  }

  let context: AppContext = bodyContext
    ? { ...EMPTY_CONTEXT(tone || "friendly"), ...bodyContext, tone: bodyContext.tone || tone || "friendly" }
    : EMPTY_CONTEXT(tone || "friendly");

  if (user && connectionId) {
    const { data: conn } = await supabase
      .from("connections")
      .select("user_id")
      .eq("id", connectionId)
      .single();
    if (conn?.user_id === user.id) {
      const { data: ctx } = await supabase
        .from("app_contexts")
        .select("*")
        .eq("connection_id", connectionId)
        .single();
      if (ctx) {
        context = { ...context, ...ctx } as AppContext;
      }
    }
  }

  if (user && reviewId && !connectionId) {
    const { data: rev } = await supabase
      .from("reviews")
      .select("connection_id")
      .eq("id", reviewId)
      .single();
    if (rev?.connection_id) {
      const { data: conn } = await supabase
        .from("connections")
        .select("user_id")
        .eq("id", rev.connection_id)
        .single();
      if (conn?.user_id === user.id) {
        const { data: ctx } = await supabase
          .from("app_contexts")
          .select("*")
          .eq("connection_id", rev.connection_id)
          .single();
        if (ctx) {
          context = { ...context, ...ctx } as AppContext;
        }
      }
    }
  }

  const reviewData: Review = {
    id: review?.id || reviewId || "",
    source: source || "play_store",
    external_review_id: review?.external_review_id || "",
    author_name: review?.author_name || "User",
    rating: review?.rating ?? 3,
    review_text: review?.review_text || "",
    review_language: review?.review_language || "en",
    reply_status: "pending",
    sentiment: review?.sentiment || "neutral",
    keywords: review?.keywords || [],
    is_read: false,
    review_created_at: review?.review_created_at || new Date().toISOString(),
  };

  console.log("[ai-generate]", {
    review_id: reviewData.id,
    has_app_context: !!context && !!context.connection_id,
    has_additional_instructions: !!context.additional_instructions?.trim(),
    additional_instructions_preview: context.additional_instructions?.slice(0, 80),
    tone: tone || context.tone || "friendly",
  });

  try {
    const aiResult = await generateReplyWithRecovery({
      appContext: context,
      review: reviewData,
      source: source || "play_store",
      tone: tone || context.tone,
    });

    // Increment usage counter after successful generation
    if (user) {
      await incrementUsage(user.id, "ai_replies_used", 1, supabase);
    }

    // Persist recovery fields + cluster into an issue when the AI flagged a
    // concrete, fixable problem. Best-effort — never fails the reply.
    if (user && reviewData.id) {
      try {
        await supabase
          .from("reviews")
          .update({
            is_recoverable: aiResult.recoverable,
            issue_label: aiResult.issue_label,
            classification_at: new Date().toISOString(),
          })
          .eq("id", reviewData.id);

        if (aiResult.recoverable && aiResult.issue_label && reviewData.rating != null) {
          const { data: rev } = await supabase
            .from("reviews")
            .select("connection_id")
            .eq("id", reviewData.id)
            .single();
          if (rev?.connection_id) {
            await linkRecoverableReview(supabase, {
              userId: user.id,
              connectionId: rev.connection_id,
              reviewId: reviewData.id,
              rating: reviewData.rating,
              issueLabel: aiResult.issue_label,
            });
          }
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        console.error("[ai-generate] recovery persist failed:", err.message);
      }
    }

    return NextResponse.json({
      reply: aiResult.reply,
      recoverable: aiResult.recoverable,
      issue_label: aiResult.issue_label,
    });
  } catch (error) {
    console.error("[AI Generate Reply Error]", error);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
