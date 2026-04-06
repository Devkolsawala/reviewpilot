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
  topKeywords: { word: string; count: number }[];
  sourceBreakdown: { name: string; value: number; color: string }[];
  ratingDistribution?: { star: number; count: number }[];
  replyRate?: number;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#14b8a6",
  negative: "#ef4444",
  neutral: "#94a3b8",
  mixed: "#f59e0b",
};

const POSITIVE_KEYWORDS = new Set([
  "great service", "friendly staff", "recommend", "easy to use",
  "original quality", "batch download", "amazing", "best",
]);

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const STAR_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#14b8a6"];

export function AnalyticsCharts({
  ratingTrend,
  sentimentBreakdown,
  topKeywords,
  sourceBreakdown,
  ratingDistribution,
  replyRate,
}: AnalyticsChartsProps) {
  const sentimentData = Object.entries(sentimentBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SENTIMENT_COLORS[name] || "#94a3b8",
  }));

  const sentimentTotal = sentimentData.reduce((sum, d) => sum + d.value, 0);

  const sourceData = sourceBreakdown;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Rating trend — area chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Rating Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ratingTrend}>
                <defs>
                  <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return isNaN(d.getTime())
                      ? v
                      : d.toLocaleDateString("en", { month: "short", day: "numeric" });
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine
                  y={4.5}
                  stroke="#94a3b8"
                  strokeDasharray="6 3"
                  label={{ value: "Goal 4.5★", position: "right", fontSize: 10, fill: "#94a3b8" }}
                />
                <Area
                  type="monotone"
                  dataKey="avg_rating"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  fill="url(#ratingGradient)"
                  dot={{ r: 5, fill: "#14b8a6", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 7, stroke: "#14b8a6", strokeWidth: 2, fill: "#fff" }}
                  name="Avg Rating"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rating distribution — 5 star buckets */}
      {ratingDistribution && ratingDistribution.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="star"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}★`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val, _name, props) => [val, `${props.payload.star}★ reviews`]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Reviews">
                    {ratingDistribution.map((entry) => (
                      <Cell
                        key={entry.star}
                        fill={STAR_COLORS[entry.star - 1] || "#94a3b8"}
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
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

      {/* Sentiment breakdown — donut */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center">
            <div className="w-1/2 relative">
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold font-heading">{sentimentTotal}</p>
                  <p className="text-[10px] text-muted-foreground">reviews</p>
                </div>
              </div>
            </div>
            <div className="w-1/2 space-y-3 pl-4">
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
              <span className="text-5xl font-bold font-heading text-teal-600 dark:text-teal-400">
                {replyRate}%
              </span>
              <span className="text-sm text-muted-foreground pb-1.5">replied</span>
            </div>
            <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${Math.min(replyRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Industry average: <strong>25%</strong>.{" "}
              {replyRate >= 50 ? (
                <span className="text-teal-600 dark:text-teal-400 font-medium">You&apos;re above average!</span>
              ) : (
                <span>Aim for 50%+ for best results.</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Top keywords — tag chips */}
      <Card className={cn(replyRate === undefined ? "" : "lg:col-span-2")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          {topKeywords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keywords yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {topKeywords.map((kw) => {
                const positive = POSITIVE_KEYWORDS.has(kw.word);
                return (
                  <div
                    key={kw.word}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                      positive
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                        : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    )}
                  >
                    {kw.word}
                    <span className="opacity-60 font-normal">{kw.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                      <p className="text-2xl font-bold font-heading">{d.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
