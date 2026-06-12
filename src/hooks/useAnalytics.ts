"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeThemes,
  computeAspectAggregates,
  computeResponseRate,
  computeTrend,
  isoWeekStart,
  type AnalyticsRange,
  type AiSentimentLabel,
  type AiUrgency,
  type ThemeAggregate,
  type AspectAggregate,
  type MinReview,
} from "@/lib/analytics/aggregates";

// Re-exported so existing imports from this hook keep working. The pure
// aggregation helpers live in @/lib/analytics/aggregates so the server-side
// digest pipeline computes the same numbers from the same math.
export type {
  AnalyticsRange,
  AiSentimentLabel,
  AiUrgency,
  ThemeAggregate,
  AspectAggregate,
};

export const RANGE_DAYS: Record<AnalyticsRange, number> = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export interface AnalyticsTotals {
  total_reviews: number;
  avg_rating: number;
  response_rate: number | null; // null = "—" (no denominator)
  awaiting_reply: number;
  auto_replies_this_month: number; // always calendar month
  auto_replies_this_month_published: number;
  auto_replies_this_month_drafted: number;
}

export interface CriticalIssue {
  id: string;
  author_name: string;
  text: string;
  rating: number | null;
  source: string | null;
  created_at: string; // review_created_at
  ai_theme: string | null;
  ai_emotion: string | null;
}

// Phase 2 — Net Sentiment Score trend point. NSS = positive% − negative% on
// the bucket's reviews. Used by the redesigned Sentiment card sparkline.
export interface NssTrendPoint {
  date: string;
  nss: number;
  total: number;
}

export interface Analytics {
  totals: AnalyticsTotals;
  previousPeriodTotals: AnalyticsTotals;
  trend: { date: string; avg_rating: number; count: number }[];
  distribution: { star: number; count: number }[];
  sentiment_breakdown: Record<string, number>;
  top_keywords: { word: string; count: number }[];
  source_breakdown: { name: string; value: number; color: string }[];
  connectionAgeDays: number | null;
  // Theme Map (STEP 7) — aggregated over the selected range, with prior-period delta.
  themes: ThemeAggregate[];
  // Number of reviews in the selected range with ai_theme IS NULL (or
  // "general feedback"). Shown as a small footer count in the card.
  themesUnclassifiedCount: number;
  // Number of reviews across the FULL fetched dataset (not range-filtered)
  // with ai_insights_classified_at IS NULL. Drives the "Classify N pending"
  // CTA in the Theme Map empty state and header button. Separate from
  // themesUnclassifiedCount so the user-facing classifier batch is sized
  // against all unclassified reviews, not just those in the selected range.
  allUnclassifiedCount: number;
  // Whether the selected range has any reviews at all. Drives the second
  // empty-state variant (no reviews) vs the "no themes but reviews exist".
  hasReviewsInRange: boolean;
  // Critical Issues card (STEP 8) — last 7 days only, independent of range.
  criticalIssues: CriticalIssue[];
  // Phase 2 — Aspect sentiment aggregates over the selected range.
  // Filtered with an ADAPTIVE noise threshold (min 2 mentions, scales up
  // with reviewCountInRange/20) so low-volume users still see aspects.
  // Sorted by total mentions descending.
  aspectAggregates: AspectAggregate[];
  // All-time count of reviews across the user's active connections
  // (independent of the page's range selector). Drives empty-state copy that
  // distinguishes "no reviews ever" from "no reviews in this range".
  totalReviewCountAllTime: number;
  // Count of reviews in the selected range (== currentRows.length). Exposed
  // explicitly because several cards branch their empty state on it.
  reviewCountInRange: number;
  // Phase 2 — Day-by-day (or hourly for 1d, weekly for 90d) NSS series for
  // the sentiment card sparkline.
  nssTrend: NssTrendPoint[];
  // Phase 2 — Current NSS for the selected range and the delta vs the same
  // length previous period. null when there isn't enough data.
  nssCurrent: number | null;
  nssPrevious: number | null;
  nssDelta: number | null;
}

const EMPTY_TOTALS: AnalyticsTotals = {
  total_reviews: 0,
  avg_rating: 0,
  response_rate: null,
  awaiting_reply: 0,
  auto_replies_this_month: 0,
  auto_replies_this_month_published: 0,
  auto_replies_this_month_drafted: 0,
};

