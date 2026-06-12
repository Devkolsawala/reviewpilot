/**
 * Builds the REAL metrics payload for the weekly digest's AI executive
 * summary. Replaces the stubbed zeros/empties that previously went into
 * generateExecutiveSummary at the send.ts call site.
 *
 * All aggregation math is shared with the analytics page
 * (@/lib/analytics/aggregates) so the summary describes the same numbers the
 * user sees in the dashboard. Runs on the admin client — same trust level as
 * the rest of the digest pipeline (cron path, no user session).
 */

// Relative imports (not "@/...") so the node:test suite can load this module
// without tsconfig path-alias resolution.
import { createAdminClient } from "../supabase/admin";
import type { ExecutiveSummaryMetrics } from "../ai/generateExecutiveSummary";
import {
  computeThemes,
  computeAspectAggregates,
  computeResponseRate,
  type MinReview,
} from "../analytics/aggregates";

/**
 * The preceding window of the same length, ending exactly where the current
 * one starts. Pure — unit-tested in digest-exec-metrics.test.ts.
 */
export function previousWindow(
  periodStart: Date,
  periodEnd: Date
): { prevStart: Date; prevEnd: Date } {
  const windowMs = periodEnd.getTime() - periodStart.getTime();
  return {
    prevStart: new Date(periodStart.getTime() - windowMs),
    prevEnd: new Date(periodStart.getTime()),
  };
}

type MetricsRow = Pick<
  MinReview,
  | "rating"
  | "reply_status"
  | "review_created_at"
  | "ai_theme"
  | "ai_sentiment"
  | "ai_urgency"
  | "ai_aspects"
>;

const ROW_SELECT =
  "rating, reply_status, review_created_at, ai_theme, ai_sentiment, ai_urgency, ai_aspects";

function avgRating(rows: MetricsRow[]): number {
  const rated = rows.filter((r) => r.rating != null);
  if (rated.length === 0) return 0;
  const avg = rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length;
  return Math.round(avg * 10) / 10;
}

/** Pure aggregation over already-fetched rows — exported for tests. */
export function metricsFromRows(
  rows: MetricsRow[],
  prevRows: MetricsRow[]
): ExecutiveSummaryMetrics {
  const minRows = rows as MinReview[];
  const minPrev = prevRows as MinReview[];

  const { themes } = computeThemes(minRows, minPrev);
  const topThemes = themes.slice(0, 5).map((t) => ({
    theme: t.theme,
    count: t.count,
    sentiment: t.sentiment,
    trend: t.changePct ?? 0,
  }));

  const aspects = computeAspectAggregates(minRows, 2);
  const negatives = aspects.filter((a) => a.net < 0);
  const positives = aspects.filter((a) => a.net > 0);
  const topNegativeAspect = negatives.length
    ? negatives.reduce((min, a) => (a.net < min.net ? a : min))
    : null;
  const topPositiveAspect = positives.length
    ? positives.reduce((max, a) => (a.net > max.net ? a : max))
    : null;

  return {
    totalReviews: rows.length,
    totalReviewsPrev: prevRows.length,
    avgRating: avgRating(rows),
    avgRatingPrev: avgRating(prevRows),
    responseRate: computeResponseRate(minRows) ?? 0,
    responseRatePrev: computeResponseRate(minPrev) ?? 0,
    topThemes,
    criticalCount: rows.filter((r) => r.ai_urgency === "critical").length,
    topNegativeAspect: topNegativeAspect
      ? { aspect: topNegativeAspect.aspect, net: topNegativeAspect.net }
      : null,
    topPositiveAspect: topPositiveAspect
      ? { aspect: topPositiveAspect.aspect, net: topPositiveAspect.net }
      : null,
  };
}

export async function buildExecutiveMetrics(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ExecutiveSummaryMetrics> {
  // Mock mode never reaches the AI (the generator returns canned content),
  // so don't touch the database either.
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return metricsFromRows([], []);
  }

  const supabase = createAdminClient();
  const { prevStart, prevEnd } = previousWindow(periodStart, periodEnd);

  const { data: connections } = await supabase
    .from("connections")
    .select("id")
    .eq("user_id", userId);
  const connIds = (connections || []).map((c) => c.id);
  if (connIds.length === 0) return metricsFromRows([], []);

  const [currentRes, prevRes] = await Promise.all([
    supabase
      .from("reviews")
      .select(ROW_SELECT)
      .in("connection_id", connIds)
      .gte("review_created_at", periodStart.toISOString())
      .lt("review_created_at", periodEnd.toISOString())
      .limit(2000),
    supabase
      .from("reviews")
      .select(ROW_SELECT)
      .in("connection_id", connIds)
      .gte("review_created_at", prevStart.toISOString())
      .lt("review_created_at", prevEnd.toISOString())
      .limit(2000),
  ]);

  return metricsFromRows(
    (currentRes.data as MetricsRow[]) || [],
    (prevRes.data as MetricsRow[]) || []
  );
}
