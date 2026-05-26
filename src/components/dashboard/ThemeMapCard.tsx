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
  Link2,
  CheckCircle2,
} from "lucide-react";
import type { ThemeAggregate } from "@/hooks/useAnalytics";
import type { ConnectionState } from "@/lib/connection-state";

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
  /** All-time review count, used to branch "no reviews ever" empty state. */
  totalReviewCount?: number;
  /** Snapshot of the account's connection setup. */
  connectionState?: ConnectionState;
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
  totalReviewCount,
  connectionState,
  onClassifyPending,
  loading,
}: ThemeMapCardProps) {
  const shown = themes.slice(0, 10);
  // Split themes into Active (still has at least one rating <=3) and Resolved
  // (every rated review is now 4+). Sort each section independently:
  //   - Active:   count DESC, then avg rating ASC (worst issues first)
  //   - Resolved: count DESC
  const activeShown = shown
    .filter((t) => !t.isResolved)
    .slice()
    .sort((a, b) => b.count - a.count || a.avgRating - b.avgRating);
  const resolvedShown = shown
    .filter((t) => t.isResolved)
    .slice()
    .sort((a, b) => b.count - a.count);
  const hasActive = activeShown.length > 0;
  const hasResolved = resolvedShown.length > 0;
  const [classifying, setClassifying] = useState(false);
  const hasAnyConnection = connectionState?.hasAnyConnection ?? true;
  const oldestConnectionDaysAgo = connectionState?.oldestConnectionDaysAgo ?? null;
  // For older API users who haven't been wired up with totalReviewCount yet,
  // fall back to hasReviewsInRange as a soft proxy.
  const totalReviewsKnown = typeof totalReviewCount === "number";
  const hasAnyReviews = totalReviewsKnown
    ? (totalReviewCount as number) > 0
    : hasReviewsInRange;
  // Classify CTA may only show when the user actually has a connection — no
  // point offering classification to someone with nothing connected.
  const canShowClassifyCta = hasAnyConnection && pendingCount > 0 && !!onClassifyPending;

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
    !loading && shown.length > 0 && canShowClassifyCta;

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
          // Empty-state ladder — five buckets, evaluated in order so the most
          // specific message wins:
          //   1. No connection           → onboarding CTA
          //   2. Connection but 0 reviews ever → "no themes yet" + age-aware copy
          //   3. Reviews exist but 0 in range  → "widen the range"
          //   4. Reviews classifying           → "being analyzed" + Classify CTA
          //   5. Reviews classified, no themes → "no clear themes yet"
          !hasAnyConnection ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">Connect a source to see themes</p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-sm mx-auto">
                Theme Map analyzes your reviews to surface what customers actually talk about.
              </p>
              <Link
                href="/dashboard/settings/connections"
                className={cn(
                  "mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold",
                  "bg-accent text-white hover:bg-accent/90 transition-colors"
                )}
              >
                <Link2 className="h-3 w-3" />
                Connect a source
              </Link>
            </div>
          ) : !hasAnyReviews ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">No themes to show yet</p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-sm mx-auto">
                {oldestConnectionDaysAgo !== null && oldestConnectionDaysAgo < 1
                  ? "Themes will appear once your first reviews sync. This usually takes a few minutes."
                  : "Themes appear once your connected sources receive reviews."}
              </p>
            </div>
          ) : !hasReviewsInRange ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">No reviews in this range</p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-sm mx-auto">
                Try widening the date range above (7d, 30d, 90d) to see more data.
              </p>
            </div>
          ) : canShowClassifyCta ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">Reviews are being analyzed</p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-sm mx-auto">
                {pendingCount} review{pendingCount === 1 ? "" : "s"}{" "}
                {pendingCount === 1 ? "is" : "are"} queued for analysis. This usually takes under a minute.
              </p>
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
                    Classify now ({pendingCount}) →
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">No clear themes yet</p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-sm mx-auto">
                Themes emerge once you have a handful of reviews. More reviews will reveal what customers care about most.
              </p>
            </div>
          )
        ) : (
          <>
            {/* When the only themes in this period are resolved, lead with a
                small success banner so the meaning is unambiguous. */}
            {!hasActive && hasResolved && (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden />
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  All issues resolved! Your users confirmed the fixes.
                </p>
              </div>
            )}

            {hasActive && (
              <ul className="divide-y divide-border/60">
                {activeShown.map((t) => (
                  <ThemeRow key={t.theme} t={t} resolved={false} />
                ))}
              </ul>
            )}

            {/* Divider between Active and Resolved sections — only renders
                when BOTH sections have rows. Centered "Resolved" label. */}
            {hasActive && hasResolved && (
              <div
                className="my-3 flex items-center gap-3"
                role="separator"
                aria-label="Resolved themes"
              >
                <span className="flex-1 h-px bg-border/60" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Resolved
                </span>
                <span className="flex-1 h-px bg-border/60" aria-hidden />
              </div>
            )}

            {hasResolved && (
              <ul className="divide-y divide-border/60">
                {resolvedShown.map((t) => (
                  <ThemeRow key={t.theme} t={t} resolved={true} />
                ))}
              </ul>
            )}
          </>
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

/**
 * One row in the Theme Map list. Renders identically to the prior flat layout
 * when `resolved=false`; when `resolved=true` it swaps the colored dot for a
 * green check, mutes the label, and keeps the same counts/trend/avg cells so
 * the two sections align visually. Click target (the whole row) is preserved
 * for both states so filter-by-theme works identically.
 */
function ThemeRow({
  t,
  resolved,
}: {
  t: ThemeAggregate;
  resolved: boolean;
}) {
  const showTrend =
    t.changePct !== null && Math.abs(t.changePct) >= TREND_HIDE_THRESHOLD;
  const trendUp = (t.changePct ?? 0) > 0;
  return (
    <li>
      <Link
        href={themeHref(t.theme)}
        className="group block py-2.5 px-1 -mx-1 rounded-md hover:bg-muted/40 transition-colors"
      >
        {/* Line 1: indicator + name + count (always one row). On desktop the
            trend/rating tag along here; on mobile they wrap to line 2. */}
        <div className="flex items-center gap-3">
          {resolved ? (
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-emerald-500"
              aria-label="Resolved"
            />
          ) : (
            <span
              aria-hidden
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                SENTIMENT_DOT[t.sentiment] || SENTIMENT_DOT.neutral
              )}
            />
          )}
          <span
            className={cn(
              "flex-1 truncate text-sm font-medium capitalize",
              resolved && "text-muted-foreground"
            )}
          >
            {t.theme}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {t.count}
          </span>
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
            <span
              className={cn(
                "hidden sm:inline-flex items-center gap-0.5 text-[11px] tabular-nums w-14 justify-end",
                resolved
                  ? "text-muted-foreground/70"
                  : "text-muted-foreground/80"
              )}
            >
              {t.avgRating.toFixed(1)}
              <span className="text-amber-500">★</span>
              <span className="text-muted-foreground/60">avg</span>
            </span>
          )}
        </div>

        {/* Line 2 (mobile only): avg + trend, indented to align with name. */}
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
}