const EMPTY_ANALYTICS: Analytics = {
  totals: EMPTY_TOTALS,
  previousPeriodTotals: EMPTY_TOTALS,
  trend: [],
  distribution: [1, 2, 3, 4, 5].map((s) => ({ star: s, count: 0 })),
  sentiment_breakdown: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
  top_keywords: [],
  source_breakdown: [],
  connectionAgeDays: null,
  themes: [],
  themesUnclassifiedCount: 0,
  allUnclassifiedCount: 0,
  hasReviewsInRange: false,
  criticalIssues: [],
  aspectAggregates: [],
  totalReviewCountAllTime: 0,
  reviewCountInRange: 0,
  nssTrend: [],
  nssCurrent: null,
  nssPrevious: null,
  nssDelta: null,
};

const SOURCE_META: Record<string, { name: string; color: string }> = {
  google_business: { name: "Google Business", color: "#4285f4" },
  play_store: { name: "Play Store", color: "#34a853" },
};

// ── Deterministic seeded 120-day mock dataset ───────────────────────────────
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

type MockReview = {
  id: string;
  rating: number;
  review_created_at: string;
  reply_status: "pending" | "drafted" | "published";
  is_auto_replied: boolean;
  source: string;
  sentiment: string;
  keywords: string[];
  author_name: string;
  review_text: string;
  ai_theme: string | null;
  ai_emotion: string | null;
  ai_urgency: AiUrgency | null;
  ai_sentiment: AiSentimentLabel | null;
  ai_insights_classified_at: string | null;
  ai_aspects: Record<string, AiSentimentLabel> | null;
};

const KEYWORDS = [
  "great service", "friendly staff", "recommend", "easy to use", "fast",
  "slow", "crash", "ads", "wait time", "amazing", "buggy", "love it",
  "too expensive", "clean", "helpful",
];

// Realistic theme clusters for the Theme Map mock. Each entry: theme,
// sentiment, base rating, sample text. The mock generator picks one of these
// per review (weighted by `weight`) so the Theme Map shows clusters.
const MOCK_THEMES: Array<{
  theme: string;
  sentiment: AiSentimentLabel;
  emotion: string;
  ratingRange: [number, number];
  weight: number;
  texts: string[];
  // Phase 2 — aspect signature for the theme. The mock dataset assigns these
  // ai_aspects values so the AspectSentimentCard has realistic data.
  // Aspect keys vary by source; the generator picks PS- or GBP-flavored sets
  // depending on the review's chosen source.
  appAspects?: Record<string, AiSentimentLabel>;
  gbpAspects?: Record<string, AiSentimentLabel>;
}> = [
  { theme: "camera crashes", sentiment: "negative", emotion: "frustrated", ratingRange: [1, 2], weight: 5,
    texts: ["Camera crashes every time I open it.", "App keeps closing on the camera screen, please fix."],
    appAspects: { performance: "negative", bugs: "negative", features: "negative" },
    gbpAspects: { service: "negative" } },
  { theme: "slow checkout", sentiment: "negative", emotion: "frustrated", ratingRange: [1, 3], weight: 4,
    texts: ["Checkout is so slow, takes forever.", "Payment screen lag is unbearable."],
    appAspects: { performance: "negative", ui_ux: "negative" },
    gbpAspects: { service: "negative", wait_time: "negative" } },
  { theme: "great support", sentiment: "positive", emotion: "delighted", ratingRange: [4, 5], weight: 4,
    texts: ["Support team helped me in minutes.", "Loved how quickly support replied!"],
    appAspects: { customer_support: "positive" },
    gbpAspects: { service: "positive", staff: "positive" } },
  { theme: "polite staff", sentiment: "positive", emotion: "satisfied", ratingRange: [4, 5], weight: 3,
    texts: ["Staff was very polite and helpful.", "Friendly and patient staff, will return."],
    appAspects: { customer_support: "positive" },
    gbpAspects: { staff: "positive", service: "positive" } },
  { theme: "long wait time", sentiment: "negative", emotion: "disappointed", ratingRange: [1, 3], weight: 3,
    texts: ["Waited 45 minutes for service.", "Wait time was way too long."],
    appAspects: { performance: "negative" },
    gbpAspects: { wait_time: "negative", service: "negative" } },
  { theme: "good food quality", sentiment: "positive", emotion: "satisfied", ratingRange: [4, 5], weight: 3,
    texts: ["Food quality was excellent.", "Tasted great, fresh ingredients."],
    gbpAspects: { food: "positive", ambience: "positive" } },
  { theme: "dark mode missing", sentiment: "neutral", emotion: "hopeful", ratingRange: [3, 4], weight: 2,
    texts: ["Please add dark mode!", "Would love a dark theme option."],
    appAspects: { features: "neutral", ui_ux: "neutral" } },
  { theme: "too many ads", sentiment: "negative", emotion: "frustrated", ratingRange: [1, 2], weight: 3,
    texts: ["Ads after every action, ridiculous.", "Too many ads, ruins the experience."],
    appAspects: { ads: "negative", ui_ux: "negative" } },
];

