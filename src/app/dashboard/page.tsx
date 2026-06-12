"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DashboardReviewRow } from "@/components/dashboard/DashboardReviewRow";
import { GettingStartedCard, type OnboardingStep } from "@/components/dashboard/GettingStartedCard";
import { QuickActionTiles, type QuickActionTile } from "@/components/dashboard/QuickActionTiles";
import { ActiveIssues } from "@/components/dashboard/ActiveIssues";
import { RecoveryRateCard } from "@/components/dashboard/RecoveryRateCard";
import { WeeklyGlanceCard } from "@/components/dashboard/WeeklyGlanceCard";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReviews } from "@/hooks/useReviews";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useConnections } from "@/hooks/useConnection";
import { deriveConnectionState } from "@/lib/connection-state";
import {
  MessageSquare,
  Megaphone,
  BarChart3,
  Bell,
  CheckCircle2,
  Link2,
  Bot,
  Star,
  ChevronRight,
  Zap,
  Info,
  RefreshCw,
  FlaskConical,
  Loader2,
  Inbox,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/utils";

type ActivityItem = {
  icon: typeof Zap;
  color: string;
  bg: string;
  text: string;
  time: string;
  sortKey: number;
};

// Shown only in mock/demo mode so the activity section doesn't look empty for new users
const MOCK_ACTIVITY_FEED: ActivityItem[] = [
  { icon: Zap, color: "text-accent", bg: "bg-accent/10 dark:bg-accent/10", text: "AI replied to 3 reviews automatically", time: "1 hour ago", sortKey: 0 },
  { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", text: "Synced 12 reviews from your Play Store", time: "3 hours ago", sortKey: 0 },
  { icon: Bot, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "AI drafted reply for a 2★ review", time: "Yesterday", sortKey: 0 },
  { icon: Star, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", text: "5 new reviews received from Play Store", time: "Yesterday", sortKey: 0 },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function deriveFirstName(profileName: string | null, email: string | null): string | null {
  if (profileName) {
    const first = profileName.split(" ")[0];
    if (first) return first;
  }
  if (email) {
    // dev.kolsawala45@gmail.com → "Dev"
    const local = email.split("@")[0] ?? "";
    const token = local.split(/[._\-+]/)[0] ?? "";
    const cleaned = token.replace(/\d+$/, "");
    if (cleaned) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }
  return null;
}

export default function DashboardPage() {
  const { reviews, isMock, refetch } = useReviews();
  const { analytics } = useAnalytics();
  const { connections } = useConnections();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  async function handleSeedTestData() {
    setSeeding(true);
    try {
      const res = await fetch("/api/test/seed-reviews", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Test data seeded", description: data.message });
        refetch();
      } else {
        toast({ title: "Seed failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Seed failed", description: "Could not seed test data.", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    async function loadName() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const email = session?.user?.email ?? null;
      if (!userId) {
        setFirstName(deriveFirstName(null, email));
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      setFirstName(deriveFirstName(data?.full_name ?? null, email));
    }
    loadName();
  }, []);

  // Live done-state for the "Turn on review alerts" onboarding step. RLS
  // scopes the read to the workspace owner's row; no row yet = not enabled.
  useEffect(() => {
    async function loadAlertPrefs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("alert_preferences")
        .select("enabled")
        .maybeSingle();
      setAlertsEnabled(data?.enabled === true);
    }
    loadAlertPrefs();
  }, []);

  // Load real activity feed from Supabase
  useEffect(() => {
    if (isMock) return; // Skip for mock mode — no real data to show
    async function loadActivity() {
      const supabase = createClient();
      const items: ActivityItem[] = [];

      // 1. Recent published replies
      const { data: replies } = await supabase
        .from("reviews")
        .select("author_name, reply_published_at, rating, source")
        .not("reply_published_at", "is", null)
        .order("reply_published_at", { ascending: false })
        .limit(5);

      for (const r of replies ?? []) {
        if (!r.reply_published_at) continue;
        items.push({
          icon: Zap,
          color: "text-accent",
          bg: "bg-accent/10 dark:bg-accent/10",
          text: `Replied to ${r.author_name}'s ${r.rating}★ review`,
          time: timeAgo(r.reply_published_at),
          sortKey: new Date(r.reply_published_at).getTime(),
        });
      }

      // 2. Recent AI drafts (auto-replied but not yet published)
      const { data: drafts } = await supabase
        .from("reviews")
        .select("author_name, updated_at, rating")
        .eq("reply_status", "drafted")
        .eq("is_auto_replied", true)
        .not("reply_text", "is", null)
        .order("updated_at", { ascending: false })
        .limit(3);

      for (const d of drafts ?? []) {
        if (!d.updated_at) continue;
        items.push({
          icon: Bot,
          color: "text-indigo-500",
          bg: "bg-indigo-50 dark:bg-indigo-950/30",
          text: `AI drafted reply for ${d.author_name}'s ${d.rating}★ review`,
          time: timeAgo(d.updated_at),
          sortKey: new Date(d.updated_at).getTime(),
        });
      }

      // 3. Recent connection syncs
      const { data: conns } = await supabase
        .from("connections")
        .select("name, type, last_synced_at, review_count")
        .not("last_synced_at", "is", null)
        .order("last_synced_at", { ascending: false })
        .limit(3);

      for (const c of conns ?? []) {
        if (!c.last_synced_at) continue;
        const source = c.type === "play_store" ? "Play Store" : "Google Business";
        items.push({
          icon: RefreshCw,
          color: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          text: `Synced ${c.review_count ?? 0} reviews from ${c.name} (${source})`,
          time: timeAgo(c.last_synced_at),
          sortKey: new Date(c.last_synced_at).getTime(),
        });
      }

      items.sort((a, b) => b.sortKey - a.sortKey);
      setActivityFeed(items.slice(0, 5));
    }
    loadActivity();
  }, [isMock, connections.length]);

  const pendingReviews = reviews.filter((r) => r.reply_status === "pending");

  const connectionState = deriveConnectionState(connections);
  const {
    hasAnyConnection,
    primarySourceLabel,
    oldestConnectionDaysAgo,
    connectionCount,
  } = connectionState;
  // Most recent sync across all active connections. Drives the header
  // "Last synced …" indicator (STEP 8). Null = never synced.
  const lastSyncedAt = connections.reduce<string | null>((acc, c) => {
    if (!c.last_synced_at) return acc;
    if (!acc) return c.last_synced_at;
    return new Date(c.last_synced_at).getTime() >
      new Date(acc).getTime()
      ? c.last_synced_at
      : acc;
  }, null);

  const hasConnections = connections.length > 0;
  const hasReplied = reviews.some((r) => r.reply_status === "published" && !!r.reply_published_at);

  const onboardingSteps: OnboardingStep[] = [
    { label: "Create account", href: "#", icon: CheckCircle2, done: true },
    { label: "Connect Google Business Profile or Play Store", href: "/dashboard/settings/connections", icon: Link2, done: hasConnections },
    { label: "Configure AI reply settings", href: "/dashboard/settings/ai-config", icon: Bot, done: false },
    { label: "Reply to your first review", href: "/dashboard/inbox", icon: Star, done: hasReplied },
    { label: "Turn on review alerts", href: "/dashboard/settings/notifications", icon: Bell, done: alertsEnabled },
  ];

  const quickActions: QuickActionTile[] = [
    {
      label: "Reply to Reviews",
      description: "Catch up on pending and drafted replies in your inbox.",
      href: "/dashboard/inbox",
      icon: MessageSquare,
      tone: "accent",
      badge:
        pendingReviews.length > 0
          ? { label: `${pendingReviews.length} pending`, tone: "amber" }
          : undefined,
    },
    {
      label: "View Analytics",
      description: "Track ratings, response rate, and trends over time.",
      href: "/dashboard/analytics",
      icon: BarChart3,
      tone: "blue",
    },
    {
      label: "Create Campaign",
      description: "Run review-request campaigns by SMS or WhatsApp.",
      href: "/dashboard/campaigns",
      icon: Megaphone,
      tone: "purple",
      badge: { label: "Soon", tone: "muted" },
    },
    {
      label: "Connect New Source",
      description: "Add Play Store or Google Business to pull more reviews.",
      href: "/dashboard/settings/connections",
      icon: Link2,
      tone: "amber",
    },
  ];

  const greetingDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageTransition stagger>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-sans text-2xl sm:text-3xl font-semibold tracking-tight">
              {getGreeting()}{firstName ? `, ${firstName}` : ""}
              <span className="text-accent">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-mono">
              {greetingDate}
            </p>
            {/* Sync-status signal — keeps users from wondering whether the
                connection is stuck. Wraps below the greeting on mobile so
                long timestamps don't push the header off-screen. */}
            {hasAnyConnection && lastSyncedAt && (
              <p className="text-[11px] text-muted-foreground/70 mt-1 font-mono">
                Last synced {timeAgo(lastSyncedAt)}
              </p>
            )}
            {hasAnyConnection && !lastSyncedAt && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-mono">
                Waiting for first sync…
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="ghost" asChild className="border border-border/60">
              <Link href="/dashboard/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button size="sm" variant="gradient" asChild>
              <Link href="/dashboard/inbox">
                <MessageSquare className="mr-2 h-4 w-4" />
                Reply to Reviews
              </Link>
            </Button>
          </div>
        </div>

        {/* Sample data banner — yellow, only shown when isMock=true */}
        {isMock && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5">
            <Info className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-400 flex-1">
              You&apos;re viewing <strong>sample data.</strong> Connect your Google Business Profile or Play Store in{" "}
              <a
                href="/dashboard/settings/connections"
                className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-300"
              >
                Settings → Connections
              </a>{" "}
              to see real reviews and live stats.
            </p>
          </div>
        )}

        {/* Dev-only: Seed Test Data button */}
        {process.env.NODE_ENV !== "production" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedTestData}
            disabled={seeding}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/20"
          >
            {seeding ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...</>
            ) : (
              <><FlaskConical className="mr-2 h-4 w-4" /> Load Test Reviews (Dev Only)</>
            )}
          </Button>
        )}

        {/* Stat cards */}
        <StatsCards
          totalReviews={analytics.totals.total_reviews}
          avgRating={analytics.totals.avg_rating}
          responseRate={analytics.totals.response_rate}
          pendingCount={pendingReviews.length}
          previousTotals={analytics.previousPeriodTotals.total_reviews}
          previousAvgRating={analytics.previousPeriodTotals.avg_rating}
          previousResponseRate={analytics.previousPeriodTotals.response_rate}
          trend={analytics.trend}
          oldestConnectionDaysAgo={isMock ? null : analytics.connectionAgeDays}
        />

        {/* Second stat row — Recovery Rate + AI weekly summary. Mock mode
            skips it since both run on real data only. WeeklyGlanceCard
            renders null when DIGEST_EXECUTIVE_SUMMARY_ENABLED is off. */}
        {!isMock && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <RecoveryRateCard />
            <WeeklyGlanceCard className="sm:col-span-1 lg:col-span-3" />
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left — Recent reviews */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">Recent Reviews</CardTitle>
              <Link
                href="/dashboard/inbox"
                className="group -mr-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
              >
                View all
                <ChevronRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {reviews.length === 0 && !isMock ? (
                // Empty-state branches — match the user's actual situation so
                // the CTA isn't misleading. Three buckets:
                //   1. No connection yet           → "Connect a source" CTA
                //   2. Fresh connection (< 1 day)  → "Reviews will appear shortly" (no CTA)
                //   3. Old connection, no reviews  → "No reviews to display" + soft link
                !hasAnyConnection ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <div className="rounded-2xl bg-secondary/60 p-4 mb-4 ring-1 ring-border/60">
                      <Inbox className="h-7 w-7 text-muted-foreground/50 mx-auto" />
                    </div>
                    <p className="text-sm font-medium mb-1">No reviews yet</p>
                    <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                      Connect a source to start pulling reviews from your Play Store app or Google Business Profile.
                    </p>
                    <Button size="sm" variant="gradient" asChild>
                      <Link href="/dashboard/settings/connections">
                        <Link2 className="mr-2 h-3.5 w-3.5" />
                        Connect a source
                      </Link>
                    </Button>
                  </div>
                ) : oldestConnectionDaysAgo !== null &&
                  oldestConnectionDaysAgo < 1 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <div className="rounded-2xl bg-secondary/60 p-4 mb-4 ring-1 ring-border/60">
                      <Inbox className="h-7 w-7 text-muted-foreground/50 mx-auto" />
                    </div>
                    <p className="text-sm font-medium mb-1">
                      Reviews will appear here shortly
                    </p>
                    <p className="text-xs text-muted-foreground mb-2 max-w-sm">
                      We&apos;re checking{" "}
                      {primarySourceLabel === "app"
                        ? "your Play Store app"
                        : primarySourceLabel === "business"
                        ? "your Google Business Profile"
                        : "your connected sources"}{" "}
                      for reviews. First sync usually completes within 15 minutes.
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 max-w-sm">
                      If reviews still don&apos;t appear after an hour, your source may not have any recent reviews yet.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <div className="rounded-2xl bg-secondary/60 p-4 mb-4 ring-1 ring-border/60">
                      <Inbox className="h-7 w-7 text-muted-foreground/50 mx-auto" />
                    </div>
                    <p className="text-sm font-medium mb-1">
                      No reviews to display
                    </p>
                    <p className="text-xs text-muted-foreground mb-2 max-w-sm">
                      Your connected{" "}
                      {primarySourceLabel === "app"
                        ? "app"
                        : primarySourceLabel === "business"
                        ? "business"
                        : "sources"}{" "}
                      {connectionCount > 1 ? "haven't" : "hasn't"} received any reviews yet. Reviews will sync automatically once they arrive.
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Need to verify the connection?{" "}
                      <Link
                        href="/dashboard/settings/connections"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        Check connection status
                      </Link>
                    </p>
                  </div>
                )
              ) : (
                <div>
                  {reviews.slice(0, 5).map((review) => (
                    <DashboardReviewRow key={review.id} review={review} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            <GettingStartedCard steps={onboardingSteps} />

            {/* Quick actions */}
            <div>
              <h3 className="px-1 font-sans text-sm font-semibold tracking-tight mb-2.5">
                Quick Actions
              </h3>
              <QuickActionTiles tiles={quickActions} />
            </div>
          </div>
        </div>

        {/* Active Issues — surfaces complaint clusters detected from negative
            reviews. Hidden in mock mode (no real classification data). */}
        {!isMock && (
          <ActiveIssues
            hasConnection={hasAnyConnection}
            hasAnyReviews={reviews.length > 0}
          />
        )}

        {/* Activity feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {activityFeed.length === 0 && !isMock ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-2xl bg-secondary/60 p-4 mb-3 ring-1 ring-border/60">
                  <Inbox className="h-6 w-6 text-muted-foreground/50 mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
                  Activity will appear here once you start syncing reviews and generating replies.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {(isMock ? MOCK_ACTIVITY_FEED : activityFeed).map((item, i) => (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div className={`relative z-10 rounded-full p-1.5 ${item.bg} ring-4 ring-card`}>
                        <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm">{item.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
