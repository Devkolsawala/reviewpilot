"use client";

import {
 BarChart,
 Bar,
 PieChart,
 Pie,
 Cell,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 ReferenceLine,
 Area,
 AreaChart,
 Line,
 LineChart,
} from "recharts";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus, Link2 } from "lucide-react";
import type { NssTrendPoint } from "@/hooks/useAnalytics";
import type { ConnectionState } from "@/lib/connection-state";

interface AnalyticsChartsProps {
 ratingTrend: { date: string; avg_rating: number; count: number }[];
 sentimentBreakdown: Record<string, number>;
 sourceBreakdown: { name: string; value: number; color: string }[];
 ratingDistribution?: { star: number; count: number }[];
 replyRate?: number;
 /**
  * Phase 2 — Net Sentiment Score data for the redesigned sentiment card.
  * `nssTrend` drives the sparkline; `nssCurrent` is the prominent number;
  * `nssDelta` is the change vs the previous period.
  */
 nssTrend?: NssTrendPoint[];
 nssCurrent?: number | null;
 nssDelta?: number | null;
 /**
  * Optional render slot. Lets /dashboard/analytics page.tsx interleave the
  * ThemeMap card between rows.
  *   "row1" = Rating Trend + Rating Distribution (2-up)
  *   "row2" = Sentiment Analysis + Reply Rate (2-up) + Source Breakdown (full)
  * Omit to render everything in a single grid (legacy behavior).
  */
 slot?: "row1" | "row2";
 /** Context-aware empty-state props (hotfix). */
 connectionState?: ConnectionState;
 /** All-time review count. */
 totalReviewCount?: number;
 /** Reviews in the selected range. */
 reviewCountInRange?: number;
}

const SENTIMENT_COLORS: Record<string, string> = {
 positive: "#14b8a6",
 negative: "#ef4444",
 neutral: "#94a3b8",
 mixed: "#f59e0b",
};

const tooltipStyle = {
 borderRadius: 10,
 border: "1px solid hsl(var(--border))",
 background: "hsl(var(--card))",
 fontSize: 12,
 boxShadow: "none",
} as const;

// Sentiment scale used in rating distribution: 1★ rose → 5★ emerald
// Matches the row-level palette in DashboardReviewRow / ReviewCard.
const STAR_SENTIMENT: Record<number, { fill: string; track: string; label: string }> = {
 1: { fill: "#f43f5e", track: "bg-rose-100 dark:bg-rose-950/30", label: "text-rose-600 dark:text-rose-400" },
 2: { fill: "#f97316", track: "bg-orange-100 dark:bg-orange-950/30", label: "text-orange-600 dark:text-orange-400" },
 3: { fill: "#f59e0b", track: "bg-amber-100 dark:bg-amber-950/30", label: "text-amber-600 dark:text-amber-400" },
 4: { fill: "#84cc16", track: "bg-lime-100 dark:bg-lime-950/30", label: "text-lime-600 dark:text-lime-400" },
 5: { fill: "#10b981", track: "bg-emerald-100 dark:bg-emerald-950/30", label: "text-emerald-600 dark:text-emerald-400" },
};