// Theme-weighted picker for the mock dataset.
function pickTheme(rand: () => number) {
  const totalWeight = MOCK_THEMES.reduce((s, t) => s + t.weight, 0);
  let r = rand() * totalWeight;
  for (const t of MOCK_THEMES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return MOCK_THEMES[0];
}

const MOCK_NAMES = [
  "Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Reddy", "Vikram Singh",
  "Arjun Nair", "Meera Joshi", "Deepak Verma", "Kavita Deshmukh", "Suresh Menon",
  "Ananya Chatterjee", "Rohit Gupta", "Fatima Sheikh", "Kiran Rao", "Rajesh Pillai",
];

let MOCK_CACHE: MockReview[] | null = null;
function buildMockDataset(): MockReview[] {
  if (MOCK_CACHE) return MOCK_CACHE;
  const rand = seededRand(42);
  const reviews: MockReview[] = [];
  const now = Date.now();
  // ~120 days of reviews, ~2-4 per day
  for (let d = 0; d < 120; d++) {
    const count = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const hourOffset = Math.floor(rand() * 24);
      const created = new Date(now - d * 86400000 - hourOffset * 3600000);

      // Pick a theme cluster; rating + sentiment derive from it so the Theme
      // Map shows realistic per-theme averages.
      const themeMeta = pickTheme(rand);
      const [rLo, rHi] = themeMeta.ratingRange;
      const rating = Math.min(5, Math.max(1, rLo + Math.floor(rand() * (rHi - rLo + 1))));

      const source = rand() > 0.6 ? "play_store" : "google_business";
      const statusRoll = rand();
      const reply_status: MockReview["reply_status"] =
        statusRoll < 0.55 ? "published" : statusRoll < 0.75 ? "drafted" : "pending";
      const is_auto_replied = reply_status !== "pending" && rand() > 0.3;
      const sentiment = rating >= 4 ? "positive" : rating <= 2 ? "negative" : rand() > 0.5 ? "mixed" : "neutral";
      const kwCount = 1 + Math.floor(rand() * 3);
      const keywords: string[] = [];
      for (let k = 0; k < kwCount; k++) {
        keywords.push(KEYWORDS[Math.floor(rand() * KEYWORDS.length)]);
      }
      const author_name = MOCK_NAMES[Math.floor(rand() * MOCK_NAMES.length)];
      const review_text = themeMeta.texts[Math.floor(rand() * themeMeta.texts.length)];
      const aspectsForRow =
        source === "play_store" ? themeMeta.appAspects : themeMeta.gbpAspects;
      reviews.push({
        id: `mock-an-${d}-${i}`,
        rating,
        review_created_at: created.toISOString(),
        reply_status,
        is_auto_replied,
        source,
        sentiment,
        keywords,
        author_name,
        review_text,
        ai_theme: themeMeta.theme,
        ai_emotion: themeMeta.emotion,
        ai_urgency:
          themeMeta.sentiment === "negative" && rating <= 2 ? "high" : "low",
        ai_sentiment: themeMeta.sentiment,
        ai_insights_classified_at: created.toISOString(),
        ai_aspects: aspectsForRow ?? null,
      });
    }
  }

  // ── Critical reviews — explicit injections so the Critical Issues card
  //    has predictable data in mock mode. One inside the last 7d window
  //    (alarm variant), one outside (>7d, must NOT appear) so the filter
  //    is verifiable.
  reviews.push({
    id: "mock-an-critical-recent",
    rating: 1,
    review_created_at: new Date(now - 2 * 86400000).toISOString(),
    reply_status: "pending",
    is_auto_replied: false,
    source: "play_store",
    sentiment: "negative",
    keywords: ["payment", "fraud"],
    author_name: "Karan Mehta",
    review_text:
      "Paid for premium but never got access, support not responding. Filing chargeback.",
    ai_theme: "payment lost",
    ai_emotion: "angry",
    ai_urgency: "critical",
    ai_sentiment: "negative",
    ai_insights_classified_at: new Date(now - 2 * 86400000).toISOString(),
    ai_aspects: { customer_support: "negative", features: "negative" },
  });
  reviews.push({
    id: "mock-an-critical-old",
    rating: 1,
    review_created_at: new Date(now - 20 * 86400000).toISOString(),
    reply_status: "published",
    is_auto_replied: false,
    source: "google_business",
    sentiment: "negative",
    keywords: ["food poisoning"],
    author_name: "Riya Bhatt",
    review_text:
      "Got food poisoning after eating here last week, terrible experience.",
    ai_theme: "food poisoning",
    ai_emotion: "angry",
    ai_urgency: "critical",
    ai_sentiment: "negative",
    ai_insights_classified_at: new Date(now - 20 * 86400000).toISOString(),
    ai_aspects: { food: "negative", cleanliness: "negative" },
  });

  MOCK_CACHE = reviews;
  return reviews;
}

