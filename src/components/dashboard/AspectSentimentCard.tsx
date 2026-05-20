"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, LayoutGrid } from "lucide-react";
import type { AspectAggregate } from "@/hooks/useAnalytics";

interface AspectSentimentCardProps {
  aspects: AspectAggregate[];
  /**
   * Full-dataset count of reviews with ai_insights_classified_at IS NULL.
   * Used to surface the "Classify N pending" CTA when no aspect data has
   * been produced yet.
   */
  pendingCount?: number;
  onClassifyPending?: () => Promise<void> | void;
  loading?: boolean;
}

const POSITIVE = "#10b981";
const NEUTRAL = "#94a3b8";
const NEGATIVE = "#ef4444";

// "wait_time" → "Wait Time", "ui_ux" → "UI/UX", "food" → "Food"
function formatAspectLabel(aspect: string): string {
  if (aspect === "ui_ux") return "UI/UX";
  return aspect
    .split("_")
    .map((s) => (s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join(" ");
}

function netColor(net: number): string {
  if (net > 10) return "text-emerald-600 dark:text-emerald-400";
  if (net < -10) return "text-rose-600 dark:text-rose-400";
  return "text-muted-foreground";
}

export function AspectSentimentCard({
  aspects,
  pendingCount = 0,
  onClassifyPending,
  loading,
}: AspectSentimentCardProps) {
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-accent shrink-0" />
            What customers feel about each part of your business
          </CardTitle>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            Sentiment broken down by aspect, based on review content
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 rounded-md bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-accent shrink-0" />
          What customers feel about each part of your business
        </CardTitle>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          Sentiment broken down by aspect, based on review content
        </p>
      </CardHeader>
      <CardContent>
        {aspects.length === 0 ? (
          pendingCount > 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">Not enough aspect data yet</p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-sm mx-auto">
                Aspect sentiment appears when reviews mention specific parts of
                your business.
              </p>
              {onClassifyPending && (
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
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">
                No reviews with aspect mentions
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-sm mx-auto">
                Aspects appear when reviews mention specific things like food,
                service, performance, etc.
              </p>
            </div>
          )
        ) : (
          <ul className="space-y-3">
            {aspects.map((a) => {
              const posPct = (a.positive / a.total) * 100;
              const neuPct = (a.neutral / a.total) * 100;
              const negPct = (a.negative / a.total) * 100;
              const label = formatAspectLabel(a.aspect);
              const netSign = a.net > 0 ? "+" : "";
              return (
                <li key={a.aspect}>
                  {/* Desktop (sm+): single-line row.
                      Mobile: two lines — header line (name + mentions), then
                      bar + net. */}
                  <div className="hidden sm:flex items-center gap-3">
                    <span className="w-32 shrink-0 text-sm font-medium truncate">
                      {label}
                    </span>
                    <div className="relative flex-1 h-3 rounded-md overflow-hidden bg-muted/30">
                      <div className="absolute inset-0 flex">
                        {a.positive > 0 && (
                          <div
                            style={{
                              width: `${Math.max(posPct, 1.5)}%`,
                              backgroundColor: POSITIVE,
                            }}
                            title={`Positive: ${a.positive}`}
                          />
                        )}
                        {a.neutral > 0 && (
                          <div
                            style={{
                              width: `${Math.max(neuPct, 1.5)}%`,
                              backgroundColor: NEUTRAL,
                            }}
                            title={`Neutral: ${a.neutral}`}
                          />
                        )}
                        {a.negative > 0 && (
                          <div
                            style={{
                              width: `${Math.max(negPct, 1.5)}%`,
                              backgroundColor: NEGATIVE,
                            }}
                            title={`Negative: ${a.negative}`}
                          />
                        )}
                      </div>
                    </div>
                    <span className="w-24 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {a.total} mention{a.total === 1 ? "" : "s"}
                    </span>
                    <span
                      className={cn(
                        "w-10 shrink-0 text-right text-sm font-semibold tabular-nums",
                        netColor(a.net)
                      )}
                      aria-label={`Net sentiment ${a.net}`}
                    >
                      {netSign}
                      {a.net}
                    </span>
                  </div>

                  {/* Mobile two-line layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-sm font-medium truncate">
                        {label}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground shrink-0">
                        {a.total} mention{a.total === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 h-3 rounded-md overflow-hidden bg-muted/30">
                        <div className="absolute inset-0 flex">
                          {a.positive > 0 && (
                            <div
                              style={{
                                width: `${Math.max(posPct, 2)}%`,
                                backgroundColor: POSITIVE,
                              }}
                            />
                          )}
                          {a.neutral > 0 && (
                            <div
                              style={{
                                width: `${Math.max(neuPct, 2)}%`,
                                backgroundColor: NEUTRAL,
                              }}
                            />
                          )}
                          {a.negative > 0 && (
                            <div
                              style={{
                                width: `${Math.max(negPct, 2)}%`,
                                backgroundColor: NEGATIVE,
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          netColor(a.net)
                        )}
                      >
                        {netSign}
                        {a.net}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {aspects.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: POSITIVE }}
              />
              Positive
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: NEUTRAL }}
              />
              Neutral
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: NEGATIVE }}
              />
              Negative
            </span>
            <span className="ml-auto">
              Net = (positive − negative) ÷ total
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
