"use client";

import { StatsCards } from "@/components/dashboard/StatsCards";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { Card, CardContent } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useReviews } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";
import { Zap, CheckCircle2, Clock, Info } from "lucide-react";
import { UpgradeGate } from "@/components/dashboard/UpgradeGate";

const PERIODS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
] as const;

export default function AnalyticsPage() {
  const { analytics, isMock, period, setPeriod } = useAnalytics();
  const { reviews } = useReviews();
  const pendingCount = reviews.filter((r) => r.reply_status === "pending").length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Mock data notice — only when showing sample data */}
        {isMock && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-4 py-2.5">
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Showing sample data. Connect your Google Business Profile or Play Store in{" "}
              <a href="/dashboard/settings/connections" className="font-semibold underline underline-offset-2">
                Settings → Connections
              </a>{" "}
              to see real analytics.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Analytics</h1>
          <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150",
                  period === p.value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <StatsCards
          totalReviews={analytics.total_reviews}
          avgRating={analytics.avg_rating}
          responseRate={analytics.response_rate}
          pendingCount={pendingCount}
        />

        {/* Auto-reply stat card */}
        <UpgradeGate feature="inbox_auto_reply">
        <Card className="border-teal-200/70 dark:border-teal-800/70 bg-gradient-to-r from-teal-50/60 to-emerald-50/60 dark:from-teal-950/20 dark:to-emerald-950/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg p-2 bg-teal-100 dark:bg-teal-950/50">
                <Zap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Auto-Replies This Month</p>
                <p className="text-xs text-muted-foreground">Powered by scheduled AI</p>
              </div>
              <div className="ml-auto text-right">
                <AnimatedCounter
                  value={analytics.auto_reply_stats.total}
                  className="text-3xl font-bold font-heading text-teal-700 dark:text-teal-300"
                />
                <p className="text-[10px] text-muted-foreground">total replies</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-background/70 border px-3 py-2.5 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <div>
                  <AnimatedCounter
                    value={analytics.auto_reply_stats.published}
                    className="text-lg font-bold font-heading"
                  />
                  <p className="text-[11px] text-muted-foreground">Published automatically</p>
                </div>
              </div>
              <div className="rounded-lg bg-background/70 border px-3 py-2.5 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                <div>
                  <AnimatedCounter
                    value={analytics.auto_reply_stats.drafted}
                    className="text-lg font-bold font-heading"
                  />
                  <p className="text-[11px] text-muted-foreground">Drafted for review</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              <a href="/dashboard/settings/ai-config" className="text-teal-600 hover:underline">
                Configure auto-reply schedule →
              </a>
            </p>
          </CardContent>
        </Card>
        </UpgradeGate>

        <UpgradeGate feature="analytics_advanced">
        <AnalyticsCharts
          ratingTrend={analytics.rating_trend}
          sentimentBreakdown={analytics.sentiment_breakdown}
          topKeywords={analytics.top_keywords}
          sourceBreakdown={analytics.source_breakdown}
          ratingDistribution={[1, 2, 3, 4, 5].map((star) => ({
            star,
            count: reviews.filter((r) => r.rating === star).length,
          }))}
          replyRate={analytics.response_rate}
        />
        </UpgradeGate>
      </div>
    </PageTransition>
  );
}