// ── Aggregation helpers ─────────────────────────────────────────────────────

function computeTotals(rows: MinReview[], monthStart: Date): AnalyticsTotals {
  const total = rows.length;
  // WhatsApp messages have no rating; exclude them from avg so the number
  // isn't skewed toward 0.
  const rated = rows.filter((r) => r.rating != null);
  const avg =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length
      : 0;
  const pending = rows.filter((r) => r.reply_status === "pending").length;
  const drafted = rows.filter((r) => r.reply_status === "drafted").length;
  const responseRate = computeResponseRate(rows);
  const awaiting = pending + drafted;

  const autoMonth = rows.filter(
    (r) =>
      r.is_auto_replied && new Date(r.review_created_at) >= monthStart
  );
  return {
    total_reviews: total,
    avg_rating: Math.round(avg * 10) / 10,
    response_rate: responseRate,
    awaiting_reply: awaiting,
    auto_replies_this_month: autoMonth.length,
    auto_replies_this_month_published: autoMonth.filter((r) => r.reply_status === "published").length,
    auto_replies_this_month_drafted: autoMonth.filter((r) => r.reply_status === "drafted").length,
  };
}

// Net Sentiment Score for a set of reviews. Considers only rows with a
// non-mixed sentiment label. Returns null if there are no qualifying rows.
function nssFor(rows: MinReview[]): { nss: number | null; total: number } {
  let pos = 0;
  let neg = 0;
  let total = 0;
  for (const r of rows) {
    if (r.sentiment === "positive") {
      pos++;
      total++;
    } else if (r.sentiment === "negative") {
      neg++;
      total++;
    } else if (r.sentiment === "neutral" || r.sentiment === "mixed") {
      total++;
    }
  }
  if (total === 0) return { nss: null, total: 0 };
  return {
    nss: Math.round(((pos - neg) / total) * 100),
    total,
  };
}

function computeNssTrend(
  rows: MinReview[],
  range: AnalyticsRange
): NssTrendPoint[] {
  const useHourly = range === "1d";
  const useWeekly = range === "90d";
  const buckets: Record<string, { pos: number; neg: number; total: number }> =
    {};
  for (const r of rows) {
    const d = new Date(r.review_created_at);
    if (isNaN(d.getTime())) continue;
    const key = useHourly
      ? `${d.toISOString().slice(0, 13)}:00`
      : useWeekly
      ? isoWeekStart(d)
      : d.toISOString().split("T")[0];
    if (!buckets[key]) buckets[key] = { pos: 0, neg: 0, total: 0 };
    if (r.sentiment === "positive") {
      buckets[key].pos++;
      buckets[key].total++;
    } else if (r.sentiment === "negative") {
      buckets[key].neg++;
      buckets[key].total++;
    } else if (r.sentiment === "neutral" || r.sentiment === "mixed") {
      buckets[key].total++;
    }
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      nss:
        b.total === 0
          ? 0
          : Math.round(((b.pos - b.neg) / b.total) * 100),
      total: b.total,
    }));
}

