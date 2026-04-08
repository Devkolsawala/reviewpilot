import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { replyToPlayStoreReview } from "@/lib/google/playstore";
import { publishGBPReply } from "@/lib/google/gbp";
import { generateReply } from "@/lib/ai/reply-generator";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { reviewId, replyText, action } = body;
  console.log("[API] reviews/reply request:", { reviewId, action: action ?? "publish" });

  if (!reviewId) {
    return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });
  }

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("*, connections(*)")
    .eq("id", reviewId)
    .single();

  if (reviewError || !review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (action === "save_draft") {
    if (!replyText || typeof replyText !== "string") {
      return NextResponse.json({ error: "Missing replyText" }, { status: 400 });
    }
    console.log("[API] save_draft review:", reviewId);
    const { data: draftData, error: draftErr } = await supabase
      .from("reviews")
      .update({ reply_text: replyText, reply_status: "drafted", is_read: true })
      .eq("id", reviewId)
      .select("id, reply_status")
      .single();
    console.log("[API] save_draft Supabase result:", { data: draftData, error: draftErr });
    if (draftErr) {
      return NextResponse.json({ error: draftErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, status: "drafted", message: "Draft saved" });
  }

  const connection = review.connections;

  const { data: appContext } = await supabase
    .from("app_contexts")
    .select("*")
    .eq("connection_id", review.connection_id)
    .single();

  let finalReplyText = replyText;

  // Generate AI reply if requested — check usage limit first
  if (action === "generate" || action === "generate_and_publish") {
    const usageCheck = await checkUsageLimit(user.id, "ai_replies", supabase);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "limit_exceeded",
          message: `AI reply limit reached (${usageCheck.current}/${usageCheck.limit} this ${usageCheck.periodLabel})`,
          resetDate: usageCheck.resetDate.toISOString(),
          upgradeNeeded: true,
          planName: usageCheck.planName,
        },
        { status: 429 }
      );
    }

    finalReplyText = await generateReply({
      appContext: appContext || {
        id: "", connection_id: "", description: "", key_features: [], common_questions: [],
        known_issues: [], tone: "friendly", auto_reply_enabled: false, auto_reply_mode: "manual",
        auto_reply_draft_low_ratings: true, auto_reply_min_rating: 1, auto_reply_max_rating: 5,
        schedule_enabled: false, schedule_time: "08:00", schedule_timezone: "UTC",
        schedule_days: [true, true, true, true, true, true, true],
        schedule_review_age_hours: 24, schedule_safety_toggle: true,
        updated_at: new Date().toISOString(),
      },
      review: {
        id: review.id, source: review.source, external_review_id: review.external_review_id,
        author_name: review.author_name, rating: review.rating, review_text: review.review_text,
        review_language: review.review_language || "en", reply_status: review.reply_status,
        sentiment: review.sentiment || "neutral", keywords: review.keywords || [],
        is_read: review.is_read, review_created_at: review.review_created_at,
      },
      source: review.source,
      tone: appContext?.tone,
    });

    // Count usage after successful generation
    await incrementUsage(user.id, "ai_replies_used", 1, supabase);

    await supabase
      .from("reviews")
      .update({
        reply_text: finalReplyText,
        reply_status: action === "generate" ? "drafted" : "approved",
      })
      .eq("id", reviewId);

    if (action === "generate") {
      return NextResponse.json({
        success: true, replyText: finalReplyText, status: "drafted",
        message: "Reply generated and saved as draft",
      });
    }
  }

  // Publish path — publishing a pre-existing draft does NOT count against limit
  if (!finalReplyText) {
    return NextResponse.json({ error: "Missing replyText" }, { status: 400 });
  }

  if (review.source === "play_store" && finalReplyText.length > 350) {
    return NextResponse.json(
      { error: "Play Store replies must be 350 characters or fewer" },
      { status: 400 }
    );
  }

  let published = false;

  if (review.source === "play_store") {
    // connection.credentials is null for Invite Email method → lib falls back to shared env credentials
    const result = await replyToPlayStoreReview(
      connection?.external_id || "",
      review.external_review_id,
      finalReplyText,
      connection?.credentials as Record<string, unknown> | null
    );
    published = result.success;
    if (!result.success) {
      await supabase
        .from("reviews")
        .update({ reply_text: finalReplyText, reply_status: "failed" })
        .eq("id", reviewId);
      return NextResponse.json(
        { success: false, error: result.error, message: "Failed to publish reply to Play Store" },
        { status: 500 }
      );
    }
  } else if (review.source === "google_business" && connection?.credentials) {
    published = await publishGBPReply(
      connection.credentials, "", connection.external_id || "",
      review.external_review_id, finalReplyText
    );
  } else {
    published = true;
  }

  console.log("[API] Updating review after publish:", reviewId, { published });
  const { data: updateRow, error: updateError } = await supabase
    .from("reviews")
    .update({
      reply_text: finalReplyText,
      reply_status: published ? "published" : "failed",
      reply_published_at: published ? new Date().toISOString() : null,
      is_read: true,
    })
    .eq("id", reviewId)
    .select("id, reply_status, reply_published_at")
    .single();

  console.log("[API] Supabase update result:", { data: updateRow, error: updateError });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true, published, replyText: finalReplyText,
    status: published ? "published" : "failed",
    message: published ? "Reply published successfully!" : "Reply saved but could not be published",
  });
}
