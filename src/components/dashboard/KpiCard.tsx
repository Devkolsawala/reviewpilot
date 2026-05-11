"use client";

import { useEffect, useState, useId } from "react";
import NumberFlow from "@number-flow/react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiTone = "accent" | "amber" | "emerald" | "rose" | "sky";

const TONE_BG: Record<KpiTone, string> = {
  accent: "bg-accent/10 text-accent",
  amber: "bg-amber-50 text-amber-500 dark:bg-amber-950/30",
  emerald: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30",
  rose: "bg-rose-50 text-rose-500 dark:bg-rose-950/30",
  sky: "bg-sky-50 text-sky-500 dark:bg-sky-950/30",
};

const TONE_STROKE: Record<KpiTone, string> = {
  accent: "#8b5cf6",
  amber: "#f59e0b",
  emerald: "#10b981",
  rose: "#f43f5e",
  sky: "#0ea5e9",
};

interface DeltaInput {
  current: number;
  previous: number;
  /** Treat as a rating diff (signed decimal) rather than a percentage. */
  isRating?: boolean;
}

function computeDelta({ current, previous, isRating }: DeltaInput) {
  if (previous === 0 && current === 0) return { kind: "zero" as const, label: "0" };
  if (isRating) {
    const diff = Math.round((current - previous) * 10) / 10;
    if (diff === 0) return { kind: "zero" as const, label: "0.0" };
    return {
      kind: diff > 0 ? ("up" as const) : ("down" as const),
      label: `${diff > 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)}`,
    };
  }
  if (previous === 0) {
    return { kind: "up" as const, label: "+100%" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { kind: "zero" as const, label: "0%" };
  return {
    kind: pct > 0 ? ("up" as const) : ("down" as const),
    label: `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`,
  };
}

function DeltaPill({ delta }: { delta: ReturnType<typeof computeDelta> }) {
  const Icon = delta.kind === "up" ? ArrowUpRight : delta.kind === "down" ? ArrowDownRight : Minus;
  const tone =
    delta.kind === "up"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
      : delta.kind === "down"
      ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        tone,
        delta.kind === "up" && "ring-emerald-500/20",
        delta.kind === "down" && "ring-rose-500/20",
        delta.kind === "zero" && "ring-border/60"
      )}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      {delta.label}
    </span>
  );
}

function Sparkline({
  data,
  tone,
}: {
  data: { value: number }[];
  tone: KpiTone;
}) {
  const gradId = useId();
  const hasData = data.length > 1 && data.some((d) => d.value !== 0);

  if (!hasData) {
    // Faint dashed baseline when there's no series yet
    return (
      <div className="h-8 w-full flex items-center" aria-hidden>
        <div className="h-px w-full border-t border-dashed border-border/60" />
      </div>
    );
  }

  const stroke = TONE_STROKE[tone];
  return (
    <div className="h-8 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface KpiCardProps {
  label: string;
  value: number;
  /** Decimals for NumberFlow. 0 for counts, 1 for ratings. */
  decimals?: number;
  suffix?: string;
  icon: LucideIcon;
  tone?: KpiTone;
  delta?: DeltaInput;
  sparklineData?: { value: number }[];
  rangeLabel?: string;
  vsLabel?: string;
  /** Optional inline visual (e.g. star row, progress ring) shown next to the number. */
  inlineExtra?: React.ReactNode;
  /** "success" centers a check icon instead of a sparkline (used for "All caught up"). */
  variant?: "default" | "success";
  /** Chip shown next to the value (e.g. "All caught up!"). */
  chip?: { label: string; tone: "emerald" | "amber" | "rose" | "muted" };
}

const CHIP_TONES: Record<NonNullable<KpiCardProps["chip"]>["tone"], string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  muted: "bg-muted text-muted-foreground",
};

export function KpiCard({
  label,
  value,
  decimals = 0,
  suffix,
  icon: Icon,
  tone = "accent",
  delta,
  sparklineData,
  rangeLabel = "Last 30 days",
  vsLabel = "vs previous 30 days",
  inlineExtra,
  variant = "default",
  chip,
}: KpiCardProps) {
  // First-mount count-up: start at 0 then snap to value so NumberFlow animates in.
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    // Defer one frame so NumberFlow registers 0 → value as a transition.
    const r = requestAnimationFrame(() => setDisplayValue(value));
    return () => cancelAnimationFrame(r);
  }, [value]);

  const deltaInfo = delta ? computeDelta(delta) : null;

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
            {label}
          </p>
          <div className={cn("rounded-lg p-2 ring-1 ring-inset ring-border/40", TONE_BG[tone])}>
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <NumberFlow
            value={displayValue}
            format={{
              maximumFractionDigits: decimals,
              minimumFractionDigits: decimals,
            }}
            suffix={suffix}
            className="font-sans text-3xl font-bold tracking-tight tabular-nums"
          />
          {inlineExtra}
          {deltaInfo && (
            <div className="mb-1.5">
              <DeltaPill delta={deltaInfo} />
            </div>
          )}
          {chip && (
            <span
              className={cn(
                "mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                CHIP_TONES[chip.tone]
              )}
            >
              {chip.label}
            </span>
          )}
        </div>

        <div className="mt-3 min-h-[32px]">
          {variant === "success" ? (
            <div className="flex h-8 items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              <span className="text-[11px] font-medium">Inbox zero</span>
            </div>
          ) : sparklineData ? (
            <Sparkline data={sparklineData} tone={tone} />
          ) : (
            <div className="h-8" />
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono">
          <span>{rangeLabel}</span>
          <span className="text-muted-foreground/60">{vsLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