function computeCriticalIssues(
  all: MinReview[],
  now: Date,
  range: AnalyticsRange
): CriticalIssue[] {
  // Critical Issues honors the page's range selector. "1d" = since start of
  // today in local time (calendar-day semantics — what a user expects when
  // they pick "Today"). Other ranges = rolling N-day window.
  let from: number;
  if (range === "1d") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    from = start.getTime();
  } else {
    const days = RANGE_DAYS[range];
    from = now.getTime() - days * 86400000;
  }
  return all
    .filter((r) => {
      if (r.ai_urgency !== "critical") return false;
      const t = new Date(r.review_created_at).getTime();
      return !isNaN(t) && t >= from;
    })
    .sort(
      (a, b) =>
        new Date(b.review_created_at).getTime() -
        new Date(a.review_created_at).getTime()
    )
    .slice(0, 5)
    .map((r) => ({
      id: r.id || "",
      author_name: r.author_name || "Anonymous",
      text: r.review_text || "",
      rating: r.rating,
      source: r.source || null,
      created_at: r.review_created_at,
      ai_theme: r.ai_theme || null,
      ai_emotion: r.ai_emotion || null,
    }));
}

function computeAggregates(rows: MinReview[], range: AnalyticsRange) {
  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: rows.filter((r) => r.rating === star).length,
  }));

  const sentiment_breakdown = {
    positive: rows.filter((r) => r.sentiment === "positive").length,
    negative: rows.filter((r) => r.sentiment === "negative").length,
    neutral: rows.filter((r) => r.sentiment === "neutral").length,
    mixed: rows.filter((r) => r.sentiment === "mixed").length,
  };

  const keywordFreq: Record<string, number> = {};
  for (const r of rows) {
    for (const kw of r.keywords || []) {
      keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
    }
  }
  const top_keywords = Object.entries(keywordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  const total = rows.length;
  const sourceCount: Record<string, number> = {};
  for (const r of rows) {
    const src = r.source || "unknown";
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  }
  const source_breakdown = Object.entries(sourceCount).map(([src, count]) => ({
    name: SOURCE_META[src]?.name ?? src,
    value: total > 0 ? Math.round((count / total) * 100) : 0,
    color: SOURCE_META[src]?.color ?? "#94a3b8",
  }));

  return {
    distribution,
    sentiment_breakdown,
    top_keywords,
    source_breakdown,
    trend: computeTrend(rows, range),
  };
}

function filterRange(rows: MinReview[], from: Date, to: Date): MinReview[] {
  return rows.filter((r) => {
    const d = new Date(r.review_created_at);
    return d >= from && d < to;
  });
}

