"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReviews } from "@/hooks/useReviews";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useConnections } from "@/hooks/useConnection";
import {
  MessageSquare,
  Megaphone,
  BarChart3,
  CheckCircle2,
  Link2,
  Bot,
  Star,
  ArrowRight,
  TrendingUp,
  Zap,
  Send,
  Info,
  RefreshCw,
  FlaskConical,
  Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const ACTIVITY_FEED = [
  { icon: Zap, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30", text: "AI replied to 3 reviews automatically", time: "1 hour ago" },
  { icon: Send, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", text: "Campaign \"March Feedback\" sent to 15 contacts", time: "3 hours ago" },
  { icon: TrendingUp, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", text: "Rating improved from 3.8 to 4.1", time: "Yesterday" },
  { icon: Star, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", text: "5 new reviews received from Play Store", time: "Yesterday" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { reviews, isMock, refetch } = useReviews();
  const { analytics } = useAnalytics();
  const { connections } = useConnections();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      const name = data?.full_name?.split(" ")[0] ?? null;
      setFirstName(name);
    }
    loadName();
  }, []);
  const pendingReviews = reviews.filter((r) => r.reply_status === "pending");

  const hasConnections = connections.length > 0;
  const hasReplied = reviews.some((r) => r.reply_status === "published");

  const CHECKLIST = [
    { label: "Create account", href: "#", icon: CheckCircle2, done: true },
    { label: "Connect Google Business Profile or Play Store", href: "/dashboard/settings/connections", icon: Link2, done: hasConnections },
    { label: "Configure AI reply settings", href: "/dashboard/settings/ai-config", icon: Bot, done: false },
    { label: "Reply to your first review", href: "/dashboard/inbox", icon: Star, done: hasReplied },
  ];

  const completedSteps = CHECKLIST.filter((c) => c.done).length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold">
              {getGreeting()}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button size="sm" asChild>
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
          totalReviews={analytics.total_reviews}
          avgRating={analytics.avg_rating}
          responseRate={analytics.response_rate}
          pendingCount={pendingReviews.length}
        />

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left — Recent reviews */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Recent Reviews</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-teal-600 hover:text-teal-700">
                <Link href="/dashboard/inbox">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {reviews.length === 0 && !isMock ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="rounded-2xl bg-secondary/60 p-4 mb-4">
                    <RefreshCw className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  </div>
                  <p className="text-sm font-medium mb-1">No reviews synced yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Go to{" "}
                    <a href="/dashboard/settings/connections" className="text-teal-600 hover:underline font-medium">
                      Settings → Connections
                    </a>{" "}
                    and click &ldquo;Sync Now&rdquo; to fetch your reviews.
                  </p>
                </div>
              ) : (
                reviews.slice(0, 5).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            {/* Getting started (show if not all done) */}
            {completedSteps < CHECKLIST.length && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Getting Started</CardTitle>
                    <span className="text-xs font-medium text-muted-foreground">
                      {completedSteps}/{CHECKLIST.length}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(completedSteps / CHECKLIST.length) * 100}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 pt-0">
                  {CHECKLIST.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary/80 transition-colors group"
                    >
                      <div
                        className={`rounded-full p-1.5 transition-colors ${
                          item.done
                            ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                            : "bg-secondary text-muted-foreground group-hover:bg-teal-100 group-hover:text-teal-600 dark:group-hover:bg-teal-950/30 dark:group-hover:text-teal-400"
                        }`}
                      >
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <item.icon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          item.done
                            ? "line-through text-muted-foreground"
                            : "group-hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 hover:border-teal-200 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard/inbox">
                    <MessageSquare className="mr-3 h-4 w-4 text-teal-500" />
                    Reply to Reviews
                    {pendingReviews.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400 rounded-full px-1.5 py-0.5">
                        {pendingReviews.length}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 hover:border-purple-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard/campaigns">
                    <Megaphone className="mr-3 h-4 w-4 text-purple-500" />
                    Create Campaign
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard/analytics">
                    <BarChart3 className="mr-3 h-4 w-4 text-blue-500" />
                    View Analytics
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 hover:border-amber-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard/settings/connections">
                    <Link2 className="mr-3 h-4 w-4 text-amber-500" />
                    Connect New Source
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {ACTIVITY_FEED.map((item, i) => (
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
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
