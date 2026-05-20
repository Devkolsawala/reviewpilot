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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalyticsChartsProps {
 ratingTrend: { date: string; avg_rating: number; count: number }[];
 sentimentBreakdown: Record<string, number>;
 sourceBreakdown: { name: string; value: number; color: string }[];
 ratingDistribution?: { star: number; count: number }[];
 replyRate?: number;
 /**
  * Optional render slot. Lets /dashboard/analytics page.tsx interleave the
  * ThemeMap card between rows.
  *   "row1" = Rating Trend + Rating Distribution (2-up)
  *   "row2" = Sentiment Analysis + Reply Rate (2-up) + Source Breakdown (full)
  * Omit to render everything in a single grid (legacy behavior).
  */
 slot?: "row1" | "row2";
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
 slot,
}: AnalyticsChartsProps) {
 const sentimentData = Object.entries(sentimentBreakdown).map(([name, value]) => ({
 name: name.charAt(0).toUpperCase() + name.slice(1),
 value,
 color: SENTIMENT_COLORS[name] || "#94a3b8",
 }));

 const sentimentTotal = sentimentData.reduce((sum, d) => sum + d.value, 0);

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
 {/* Sentiment breakdown — donut.
     Mobile (<sm): donut on top, legend below, Net Sentiment line under the
     donut (never overlapping). Desktop: donut + legend side-by-side.
     Net Sentiment always renders on its own row, never as an absolute
     overlay (live testing showed the absolute version overlapping the
     center number on narrow viewports). */}
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-base font-semibold">Sentiment Analysis</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-2">
 {/* Donut column */}
 <div className="w-full sm:w-1/2 flex flex-col items-center">
 <div className="relative w-full max-w-[220px]">
 <ResponsiveContainer width="100%" height={200}>
 <PieChart>
 <Pie
 data={sentimentData}
 cx="50%"
 cy="50%"
 innerRadius={55}
 outerRadius={80}
 paddingAngle={3}
 dataKey="value"
 strokeWidth={0}
 >
 {sentimentData.map((entry) => (
 <Cell key={entry.name} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip contentStyle={tooltipStyle} />
 </PieChart>
 </ResponsiveContainer>
 {/* Only the centre count/label remain absolutely-positioned over the
         donut — the Net Sentiment line moved out to its own row below. */}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 <div className="text-center">
 <p className="text-2xl font-bold font-sans tracking-tight">{sentimentTotal}</p>
 <p className="text-[10px] text-muted-foreground">reviews</p>
 </div>
 </div>
 </div>
 {/* Net Sentiment Score — own row, always below the donut, never inside */}
 {(() => {
 if (sentimentTotal === 0) return null;
 const pos = sentimentBreakdown.positive ?? 0;
 const neg = sentimentBreakdown.negative ?? 0;
 const nss = Math.round(((pos - neg) / sentimentTotal) * 100);
 // Near-zero band (|nss| ≤ 5) stays gray to avoid noisy color flips.
 const colorClass =
 nss > 5
 ? "text-emerald-600 dark:text-emerald-400"
 : nss < -5
 ? "text-rose-600 dark:text-rose-400"
 : "text-muted-foreground";
 const sign = nss > 0 ? "+" : "";
 return (
 <p className="mt-2 text-[11px] tabular-nums text-center">
 <span className="text-muted-foreground/70">Net sentiment: </span>
 <span className={cn("font-semibold", colorClass)}>
 {sign}{nss}
 </span>
 </p>
 );
 })()}
 </div>
 {/* Legend column — full width on mobile, half-width on desktop */}
 <div className="w-full sm:w-1/2 space-y-3 sm:pl-4">
 {sentimentData.map((d) => (
 <div key={d.name} className="flex items-center gap-2">
 <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
 <span className="text-sm flex-1">{d.name}</span>
 <span className="text-sm font-medium">
 {sentimentTotal > 0 ? Math.round((d.value / sentimentTotal) * 100) : 0}%
 </span>
 </div>
 ))}
 </div>
 </div>
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
 <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
 No reviews synced yet.
 </div>
 ) : (
 <div className="flex items-center gap-8">
 <div className="w-40 h-40 relative">
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
 <div className="flex-1 grid grid-cols-2 gap-6">
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
