"use client";
import { useState, useEffect } from "react";
import { MOCK_ANALYTICS } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

export interface Analytics {
  total_reviews: number;
  avg_rating: number;
  response_rate: number;
  avg_response_time_hours: number;
  rating_trend: { date: string; avg_rating: number; count: number }[];
  sentiment_breakdown: Record<string, number>;
  top_keywords: { word: string; count: number }[];
  source_breakdown: { name: string; value: number; color: string }[];
  auto_reply_stats: {
    total: number;
    published: number;
    drafted: number;
  };
}

const EMPTY_ANALYTICS: Analytics = {
  total_reviews: 0,
  avg_rating: 0,
  response_rate: 0,
  avg_response_time_hours: 0,
  rating_trend: [],
  sentiment_breakdown: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
  top_keywords: [],
  source_breakdown: [],
  auto_reply_stats: { total: 0, published: 0, drafted: 0 },
};

const SOURCE_META: Record<string, { name: string; color: string }> = {
  google_business: { name: "Google Business", color: "#4285f4" },
  play_store: { name: "Play Store", color: "#34a853" },
};

// month label → first-of-month ISO date
const MONTH_IDX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
function monthToISO(str: string): string {
  const [mon, year] = str.split(" ");
  const m = MONTH_IDX[mon] ?? 0;
  return new Date(parseInt(year), m, 1).toISOString().split("T")[0];
}

async function buildMockAnalytics(): Promise<Analytics> {
  const { mockAnalytics } = await import("@/lib/mock/mock-analytics");
  return {
    total_reviews: mockAnalytics.totalReviews,
    avg_rating: mockAnalytics.averageRating,
    response_rate: Math.round(mockAnalytics.replyRate),
    avg_response_time_hours: 4.2,
    rating_trend: mockAnalytics.monthlyTrend.map((m) => ({
      date: monthToISO(m.month),
      avg_rating: m.avgRating,
      count: m.count,
    })),
    sentiment_breakdown: {
      positive: mockAnalytics.sentimentBreakdown.positive,
      negative: mockAnalytics.sentimentBreakdown.negative,
      neutral: mockAnalytics.sentimentBreakdown.neutral,
      mixed: 2,
    },
    top_keywords: mockAnalytics.topKeywords.map((word, i) => ({
      word,
      count: Math.max(28 - i * 2, 4),
    })),
    source_breakdown: [
      { name: "Play Store", value: 63, color: "#34a853" },
      { name: "Google Business", value: 37, color: "#4285f4" },
    ],
    auto_reply_stats: { total: 2, published: 2, drafted: 0 },
  };
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        // Fast-path: env var forces mock mode
        if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
          const mock = await buildMockAnalytics();
          setAnalytics(mock);
          setIsMock(true);
          return;
        }

        const supabase = createClient();

        const { data: connections } = await supabase
          .from("connections")
          .select("id")
          .eq("is_active", true)
          .limit(1);

        if (!connections || connections.length === 0) {
          setAnalytics({
            ...MOCK_ANALYTICS,
            source_breakdown: [
              { name: "Google Business", value: 55, color: "#4285f4" },
              { name: "Play Store", value: 45, color: "#34a853" },
            ],
            auto_reply_stats: { total: 47, published: 42, drafted: 5 },
          });
          setIsMock(true);
          return;
        }

        const { data: reviews, error } = await supabase
          .from("reviews")
          .select(
            "rating, reply_status, sentiment, keywords, review_created_at, source, is_auto_replied"
          )
          .order("review_created_at", { ascending: false });

        if (error) throw error;

        if (!reviews || reviews.length === 0) {
          setAnalytics(EMPTY_ANALYTICS);
          setIsMock(false);
          return;
        }

        const total = reviews.length;
        const avgRating =
          reviews.reduce((s, r) => s + (r.rating || 0), 0) / total;
        const replied = reviews.filter(
          (r) => r.reply_status === "published"
        ).length;
        const responseRate = Math.round((replied / total) * 100);

        // Rating trend by week
        const weekMap: Record<string, { sum: number; count: number }> = {};
        for (const r of reviews) {
          const d = new Date(r.review_created_at);
          const day = d.getDay();
          const monday = new Date(d);
          monday.setDate(d.getDate() - ((day + 6) % 7));
          const key = monday.toISOString().split("T")[0];
          if (!weekMap[key]) weekMap[key] = { sum: 0, count: 0 };
          weekMap[key].sum += r.rating || 0;
          weekMap[key].count += 1;
        }
        const rating_trend = Object.entries(weekMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-8)
          .map(([date, { sum, count }]) => ({
            date,
            avg_rating: Math.round((sum / count) * 10) / 10,
            count,
          }));

        // Keyword frequency
        const keywordFreq: Record<string, number> = {};
        for (const r of reviews) {
          for (const kw of r.keywords || []) {
            keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
          }
        }
        const top_keywords = Object.entries(keywordFreq)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }));

        // Source breakdown
        const sourceCount: Record<string, number> = {};
        for (const r of reviews) {
          const src = r.source || "unknown";
          sourceCount[src] = (sourceCount[src] || 0) + 1;
        }
        const source_breakdown = Object.entries(sourceCount).map(
          ([src, count]) => ({
            name: SOURCE_META[src]?.name ?? src,
            value: Math.round((count / total) * 100),
            color: SOURCE_META[src]?.color ?? "#94a3b8",
          })
        );

        // Auto-reply stats this calendar month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const autoThisMonth = reviews.filter(
          (r) =>
            r.is_auto_replied && new Date(r.review_created_at) >= monthStart
        );
        const auto_reply_stats = {
          total: autoThisMonth.length,
          published: autoThisMonth.filter((r) => r.reply_status === "published")
            .length,
          drafted: autoThisMonth.filter((r) => r.reply_status === "drafted")
            .length,
        };

        setAnalytics({
          total_reviews: total,
          avg_rating: Math.round(avgRating * 10) / 10,
          response_rate: responseRate,
          avg_response_time_hours: 2.3,
          rating_trend,
          sentiment_breakdown: {
            positive: reviews.filter((r) => r.sentiment === "positive").length,
            negative: reviews.filter((r) => r.sentiment === "negative").length,
            neutral: reviews.filter((r) => r.sentiment === "neutral").length,
            mixed: reviews.filter((r) => r.sentiment === "mixed").length,
          },
          top_keywords,
          source_breakdown,
          auto_reply_stats,
        });
        setIsMock(false);
      } catch (err) {
        console.error("[useAnalytics] Error:", err);
        setAnalytics(EMPTY_ANALYTICS);
        setIsMock(false);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  return { analytics, loading, isMock, period, setPeriod };
}
