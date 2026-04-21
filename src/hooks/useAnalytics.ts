"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export type AnalyticsRange = "7d" | "30d" | "90d";

export const RANGE_DAYS: Record<AnalyticsRange, number> = {
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

export interface Analytics {
  totals: AnalyticsTotals;
  previousPeriodTotals: AnalyticsTotals;
  trend: { date: string; avg_rating: number; count: number }[];
  distribution: { star: number; count: number }[];
  sentiment_breakdown: Record<string, number>;
  top_keywords: { word: string; count: number }[];
  source_breakdown: { name: string; value: number; color: string }[];
  connectionAgeDays: number | null;
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
  rating: number;
  review_created_at: string;
  reply_status: "pending" | "drafted" | "published";
  is_auto_replied: boolean;
  source: string;
  sentiment: string;
  keywords: string[];
};

const KEYWORDS = [
  "great service", "friendly staff", "recommend", "easy to use", "fast",
  "slow", "crash", "ads", "wait time", "amazing", "buggy", "love it",
  "too expensive", "clean", "helpful",
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
      const rating = Math.min(5, Math.max(1, 1 + Math.floor(rand() * 5) + (rand() > 0.5 ? 1 : 0)));
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
      reviews.push({
        rating,
        review_created_at: created.toISOString(),
        reply_status,
        is_auto_replied,
        source,
        sentiment,
        keywords,
      });
    }
  }
  MOCK_CACHE = reviews;
  return reviews;
}

// ── Aggregation helpers ─────────────────────────────────────────────────────
type MinReview = {
  rating: number | null;
  reply_status: string | null;
  sentiment?: string | null;
  keywords?: string[] | null;
  review_created_at: string;
  source?: string | null;
  is_auto_replied?: boolean | null;
};

function computeTotals(rows: MinReview[], monthStart: Date): AnalyticsTotals {
  const total = rows.length;
  // WhatsApp messages have no rating; exclude them from avg so the number
  // isn't skewed toward 0.
  const rated = rows.filter((r) => r.rating != null);
  const avg =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length
      : 0;
  const published = rows.filter((r) => r.reply_status === "published").length;
  const pending = rows.filter((r) => r.reply_status === "pending").length;
  const drafted = rows.filter((r) => r.reply_status === "drafted").length;
  const denom = published + pending + drafted;
  const responseRate = denom === 0 ? null : Math.round((published / denom) * 100);
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

function isoWeekStart(d: Date): string {
  const day = d.getDay();
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().split("T")[0];
}

function computeTrend(rows: MinReview[], range: AnalyticsRange): { date: string; avg_rating: number; count: number }[] {
  const bucket: Record<string, { sum: number; count: number }> = {};
  const useWeekly = range === "90d";
  for (const r of rows) {
    // Skip rating-less rows (WhatsApp) from the rating trend
    if (r.rating == null) continue;
    const d = new Date(r.review_created_at);
    const key = useWeekly ? isoWeekStart(d) : d.toISOString().split("T")[0];
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

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
          if (cancelled) return;
          setRows(buildMockDataset());
          setIsMock(true);
          setConnectionAgeDays(120);
          return;
        }

        const supabase = createClient();
        const { data: connections } = await supabase
          .from("connections")
          .select("id, created_at")
          .eq("is_active", true);

        if (!connections || connections.length === 0) {
          if (cancelled) return;
          setRows(buildMockDataset());
          setIsMock(true);
          setConnectionAgeDays(120);
          return;
        }

        const oldest = connections.reduce((acc, c) => {
          const t = c.created_at ? new Date(c.created_at).getTime() : Date.now();
          return Math.min(acc, t);
        }, Date.now());
        const ageDays = Math.floor((Date.now() - oldest) / 86400000);

        const { data, error } = await supabase
          .from("reviews")
          .select(
            "rating, reply_status, sentiment, keywords, review_created_at, source, is_auto_replied"
          )
          .in("connection_id", connections.map((c) => c.id))
          .order("review_created_at", { ascending: false })
          .limit(5000);

        if (error) throw error;
        if (cancelled) return;
        setRows((data || []) as MinReview[]);
        setIsMock(false);
        setConnectionAgeDays(ageDays);
      } catch (err) {
        if (cancelled) return;
        console.error("[useAnalytics]", err);
        setRows([]);
        setIsMock(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

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

    return {
      totals,
      previousPeriodTotals: prevTotals,
      ...agg,
      connectionAgeDays,
    };
  }, [rows, range, connectionAgeDays]);

  return { analytics, loading, isMock, range };
}