export function useAnalytics(range: AnalyticsRange = "30d") {
  const [rows, setRows] = useState<MinReview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [connectionAgeDays, setConnectionAgeDays] = useState<number | null>(null);
  // All-time review count, separate from `rows` (which is .limit(5000)) so we
  // can distinguish "no reviews ever" from "no reviews in this range" even on
  // accounts with > 5000 reviews. Cheap count-only query against Supabase.
  const [totalReviewCountAllTime, setTotalReviewCountAllTime] = useState(0);
  // Incremented by callers to force a re-fetch (e.g. after the user clicks
  // "Classify N pending reviews" on the Theme Map card).
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
          if (cancelled) return;
          const mock = buildMockDataset();
          setRows(mock);
          setIsMock(true);
          setConnectionAgeDays(120);
          setTotalReviewCountAllTime(mock.length);
          return;
        }

        const supabase = createClient();
        const { data: connections } = await supabase
          .from("connections")
          .select("id, created_at")
          .eq("is_active", true);

        if (!connections || connections.length === 0) {
          if (cancelled) return;
          const mock = buildMockDataset();
          setRows(mock);
          setIsMock(true);
          setConnectionAgeDays(120);
          setTotalReviewCountAllTime(mock.length);
          return;
        }

        const oldest = connections.reduce((acc, c) => {
          const t = c.created_at ? new Date(c.created_at).getTime() : Date.now();
          return Math.min(acc, t);
        }, Date.now());
        const ageDays = Math.floor((Date.now() - oldest) / 86400000);

        const connectionIds = connections.map((c) => c.id);

        // Count-only query for the all-time total. Separate from the rows
        // load so it stays cheap even for > 5000-review accounts.
        const { count: allTimeCount } = await supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .in("connection_id", connectionIds);

        const { data, error } = await supabase
          .from("reviews")
          .select(
            "id, rating, reply_status, sentiment, keywords, review_created_at, source, is_auto_replied, author_name, review_text, ai_theme, ai_emotion, ai_urgency, ai_sentiment, ai_insights_classified_at, ai_aspects"
          )
          .in("connection_id", connectionIds)
          .order("review_created_at", { ascending: false })
          .limit(5000);

        if (error) throw error;
        if (cancelled) return;
        setRows((data || []) as MinReview[]);
        setIsMock(false);
        setConnectionAgeDays(ageDays);
        setTotalReviewCountAllTime(
          typeof allTimeCount === "number" ? allTimeCount : (data?.length ?? 0)
        );
      } catch (err) {
        if (cancelled) return;
        console.error("[useAnalytics]", err);
        setRows([]);
        setIsMock(false);
        setTotalReviewCountAllTime(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // refreshTick is intentionally a dep so callers can force a re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick]);

  const analytics = useMemo<Analytics>(() => {
    if (!rows) return EMPTY_ANALYTICS;
    const now = new Date();
    const days = RANGE_DAYS[range];
    const from = new Date(now.getTime() - days * 86400000);
    const prevFrom = new Date(now.getTime() - 2 * days * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentRows = filterRange(rows, from, now);
    const previousRows = filterRange(rows, prevFrom, from);

    const totals = computeTotals(currentRows, monthStart);
    const prevTotals = computeTotals(previousRows, monthStart);
    const agg = computeAggregates(currentRows, range);
    const { themes, unclassifiedCount } = computeThemes(currentRows, previousRows);
    // Critical issues use the WHOLE dataset filtered to the selected range —
    // matches the page's range selector so the card copy ("today" / "last
    // 7/30/90 days") and the rows agree.
    const criticalIssues = computeCriticalIssues(rows, now, range);
    // Adaptive threshold: 22 reviews → 2, 100 → 5, 200 → 10. Low-volume users
    // no longer get a perpetually-empty ABSA card just because the prior
    // hard-coded floor of 3 was too high for them.
    const minMentions = Math.max(2, Math.ceil(currentRows.length / 20));
    const aspectAggregates = computeAspectAggregates(currentRows, minMentions);

    const { nss: nssCurrent } = nssFor(currentRows);
    const { nss: nssPrevious } = nssFor(previousRows);
    const nssDelta =
      nssCurrent != null && nssPrevious != null ? nssCurrent - nssPrevious : null;
    const nssTrend = computeNssTrend(currentRows, range);

    // Across the WHOLE fetched dataset (not range-filtered) — drives the
    // user-facing "Classify N pending" CTA. We count rows where the AI hasn't
    // touched them yet.
    const allUnclassifiedCount = rows.filter(
      (r) => !r.ai_insights_classified_at
    ).length;
    const hasReviewsInRange = currentRows.length > 0;

    return {
      totals,
      previousPeriodTotals: prevTotals,
      ...agg,
      connectionAgeDays,
      themes,
      themesUnclassifiedCount: unclassifiedCount,
      allUnclassifiedCount,
      hasReviewsInRange,
      criticalIssues,
      aspectAggregates,
      // All-time count is what the empty-state copy needs ("no reviews ever"
      // vs "no reviews in this range"). When `rows` undershoots due to the
      // 5000-row limit, fall back to that value.
      totalReviewCountAllTime: Math.max(totalReviewCountAllTime, rows.length),
      reviewCountInRange: currentRows.length,
      nssTrend,
      nssCurrent,
      nssPrevious,
      nssDelta,
    };
  }, [rows, range, connectionAgeDays, totalReviewCountAllTime]);

  const refetch = () => setRefreshTick((t) => t + 1);
  return { analytics, loading, isMock, range, refetch };
}
