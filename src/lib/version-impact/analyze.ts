/**
 * Version Impact Analyzer — DETERMINISTIC CORE (pure, no AI, no I/O).
 *
 * Given a set of reviews for ONE connected app, this computes per-version
 * metrics and a "compare two versions" diff (rating / review-count / sentiment
 * deltas + theme deltas). It is the free, all-plans path: the API route feeds
 * it review rows and returns the result verbatim. The AI verdict layer
 * (grok.ts) consumes ONLY the deltas this produces — never raw reviews.
 *
 * Reuses the existing analytics math instead of reinventing it:
 *   - computeThemes()        — per-theme bucketing (run per version, then diffed)
 *   - sentimentFromRating()  — current-rating-derived sentiment
 *   - isValidAiSentiment()   — stored-sentiment fallback
 *
 * Only Play Store reviews carry version data (migration 039). Reviews from
 * other sources, or Play Store reviews with no reported version, are excluded
 * here — the caller surfaces a UI note about it.
 */

import {
  computeThemes,
  sentimentFromRating,
  isValidAiSentiment,
  type MinReview,
  type AiSentimentLabel,
} from "@/lib/analytics/aggregates";

// A version with fewer than this many reviews is flagged "low sample" so the UI
// can mark it and the default comparison can skip it as the baseline. Tuned low
// enough that small apps still get a comparison, high enough to avoid treating
// a single review's rating as a signal.
export const MIN_REVIEWS_FOR_CONFIDENCE = 5;

// How many theme deltas to surface (sorted by magnitude). The UI shows risers
// and fallers; the grok payload is additionally capped in the route.
export const MAX_THEME_DELTAS = 12;

/** A review row with the version fields from migration 039 layered onto MinReview. */
export type VersionedReview = MinReview & {
  app_version_name?: string | null;
  app_version_code?: number | null;
};

export interface SentimentSplit {
  positive: number;
  neutral: number;
  negative: number;
  /** Reviews that could be classified into one of the three buckets. */
  total: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
}

export interface VersionMetrics {
  versionName: string;
  versionCode: number | null;
  count: number;
  /** Mean of rated reviews, 1 decimal; null when none are rated. */
  avgRating: number | null;
  sentiment: SentimentSplit;
  /** ISO timestamp of the earliest / latest review on this version; null if none. */
  firstSeen: string | null;
  lastSeen: string | null;
  /** True when count < MIN_REVIEWS_FOR_CONFIDENCE — "don't treat noise as signal". */
  lowSample: boolean;
}

export type ThemeDeltaDirection = "up" | "down";

export interface ThemeDelta {
  theme: string;
  countA: number;
  countB: number;
  /** countB - countA. Positive = rose in the newer version. */
  delta: number;
  /** Percent change vs version A; null when A had zero (a brand-new theme). */
  changePct: number | null;
  direction: ThemeDeltaDirection;
}

export interface VersionComparison {
  /** Older release. */
  versionA: VersionMetrics;
  /** Newer release. */
  versionB: VersionMetrics;
  /** avgRating(B) - avgRating(A); null when either side has no rated reviews. */
  ratingDelta: number | null;
  /** count(B) - count(A). */
  countDelta: number;
  /** Percentage-point deltas (B - A) for each sentiment bucket. */
  sentimentDelta: {
    positivePct: number;
    neutralPct: number;
    negativePct: number;
  };
  /** Themes that rose or fell between A and B, sorted by magnitude. */
  themeDeltas: ThemeDelta[];
}

