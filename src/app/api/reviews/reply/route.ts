import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { replyToPlayStoreReview, fetchPlayStoreReviews } from "@/lib/google/playstore";
import { publishGBPReply } from "@/lib/google/gbp";
import { sendWhatsAppText, decryptToken } from "@/lib/whatsapp/client";
import { generateReply } from "@/lib/ai/reply-generator";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { GBP_ENABLED, GBP_COMING_SOON_MESSAGE } from "@/lib/feature-flags";

const MAX_EDITS_PER_24H = 10;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REVIEW_DELETED_MESSAGE =
  "This review was deleted from Play Store by the reviewer, so it can no longer be replied to.";

function friendlyPlayStoreError(raw: string | undefined | null): string {
  const msg = raw || "Unknown error";
  if (/could not find review|notfound|not.?found/i.test(msg)) {
    return REVIEW_DELETED_MESSAGE;
  }
  if (/quota|rate.?limit/i.test(msg)) {
    return "Google rate limit reached. Try again in a few minutes.";
  }
  if (/permission|forbidden|unauthorized/i.test(msg)) {
    return "Permission denied. Reconnect your Play Console under Settings → Connections.";
  }
  return msg;
}

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

  // Discard a draft or un-publish a locally-published reply.
  // Note: if the reply was already sent to Play Store/GBP it remains live there
  // until a new reply is posted. This only resets the state in our database.
  if (action === "discard_reply") {
    console.log("[API] discard_reply review:", reviewId);
    const { error: discardErr } = await supabase
      .from("reviews")
      .update({
        reply_text: null,
        reply_status: "pending",
        reply_published_at: null,
        is_read: false,
      })
      .eq("id", reviewId);
    if (discardErr) {
      console.error("[API] discard_reply error:", discardErr.message);
      return NextResponse.json({ error: discardErr.message }, { status: 500 });
    }
    console.log("[API] discard_reply success for review:", reviewId);
    return NextResponse.json({ success: true, status: "pending", message: "Reply discarded" });
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

  // Soft per-review edit cap (publish only — drafts/discards exempt).
  // Reset window: edits older than 24h don't count toward the cap.
  const isEdit = !!review.reply_first_published_at;
  if (isEdit && (review.source === "play_store" || review.source === "google_business")) {
    const lastEdit = review.reply_last_edited_at
      ? new Date(review.reply_last_edited_at).getTime()
      : 0;
    const within24h = lastEdit > 0 && Date.now() - lastEdit < 24 * 60 * 60 * 1000;
    const currentCount = within24h ? (review.reply_edit_count ?? 0) : 0;
    if (currentCount >= MAX_EDITS_PER_24H) {
      return NextResponse.json(
        {
          error: `You've edited this reply ${MAX_EDITS_PER_24H} times in the last 24 hours. Please wait before editing again.`,
        },
        { status: 429 }
      );
    }
  }

  let published = false;

  if (review.source === "whatsapp") {
    if (
      !connection ||
      !connection.whatsapp_phone_number_id ||
      !connection.whatsapp_access_token_encrypted
    ) {
      return NextResponse.json(
        { error: "WhatsApp connection missing credentials" },
        { status: 400 }
      );
    }
    if (!review.author_id) {
      return NextResponse.json(
        { error: "WhatsApp reply target phone number missing on the review" },
        { status: 400 }
      );
    }
    try {
      const accessToken = decryptToken(connection.whatsapp_access_token_encrypted);
      await sendWhatsAppText(
        {
          phoneNumberId: connection.whatsapp_phone_number_id,
          accessToken,
        },
        review.author_id,
        finalReplyText
      );
      published = true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "WhatsApp send failed";
      await supabase
        .from("reviews")
        .update({ reply_text: finalReplyText, reply_status: "failed" })
        .eq("id", reviewId);
      return NextResponse.json(
        { success: false, error: msg, message: "Failed to send WhatsApp reply" },
        { status: 500 }
      );
    }
  } else if (review.source === "play_store") {
    let resolvedExternalId = review.external_review_id as string | null | undefined;
    const looksCorrupt = !resolvedExternalId || UUID_REGEX.test(resolvedExternalId);

    // Auto-heal: if the stored external_review_id is missing or looks like a UUID
    // (a known data-corruption mode where reviews.id was written into the column),
    // try to recover by fetching live reviews from Play Store and matching on
    // review_text + author_name. Patch the row when we find a match.
    if (looksCorrupt && connection?.external_id) {
      console.warn("[reply-publish] external_review_id looks corrupt — attempting auto-heal", {
        internal_id: review.id,
        stored_external_review_id: resolvedExternalId,
      });
      try {
        const live = await fetchPlayStoreReviews(
          connection.external_id,
          connection.credentials as Record<string, unknown> | null
        );
        const match = live.find(
          (r) =>
            r.review_text === review.review_text &&
            r.author_name === review.author_name
        );
        if (match?.external_review_id && !UUID_REGEX.test(match.external_review_id)) {
          resolvedExternalId = match.external_review_id;
          await supabase
            .from("reviews")
            .update({ external_review_id: resolvedExternalId })
            .eq("id", review.id);
          console.log("[reply-publish] auto-heal succeeded", {
            internal_id: review.id,
            recovered_external_review_id: resolvedExternalId,
          });
        } else {
          console.warn("[reply-publish] auto-heal failed — no live match");
        }
      } catch (e) {
        console.error("[reply-publish] auto-heal error:", e);
      }
    }

    if (!resolvedExternalId || UUID_REGEX.test(resolvedExternalId)) {
      await supabase
        .from("reviews")
        .update({ reply_text: finalReplyText, reply_status: "failed" })
        .eq("id", reviewId);
      return NextResponse.json(
        {
          success: false,
          error: REVIEW_DELETED_MESSAGE,
          message: REVIEW_DELETED_MESSAGE,
        },
        { status: 400 }
      );
    }

    console.log("[reply-publish]", {
      internal_id: review.id,
      external_review_id: resolvedExternalId,
      package: connection?.external_id,
      is_edit: isEdit,
      edit_count: review.reply_edit_count ?? 0,
    });
    // connection.credentials is null for Invite Email method → lib falls back to shared env credentials
    const result = await replyToPlayStoreReview(
      connection?.external_id || "",
      resolvedExternalId,
      finalReplyText,
      connection?.credentials as Record<string, unknown> | null
    );
    published = result.success;
    if (!result.success) {
      await supabase
        .from("reviews")
        .update({ reply_text: finalReplyText, reply_status: "failed" })
        .eq("id", reviewId);
      const friendly = friendlyPlayStoreError(result.error);
      return NextResponse.json(
        { success: false, error: friendly, message: friendly },
        { status: 500 }
      );
    }
  } else if (review.source === "google_business") {
    if (!GBP_ENABLED) {
      return NextResponse.json(
        { success: false, error: GBP_COMING_SOON_MESSAGE },
        { status: 503 }
      );
    }
    if (connection?.credentials) {
      published = await publishGBPReply(
        connection.credentials, "", connection.external_id || "",
        review.external_review_id, finalReplyText
      );
    } else {
      published = true;
    }
  } else {
    published = true;
  }

  console.log("[API] Updating review after publish:", reviewId, { published });
  const nowIso = new Date().toISOString();
  const lastEditMs = review.reply_last_edited_at
    ? new Date(review.reply_last_edited_at).getTime()
    : 0;
  const within24h = lastEditMs > 0 && Date.now() - lastEditMs < 24 * 60 * 60 * 1000;
  const nextEditCount = published
    ? isEdit
      ? (within24h ? (review.reply_edit_count ?? 0) : 0) + 1
      : 0
    : (review.reply_edit_count ?? 0);

  const updatePayload: Record<string, unknown> = {
    reply_text: finalReplyText,
    reply_status: published ? "published" : "failed",
    reply_published_at: published ? nowIso : null,
    is_read: true,
  };
  if (published) {
    updatePayload.reply_first_published_at = review.reply_first_published_at ?? nowIso;
    updatePayload.reply_last_edited_at = isEdit ? nowIso : null;
    updatePayload.reply_edit_count = nextEditCount;
  }

  const { data: updateRow, error: updateError } = await supabase
    .from("reviews")
    .update(updatePayload)
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
