"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Star,
  Loader2,
  ChevronDown,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { usePlan } from "@/hooks/usePlan";
import type { Issue } from "@/types/review";

type IssueStatus = "active" | "fixed" | "dismissed";

interface IssueReview {
  id: string;
  source: string;
  external_review_id: string;
  author_name: string;
  rating: number | null;
  review_text: string;
  original_rating: number | null;
  recovery_status: string | null;
  recovery_detected_at: string | null;
  review_created_at: string | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function IssuesPage() {
  const { can, isLoading: planLoading } = usePlan();
  // Starter and above get the full drill-down. Free plan sees a teaser.
  const fullAccess = can("auto_reply") || planLoading;

  const [tab, setTab] = useState<IssueStatus>("active");
  const [issues, setIssues] = useState<Record<IssueStatus, Issue[]>>({
    active: [],
    fixed: [],
    dismissed: [],
  });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewsByIssue, setReviewsByIssue] = useState<Record<string, IssueReview[]>>({});
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  async function loadTab(target: IssueStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/issues?status=${target}`);
      if (!res.ok) {
        setIssues((prev) => ({ ...prev, [target]: [] }));
      } else {
        const data = await res.json();
        setIssues((prev) => ({ ...prev, [target]: data.issues ?? [] }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function toggleExpand(issueId: string) {
    if (expandedId === issueId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(issueId);
    if (!reviewsByIssue[issueId]) {
      setReviewLoadingId(issueId);
      try {
        const res = await fetch(`/api/issues/${issueId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviewsByIssue((prev) => ({ ...prev, [issueId]: data.reviews ?? [] }));
        }
      } finally {
        setReviewLoadingId(null);
      }
    }
  }

  async function changeStatus(id: string, status: IssueStatus) {
    setPendingActionId(id);
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      const payload = await res.json().catch(() => ({}));
      const published: number = payload?.published ?? 0;
      const drafted: number = payload?.drafted ?? 0;
      const candidatesFound: number = payload?.candidatesFound ?? 0;
      const regenerated = published + drafted;

      if (status === "fixed") {
        let description: string;
        if (regenerated === 0) {
          description =
            candidatesFound === 0
              ? "No linked reviews had updated feedback yet. We'll keep watching for rating changes."
              : "Couldn't regenerate replies right now — see the server logs for details.";
        } else if (published > 0 && drafted === 0) {
          description = `Published ${published} new ${
            published === 1 ? "reply" : "replies"
          } on the store, replacing the previous reply.`;
        } else if (published === 0 && drafted > 0) {
          description = `Drafted ${drafted} new ${
            drafted === 1 ? "reply" : "replies"
          } — couldn't auto-publish (likely outside the store's reply window). Review & publish from the Inbox.`;
        } else {
          description = `Published ${published} new ${
            published === 1 ? "reply" : "replies"
          }, drafted ${drafted} more for manual review.`;
        }
        toast({ title: "Marked as fixed", description });
      } else {
        toast({
          title: status === "dismissed" ? "Insight dismissed" : "Insight reopened",
        });
      }
      // Refresh affected tabs
      await Promise.all([loadTab(tab), loadTab(status)]);
      // Notify the sidebar so the active-count badge updates without a full
      // page refresh (matches the auto-reply-complete pattern used elsewhere).
      window.dispatchEvent(new CustomEvent("reviewpilot:issues-changed"));
      // Inbox listens to auto-reply-complete to refresh its review list /
      // draft counts. Reuse that event with the real split between published
      // and drafted so any downstream listeners get accurate numbers.
      if (regenerated > 0) {
        window.dispatchEvent(
          new CustomEvent("reviewpilot:auto-reply-complete", {
            detail: { drafted, published },
          })
        );
      }
    } catch {
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingActionId(null);
    }
  }

  const current = issues[tab] ?? [];

  const tabs = useMemo(
    () =>
      [
        { id: "active" as const, label: "Active", Icon: AlertTriangle },
        { id: "fixed" as const, label: "Fixed", Icon: CheckCircle2 },
        { id: "dismissed" as const, label: "Dismissed", Icon: XCircle },
      ],
    []
  );

  return (
    <PageTransition stagger>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-sans text-2xl sm:text-3xl font-semibold tracking-tight">
              Insights
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Recurring themes detected from your negative reviews. Mark them
              fixed once you ship a fix — we&apos;ll keep watching linked
              reviews for rating improvements.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 border-b border-border/60">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.Icon className="h-3.5 w-3.5" aria-hidden />
                {t.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-2 right-2 -bottom-px h-[2px] rounded-t-full bg-[linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Free-plan teaser banner (drill-down is starter+) */}
        {!fullAccess && (
          <Card className="border-accent/40 bg-[linear-gradient(135deg,rgba(99,102,241,0.08)_0%,rgba(217,70,239,0.08)_100%)]">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden />
              <div className="flex-1">
                <p className="text-sm font-semibold">Upgrade for full insight analysis</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Free plan shows insight labels and counts. Upgrade to Starter
                  to drill into linked reviews, see recovery trends, and access
                  fixed/dismissed history.
                </p>
              </div>
              <Link
                href="/dashboard/settings/billing"
                className="shrink-0 inline-flex items-center text-xs font-semibold text-white bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] hover:brightness-110 rounded-lg px-3 py-1.5"
              >
                Upgrade
              </Link>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : current.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="rounded-2xl bg-secondary/60 p-4 mb-3 ring-1 ring-border/60">
                <Inbox className="h-6 w-6 text-muted-foreground/50" aria-hidden />
              </div>
              <p className="text-sm font-medium mb-1">
                {tab === "active" && "No active insights"}
                {tab === "fixed" && "No fixed insights yet"}
                {tab === "dismissed" && "No dismissed insights"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {tab === "active" &&
                  "When AI detects a recurring theme in your negative reviews, it'll appear here."}
                {tab === "fixed" &&
                  "Insights you mark as fixed will move here for tracking."}
                {tab === "dismissed" &&
                  "Insights you dismiss will be archived here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {current.map((issue) => {
              const expanded = expandedId === issue.id;
              const pending = pendingActionId === issue.id;
              const linkedReviews = reviewsByIssue[issue.id];
              const avg = issue.avg_rating != null ? Number(issue.avg_rating) : null;
              const severityDot =
                avg != null && avg <= 2.0
                  ? "bg-rose-500 ring-rose-500/30"
                  : "bg-amber-500 ring-amber-500/30";

              return (
                <Card key={issue.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 rounded-full ring-2 shrink-0",
                          tab === "fixed" ? "bg-emerald-500 ring-emerald-500/30" : severityDot
                        )}
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h3 className="text-sm font-semibold leading-snug">
                              {issue.label}
                            </h3>
                            <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                              <span className="font-mono">
                                {issue.review_count} {issue.review_count === 1 ? "review" : "reviews"}
                              </span>
                              {avg != null && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="inline-flex items-center gap-0.5">
                                    <Star
                                      className="h-3 w-3 fill-amber-400 text-amber-400"
                                      aria-hidden
                                    />
                                    <span className="font-mono tabular-nums">
                                      {avg.toFixed(1)}
                                    </span>
                                    <span className="ml-0.5">avg</span>
                                  </span>
                                </>
                              )}
                              <span aria-hidden>·</span>
                              <span>First seen {timeAgo(issue.first_seen_at)}</span>
                              {issue.fixed_at && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    Fixed {timeAgo(issue.fixed_at)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {tab === "active" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => changeStatus(issue.id, "dismissed")}
                                  disabled={pending}
                                  className="h-7 px-2 text-xs"
                                >
                                  <XCircle className="h-3 w-3 mr-1" aria-hidden />
                                  Dismiss
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => changeStatus(issue.id, "fixed")}
                                  disabled={pending}
                                  className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                                >
                                  {pending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden />
                                      Mark as Fixed
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                            {(tab === "fixed" || tab === "dismissed") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => changeStatus(issue.id, "active")}
                                disabled={pending}
                                className="h-7 px-2 text-xs"
                              >
                                {pending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCcw className="h-3 w-3 mr-1" aria-hidden />
                                    Reopen
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Drill-down: linked reviews (starter+ only) */}
                        {fullAccess && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => toggleExpand(issue.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {expanded ? (
                                <ChevronDown className="h-3 w-3" aria-hidden />
                              ) : (
                                <ChevronRight className="h-3 w-3" aria-hidden />
                              )}
                              {expanded ? "Hide linked reviews" : "Show linked reviews"}
                            </button>

                            {expanded && (
                              <div className="mt-3 space-y-2 border-l-2 border-border/60 pl-3">
                                {reviewLoadingId === issue.id ? (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Loading reviews…
                                  </div>
                                ) : linkedReviews && linkedReviews.length > 0 ? (
                                  linkedReviews.map((r) => (
                                    <div key={r.id} className="text-xs">
                                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                        <span className="font-medium text-foreground/80">
                                          {r.author_name}
                                        </span>
                                        {r.rating != null && (
                                          <span className="inline-flex items-center gap-0.5">
                                            <Star
                                              className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                                              aria-hidden
                                            />
                                            <span className="font-mono tabular-nums">
                                              {r.rating}
                                            </span>
                                          </span>
                                        )}
                                        {r.recovery_status === "recovered" && (
                                          <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                                            Recovered
                                          </span>
                                        )}
                                        {r.recovery_status === "monitoring" && (
                                          <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                                            Monitoring
                                          </span>
                                        )}
                                        <span aria-hidden>·</span>
                                        <span>{timeAgo(r.review_created_at || r.created_at)}</span>
                                      </div>
                                      <p className="text-foreground/80 leading-relaxed">
                                        {r.review_text}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground py-2">
                                    No linked reviews found.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
