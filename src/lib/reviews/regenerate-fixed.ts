import type { SupabaseClient } from "@supabase/supabase-js";
import { generateReply } from "@/lib/ai/reply-generator";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { replyToPlayStoreReview } from "@/lib/google/playstore";
import { publishGBPReply } from "@/lib/google/gbp";
import type { AppContext } from "@/types/database";
import type { Review, ReviewSource } from "@/types/review";

/**
 * Regenerate AI replies for reviews linked to an insight (formerly "issue")
 * that the owner has just marked as fixed.
 *
 * Strategy:
 *   1. Pull linked reviews via review_issues, then fetch their full row in a
 *      separate query (avoids Supabase FK-embed quirks and makes the path
 *      easier to debug).
 *   2. Filter to reviews where the customer's state has changed since we
 *      replied — rating climbed, text was edited, or the current rating
 *      diverges from the snapshot we took on first ingestion. The third
 *      branch is the catch-all that handles the case where the user clicked
 *      Mark-as-Fixed before our internal edited_at / recovery_status flags
 *      had been stamped.
 *   3. For each candidate: generate a fresh reply against the CURRENT review
 *      content (so a 5★ thank-you gets a 5★-appropriate response).
 *   4. PUBLISH it — overwrite the live reply on Play Store / Google Business.
 *      The owner explicitly opted in by clicking Mark as Fixed. If the publish
 *      fails (e.g. Play API's ~7-day reply window has closed), gracefully fall
 *      back to a draft so the work isn't lost.
 *
 * Safety:
 *   - Best-effort: per-review errors are logged & skipped; never re-thrown.
 *   - Respects AI usage cap. Stops cleanly when at quota.
 *   - Only acts on reviews where reply_status is 'published' or 'drafted' —
 *     a 'pending' (never-replied-to) review keeps its pending status because
 *     overwriting it as 'published' without confirming the API succeeded
 *     would silently change state.
 *
 * Returns: { regenerated, published, drafted, candidatesFound, skipped }
 *   regenerated = published + drafted (rows whose reply_text we successfully wrote)
 */
