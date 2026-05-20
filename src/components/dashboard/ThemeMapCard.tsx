"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, MessageSquareText } from "lucide-react";
import type { ThemeAggregate } from "@/hooks/useAnalytics";

interface ThemeMapCardProps {
  themes: ThemeAggregate[];
  unclassifiedCount: number;
  loading?: boolean;
}

// Dot color by dominant sentiment. Matches the SENTIMENT_COLORS palette used
// in AnalyticsCharts (#14b8a6 / #ef4444 / #94a3b8) for cross-card consistency.
const SENTIMENT_DOT: Record<string, string> = {
  positive: "bg-emerald-500",
  negative: "bg-rose-500",
  neutral: "bg-slate-400",
};

// % thresholds — anything within ±10% is treated as "no real change" and the
// trend pill is hidden (spec: "Hide if change < ±10%").
const TREND_HIDE_THRESHOLD = 10;

function themeHref(theme: string) {
  return `/dashboard/inbox?theme=${encodeURIComponent(theme)}`;
}

export function ThemeMapCard({
  themes,
  unclassifiedCount,
  loading,
}: ThemeMapCardProps) {
  const shown = themes.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-accent" />
          Theme Map
        </CardTitle>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          What customers are actually talking about
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 rounded-md bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Not enough classified reviews yet.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              New reviews are being analyzed in the background.
            </p>
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-9 rounded-md bg-muted/30 animate-pulse mx-6"
                />
              ))}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {shown.map((t) => {
              const showTrend =
                t.changePct !== null &&
                Math.abs(t.changePct) >= TREND_HIDE_THRESHOLD;
              const trendUp = (t.changePct ?? 0) > 0;
              return (
                <li key={t.theme}>
                  <Link
                    href={themeHref(t.theme)}
                    className="group flex items-center gap-3 py-2.5 px-1 -mx-1 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        SENTIMENT_DOT[t.sentiment] || SENTIMENT_DOT.neutral
                      )}
                    />
                    <span className="flex-1 truncate text-sm font-medium capitalize">
                      {t.theme}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {t.count}
                    </span>
                    {showTrend && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                          trendUp
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        )}
                        aria-label={`${trendUp ? "Up" : "Down"} ${Math.abs(
                          t.changePct ?? 0
                        )}% vs previous period`}
                      >
                        {trendUp ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(t.changePct ?? 0)}%
                      </span>
                    )}
                    {t.avgRating > 0 && (
                      <span className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-muted-foreground/80 tabular-nums w-14 justify-end">
                        {t.avgRating.toFixed(1)}
                        <span className="text-amber-500">★</span>
                        <span className="text-muted-foreground/60">avg</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {unclassifiedCount > 0 && (
          <p className="mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground/70">
            {unclassifiedCount} review{unclassifiedCount === 1 ? "" : "s"} not yet
            classified.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
