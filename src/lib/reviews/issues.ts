import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyIssueCreated } from "@/lib/alerts/run";

/**
 * Active Issues clustering helpers.
 *
 * When the AI reply pipeline flags a review as "recoverable" with an
 * issue_label, we either find an existing active issue with a similar label
 * for the same connection or create a new one. The review is then linked via
 * review_issues and put into recovery_status = 'monitoring'.
 *
 * All errors are swallowed and logged — recovery tracking is best-effort and
 * MUST NOT break the reply flow.
 */

const SIMILARITY_MIN_OVERLAP_WORDS = 2;
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "have", "has",
  "are", "not", "but", "too", "very", "all", "any", "can", "cannot",
  "issue", "issues", "problem", "problems", "bug", "bugs",
]);

function normalize(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function significantWords(label: string): Set<string> {
  return new Set(
    normalize(label)
      .split(" ")
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
  );
}

function labelsAreSimilar(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wa = Array.from(significantWords(a));
  const wb = significantWords(b);
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap++;
  return overlap >= SIMILARITY_MIN_OVERLAP_WORDS;
}

export interface LinkRecoverableReviewParams {
  userId: string;
  connectionId: string;
  reviewId: string;
  rating: number;
  issueLabel: string;
}

/**
 * Best-effort: find or create an issue for the label, link the review, and
 * flip recovery_status to 'monitoring'. Caller should already have updated
 * the review with is_recoverable=true and issue_label.
 *
 * Returns the issue id on success, or null on any failure (logged).
 */
export async function linkRecoverableReview(
  supabase: SupabaseClient,
  params: LinkRecoverableReviewParams
): Promise<string | null> {
  const { userId, connectionId, reviewId, rating, issueLabel } = params;

  try {
    const { data: openIssues, error: openErr } = await supabase
      .from("issues")
      .select("id, label, review_count, avg_rating")
      .eq("user_id", userId)
      .eq("connection_id", connectionId)
      .eq("status", "active");

    if (openErr) {
      console.error("[issues] lookup error:", openErr.message);
      return null;
    }

    let issueId: string | null = null;
    let matched: { review_count: number; avg_rating: number | null } | null = null;

    for (const row of openIssues ?? []) {
      if (labelsAreSimilar(row.label, issueLabel)) {
        issueId = row.id;
        matched = {
          review_count: row.review_count,
          avg_rating: row.avg_rating,
        };
        break;
      }
    }

    // For a NEW issue: create it with zero counts. The link-insert below will
    // bump them. This keeps the invariant "issues.review_count = COUNT(review_issues)"
    // intact even when the link insert fails (RLS, network, etc.) — previously
    // we created with review_count=1 BEFORE inserting the link, so a silent
    // failure left an inflated count behind that the drill-down couldn't back up.
    if (!issueId) {
      const { data: created, error: insertErr } = await supabase
        .from("issues")
        .insert({
          user_id: userId,
          connection_id: connectionId,
          label: issueLabel,
          status: "active",
          review_count: 0,
          avg_rating: null,
        })
        .select("id")
        .single();

      if (insertErr || !created) {
        console.error("[issues] create error:", insertErr?.message);
        return null;
      }
      issueId = created.id;
      matched = { review_count: 0, avg_rating: null };

      // Additive bell notification for the freshly created cluster.
      // notifyIssueCreated swallows its own errors (and uses a service-role
      // client internally), so clustering can never be affected.
      try {
        await notifyIssueCreated({
          userId,
          issueId: created.id,
          label: issueLabel,
        });
      } catch {
        /* never block clustering */
      }
    }

    // Insert the join row FIRST. Only on a confirmed new insert do we bump
    // the count + rolling average. A duplicate (same review linked twice) is
    // a no-op. A hard failure returns null so the caller knows clustering
    // didn't actually take effect.
    const { error: linkErr } = await supabase
      .from("review_issues")
      .insert({ review_id: reviewId, issue_id: issueId });

    const isDuplicate =
      !!linkErr && /duplicate|unique|conflict/i.test(linkErr.message || "");
    const linkInserted = !linkErr;

    if (linkErr && !isDuplicate) {
      console.error("[issues] link error:", linkErr.message);
      return null;
    }

    if (linkInserted) {
      const prevCount = matched!.review_count;
      const newCount = prevCount + 1;
      const newAvg =
        matched!.avg_rating == null
          ? rating
          : Math.round(
              ((Number(matched!.avg_rating) * prevCount + rating) / newCount) *
                10
            ) / 10;
      await supabase
        .from("issues")
        .update({
          review_count: newCount,
          avg_rating: newAvg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", issueId);
    }

    await supabase
      .from("reviews")
      .update({ recovery_status: "monitoring" })
      .eq("id", reviewId)
      .eq("recovery_status", "none");

    // Self-heal a corrupted baseline. linkRecoverableReview only runs for
    // 1-3★ reviews (the AI's recoverable classification gate enforces this
    // upstream), so the CURRENT rating IS a valid negative baseline. If the
    // stored original_rating is NULL or somehow > 3 (e.g. clobbered by an
    // earlier migration backfill that ran after the customer had already
    // upgraded their rating), reset it now so future recovery detection
    // works correctly. Use the .or() PostgREST filter so we only touch
    // rows that are actually corrupted.
    if (rating >= 1 && rating <= 3) {
      const { error: healErr } = await supabase
        .from("reviews")
        .update({ original_rating: rating })
        .eq("id", reviewId)
        .or("original_rating.is.null,original_rating.gt.3");
      if (healErr) {
        // Non-fatal — this is just a self-heal, not core functionality.
        console.warn("[issues] baseline self-heal skipped:", healErr.message);
      }
    }

    return issueId;
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[issues] unexpected error:", err.message);
    return null;
  }
}
