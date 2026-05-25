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

const MIN_SAMPLE = 3;

export function RecoveryRateCard({ connectionId, days = 30 }: RecoveryRateCardProps) {
  const [data, setData] = useState<RecoveryRateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const qs = new URLSearchParams({ days: String(days) });
        if (connectionId) qs.set("connection_id", connectionId);
        const res = await fetch(`/api/dashboard/recovery-rate?${qs.toString()}`);
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

  const enoughData = !!data && data.total_negative >= MIN_SAMPLE;
  const rate = enoughData ? data!.rate ?? 0 : null;
  const prev = enoughData ? data!.previous_rate : null;

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
          ) : !enoughData ? (
            <span className="font-sans text-base font-medium text-muted-foreground">
              Not enough data yet
            </span>
          ) : (
            <>
              <span className="font-sans text-3xl font-bold tracking-tight tabular-nums">
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
          {enoughData ? (
            <p className="text-[11px] text-muted-foreground leading-snug">
              {data!.recovered} of {data!.total_negative} negative reviews improved their rating
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/70 leading-snug">
              Need at least {MIN_SAMPLE} negative reviews to compute a rate.
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono">
          <span>Last {days} days</span>
          <span className="text-muted-foreground/60">
            {enoughData && prev != null ? `vs previous ${days} days` : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
