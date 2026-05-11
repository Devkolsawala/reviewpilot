"use client";

import { Star, MessageSquare, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalReviews: number;
  avgRating: number;
  responseRate: number | null;
  pendingCount: number;
  /** e.g. "1d" | "7d" | "30d" | "90d" — controls comparison sublabel */
  rangeLabel?: string;
  /** Previous-period comparison values */
  previousTotals?: number;
  previousAvgRating?: number;
  previousResponseRate?: number | null;
  /** Daily trend points used for sparklines (most recent ~30 days). */
  trend?: { date: string; avg_rating: number; count: number }[];
}

function rangeText(rangeLabel: string) {
  const days =
    rangeLabel === "1d" ? 1 :
    rangeLabel === "7d" ? 7 :
    rangeLabel === "90d" ? 90 : 30;
  return {
    range: days === 1 ? "Today" : `Last ${days} days`,
    vs: `vs previous ${days} day${days === 1 ? "" : "s"}`,
  };
}

export function StatsCards({
  totalReviews,
  avgRating,
  responseRate,
  pendingCount,
  rangeLabel = "30d",
  previousTotals = 0,
  previousAvgRating = 0,
  previousResponseRate = null,
  trend = [],
}: StatsCardsProps) {
  const { range, vs } = rangeText(rangeLabel);

  // Last-7 (or up to last 14) data points used for the spark trail. We pad
  // with zeros so the sparkline still draws something rather than a single
  // dot when only a couple of buckets exist.
  const series = trend.slice(-14);
  const totalSpark = series.map((d) => ({ value: d.count }));
  const ratingSpark = series.map((d) => ({ value: d.avg_rating }));

  const inboxZero = pendingCount === 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Reviews */}
      <KpiCard
        label="Total Reviews"
        value={totalReviews}
        icon={MessageSquare}
        tone="accent"
        delta={{ current: totalReviews, previous: previousTotals }}
        sparklineData={totalSpark}
        rangeLabel={range}
        vsLabel={vs}
      />

      {/* Average Rating */}
      <KpiCard
        label="Avg Rating"
        value={avgRating}
        decimals={1}
        icon={Star}
        tone="amber"
        delta={{ current: avgRating, previous: previousAvgRating, isRating: true }}
        sparklineData={ratingSpark}
        rangeLabel={range}
        vsLabel={vs}
        inlineExtra={
          <div className="mb-1.5 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "h-3 w-3",
                  s <= Math.round(avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/20"
                )}
                aria-hidden
              />
            ))}
          </div>
        }
      />

      {/* Response Rate */}
      <KpiCard
        label="Response Rate"
        value={responseRate ?? 0}
        suffix="%"
        icon={TrendingUp}
        tone="emerald"
        delta={
          responseRate !== null && previousResponseRate !== null
            ? { current: responseRate, previous: previousResponseRate }
            : undefined
        }
        // Response rate doesn't have a per-day series — dashed baseline is fine.
        sparklineData={undefined}
        rangeLabel={range}
        vsLabel="Industry avg: 25%"
      />

      {/* Pending Replies */}
      <KpiCard
        label="Awaiting Reply"
        value={pendingCount}
        icon={inboxZero ? CheckCircle2 : Clock}
        tone={inboxZero ? "emerald" : "amber"}
        sparklineData={inboxZero ? undefined : []}
        variant={inboxZero ? "success" : "default"}
        rangeLabel={range}
        vsLabel={inboxZero ? "Great job!" : "Reply to keep your rate high"}
        chip={
          inboxZero
            ? { label: "All caught up!", tone: "emerald" }
            : { label: "Needs attention", tone: "amber" }
        }
      />
    </div>
  );
}
