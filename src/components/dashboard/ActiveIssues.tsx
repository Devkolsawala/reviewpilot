"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import type { Issue } from "@/types/review";

interface ActiveIssuesProps {
  /** Max issues to show inline on the dashboard card. */
  limit?: number;
  /** Whether the user has any connection. Drives the empty-state branch. */
  hasConnection?: boolean;
  /** Whether the user has any reviews synced yet. */
  hasAnyReviews?: boolean;
  /** Optional connection scope. When omitted, shows issues across all the user's connections. */
  connectionId?: string;
}

function timeAgoShort(iso: string): string {
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
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function severityTone(avg: number | null) {
  const v = avg ?? 0;
  if (v <= 2.0) return { dot: "bg-rose-500", ring: "ring-rose-500/30" };
  return { dot: "bg-amber-500", ring: "ring-amber-500/30" };
}

export function ActiveIssues({
  limit = 3,
  hasConnection = true,
  hasAnyReviews = true,
  connectionId,
}: ActiveIssuesProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFixId, setPendingFixId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function loadIssues() {
    try {
      const qs = new URLSearchParams({ status: "active" });
      if (connectionId) qs.set("connection_id", connectionId);
      const res = await fetch(`/api/issues?${qs.toString()}`);
      if (!res.ok) {
        setIssues([]);
      } else {
        const data = await res.json();
        setIssues(data.issues ?? []);
      }
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  async function markFixed(id: string) {
    setPendingFixId(id);
    // Optimistic remove
    const snapshot = issues;
    setIssues((prev) => prev.filter((i) => i.id !== id));
    setConfirmId(null);
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "fixed" }),
      });
      if (!res.ok) throw new Error("Update failed");
      const payload = await res.json().catch(() => ({}));
      const published: number = payload?.published ?? 0;
      const drafted: number = payload?.drafted ?? 0;
      const candidatesFound: number = payload?.candidatesFound ?? 0;
      const regenerated = published + drafted;

      let description: string;
      if (regenerated === 0) {
        description =
          candidatesFound === 0
            ? "No linked reviews had updated feedback yet."
            : "Couldn't regenerate replies right now — see server logs.";
      } else if (published > 0 && drafted === 0) {
        description = `Published ${published} new ${
          published === 1 ? "reply" : "replies"
        }, replacing the previous reply on the store.`;
      } else if (published === 0 && drafted > 0) {
        description = `Drafted ${drafted} new ${
          drafted === 1 ? "reply" : "replies"
        } — auto-publish failed. Review from the Inbox.`;
      } else {
        description = `Published ${published}, drafted ${drafted}.`;
      }

      toast({ title: "Insight marked as fixed", description });
      // Refresh the sidebar count badge.
      window.dispatchEvent(new CustomEvent("reviewpilot:issues-changed"));
      // Refresh inbox / draft counters when new replies were generated.
      if (regenerated > 0) {
        window.dispatchEvent(
          new CustomEvent("reviewpilot:auto-reply-complete", {
            detail: { drafted, published },
          })
        );
      }
    } catch {
      // rollback
      setIssues(snapshot);
      toast({
        title: "Couldn't mark as fixed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingFixId(null);
    }
  }

  const visible = issues.slice(0, limit);
  const hiddenCount = Math.max(0, issues.length - limit);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
            Active Insights
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Themes detected from negative reviews
          </p>
        </div>
        {issues.length > 0 && (
          <Link
            href="/dashboard/issues"
            className="group -mr-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            View all
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasConnection ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-6">
            <div className="rounded-2xl bg-secondary/60 p-3 mb-3 ring-1 ring-border/60">
              <AlertTriangle className="h-5 w-5 text-muted-foreground/50" aria-hidden />
            </div>
            <p className="text-sm font-medium mb-1">No insights yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Connect a source to start surfacing themes from negative reviews.
            </p>
          </div>
        ) : !hasAnyReviews ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-6">
            <div className="rounded-2xl bg-secondary/60 p-3 mb-3 ring-1 ring-border/60">
              <AlertTriangle className="h-5 w-5 text-muted-foreground/50" aria-hidden />
            </div>
            <p className="text-sm font-medium mb-1">No insights detected yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Insights will appear here as ReviewPilot analyzes your negative reviews.
            </p>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-6">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-3 mb-3 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </div>
            <p className="text-sm font-medium mb-1">No active insights — great work!</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Your app is in good shape. We&apos;ll flag new complaints here as they come in.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visible.map((issue) => {
              const tone = severityTone(issue.avg_rating);
              const isConfirming = confirmId === issue.id;
              const isPending = pendingFixId === issue.id;
              return (
                <div
                  key={issue.id}
                  className="rounded-lg border border-border/60 bg-card/40 px-3.5 py-3 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 rounded-full ring-2 shrink-0",
                        tone.dot,
                        tone.ring
                      )}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium leading-snug">
                          {issue.label}
                        </p>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                          {issue.review_count} {issue.review_count === 1 ? "review" : "reviews"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        {issue.avg_rating != null && (
                          <span className="inline-flex items-center gap-0.5">
                            <Star
                              className="h-3 w-3 fill-amber-400 text-amber-400"
                              aria-hidden
                            />
                            <span className="font-mono tabular-nums">
                              {Number(issue.avg_rating).toFixed(1)}
                            </span>
                            <span className="ml-0.5">avg</span>
                          </span>
                        )}
                        <span aria-hidden>·</span>
                        <span>First seen {timeAgoShort(issue.first_seen_at)}</span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-end gap-2">
                        {isConfirming ? (
                          <>
                            <span className="text-[11px] text-muted-foreground mr-auto">
                              Mark this as fixed?
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmId(null)}
                              disabled={isPending}
                              className="h-7 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => markFixed(issue.id)}
                              disabled={isPending}
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                            >
                              {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Confirm
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmId(issue.id)}
                            className="h-7 px-2.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden />
                            Mark as Fixed
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <Link
                href="/dashboard/issues"
                className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
              >
                + {hiddenCount} more {hiddenCount === 1 ? "insight" : "insights"}
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
