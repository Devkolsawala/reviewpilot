/**
 * Pure analytics aggregation helpers shared between the client analytics hook
 * (useAnalytics) and the server-side digest pipeline (exec-summary metrics,
 * weekly rating trend). Extracted verbatim from useAnalytics so both surfaces
 * compute the same numbers from the same math — no behavior change.
 *
 * Everything here is pure (rows in, aggregates out) and safe to import from
 * either client or server code.
 */

export type AnalyticsRange = "1d" | "7d" | "30d" | "90d";

export type AiSentimentLabel = "positive" | "neutral" | "negative";
export type AiUrgency = "low" | "medium" | "high" | "critical";

export interface ThemeAggregate {
  theme: string;
  // Dominant sentiment (the one with the highest count for this theme in
  // the current period). Used for the colored dot prefix in the card.
  sentiment: AiSentimentLabel;
  count: number;
  avgRating: number; // 0 if no rated reviews
  previousCount: number; // 0 if no data in the prior period
  changePct: number | null; // null when prior is 0 (treated as "no change indicator")
  // True when EVERY rated review in the theme has current rating >= 4.
  // Drives the "Resolved" split in ThemeMapCard so past issues users
  // confirmed-fixed render as resolved rather than as ongoing problems.
  // A theme with zero rated reviews defaults to false (treated as active).
  isResolved: boolean;
}

// Aspect-Based Sentiment Analysis aggregate per aspect across the selected
// range. `net` = ((positive - negative) / total) * 100, rounded.
export interface AspectAggregate {
  aspect: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  net: number;
}

// The minimal review row shape the aggregators need. Both the analytics hook's
// fetched rows and the digest's admin-client rows satisfy this.
export type MinReview = {
  id?: string;
  rating: number | null;
  reply_status: string | null;
  sentiment?: string | null;
  keywords?: string[] | null;
  review_created_at: string;
  source?: string | null;
  is_auto_replied?: boolean | null;
  author_name?: string | null;
  review_text?: string | null;
  ai_theme?: string | null;
  ai_emotion?: string | null;
  ai_urgency?: AiUrgency | string | null;
  ai_sentiment?: AiSentimentLabel | string | null;
  ai_insights_classified_at?: string | null;
  ai_aspects?: Record<string, string> | null;
};

export function isValidAiSentiment(v: unknown): v is AiSentimentLabel {
  return v === "positive" || v === "neutral" || v === "negative";
}

// Sentiment inferred from the review's CURRENT rating, not the classification
// snapshot. A review classified as negative that later recovers to 4–5★ should
// count as positive, so Theme Map dots and Aspect Sentiment reflect today's
// state — not what was true at classification time.
export function sentimentFromRating(
  rating: number | null | undefined
): AiSentimentLabel | null {
  if (typeof rating !== "number") return null;
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

// Response rate over a set of rows: published / (published + pending + drafted)
// as a rounded percentage. null when there's no denominator ("—" in the UI).
// This is the single source of truth — the dashboard stat card and the digest
// exec-summary metrics both go through here.
export function computeResponseRate(
  rows: Pick<MinReview, "reply_status">[]
): number | null {
  const published = rows.filter((r) => r.reply_status === "published").length;
  const pending = rows.filter((r) => r.reply_status === "pending").length;
  const drafted = rows.filter((r) => r.reply_status === "drafted").length;
  const denom = published + pending + drafted;
  return denom === 0 ? null : Math.round((published / denom) * 100);
}

export function isoWeekStart(d: Date): string {
  const day = d.getDay();
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().split("T")[0];
}

export function computeTrend(
  rows: MinReview[],
  range: AnalyticsRange
): { date: string; avg_rating: number; count: number }[] {
  const bucket: Record<string, { sum: number; count: number }> = {};
  const useWeekly = range === "90d";
  const useHourly = range === "1d";
  for (const r of rows) {
    // Skip rating-less rows (WhatsApp) from the rating trend
    if (r.rating == null) continue;
    const d = new Date(r.review_created_at);
    const key = useHourly
      ? `${d.toISOString().slice(0, 13)}:00` // YYYY-MM-DDTHH:00
      : useWeekly
      ? isoWeekStart(d)
      : d.toISOString().split("T")[0];
    if (!bucket[key]) bucket[key] = { sum: 0, count: 0 };
    bucket[key].sum += r.rating || 0;
    bucket[key].count += 1;
  }
  return Object.entries(bucket)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count }]) => ({
      date,
      avg_rating: Math.round((sum / count) * 10) / 10,
      count,
    }));
}

