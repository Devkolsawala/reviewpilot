// Review Health Score — a deterministic 0–100 score + A–F grade for a Play
// Store app's review hygiene. PURE and unit-tested: no AI call, no I/O, no
// randomness. Derived entirely from signals the analyzer already computes
// (response rate, unreplied negatives, sentiment mix, 90-day rating trend),
// so it can be computed at render time on both the tool result and the
// /insights page without storing anything new (no migration).
//
// The score is a weighted blend of four sub-scores, each normalised to 0–100:
//   responseRate        30%  — % of analyzed reviews with a developer reply
//   unrepliedNegatives  25%  — penalises the share of the feed that is
//                              unanswered negativity
//   sentiment           30%  — net (positive − negative) sentiment
//   recency             15%  — recent activity + rating trajectory
//
// Weights are an explicit product judgement, not a fitted model. Keep them
// here so the logic is auditable and the tests pin the math.

export interface RatingTrendPoint {
  date: string; // YYYY-MM-DD
  avg: number; // average rating that day (1..5)
  count: number; // number of reviews that day
}

export interface HealthScoreInput {
  responseRate: number; // 0..1
  unrepliedNegativeCount: number; // count of ≤3★ reviews with no reply
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  ratingTrend90d: RatingTrendPoint[];
  reviewCount: number; // total analyzed reviews (positive+neutral+negative)
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface HealthScore {
  score: number; // 0..100, integer
  grade: Grade;
  verdict: string; // one-line plain-English summary
  lowConfidence: boolean; // true when the sample is too small to trust
  sampleSize: number; // reviews the score was computed from
  components: {
    responseRate: number; // 0..100
    unrepliedNegatives: number; // 0..100
    sentiment: number; // 0..100
    recency: number; // 0..100
  };
}

const WEIGHTS = {
  responseRate: 0.3,
  unrepliedNegatives: 0.25,
  sentiment: 0.3,
  recency: 0.15,
} as const;

// At/above this share of the WHOLE feed being unanswered negatives, the
// unreplied-negatives sub-score bottoms out at 0.
const UNREPLIED_FLOOR_SHARE = 0.4;

// Below this many reviews we still produce a score but flag it as low
// confidence so the UI can caption it honestly.
const LOW_CONFIDENCE_BELOW = 20;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function toGrade(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function verdictFor(grade: Grade): string {
  switch (grade) {
    case "A":
      return "Excellent — reviews are well-managed and sentiment is strong.";
    case "B":
      return "Healthy — solid review management with a little room to tighten up.";
    case "C":
      return "Mixed — real gaps in responses or sentiment are showing.";
    case "D":
      return "At risk — unanswered negatives and weak sentiment are dragging this app down.";
    case "F":
      return "Critical — reviews are largely unmanaged and sentiment is poor.";
  }
}

function weightedAvgRating(points: RatingTrendPoint[]): number {
  const count = points.reduce((s, p) => s + p.count, 0);
  if (!count) return 0;
  return points.reduce((s, p) => s + p.avg * p.count, 0) / count;
}

// Recency = blend of (a) freshness (how much of the analyzed sample landed in
// the last 90 days — a proxy for "is this app still alive") and (b) trajectory
// (whether the recent third of the window rates higher than the earliest
// third). Kept independent of the sentiment sub-score so the two don't double
// count the same star ratings.
function computeRecencyScore(
  trend: RatingTrendPoint[],
  total: number
): number {
  if (total <= 0) return 50;

  const recentCount = trend.reduce((s, p) => s + p.count, 0);
  const freshness = clamp(recentCount / total, 0, 1); // 0..1

  let trajectory = 0.5; // neutral when we can't tell
  if (trend.length >= 2) {
    const sorted = [...trend].sort((a, b) => a.date.localeCompare(b.date));
    const third = Math.max(1, Math.floor(sorted.length / 3));
    const delta =
      weightedAvgRating(sorted.slice(-third)) -
      weightedAvgRating(sorted.slice(0, third)); // rating points, ~-4..4
    trajectory = clamp(0.5 + delta / 4, 0, 1); // each star ≈ 0.25
  }

  return clamp(Math.round((freshness * 0.5 + trajectory * 0.5) * 100), 0, 100);
}

export function computeHealthScore(input: HealthScoreInput): HealthScore {
  const total = Math.max(0, Math.floor(input.reviewCount));
  const { positive, negative } = input.sentimentBreakdown;

  // 1. Response rate — straight 0..1 → 0..100.
  const responseRate = clamp(Math.round(input.responseRate * 100), 0, 100);

  // 2. Unreplied negatives — share of the whole feed that is unanswered
  //    negativity. 0% → 100; ≥UNREPLIED_FLOOR_SHARE → 0.
  const unrepliedShare =
    total > 0 ? input.unrepliedNegativeCount / total : 0;
  const unrepliedNegatives = clamp(
    Math.round(100 * (1 - Math.min(1, unrepliedShare / UNREPLIED_FLOOR_SHARE))),
    0,
    100
  );

  // 3. Sentiment — net (positive − negative) / total, mapped from -1..1 to
  //    0..100.
  const net = total > 0 ? (positive - negative) / total : 0;
  const sentiment = clamp(Math.round(((net + 1) / 2) * 100), 0, 100);

  // 4. Recency.
  const recency = computeRecencyScore(input.ratingTrend90d, total);

  const score = clamp(
    Math.round(
      responseRate * WEIGHTS.responseRate +
        unrepliedNegatives * WEIGHTS.unrepliedNegatives +
        sentiment * WEIGHTS.sentiment +
        recency * WEIGHTS.recency
    ),
    0,
    100
  );

  const grade = toGrade(score);

  return {
    score,
    grade,
    verdict: verdictFor(grade),
    lowConfidence: total < LOW_CONFIDENCE_BELOW,
    sampleSize: total,
    components: { responseRate, unrepliedNegatives, sentiment, recency },
  };
}

// A clearly-labelled heuristic benchmark for the response rate. NOT a sourced
// external statistic — phrased as a comparison against "apps we analyze" so we
// never present a fabricated precise figure as fact.
export function responseRateBenchmark(responseRate: number): string {
  const pct = Math.round(clamp(responseRate, 0, 1) * 100);
  if (pct >= 50) {
    return `Response rate ${pct}% — top-tier; most apps we analyze reply to far fewer.`;
  }
  if (pct >= 30) {
    return `Response rate ${pct}% — ahead of the pack; many apps we analyze sit below 30%.`;
  }
  if (pct >= 10) {
    return `Response rate ${pct}% — well-managed apps we analyze are typically above 30%.`;
  }
  return `Response rate ${pct}% — barely replying; well-managed apps we analyze are typically above 30%.`;
}

// Compact human description of the 90-day trajectory for the trend caption.
export function trendDirection(
  trend: RatingTrendPoint[]
): { label: string; delta: number } {
  if (trend.length < 2) return { label: "not enough recent data", delta: 0 };
  const sorted = [...trend].sort((a, b) => a.date.localeCompare(b.date));
  const third = Math.max(1, Math.floor(sorted.length / 3));
  const delta = Number(
    (
      weightedAvgRating(sorted.slice(-third)) -
      weightedAvgRating(sorted.slice(0, third))
    ).toFixed(2)
  );
  if (delta >= 0.15) return { label: "improving", delta };
  if (delta <= -0.15) return { label: "declining", delta };
  return { label: "steady", delta };
}