export function AnalyticsCharts({
 ratingTrend,
 sentimentBreakdown,
 sourceBreakdown,
 ratingDistribution,
 replyRate,
 nssTrend = [],
 nssCurrent = null,
 nssDelta = null,
 slot,
 connectionState,
 totalReviewCount,
 reviewCountInRange,
}: AnalyticsChartsProps) {
 // Empty-state branching props (hotfix). When omitted, components fall back
 // to the legacy "Not enough reviews" copy so older call sites don't break.
 const hasAnyConnection = connectionState?.hasAnyConnection ?? true;
 const totalReviewsKnown = typeof totalReviewCount === "number";
 const rangeCountKnown = typeof reviewCountInRange === "number";
 const hasAnyReviews = totalReviewsKnown ? (totalReviewCount as number) > 0 : true;
 const rangeReviewCount = rangeCountKnown ? (reviewCountInRange as number) : 0;
 const sentimentData = Object.entries(sentimentBreakdown).map(([name, value]) => ({
 name: name.charAt(0).toUpperCase() + name.slice(1),
 value,
 color: SENTIMENT_COLORS[name] || "#94a3b8",
 }));

 const sentimentTotal = sentimentData.reduce((sum, d) => sum + d.value, 0);
 const sentimentPct = (key: string): number =>
 sentimentTotal > 0
 ? Math.round(((sentimentBreakdown[key] ?? 0) / sentimentTotal) * 100)
 : 0;
 const positivePct = sentimentPct("positive");
 const neutralPct = sentimentPct("neutral");
 const mixedPct = sentimentPct("mixed");
 const negativePct = sentimentPct("negative");
 const nssColor =
 nssCurrent == null
 ? "text-muted-foreground"
 : nssCurrent > 5
 ? "text-emerald-600 dark:text-emerald-400"
 : nssCurrent < -5
 ? "text-rose-600 dark:text-rose-400"
 : "text-muted-foreground";
 const deltaColor =
 nssDelta == null || Math.abs(nssDelta) < 1
 ? "text-muted-foreground"
 : nssDelta > 0
 ? "text-emerald-600 dark:text-emerald-400"
 : "text-rose-600 dark:text-rose-400";
 // recharts requires a continuous data series. We feed two series:
 // posNss = max(nss, 0), negNss = min(nss, 0) so the line above 0 is green,
 // below 0 is red. Achieved by drawing two lines and masking with the data
 // (null where the value falls in the other half).
 const nssChartData = nssTrend.map((p) => ({
 date: p.date,
 nss: p.nss,
 posNss: p.nss >= 0 ? p.nss : null,
 negNss: p.nss < 0 ? p.nss : null,
 }));

 const sourceData = sourceBreakdown;

 const ratedTrend = ratingTrend.filter((d) => d.avg_rating > 0);
 const currentAvg =
 ratedTrend.length > 0
 ? Math.round((ratedTrend.reduce((s, d) => s + d.avg_rating, 0) / ratedTrend.length) * 10) / 10
 : 0;

 // Slot-scoped flags. When `slot` is set, only that pair of cards renders.
 // `slot === undefined` falls back to the legacy single-grid behavior so any
 // remaining caller without the prop still works.
 const showRow1 = slot === undefined || slot === "row1";
 const showRow2 = slot === undefined || slot === "row2";

 return (
 <div className="grid gap-6 lg:grid-cols-2">
 {showRow1 && (<>
 {/* Rating trend — gradient area chart, animated draw on mount */}
 <Card>
 <CardHeader className="pb-2 flex flex-row items-start justify-between">
 <div>
 <CardTitle className="text-sm font-semibold">Rating Trend</CardTitle>
 <p className="text-[11px] text-muted-foreground/70 mt-0.5">
 Goal: <span className="font-mono">4.5★</span>
 </p>
 </div>
 {currentAvg > 0 && (
 <div className="text-right">
 <p className="font-sans text-2xl font-bold tracking-tight tabular-nums">
 {currentAvg.toFixed(1)}
 <span className="text-amber-500">★</span>
 </p>
 <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
 avg this period
 </p>
 </div>
 )}
 </CardHeader>
 <CardContent>
 <div className="h-56">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={ratingTrend} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.32} />
 <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="ratingStroke" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0%" stopColor="#6366f1" />
 <stop offset="50%" stopColor="#8b5cf6" />
 <stop offset="100%" stopColor="#d946ef" />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="2 4" className="stroke-border/60" vertical={false} />
 <XAxis
 dataKey="date"
 tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
 tickFormatter={(v) => {
 const d = new Date(v);
 return isNaN(d.getTime())
 ? v
 : d.toLocaleDateString("en", { month: "short", day: "numeric" });
 }}
 axisLine={false}
 tickLine={false}
 minTickGap={28}
 />
 {/* Y-axis hidden — current-avg label in the header replaces it. */}
 <YAxis domain={[1, 5]} hide />
 <Tooltip
 cursor={{ stroke: "hsl(var(--ring))", strokeOpacity: 0.3, strokeWidth: 1 }}
 contentStyle={tooltipStyle}
 labelFormatter={(v) => {
 const d = new Date(v);
 return isNaN(d.getTime())
 ? String(v)
 : d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
 }}
 formatter={(val) => [`${val}★`, "Avg rating"]}
 />
 <ReferenceLine y={4.5} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.4} strokeDasharray="4 4" />
 <Area
 type="monotone"
 dataKey="avg_rating"
 stroke="url(#ratingStroke)"
 strokeWidth={2}
 fill="url(#ratingGradient)"
 isAnimationActive
 animationDuration={650}
 animationEasing="ease-out"
 dot={false}
 activeDot={{ r: 4, stroke: "#8b5cf6", strokeWidth: 2, fill: "hsl(var(--card))" }}
 name="Avg Rating"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </CardContent>
 </Card>

 {/* Rating distribution — horizontal bars, sentiment-colored, mono counts */}
 {ratingDistribution && ratingDistribution.length > 0 ? (
 (() => {
 const distTotal = ratingDistribution.reduce((s, d) => s + d.count, 0);
 const maxCount = Math.max(...ratingDistribution.map((d) => d.count), 1);
 // Render 5 → 1 (top-down feels more natural for "ratings best→worst")
 const ordered = [...ratingDistribution].sort((a, b) => b.star - a.star);
 return (
 <Card>
 <CardHeader className="pb-2 flex flex-row items-start justify-between">
 <div>
 <CardTitle className="text-sm font-semibold">Rating Distribution</CardTitle>
 <p className="text-[11px] text-muted-foreground/70 mt-0.5">By star count</p>
 </div>
 <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">
 {distTotal} total
 </p>
 </CardHeader>
 <CardContent>
 <div className="space-y-2.5 py-1">
 {ordered.map((entry) => {
 const meta = STAR_SENTIMENT[entry.star] ?? STAR_SENTIMENT[3];
 const pct = distTotal === 0 ? 0 : Math.round((entry.count / distTotal) * 100);
 const barPct = (entry.count / maxCount) * 100;
 return (
 <div key={entry.star} className="flex items-center gap-3">
 <span className={cn("flex w-8 shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums", meta.label)}>
 {entry.star}
 <span aria-hidden>★</span>
 </span>
 <div className={cn("relative h-5 flex-1 overflow-hidden rounded-md", meta.track)}>
 <div
 className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-500 ease-out"
 style={{ width: `${barPct}%`, backgroundColor: meta.fill, opacity: 0.85 }}
 />
 </div>
 <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">
 <span className="text-foreground">{entry.count}</span>
 <span className="text-muted-foreground/60 ml-1">{pct}%</span>
 </span>
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>
 );
 })()
 ) : (
 /* Fallback: review volume when no distribution available */
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-base font-semibold">Review Volume</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={ratingTrend}>
 <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
 <XAxis
 dataKey="date"
 tick={{ fontSize: 11 }}
 tickFormatter={(v) => {
 const d = new Date(v);
 return isNaN(d.getTime()) ? v : d.toLocaleDateString("en", { month: "short", day: "numeric" });
 }}
 axisLine={false}
 tickLine={false}
 />
 <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
 <Tooltip contentStyle={tooltipStyle} />
 <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Reviews">
 {ratingTrend.map((entry, i) => (
 <Cell
 key={i}
 fill={entry.avg_rating >= 4 ? "#14b8a6" : entry.avg_rating >= 3 ? "#f59e0b" : "#ef4444"}
 opacity={0.85}
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </CardContent>
 </Card>
 )}
 </>)}

 {showRow2 && (<>
 {/* Sentiment card — Phase 2 redesign. Top half: horizontal stacked bar
     with positive/neutral/mixed/negative segments + legend row.
     Bottom half: Net Sentiment Score sparkline + prominent current NSS +
     delta vs previous period. */}
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-base font-semibold">How customers feel</CardTitle>
 <p className="text-[11px] text-muted-foreground/70 mt-0.5">Net sentiment over time</p>
 </CardHeader>
 <CardContent>
 {sentimentTotal === 0 ? (
 // Inline (compact) empty-state variants — proportional to the card so
 // we don't drop a huge centered placeholder into a half-width tile.
 !hasAnyConnection ? (
 <div className="py-4 text-center">
 <p className="text-sm font-medium">Connect a source</p>
 <p className="text-xs text-muted-foreground/80 mt-1">
 Sentiment data will appear once reviews start syncing.
 </p>
 </div>
 ) : !hasAnyReviews ? (
 <div className="py-4 text-center">
 <p className="text-sm font-medium">Waiting for first reviews</p>
 <p className="text-xs text-muted-foreground/80 mt-1">
 Sentiment will populate as reviews come in.
 </p>
 </div>
 ) : rangeCountKnown && rangeReviewCount < 3 ? (
 <div className="py-4 text-center">
 <p className="text-sm font-medium">Not enough reviews for this range</p>
 <p className="text-xs text-muted-foreground/80 mt-1">
 Widen the range above or wait for more reviews.
 </p>
 </div>
 ) : (
 <div className="py-4 text-center">
 <p className="text-sm font-medium">Not enough reviews</p>
 <p className="text-xs text-muted-foreground/80 mt-1">
 Not enough reviews to compute sentiment for this period.
 </p>
 </div>
 )
 ) : (
 <>
 {/* Stacked bar — full width. Segments use min-width so a 1–2% slice
         still shows. */}
 <div className="relative w-full h-7 rounded-md overflow-hidden bg-muted/30 flex">
 {positivePct > 0 && (
 <div
 className="h-full flex items-center justify-center text-[10px] font-semibold text-white"
 style={{ width: `${Math.max(positivePct, 2)}%`, backgroundColor: SENTIMENT_COLORS.positive }}
 title={`Positive: ${positivePct}%`}
 >
 {positivePct >= 8 ? `${positivePct}%` : ""}
 </div>
 )}
 {neutralPct > 0 && (
 <div
 className="h-full flex items-center justify-center text-[10px] font-semibold text-white"
 style={{ width: `${Math.max(neutralPct, 2)}%`, backgroundColor: SENTIMENT_COLORS.neutral }}
 title={`Neutral: ${neutralPct}%`}
 >
 {neutralPct >= 8 ? `${neutralPct}%` : ""}
 </div>
 )}
 {mixedPct > 0 && (
 <div
 className="h-full flex items-center justify-center text-[10px] font-semibold text-white"
 style={{ width: `${Math.max(mixedPct, 2)}%`, backgroundColor: SENTIMENT_COLORS.mixed }}
 title={`Mixed: ${mixedPct}%`}
 >
 {mixedPct >= 8 ? `${mixedPct}%` : ""}
 </div>
 )}
 {negativePct > 0 && (
 <div
 className="h-full flex items-center justify-center text-[10px] font-semibold text-white"
 style={{ width: `${Math.max(negativePct, 2)}%`, backgroundColor: SENTIMENT_COLORS.negative }}
 title={`Negative: ${negativePct}%`}
 >
 {negativePct >= 8 ? `${negativePct}%` : ""}
 </div>
 )}
 </div>

 {/* Legend row */}
 <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/80">
 <span className="inline-flex items-center gap-1.5">
 <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS.positive }} />
 Positive <span className="tabular-nums font-medium text-foreground/80">{positivePct}%</span>
 </span>
 <span className="inline-flex items-center gap-1.5">
 <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS.neutral }} />
 Neutral <span className="tabular-nums font-medium text-foreground/80">{neutralPct}%</span>
 </span>
 <span className="inline-flex items-center gap-1.5">
 <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS.mixed }} />
 Mixed <span className="tabular-nums font-medium text-foreground/80">{mixedPct}%</span>
 </span>
 <span className="inline-flex items-center gap-1.5">
 <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS.negative }} />
 Negative <span className="tabular-nums font-medium text-foreground/80">{negativePct}%</span>
 </span>
 </div>

 {/* NSS sparkline + current/delta. Mobile stacks: sparkline full width,
         NSS number + delta wrap below. Desktop: side-by-side. */}
 <div className="mt-5 pt-4 border-t border-border/60">
 <div className="flex items-center justify-between mb-2">
 <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
 Net Sentiment Score
 </p>
 <p className="text-[10px] text-muted-foreground/60 font-mono">positive % − negative %</p>
 </div>
 <div className="flex flex-col sm:flex-row sm:items-center gap-3">
 <div className="flex-1 h-[80px] min-w-0">
 {nssChartData.length > 1 ? (
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={nssChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
 <YAxis domain={[-100, 100]} hide />
 <XAxis dataKey="date" hide />
 <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} strokeDasharray="3 3" />
 <Tooltip
 contentStyle={tooltipStyle}
 labelFormatter={(v) => {
 const d = new Date(v);
 return isNaN(d.getTime())
 ? String(v)
 : d.toLocaleDateString("en", { month: "short", day: "numeric" });
 }}
 formatter={(val) => [`${val ?? "—"}`, "NSS"]}
 />
 <Line
 type="monotone"
 dataKey="posNss"
 stroke={SENTIMENT_COLORS.positive}
 strokeWidth={2}
 dot={false}
 isAnimationActive
 animationDuration={500}
 connectNulls={false}
 name="NSS"
 />
 <Line
 type="monotone"
 dataKey="negNss"
 stroke={SENTIMENT_COLORS.negative}
 strokeWidth={2}
 dot={false}
 isAnimationActive
 animationDuration={500}
 connectNulls={false}
 name="NSS"
 />
 </LineChart>
 </ResponsiveContainer>
 ) : (
 <div className="h-full flex items-center text-[11px] text-muted-foreground/70">
 Trend appears once there are at least two days of reviews.
 </div>
 )}
 </div>
 <div className="sm:w-32 shrink-0 sm:text-right">
 <p className={cn("text-3xl font-bold font-sans tracking-tight tabular-nums", nssColor)}>
 {nssCurrent == null ? "—" : `${nssCurrent > 0 ? "+" : ""}${nssCurrent}`}
 </p>
 {nssDelta != null && (
 <p className={cn("mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums sm:justify-end", deltaColor)}>
 {Math.abs(nssDelta) < 1 ? (
 <Minus className="h-3 w-3" />
 ) : nssDelta > 0 ? (
 <ArrowUpRight className="h-3 w-3" />
 ) : (
 <ArrowDownRight className="h-3 w-3" />
 )}
 {nssDelta > 0 ? "+" : ""}{nssDelta} vs previous period
 </p>
 )}
 </div>
 </div>
 </div>
 </>
 )}
 </CardContent>
 </Card>

 {/* Reply rate progress bar */}
 {replyRate !== undefined && (
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-base font-semibold">Reply Rate</CardTitle>
 </CardHeader>
 <CardContent className="flex flex-col justify-center h-[calc(100%-4rem)]">
 <div className="flex items-end gap-2 mb-3">
 <span className="text-5xl font-bold font-sans tracking-tight text-accent dark:text-accent">
 {replyRate}%
 </span>
 <span className="text-sm text-muted-foreground pb-1.5">replied</span>
 </div>
 <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
 <div
 className="h-full rounded-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef] transition-all duration-700"
 style={{ width: `${Math.min(replyRate, 100)}%` }}
 />
 </div>
 <p className="text-xs text-muted-foreground mt-2">
 Industry average: <strong>25%</strong>.{" "}
 {replyRate >= 50 ? (
 <span className="text-accent dark:text-accent font-medium">You&apos;re above average!</span>
 ) : (
 <span>Aim for 50%+ for best results.</span>
 )}
 </p>
 </CardContent>
 </Card>
 )}

 {/* Top Keywords removed — replaced by <ThemeMapCard /> rendered in
     /dashboard/analytics/page.tsx (Phase 1 sentiment intelligence). */}

 {/* Source breakdown */}
 <Card className="lg:col-span-2">
 <CardHeader className="pb-2">
 <CardTitle className="text-base font-semibold">Source Breakdown</CardTitle>
 </CardHeader>
 <CardContent>
 {sourceData.length === 0 ? (
 !hasAnyConnection ? (
 <div className="flex flex-col items-center justify-center h-24 text-center gap-2">
 <p className="text-sm font-medium">No sources connected</p>
 <Link
 href="/dashboard/settings/connections"
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
 >
 <Link2 className="h-3 w-3" />
 Connect a source →
 </Link>
 </div>
 ) : !hasAnyReviews ? (
 <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
 Reviews will appear here once synced.
 </div>
 ) : (
 <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
 No reviews synced yet.
 </div>
 )
 ) : (
 // Mobile (<sm): chart on top, single-column legend below (collision-free
 // even at 348px). Desktop: side-by-side with a 2-col legend grid.
 <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
 <div className="w-32 h-32 sm:w-40 sm:h-40 relative shrink-0 mx-auto sm:mx-0">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={sourceData}
 cx="50%"
 cy="50%"
 innerRadius={40}
 outerRadius={60}
 paddingAngle={3}
 dataKey="value"
 strokeWidth={0}
 >
 {sourceData.map((d) => (
 <Cell key={d.name} fill={d.color} />
 ))}
 </Pie>
 </PieChart>
 </ResponsiveContainer>
 </div>
 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
 {sourceData.map((d) => (
 <div key={d.name} className="flex items-center gap-3">
 <div
 className="h-10 w-10 rounded-xl flex items-center justify-center"
 style={{ backgroundColor: d.color + "15" }}
 >
 <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
 </div>
 <div>
 <p className="text-sm font-medium">{d.name}</p>
 <p className="text-2xl font-bold font-sans tracking-tight">{d.value}%</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </>)}
 </div>
 );
}