export function computeThemes(
  current: MinReview[],
  previous: MinReview[]
): { themes: ThemeAggregate[]; unclassifiedCount: number } {
  // Group current-period rows by theme. Each theme tracks per-sentiment counts
  // (so we can pick the dominant sentiment) and rating sum/count.
  type Bucket = {
    count: number;
    ratingSum: number;
    ratingCount: number;
    sentCounts: Record<AiSentimentLabel, number>;
    // Track resolved status by counting rated reviews and how many of them
    // are currently >=4 stars. A theme is "resolved" only when every rated
    // review has climbed to 4+ (i.e. all originally-classified complaints
    // have been confirmed-fixed by the reviewer).
    ratedHigh: number;
    ratedLow: number;
  };
  const buckets: Record<string, Bucket> = {};
  let unclassifiedCount = 0;

  for (const r of current) {
    const theme = (r.ai_theme || "").trim();
    if (!theme || theme === "general feedback") {
      unclassifiedCount++;
      continue;
    }
    if (!buckets[theme]) {
      buckets[theme] = {
        count: 0,
        ratingSum: 0,
        ratingCount: 0,
        sentCounts: { positive: 0, neutral: 0, negative: 0 },
        ratedHigh: 0,
        ratedLow: 0,
      };
    }
    const b = buckets[theme];
    b.count++;
    if (r.rating != null) {
      b.ratingSum += r.rating;
      b.ratingCount++;
      if (r.rating >= 4) b.ratedHigh++;
      else b.ratedLow++;
    }
    // Prefer CURRENT-rating-derived sentiment so recovered reviews flip the
    // theme's dominant sentiment to positive. Fall back to the stored
    // ai_sentiment only when the row has no rating (rare — non-rating sources).
    const ratingSent = sentimentFromRating(r.rating);
    const s: AiSentimentLabel = ratingSent
      ?? (isValidAiSentiment(r.ai_sentiment) ? r.ai_sentiment : "neutral");
    b.sentCounts[s]++;
  }

  // Previous period counts per theme.
  const prevCounts: Record<string, number> = {};
  for (const r of previous) {
    const theme = (r.ai_theme || "").trim();
    if (!theme || theme === "general feedback") continue;
    prevCounts[theme] = (prevCounts[theme] || 0) + 1;
  }

  const themes: ThemeAggregate[] = Object.entries(buckets).map(([theme, b]) => {
    // Dominant sentiment for the colored dot prefix
    let dom: AiSentimentLabel = "neutral";
    let domCount = -1;
    (["negative", "positive", "neutral"] as AiSentimentLabel[]).forEach((s) => {
      if (b.sentCounts[s] > domCount) {
        dom = s;
        domCount = b.sentCounts[s];
      }
    });
    const prev = prevCounts[theme] || 0;
    const avgRating =
      b.ratingCount > 0 ? Math.round((b.ratingSum / b.ratingCount) * 10) / 10 : 0;
    const changePct =
      prev === 0 ? null : Math.round(((b.count - prev) / prev) * 100);
    // Resolved when at least one review has a rating and EVERY rated review
    // is 4+ stars. Themes with no rated reviews (rare) stay active so they
    // don't accidentally hide in the "Resolved" section.
    const isResolved = b.ratingCount > 0 && b.ratedLow === 0;
    return {
      theme,
      sentiment: dom,
      count: b.count,
      avgRating,
      previousCount: prev,
      changePct,
      isResolved,
    };
  });

  themes.sort((a, b) => b.count - a.count);
  return { themes: themes.slice(0, 12), unclassifiedCount };
}

export function computeAspectAggregates(
  rows: MinReview[],
  minMentions: number
): AspectAggregate[] {
  const map = new Map<
    string,
    { positive: number; neutral: number; negative: number }
  >();
  for (const r of rows) {
    const a = r.ai_aspects;
    if (!a || typeof a !== "object") continue;
    // Override stored aspect sentiment with the review's CURRENT-rating
    // sentiment. Recovered reviews (e.g. went from 1★→5★) should count their
    // aspects as positive even though the classifier originally tagged them
    // negative. Fall back to the stored sentiment when the row has no rating.
    const ratingSent = sentimentFromRating(r.rating);
    for (const [aspect, storedSentiment] of Object.entries(a)) {
      if (!aspect) continue;
      const effective =
        ratingSent ??
        (storedSentiment === "positive" ||
        storedSentiment === "neutral" ||
        storedSentiment === "negative"
          ? (storedSentiment as AiSentimentLabel)
          : null);
      if (!effective) continue;
      const current = map.get(aspect) ?? {
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      current[effective]++;
      map.set(aspect, current);
    }
  }
  return Array.from(map.entries())
    .map(([aspect, counts]) => {
      const total = counts.positive + counts.neutral + counts.negative;
      return {
        aspect,
        ...counts,
        total,
        net:
          total > 0
            ? Math.round(((counts.positive - counts.negative) / total) * 100)
            : 0,
      };
    })
    // Hide noise — adaptive threshold from caller (min 2, scaling up with
    // review volume) so low-volume users still see aspects instead of an
    // empty state forever.
    .filter((a) => a.total >= minMentions)
    .sort((a, b) => b.total - a.total);
}