export interface VersionImpactResult {
  /** Per-version rows, newest first (version code DESC, NULL codes last). */
  versions: VersionMetrics[];
  /** Default (or requested) comparison; null when fewer than two versions exist. */
  comparison: VersionComparison | null;
  /** True when at least one Play Store review carries a version label. */
  hasVersionedReviews: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Effective sentiment for one review: current rating wins, stored label backs it up. */
function reviewSentiment(r: VersionedReview): AiSentimentLabel | null {
  return (
    sentimentFromRating(r.rating) ??
    (isValidAiSentiment(r.ai_sentiment) ? r.ai_sentiment : null)
  );
}

function computeSentimentSplit(rows: VersionedReview[]): SentimentSplit {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  for (const r of rows) {
    const s = reviewSentiment(r);
    if (s === "positive") positive++;
    else if (s === "negative") negative++;
    else if (s === "neutral") neutral++;
  }
  const total = positive + neutral + negative;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return {
    positive,
    neutral,
    negative,
    total,
    positivePct: pct(positive),
    neutralPct: pct(neutral),
    negativePct: pct(negative),
  };
}

/**
 * Keep only reviews that participate in version analysis: Play Store source
 * with a non-empty reported version name. Everything else (WhatsApp, Google
 * Business, "version not reported") is excluded.
 */
export function filterVersionedReviews(reviews: VersionedReview[]): VersionedReview[] {
  return reviews.filter(
    (r) =>
      r.source === "play_store" &&
      typeof r.app_version_name === "string" &&
      r.app_version_name.trim().length > 0
  );
}

/** Group versioned reviews by their version name. */
function groupByVersion(reviews: VersionedReview[]): Map<string, VersionedReview[]> {
  const map = new Map<string, VersionedReview[]>();
  for (const r of reviews) {
    const name = (r.app_version_name as string).trim();
    const bucket = map.get(name);
    if (bucket) bucket.push(r);
    else map.set(name, [r]);
  }
  return map;
}

// ── Per-version metrics ────────────────────────────────────────────────────────

/**
 * Per-version rows for the supplied reviews (already version-filtered or not —
 * this filters defensively). Ordered newest-first using the SAME signal as the
 * inbox version dropdown: app_version_code DESC, NULL codes last, then most
 * recent activity, then count.
 */
export function computeVersionMetrics(reviews: VersionedReview[]): VersionMetrics[] {
  const versioned = filterVersionedReviews(reviews);
  const groups = groupByVersion(versioned);

  const rows: VersionMetrics[] = [];
  for (const [versionName, rs] of Array.from(groups.entries())) {
    // Highest code seen for this name (a build bump can change code without the
    // human version string changing — mirror the app-versions route).
    let code: number | null = null;
    let ratingSum = 0;
    let ratingCount = 0;
    let firstSeen: string | null = null;
    let lastSeen: string | null = null;

    for (const r of rs) {
      if (typeof r.app_version_code === "number") {
        code = code === null ? r.app_version_code : Math.max(code, r.app_version_code);
      }
      if (typeof r.rating === "number") {
        ratingSum += r.rating;
        ratingCount++;
      }
      const ts = r.review_created_at;
      if (ts) {
        if (firstSeen === null || ts < firstSeen) firstSeen = ts;
        if (lastSeen === null || ts > lastSeen) lastSeen = ts;
      }
    }

    rows.push({
      versionName,
      versionCode: code,
      count: rs.length,
      avgRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
      sentiment: computeSentimentSplit(rs),
      firstSeen,
      lastSeen,
      lowSample: rs.length < MIN_REVIEWS_FOR_CONFIDENCE,
    });
  }

  return sortVersionsNewestFirst(rows);
}

/** Sort: code DESC, NULL codes last; tiebreak lastSeen DESC, then count DESC. */
export function sortVersionsNewestFirst(rows: VersionMetrics[]): VersionMetrics[] {
  return rows.slice().sort((a, b) => {
    const ca = a.versionCode;
    const cb = b.versionCode;
    if (ca !== null && cb !== null && ca !== cb) return cb - ca;
    if (ca === null && cb !== null) return 1;
    if (ca !== null && cb === null) return -1;
    // Both null OR equal codes — fall back to recency then volume.
    if (a.lastSeen && b.lastSeen && a.lastSeen !== b.lastSeen) {
      return a.lastSeen < b.lastSeen ? 1 : -1;
    }
    return b.count - a.count;
  });
}

// ── Comparison ───────────────────────────────────────────────────────────────

/**
 * Theme deltas between two review sets. Reuses computeThemes() to bucket themes
 * per version (same normalization the Theme Map uses — drops empty / "general
 * feedback", current-rating sentiment), then diffs the UNION so a theme that
 * vanished in B (fell to 0) still surfaces as a faller.
 */
export function computeThemeDeltas(
  reviewsA: VersionedReview[],
  reviewsB: VersionedReview[]
): ThemeDelta[] {
  const a = computeThemes(reviewsA, []).themes;
  const b = computeThemes(reviewsB, []).themes;
  const countA = new Map(a.map((t) => [t.theme, t.count]));
  const countB = new Map(b.map((t) => [t.theme, t.count]));

  const themes = new Set<string>([
    ...Array.from(countA.keys()),
    ...Array.from(countB.keys()),
  ]);
  const deltas: ThemeDelta[] = [];
  for (const theme of Array.from(themes)) {
    const ca = countA.get(theme) ?? 0;
    const cb = countB.get(theme) ?? 0;
    const delta = cb - ca;
    if (delta === 0) continue; // no movement → not a "delta"
    deltas.push({
      theme,
      countA: ca,
      countB: cb,
      delta,
      changePct: ca > 0 ? Math.round((delta / ca) * 100) : null,
      direction: delta > 0 ? "up" : "down",
    });
  }

  deltas.sort(
    (x, y) =>
      Math.abs(y.delta) - Math.abs(x.delta) ||
      Math.abs(y.changePct ?? 0) - Math.abs(x.changePct ?? 0) ||
      x.theme.localeCompare(y.theme)
  );
  return deltas.slice(0, MAX_THEME_DELTAS);
}

/**
 * Build a comparison given the full versioned review set and the two version
 * names. versionB is treated as the NEWER release. Returns null if either
 * version has no reviews.
 */
export function compareVersions(
  reviews: VersionedReview[],
  versionAName: string,
  versionBName: string
): VersionComparison | null {
  const versioned = filterVersionedReviews(reviews);
  const groups = groupByVersion(versioned);
  const rowsA = groups.get(versionAName);
  const rowsB = groups.get(versionBName);
  if (!rowsA || !rowsB || rowsA.length === 0 || rowsB.length === 0) return null;

  const metrics = computeVersionMetrics(reviews);
  const metricsA = metrics.find((m) => m.versionName === versionAName)!;
  const metricsB = metrics.find((m) => m.versionName === versionBName)!;

  const ratingDelta =
    metricsA.avgRating !== null && metricsB.avgRating !== null
      ? Math.round((metricsB.avgRating - metricsA.avgRating) * 10) / 10
      : null;

  return {
    versionA: metricsA,
    versionB: metricsB,
    ratingDelta,
    countDelta: metricsB.count - metricsA.count,
    sentimentDelta: {
      positivePct: metricsB.sentiment.positivePct - metricsA.sentiment.positivePct,
      neutralPct: metricsB.sentiment.neutralPct - metricsA.sentiment.neutralPct,
      negativePct: metricsB.sentiment.negativePct - metricsA.sentiment.negativePct,
    },
    themeDeltas: computeThemeDeltas(rowsA, rowsB),
  };
}

/**
 * Default comparison: the latest version (B) vs the immediately previous
 * version with enough data (A). If no older version clears the low-sample bar,
 * fall back to the immediate predecessor so the user still gets a comparison
 * (it will be flagged low-sample in the UI). Returns null when fewer than two
 * versions exist.
 */
export function selectDefaultComparison(
  versions: VersionMetrics[]
): { versionAName: string; versionBName: string } | null {
  if (versions.length < 2) return null;
  const latest = versions[0]; // newest (B)
  const olders = versions.slice(1);
  const previous = olders.find((v) => !v.lowSample) ?? olders[0];
  return { versionAName: previous.versionName, versionBName: latest.versionName };
}

/**
 * Orchestrator: per-version table + the default latest-vs-previous comparison.
 * `reviews` may include any source — non-versioned rows are filtered out.
 * Pass `requested` to compare a specific pair instead of the default.
 */
export function analyzeVersionImpact(
  reviews: VersionedReview[],
  requested?: { versionAName: string; versionBName: string }
): VersionImpactResult {
  const versions = computeVersionMetrics(reviews);
  const hasVersionedReviews = versions.length > 0;

  let comparison: VersionComparison | null = null;
  if (requested) {
    comparison = compareVersions(reviews, requested.versionAName, requested.versionBName);
  } else {
    const def = selectDefaultComparison(versions);
    if (def) comparison = compareVersions(reviews, def.versionAName, def.versionBName);
  }

  return { versions, comparison, hasVersionedReviews };
}
