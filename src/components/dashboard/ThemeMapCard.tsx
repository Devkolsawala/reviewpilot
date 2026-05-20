"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  MessageSquareText,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { ThemeAggregate } from "@/hooks/useAnalytics";

interface ThemeMapCardProps {
  themes: ThemeAggregate[];
  /** In-range count of reviews with no theme (footer line). */
  unclassifiedCount: number;
  /**
   * Full-dataset count of reviews with ai_insights_classified_at IS NULL.
   * Drives the "Classify N pending" CTA. May differ from
   * `unclassifiedCount` (which is range-scoped).
   */
  pendingCount?: number;
  /**
   * Whether the selected range has any reviews at all. Drives the
   * "No reviews in this range" empty-state variant.
   */
  hasReviewsInRange?: boolean;
  /**
   * Triggered when the user clicks the "Classify N pending" CTA. The card
   * shows an inline spinner while this resolves. Implemented in STEP 6.
   */
  onClassifyPending?: () => Promise<void> | void;
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
  pendingCount = 0,
  hasReviewsInRange = true,
  onClassifyPending,
  loading,
}: ThemeMapCardProps) {
  const shown = themes.slice(0, 10);
  const [classifying, setClassifying] = useState(false);

  const handleClassify = async () => {
    if (!onClassifyPending || classifying) return;
    setClassifying(true);
    try {
      await onClassifyPending();
    } finally {
      setClassifying(false);
    }
  };

  // Secondary header button: shows when themes ARE rendering but there are
  // still pending classifications. Lets the user incrementally process the
  // backlog by clicking again.
  const showHeaderClassifyBtn =
    !loading && shown.length > 0 && pendingCount > 0 && !!onClassifyPending;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-accent shrink-0" />
            Theme Map
          </CardTitle>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            What customers are actually talking about
          </p>
        </div>
        {showHeaderClassifyBtn && (
          <button
            type="button"
            onClick={handleClassify}
            disabled={classifying}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0",
              "text-accent hover:bg-accent/10 transition-colors",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
            aria-label={`Classify ${pendingCount} more pending reviews`}
          >
            {classifying ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Classifying…
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Classify {pendingCount} more pending →
              </>
            )}
          </button>
        )}
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
          // Two empty-state variants:
          //  (a) No reviews in selected range — guide the user to adjust range
          //      or connect a source. No CTA (nothing to classify).
          //  (b) Reviews exist but none classified — show CTA to trigger
          //      on-demand classification (the in-product alternative to
          //      running the backfill script over SSH).
          !hasReviewsInRange ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">No reviews in this range</p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-xs mx-auto">
                Adjust the date range above or connect a source to start
                seeing themes.
              </p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">No themes to show yet</p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-sm mx-auto">
                Themes appear here once your reviews have been analyzed. If
                you&apos;ve just connected a new source, classify your reviews
                now to populate this view.
              </p>
              {pendingCount > 0 && onClassifyPending && (
                <button
                  type="button"
                  onClick={handleClassify}
                  disabled={classifying}
                  className={cn(
                    "mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold",
                    "bg-accent text-white hover:bg-accent/90 transition-colors",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {classifying ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Classifying…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Classify pending reviews ({pendingCount}) →
                    </>
                  )}
                </button>
              )}
            </div>
          )
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
                    // Block link so the entire row (both lines on mobile) is one
                    // click target.
                    className="group block py-2.5 px-1 -mx-1 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    {/* Line 1: dot + name + count (always one row, both
                        viewports). On desktop the trend/rating tag along here;
                        on mobile they wrap to line 2. */}
                    <div className="flex items-center gap-3">
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
                      {/* Desktop: trend + avg sit on line 1 next to the count */}
                      {showTrend && (
                        <span
                          className={cn(
                            "hidden sm:inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
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
                    </div>

                    {/* Line 2 (mobile only): avg + trend, indented to align
                        with the theme name above. */}
                    {(showTrend || t.avgRating > 0) && (
                      <div className="sm:hidden flex items-center gap-2 mt-1 pl-5 text-[11px] text-muted-foreground/80 tabular-nums">
                        {t.avgRating > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            {t.avgRating.toFixed(1)}
                            <span className="text-amber-500">★</span>
                            <span className="text-muted-foreground/60">avg</span>
                          </span>
                        )}
                        {showTrend && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                              trendUp
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            )}
                          >
                            {trendUp ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(t.changePct ?? 0)}%
                          </span>
                        )}
                      </div>
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
