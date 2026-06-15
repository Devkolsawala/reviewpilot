// Presentational hero scorecard for the Review Health Score. No hooks, no
// "use client" — a pure server/client-agnostic component so it can be rendered
// both inside the client tool (PlayStoreAnalyzer) and on the server-rendered
// /insights page. All math comes from the deterministic health-score module.
//
// Styling reuses the existing analyzer result tokens (foreground / muted /
// border / accent + the emerald/amber/rose sentiment palette already used in
// this surface). No new colors or fonts.

import {
  computeHealthScore,
  responseRateBenchmark,
  trendDirection,
  type Grade,
  type HealthScoreInput,
} from "@/lib/analyzer/health-score";

const GRADE_TONE: Record<Grade, { text: string; bg: string; ring: string }> = {
  A: { text: "text-emerald-600", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
  B: { text: "text-emerald-600", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
  C: { text: "text-amber-600", bg: "bg-amber-400/10", ring: "ring-amber-400/40" },
  D: { text: "text-rose-600", bg: "bg-rose-500/10", ring: "ring-rose-500/30" },
  F: { text: "text-rose-600", bg: "bg-rose-500/10", ring: "ring-rose-500/30" },
};

export function ReviewHealthScore({ input }: { input: HealthScoreInput }) {
  const health = computeHealthScore(input);
  const tone = GRADE_TONE[health.grade];

  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Score + grade */}
        <div
          className={`flex shrink-0 items-center justify-center gap-3 rounded-2xl px-5 py-3 ring-1 ${tone.bg} ${tone.ring}`}
        >
          <div className="flex items-baseline gap-1">
            <span className={`text-5xl font-bold tracking-tight ${tone.text}`}>
              {health.score}
            </span>
            <span className="text-lg font-medium text-muted-foreground">
              /100
            </span>
          </div>
          <span
            className={`text-4xl font-bold leading-none ${tone.text}`}
            aria-label={`Grade ${health.grade}`}
          >
            {health.grade}
          </span>
        </div>

        {/* Verdict + label */}
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Review Health Score
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-foreground">
            {health.verdict}
          </p>
          {health.lowConfidence && (
            <p className="mt-1 text-xs text-muted-foreground">
              Based on only {health.sampleSize}{" "}
              {health.sampleSize === 1 ? "review" : "reviews"} — treat as
              indicative.
            </p>
          )}
        </div>
      </div>

      {/* Benchmark line — clearly heuristic. */}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {responseRateBenchmark(input.responseRate)}
      </p>

      {/* 90-day rating trend — previously computed but never surfaced. */}
      <TrendStrip trend={input.ratingTrend90d} />
    </div>
  );
}

function TrendStrip({ trend }: { trend: HealthScoreInput["ratingTrend90d"] }) {
  if (trend.length < 2) return null;
  const dir = trendDirection(trend);
  const sorted = [...trend].sort((a, b) => a.date.localeCompare(b.date));

  const dirTone =
    dir.label === "improving"
      ? "text-emerald-600"
      : dir.label === "declining"
        ? "text-rose-600"
        : "text-muted-foreground";

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          90-day rating trend
        </p>
        <p className={`text-xs font-medium ${dirTone}`}>
          {dir.label}
          {dir.delta !== 0 && (
            <span className="ml-1 text-muted-foreground">
              ({dir.delta > 0 ? "+" : ""}
              {dir.delta.toFixed(2)}★)
            </span>
          )}
        </p>
      </div>
      <Sparkline points={sorted.map((p) => p.avg)} />
    </div>
  );
}

// Dependency-free inline SVG sparkline. Avoids pulling a chart library into the
// public tool bundle. Y axis fixed to the 1–5 rating range so the slope is
// comparable across apps.
function Sparkline({ points }: { points: number[] }) {
  const W = 320;
  const H = 40;
  const PAD = 3;
  const min = 1;
  const max = 5;

  const coords = points.map((v, i) => {
    const x =
      points.length === 1
        ? W / 2
        : PAD + (i / (points.length - 1)) * (W - PAD * 2);
    const clamped = Math.max(min, Math.min(max, v));
    const y = PAD + (1 - (clamped - min) / (max - min)) * (H - PAD * 2);
    return [x, y] as const;
  });

  const d = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-2 h-10 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="90-day average rating sparkline"
    >
      <path
        d={d}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
