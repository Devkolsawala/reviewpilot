"use client";

import { useState, useCallback } from "react";
import { ConnectionWizard } from "@/components/dashboard/ConnectionWizard";
import { useConnections } from "@/hooks/useConnection";
import { usePlan } from "@/hooks/usePlan";
import { useTeamRole } from "@/hooks/useTeamRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Globe, Smartphone, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock, CalendarClock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getSyncScheduleLabel } from "@/lib/plans";
import type { Connection } from "@/types/connection";

function timeAgo(iso: string | null | undefined) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ConnectionsPage() {
  const { connections, loading, refetch } = useConnections();
  const { planId } = usePlan();
  const { isOwner } = useTeamRole();
  const [showWizard, setShowWizard] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const doSync = useCallback(async (connId: string, silent = false) => {
    if (!silent) {
      setSyncingId(connId);
      toast({ title: "Syncing reviews...", description: "Fetching latest reviews from your connected source." });
    }
    try {
      const res = await fetch("/api/reviews/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connId }),
      });
      const data = await res.json();

      await refetch();

      if (data.error) {
        if (!silent) toast({ title: "Sync error", description: data.error, variant: "destructive" });
        return;
      }

      if (!silent) {
        const parts: string[] = [];
        if (data.newReviews > 0) parts.push(`${data.newReviews} new review${data.newReviews === 1 ? "" : "s"}`);
        if (data.autoPublished > 0) parts.push(`${data.autoPublished} auto-published`);
        if (data.autoDrafted > 0) parts.push(`${data.autoDrafted} AI draft${data.autoDrafted === 1 ? "" : "s"}`);
        const detail = parts.length > 0
          ? `${parts.join(", ")}.`
          : data.updatedReviews > 0
            ? `${data.updatedReviews} review(s) updated, no new rows.`
            : "No new reviews found.";
        toast({ title: "Sync complete", description: detail });
      }
    } catch (err) {
      console.error("[sync] error:", err);
      if (!silent) toast({ title: "Sync failed", description: "Could not fetch reviews. Try again.", variant: "destructive" });
    } finally {
      if (!silent) setSyncingId(null);
    }
  }, [refetch]);

  async function handleComplete(newConn: Connection) {
    setShowWizard(false);
    toast({ title: "Connection saved", description: `${newConn.name} connected successfully.` });
    await refetch();
    doSync(newConn.id, false);
  }

  async function handleRemove(connId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("connections").delete().eq("id", connId);
    if (error) {
      toast({ title: "Error", description: "Could not remove connection.", variant: "destructive" });
    } else {
      toast({ title: "Connection removed" });
      await refetch();
    }
  }

  const syncLabel = getSyncScheduleLabel(planId);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your Google Business Profile or Play Store to start managing reviews.
          </p>
        </div>
        {isOwner && !showWizard && (
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Connection
          </Button>
        )}
      </div>

      {showWizard && (
        <div className="space-y-2">
          <ConnectionWizard onComplete={handleComplete} />
          <Button variant="ghost" size="sm" onClick={() => setShowWizard(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !showWizard && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && connections.length === 0 && !showWizard && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="rounded-2xl bg-secondary/60 p-5 w-fit mx-auto mb-5">
              <Globe className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            </div>
            <h3 className="font-heading text-lg font-semibold mb-2">No connections yet</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Connect your first review source to start managing reviews with AI.
            </p>
            {isOwner && (
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Connection
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connection cards */}
      {!loading && connections.length > 0 && (
        <div className="space-y-3">
          {connections.map((conn) => {
            const isSyncing = syncingId === conn.id;

            return (
              <Card key={conn.id} className="transition-shadow hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2.5 bg-teal-50 dark:bg-teal-950/30">
                        {conn.type === "play_store" ? (
                          <Smartphone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{conn.name}</p>
                          {conn.type === "play_store" && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                conn.credentials
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                  : "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                              )}
                            >
                              {conn.credentials ? "Own Credentials" : "Invite Email"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {conn.type === "play_store" ? "Google Play Store" : "Google Business Profile"}
                          {conn.external_id && (
                            <span className="ml-1 font-mono">· {conn.external_id}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          conn.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400"
                        )}
                      >
                        {conn.is_active ? (
                          <><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Active</>
                        ) : (
                          <><AlertCircle className="h-2.5 w-2.5 mr-1" />Inactive</>
                        )}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => doSync(conn.id, false)}
                        disabled={isSyncing}
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                        {isSyncing ? "Syncing..." : "Sync Now"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => handleRemove(conn.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Last synced + auto-sync schedule */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last synced:{" "}
                      <span className="font-medium text-foreground ml-0.5">
                        {timeAgo(conn.last_synced_at)}
                      </span>
                    </span>
                    <span>
                      Reviews:{" "}
                      <span className="font-medium text-foreground">{conn.review_count ?? 0}</span>
                    </span>
                    <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                      <CalendarClock className="h-3 w-3" />
                      {syncLabel}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-secondary/30 border-dashed">
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-1">How review syncing works</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Reviews sync automatically in the background based on your plan schedule</li>
            <li>• Use &ldquo;Sync Now&rdquo; any time to fetch the latest reviews immediately</li>
            <li>• New reviews appear in your inbox within seconds of syncing</li>
            <li>• If auto-reply is enabled in AI Config, replies are generated automatically</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
