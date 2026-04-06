import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReply } from "@/lib/ai/reply-generator";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

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
  const { review, tone, source, appContext: bodyContext, connectionId, reviewId } = body;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  try {
    const reply = await generateReply({
      appContext: context,
      review: reviewData,
      source: source || "play_store",
      tone: tone || context.tone,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[AI Generate Reply Error]", error);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