export async function regenerateRepliesForFixedIssue(
  supabase: SupabaseClient,
  params: { userId: string; issueId: string }
): Promise<{
  regenerated: number;
  published: number;
  drafted: number;
  candidatesFound: number;
  skipped: number;
  reason?: string;
}> {
  const { userId, issueId } = params;
  const empty = {
    regenerated: 0,
    published: 0,
    drafted: 0,
    candidatesFound: 0,
    skipped: 0,
  };

  try {
    // STEP 1: linked review ids
    const { data: joinRows, error: joinErr } = await supabase
      .from("review_issues")
      .select("review_id")
      .eq("issue_id", issueId);

    if (joinErr) {
      console.error("[regen-fixed] join query error:", joinErr.message);
      return { ...empty, reason: joinErr.message };
    }
    const reviewIds = (joinRows ?? []).map((r) => r.review_id).filter(Boolean);
    console.log(
      `[regen-fixed] issue=${issueId} → ${reviewIds.length} linked review(s)`
    );
    if (reviewIds.length === 0) return { ...empty, reason: "no_linked_reviews" };

    // STEP 2: fetch the review rows
    type ReviewRow = {
      id: string;
      connection_id: string;
      source: ReviewSource;
      external_review_id: string;
      author_name: string;
      rating: number | null;
      original_rating: number | null;
      review_text: string;
      review_language: string | null;
      reviewer_country: string | null;
      sentiment: Review["sentiment"] | null;
      keywords: string[] | null;
      reply_status: Review["reply_status"] | null;
      reply_text: string | null;
      edited_at: string | null;
      recovery_status: string | null;
      review_created_at: string;
    };
    const { data: reviewRows, error: revErr } = await supabase
      .from("reviews")
      .select(
        "id, connection_id, source, external_review_id, author_name, rating, original_rating, review_text, review_language, reviewer_country, sentiment, keywords, reply_status, reply_text, edited_at, recovery_status, review_created_at"
      )
      .in("id", reviewIds);

    if (revErr) {
      console.error("[regen-fixed] reviews query error:", revErr.message);
      return { ...empty, reason: revErr.message };
    }

    const reviews = (reviewRows ?? []) as ReviewRow[];

    // STEP 3: pick candidates
    //
    // A review is a candidate when ANY of the following holds. OR-logic
    // because our internal flags can lag behind the live store data and we
    // don't want to miss valid recoveries:
    //
    //   (a) rating is currently >= 4 — this is the strongest signal. Every
    //       review reaching this function is linked to an insight the AI
    //       flagged as a recoverable complaint, so by construction the
    //       customer was unhappy at some point. If they're at 4-5★ now,
    //       the state has changed regardless of what original_rating says.
    //       This branch heals cases where original_rating got clobbered to
    //       the current rating by an out-of-order migration backfill.
    //   (b) edited_at set (cron / sync observed an upstream edit).
    //   (c) recovery_status = 'recovered'.
    //   (d) current rating diverges from original_rating.
    //
    // Excludes reviews with no reply — leave pending rows for normal
    // auto-reply flow.
    const candidates = reviews.filter((r) => {
      if (r.reply_status !== "published" && r.reply_status !== "drafted") {
        return false;
      }
      const ratingIsPositiveNow =
        typeof r.rating === "number" && r.rating >= 4;
      const editedFlag = !!r.edited_at;
      const recoveredFlag = r.recovery_status === "recovered";
      const ratingDiverges =
        typeof r.rating === "number" &&
        typeof r.original_rating === "number" &&
        r.rating !== r.original_rating;
      return ratingIsPositiveNow || editedFlag || recoveredFlag || ratingDiverges;
    });

    console.log(
      `[regen-fixed] candidates=${candidates.length}/${reviews.length}`,
      candidates.map((c) => ({
        id: c.id,
        rating: c.rating,
        original_rating: c.original_rating,
        edited_at: !!c.edited_at,
        recovery: c.recovery_status,
        reply_status: c.reply_status,
      }))
    );

    if (candidates.length === 0) {
      return { ...empty, candidatesFound: 0, reason: "no_state_change" };
    }

    // STEP 4: preload app_contexts AND connection rows we need for publishing
    const connectionIds = Array.from(
      new Set(candidates.map((r) => r.connection_id))
    );

    const appContextByConnection = new Map<string, AppContext>();
    {
      const { data: ctxs } = await supabase
        .from("app_contexts")
        .select("*")
        .in("connection_id", connectionIds);
      for (const c of ctxs ?? []) {
        appContextByConnection.set((c as AppContext).connection_id, c as AppContext);
      }
    }

    type ConnRow = {
      id: string;
      type: string;
      external_id: string | null;
      credentials: Record<string, unknown> | null;
    };
    const connectionById = new Map<string, ConnRow>();
    {
      const { data: conns } = await supabase
        .from("connections")
        .select("id, type, external_id, credentials")
        .in("id", connectionIds);
      for (const c of conns ?? []) {
        connectionById.set(c.id, c as ConnRow);
      }
    }

    let regenerated = 0;
    let published = 0;
    let drafted = 0;
    let skipped = 0;

    // STEP 5: per-review regen + publish
    for (const r of candidates) {
      try {
        const usageCheck = await checkUsageLimit(userId, "ai_replies", supabase);
        if (!usageCheck.allowed) {
          console.log(
            `[regen-fixed] stopping — AI cap hit (${usageCheck.current}/${usageCheck.limit})`
          );
          skipped += candidates.length - (regenerated + skipped);
          break;
        }

        const appContext = appContextByConnection.get(r.connection_id);
        const connection = connectionById.get(r.connection_id);
        if (!appContext || !connection) {
          console.warn(
            `[regen-fixed] missing appContext or connection for review ${r.id}`,
            { hasAppContext: !!appContext, hasConnection: !!connection }
          );
          skipped++;
          continue;
        }

        const reviewForAi: Review = {
          id: r.id,
          source: r.source,
          external_review_id: r.external_review_id,
          author_name: r.author_name,
          rating: r.rating,
          review_text: r.review_text,
          review_language: r.review_language ?? "en",
          reviewer_country: r.reviewer_country ?? null,
          reply_status: "pending",
          sentiment: r.sentiment ?? "positive",
          keywords: r.keywords ?? [],
          is_read: false,
          review_created_at: r.review_created_at,
        };

        const newReply = await generateReply({
          appContext,
          review: reviewForAi,
          source: r.source,
          tone: appContext.tone,
        });

        // STEP 6: attempt to publish, overwriting the live reply.
        let publishedOk = false;
        let publishError: string | null = null;
        try {
          if (r.source === "play_store" && connection.external_id) {
            const result = await replyToPlayStoreReview(
              connection.external_id,
              r.external_review_id,
              newReply,
              connection.credentials
            );
            publishedOk = result.success;
            if (!result.success) {
              publishError = result.error || result.code || "play_publish_failed";
            }
          } else if (r.source === "google_business" && connection.credentials) {
            publishedOk = await publishGBPReply(
              connection.credentials,
              "",
              connection.external_id || "",
              r.external_review_id,
              newReply
            );
            if (!publishedOk) publishError = "gbp_publish_failed";
          } else {
            // Unknown source or missing creds — degrade to draft.
            publishError = "no_publish_path";
          }
        } catch (pubErr: unknown) {
          const pe = pubErr as { message?: string };
          publishError = pe.message || "publish_exception";
          publishedOk = false;
        }

        // STEP 7: persist the new reply. published vs drafted based on result.
        const now = new Date().toISOString();
        const updatePayload: Record<string, unknown> = {
          reply_text: newReply,
          reply_status: publishedOk ? "published" : "drafted",
          is_auto_replied: true,
        };
        if (publishedOk) updatePayload.reply_published_at = now;

        const { error: upErr } = await supabase
          .from("reviews")
          .update(updatePayload)
          .eq("id", r.id);

        if (upErr) {
          console.error(
            `[regen-fixed] review ${r.id} DB update failed:`,
            upErr.message
          );
          skipped++;
          continue;
        }

        await incrementUsage(userId, "ai_replies_used", 1, supabase);
        regenerated++;
        if (publishedOk) published++;
        else {
          drafted++;
          console.warn(
            `[regen-fixed] review ${r.id} saved as draft (publish failed):`,
            publishError
          );
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        console.error(`[regen-fixed] review ${r.id} unexpected error:`, err.message);
        skipped++;
      }
    }

    console.log(
      `[regen-fixed] done: regenerated=${regenerated} (published=${published}, drafted=${drafted}), skipped=${skipped}, candidates=${candidates.length}`
    );

    return {
      regenerated,
      published,
      drafted,
      candidatesFound: candidates.length,
      skipped,
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[regen-fixed] unexpected top-level error:", err.message);
    return { ...empty, reason: err.message };
  }
}
