"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, type AnalyticsRange, RANGE_DAYS } from "@/hooks/useAnalytics";
import { usePlan } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";
import { Zap, CheckCircle2, Clock, Info, Timer, TrendingUp, Bot, IndianRupee, Mail, X } from "lucide-react";
import { UpgradeGate } from "@/components/dashboard/UpgradeGate";

const DIGEST_BANNER_DISMISS_KEY = "reviewpilot_digest_banner_dismissed";

function DigestBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        if (typeof window !== "undefined" &&
            window.localStorage.getItem(DIGEST_BANNER_DISMISS_KEY) === "1") {
          return;
        }
        const res = await fetch("/api/digest/preferences");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.preferences?.daily_enabled === false) {
          setShow(true);
        }
      } catch {
        /* silent — banner is optional */
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  if (!show) return null;

  function dismiss() {
    try { window.localStorage.setItem(DIGEST_BANNER_DISMISS_KEY, "1"); } catch {}
    setShow(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
      <Mail className="h-4 w-4 text-accent shrink-0" />
      <div className="flex-1 text-sm">
        <span className="font-semibold">Get this delivered to your inbox</span>
        <span className="text-muted-foreground ml-2">
          Skip checking the dashboard, get a daily summary at your preferred time.
        </span>
      </div>
      <Link
        href="/dashboard/settings/notifications"
        className="text-xs font-semibold text-accent hover:underline whitespace-nowrap"
      >
        Set up daily digest →
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const PERIODS: { label: string; value: AnalyticsRange }[] = [
  { label: "Today", value: "1d" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

// Avg minutes a human spends writing one review reply
const MINS_PER_MANUAL_REPLY = 5;
// Approx hourly rate for a response manager (INR)
const HOURLY_RATE_INR = 500;

function AnalyticsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRange = searchParams.get("range");
  const range: AnalyticsRange =
    rawRange === "1d" || rawRange === "7d" || rawRange === "30d" || rawRange === "90d"
      ? rawRange
      : "30d";

  function setRange(r: AnalyticsRange) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("range", r);
    router.replace(`/dashboard/analytics?${params.toString()}`, { scroll: false });
  }

  const { analytics, loading, isMock } = useAnalytics(range);
  const { planId } = usePlan();
  const isAgency = planId === "agency";
  const periodDays = RANGE_DAYS[range];
  const tooNew =
    analytics.connectionAgeDays !== null && analytics.connectionAgeDays < periodDays;

  const totals = analytics.totals;
  const aiTotal = totals.auto_replies_this_month;
  const timeSavedMins = aiTotal * MINS_PER_MANUAL_REPLY;
  const timeSavedHrs = Math.floor(timeSavedMins / 60);
  const timeSavedRemMins = timeSavedMins % 60;
  const timeSavedLabel = timeSavedHrs > 0
    ? `${timeSavedHrs}h ${timeSavedRemMins}m`
    : `${timeSavedMins}m`;
  const costSavedINR = Math.round((timeSavedMins / 60) * HOURLY_RATE_INR);
  const aiEfficiency = totals.total_reviews > 0
    ? Math.round((aiTotal / totals.total_reviews) * 100)
    : 0;
  const reviewVelocity = totals.total_reviews > 0
    ? (totals.total_reviews / periodDays).toFixed(1)
    : "0.0";

  return (
    <PageTransition>
      <div className="space-y-6">
        <DigestBanner />

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
          <h1 className="font-sans text-2xl font-semibold tracking-tight">Analytics</h1>
          <div
            role="group"
            aria-label="Select time range"
            className="flex items-center gap-1 rounded-full bg-secondary p-1"
          >
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setRange(p.value)}
                aria-pressed={range === p.value}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  range === p.value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <StatsCards
            totalReviews={totals.total_reviews}
            avgRating={totals.avg_rating}
            responseRate={totals.response_rate}
            pendingCount={totals.awaiting_reply}
            rangeLabel={range}
            previousTotals={analytics.previousPeriodTotals.total_reviews}
            previousAvgRating={analytics.previousPeriodTotals.avg_rating}
          />
        )}

        {tooNew && !loading && totals.total_reviews > 0 && (
          <p className="text-xs text-muted-foreground -mt-3">
            Your {range} view will fill in as reviews accumulate. You&apos;re seeing everything available so far.
          </p>
        )}

        {/* Agency Intelligence Panel */}
        {isAgency && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Agency Intelligence</h2>
              <span className="rounded-full bg-accent/10 dark:bg-accent/10 text-accent dark:text-accent text-[10px] font-semibold px-2 py-0.5">Agency Plan</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-violet-200/70 dark:border-violet-800/70 bg-gradient-to-br from-violet-50/60 to-purple-50/60 dark:from-violet-950/20 dark:to-purple-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-lg p-1.5 bg-violet-100 dark:bg-violet-950/50">
                      <Timer className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Time Saved</p>
                  </div>
                  <p className="text-2xl font-bold font-sans tracking-tight text-violet-700 dark:text-violet-300">
                    {timeSavedLabel}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    vs. manual replies this month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200/70 dark:border-emerald-800/70 bg-gradient-to-br from-emerald-50/60 to-green-50/60 dark:from-emerald-950/20 dark:to-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-lg p-1.5 bg-emerald-100 dark:bg-emerald-950/50">
                      <IndianRupee className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Cost Saved</p>
                  </div>
                  <p className="text-2xl font-bold font-sans tracking-tight text-emerald-700 dark:text-emerald-300">
                    ₹{costSavedINR.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    at ₹{HOURLY_RATE_INR}/hr manager cost
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200/70 dark:border-blue-800/70 bg-gradient-to-br from-blue-50/60 to-sky-50/60 dark:from-blue-950/20 dark:to-sky-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-lg p-1.5 bg-blue-100 dark:bg-blue-950/50">
                      <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">AI Efficiency</p>
                  </div>
                  <p className="text-2xl font-bold font-sans tracking-tight text-blue-700 dark:text-blue-300">
                    {aiEfficiency}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    of reviews handled by AI
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200/70 dark:border-orange-800/70 bg-gradient-to-br from-orange-50/60 to-amber-50/60 dark:from-orange-950/20 dark:to-amber-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-lg p-1.5 bg-orange-100 dark:bg-orange-950/50">
                      <TrendingUp className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Review Velocity</p>
                  </div>
                  <p className="text-2xl font-bold font-sans tracking-tight text-orange-700 dark:text-orange-300">
                    {reviewVelocity}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    reviews per day ({range})
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Auto-replies This Month — scoped to calendar month */}
        <UpgradeGate feature="inbox_auto_reply">
          <Card className="border-accent/40 bg-gradient-to-r from-accent/10 to-accent/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg p-2 bg-accent/10 dark:bg-accent/10">
                  <Zap className="h-4 w-4 text-accent dark:text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Auto-Replies This Month</p>
                  <p className="text-xs text-muted-foreground">Calendar month — independent of range selector</p>
                </div>
                <div className="ml-auto text-right">
                  <AnimatedCounter
                    value={totals.auto_replies_this_month}
                    className="text-3xl font-bold font-sans tracking-tight text-accent dark:text-accent"
                  />
                  <p className="text-[10px] text-muted-foreground">total replies</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background/70 border px-3 py-2.5 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <AnimatedCounter
                      value={totals.auto_replies_this_month_published}
                      className="text-lg font-bold font-sans tracking-tight"
                    />
                    <p className="text-[11px] text-muted-foreground">Published automatically</p>
                  </div>
                </div>
                <div className="rounded-lg bg-background/70 border px-3 py-2.5 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                  <div>
                    <AnimatedCounter
                      value={totals.auto_replies_this_month_drafted}
                      className="text-lg font-bold font-sans tracking-tight"
                    />
                    <p className="text-[11px] text-muted-foreground">Drafted for review</p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                <a href="/dashboard/settings/ai-config" className="text-accent hover:underline">
                  Configure auto-reply schedule →
                </a>
              </p>
            </CardContent>
          </Card>
        </UpgradeGate>

        <UpgradeGate feature="analytics_advanced">
          <AnalyticsCharts
            ratingTrend={analytics.trend}
            sentimentBreakdown={analytics.sentiment_breakdown}
            topKeywords={analytics.top_keywords}
            sourceBreakdown={analytics.source_breakdown}
            ratingDistribution={analytics.distribution}
            replyRate={totals.response_rate ?? 0}
          />
        </UpgradeGate>
      </div>
    </PageTransition>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="h-32" />}>
      <AnalyticsPageInner />
    </Suspense>
  );
}
