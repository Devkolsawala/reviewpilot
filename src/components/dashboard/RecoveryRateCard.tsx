"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecoveryRateCardProps {
  /** Optional connection scope. Omit to aggregate across all the user's connections. */
  connectionId?: string;
  /** Rolling window in days. Defaults to 30. */
  days?: number;
}

interface RecoveryRateData {
  rate: number | null;
  recovered: number;
  total_negative: number;
  previous_rate: number | null;
  window_days: number;
}

function encouragementFor(rate: number): string {
  if (rate >= 80) return "Exceptional recovery rate!";
  if (rate >= 50) return "Strong recovery — your fixes are working";
  if (rate >= 1) return "Keep fixing issues — ratings update over time";
  return "Reviews are being monitored for changes";
}

function rateColorClass(rate: number): string {
  if (rate >= 50) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 25) return "text-amber-600 dark:text-amber-400";
  return "text-foreground";
}

export function RecoveryRateCard({ connectionId, days = 30 }: RecoveryRateCardProps) {
  const [data, setData] = useState<RecoveryRateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const qs = new URLSearchParams({ days: String(days) });
        if (connectionId) qs.set("connection_id", connectionId);
        // cache: 'no-store' guarantees a fresh fetch on every page load so a
        // newly-detected recovery shows up immediately without a hard refresh.
        const res = await fetch(
          `/api/dashboard/recovery-rate?${qs.toString()}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (!cancelled) setData(null);
          return;
        }
        const d = (await res.json()) as RecoveryRateData;
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [connectionId, days]);

  // Show real numbers as soon as we have at least one tracked negative review.
  // The MIN_SAMPLE=3 gate previously hid useful data and showed "Not enough
  // data yet" which felt like an error.
  const hasAnyTracked = !!data && data.total_negative > 0;
  const rate = hasAnyTracked ? data!.rate ?? 0 : null;
  const prev = hasAnyTracked ? data!.previous_rate : null;

  let trendKind: "up" | "down" | "zero" | null = null;
  let trendLabel = "";
  if (rate != null && prev != null) {
    const diff = rate - prev;
    if (diff > 0) {
      trendKind = "up";
      trendLabel = `+${diff}%`;
    } else if (diff < 0) {
      trendKind = "down";
      trendLabel = `−${Math.abs(diff)}%`;
    } else {
      trendKind = "zero";
      trendLabel = "0%";
    }
  }

  const TrendIcon =
    trendKind === "up" ? ArrowUpRight : trendKind === "down" ? ArrowDownRight : Minus;
  const trendTone =
    trendKind === "up"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 ring-emerald-500/20"
      : trendKind === "down"
      ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 ring-rose-500/20"
      : "bg-muted text-muted-foreground ring-border/60";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:-translate-y-px hover:border-accent/30 hover:shadow-[0_4px_24px_-12px_hsl(var(--ring)/0.25)]"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recovery Rate
          </p>
          <div className="rounded-lg p-2 ring-1 ring-inset ring-border/40 bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30">
            <TrendingUp className="h-4 w-4" aria-hidden />
          </div>
        </div>

        <div className="flex items-end gap-2 flex-wrap min-h-[36px]">
          {loading ? (
            <div className="h-8 w-20 rounded-md bg-muted/40 animate-pulse" />
          ) : !hasAnyTracked ? (
            <span className="font-sans text-3xl font-bold tracking-tight tabular-nums text-muted-foreground/60">
              —
            </span>
          ) : (
            <>
              <span
                className={cn(
                  "font-sans text-3xl font-bold tracking-tight tabular-nums",
                  rateColorClass(rate!)
                )}
              >
                {rate}%
              </span>
              {trendKind && prev !== null && (
                <span
                  className={cn(
                    "mb-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                    trendTone
                  )}
                >
                  <TrendIcon className="h-2.5 w-2.5" aria-hidden />
                  {trendLabel}
                </span>
              )}
            </>
          )}
        </div>

        <div className="mt-3 min-h-[32px]">
          {hasAnyTracked ? (
            <>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {data!.recovered} of {data!.total_negative} negative review
                {data!.total_negative === 1 ? "" : "s"} improved
              </p>
              <p className="text-[10px] text-muted-foreground/70 leading-snug mt-0.5">
                {encouragementFor(rate!)}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground/70 leading-snug">
              Tracking begins when negative reviews are detected
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono">
          <span>Last {days} days</span>
          <span className="text-muted-foreground/60">
            {hasAnyTracked && prev != null ? `vs previous ${days} days` : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
