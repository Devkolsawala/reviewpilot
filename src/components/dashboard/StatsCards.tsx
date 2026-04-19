"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalReviews: number;
  avgRating: number;
  responseRate: number | null;
  pendingCount: number;
  /** e.g. "7d" | "30d" | "90d" — controls comparison sublabel */
  rangeLabel?: string;
  /** Previous-period comparison values */
  previousTotals?: number;
  previousAvgRating?: number;
}

function Delta({ current, previous, isRating = false }: { current: number; previous: number; isRating?: boolean }) {
  if (previous === 0 && current === 0) return null;
  const diff = isRating ? Math.round((current - previous) * 10) / 10 : current - previous;
  if (diff === 0) return null;
  const up = diff > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const colorClass = up ? "text-green-600" : "text-red-600";
  if (isRating) {
    return (
      <span className={cn("flex items-center text-xs font-medium", colorClass)}>
        <Icon className="h-3 w-3" /> {Math.abs(diff).toFixed(1)}
      </span>
    );
  }
  const pct = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  return (
    <span className={cn("flex items-center text-xs font-medium", colorClass)}>
      <Icon className="h-3 w-3" /> {Math.abs(pct)}%
    </span>
  );
}

export function StatsCards({
  totalReviews,
  avgRating,
  responseRate,
  pendingCount,
  rangeLabel = "30d",
  previousTotals = 0,
  previousAvgRating = 0,
}: StatsCardsProps) {
  const days = rangeLabel === "7d" ? 7 : rangeLabel === "90d" ? 90 : 30;
  const rangeText = `Last ${days} days`;
  const vsPrev = `vs previous ${days} days`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Reviews */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
            <div className="rounded-lg p-2 bg-accent/10 dark:bg-accent/10">
              <MessageSquare className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <AnimatedCounter value={totalReviews} className="text-3xl font-bold font-sans tracking-tight" />
            <div className="mb-1">
              <Delta current={totalReviews} previous={previousTotals} />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{rangeText}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{vsPrev}</p>
        </CardContent>
      </Card>

      {/* Average Rating */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <AnimatedCounter value={avgRating} decimals={1} className="text-3xl font-bold font-sans tracking-tight" />
            <div className="flex gap-0.5 mb-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-3 w-3",
                    s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <Delta current={avgRating} previous={previousAvgRating} isRating />
            <span className="text-xs text-muted-foreground">{vsPrev}</span>
          </div>
        </CardContent>
      </Card>

      {/* Response Rate */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
            <div className="rounded-lg p-2 bg-green-50 dark:bg-green-950/30">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing value={responseRate ?? 0} size={52} strokeWidth={5} />
            <div>
              {responseRate === null ? (
                <p className="text-3xl font-bold font-sans tracking-tight">—</p>
              ) : (
                <AnimatedCounter value={responseRate} suffix="%" className="text-3xl font-bold font-sans tracking-tight" />
              )}
              <p className="text-xs text-muted-foreground mt-0.5">Industry avg: 25%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Replies */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Awaiting Reply</p>
            <div className={cn(
              "rounded-lg p-2",
              pendingCount > 0
                ? "bg-orange-50 dark:bg-orange-950/30"
                : "bg-green-50 dark:bg-green-950/30"
            )}>
              {pendingCount > 0 ? (
                <Clock className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <AnimatedCounter value={pendingCount} className="text-3xl font-bold font-sans tracking-tight" />
            {pendingCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-400 mb-1">
                Needs attention
              </span>
            )}
            {pendingCount === 0 && (
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-950/40 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 mb-1">
                All caught up!
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {pendingCount > 0 ? "Reply to keep your response rate high" : "Great job keeping up!"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
