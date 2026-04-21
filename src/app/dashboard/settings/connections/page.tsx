"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ConnectionWizard } from "@/components/dashboard/ConnectionWizard";
import { useConnections } from "@/hooks/useConnection";
import { usePlan } from "@/hooks/usePlan";
import { useTeamRole } from "@/hooks/useTeamRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Globe, Smartphone, MessageCircle, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock, CalendarClock } from "lucide-react";

const WHATSAPP_GREEN = "#25D366";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getSyncScheduleLabel } from "@/lib/plans";
import { GBP_ENABLED, GBP_STATUS_LABEL, GBP_COMING_SOON_MESSAGE } from "@/lib/feature-flags";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Connection } from "@/types/connection";
import { FirstSyncWelcomeCard } from "@/components/connections/first-sync-welcome-card";

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

// Sync cadence is ~every 2 hours. Flag as overdue past 150 minutes.
const SYNC_OVERDUE_MINUTES = 150;
function isSyncOverdue(iso: string | null | undefined): boolean {
 if (!iso) return false;
 const mins = (Date.now() - new Date(iso).getTime()) / 60000;
 return mins > SYNC_OVERDUE_MINUTES;
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
 if (data.newReviews > 0) parts.push(`${data.newReviews} new unanswered review${data.newReviews === 1 ? "" : "s"}`);
 if (data.autoPublished > 0) parts.push(`${data.autoPublished} auto-published`);
 if (data.autoDrafted > 0) parts.push(`${data.autoDrafted} AI draft${data.autoDrafted === 1 ? "" : "s"}`);
 const detail = parts.length > 0
 ? `${parts.join(", ")}.`
 : data.updatedReviews > 0
 ? `${data.updatedReviews} review(s) updated, no new rows.`
 : "No new unanswered reviews found.";
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
 <h1 className="font-sans text- font-semibold tracking-tight">Connections</h1>
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
 <h3 className="font-sans tracking-tight text-lg font-semibold mb-2">No connections yet</h3>
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
 const isGBPFrozen = conn.type === "google_business" && !GBP_ENABLED;

 return (
 <Card key={conn.id} className="transition-shadow hover:shadow-sm">
 <CardContent className="p-4">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <div
 className="rounded-lg p-2.5 bg-accent/10 dark:bg-accent/10"
 style={
 conn.type === "whatsapp"
 ? { backgroundColor: `${WHATSAPP_GREEN}22` }
 : undefined
 }
 >
 {conn.type === "play_store" ? (
 <Smartphone className="h-5 w-5 text-accent dark:text-accent" />
 ) : conn.type === "whatsapp" ? (
 <MessageCircle className="h-5 w-5" style={{ color: WHATSAPP_GREEN }} />
 ) : (
 <Globe className="h-5 w-5 text-accent dark:text-accent" />
 )}
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 {conn.type === "whatsapp" ? (
 <Link
 href={`/dashboard/settings/connections/${conn.id}`}
 className="text-sm font-semibold hover:text-accent hover:underline transition-colors"
 >
 {conn.name}
 </Link>
 ) : (
 <p className="text-sm font-semibold">{conn.name}</p>
 )}
 {conn.type === "play_store" && (
 <Badge
 variant="secondary"
 className={cn(
 "text-[10px]",
 conn.credentials
 ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
 : "bg-accent/10 text-accent dark:bg-accent/10 dark:text-accent"
 )}
 >
 {conn.credentials ? "Own Credentials" : "Invite Email"}
 </Badge>
 )}
 {isGBPFrozen && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
 >
 {GBP_STATUS_LABEL}
 </Badge>
 )}
 </div>
 <p className="text-xs text-muted-foreground capitalize">
 {conn.type === "play_store"
 ? "Google Play Store"
 : conn.type === "whatsapp"
 ? "WhatsApp Business"
 : "Google Business Profile"}
 {conn.external_id && (
 <span className="ml-1 font-mono">· {conn.external_id}</span>
 )}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {conn.type === "google_business" &&
 (conn.credentials as { status?: string } | null)?.status === "pending_verification" ? (
 <Badge
 variant="secondary"
 className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
 >
 <AlertCircle className="h-2.5 w-2.5 mr-1" />Pending Verification
 </Badge>
 ) : (
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
 )}
 {isGBPFrozen ? (
 <TooltipProvider delayDuration={150}>
 <Tooltip>
 <TooltipTrigger asChild>
 <span tabIndex={0}>
 <Button
 variant="outline"
 size="sm"
 className="h-8 gap-1.5 opacity-60 cursor-not-allowed"
 disabled
 >
 <RefreshCw className="h-3.5 w-3.5" />
 Sync Now
 </Button>
 </span>
 </TooltipTrigger>
 <TooltipContent side="top" className="max-w-xs">
 {GBP_COMING_SOON_MESSAGE}
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 ) : conn.type === "whatsapp" ? (
 <TooltipProvider delayDuration={150}>
 <Tooltip>
 <TooltipTrigger asChild>
 <span tabIndex={0}>
 <Button
 variant="outline"
 size="sm"
 className="h-8 gap-1.5 opacity-60 cursor-not-allowed"
 disabled
 >
 <RefreshCw className="h-3.5 w-3.5" />
 Realtime
 </Button>
 </span>
 </TooltipTrigger>
 <TooltipContent side="top" className="max-w-xs">
 WhatsApp messages arrive in realtime via webhook — no manual sync needed.
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 ) : (
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
 )}
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
 {conn.type === "whatsapp" ? (
 <span className="flex items-center gap-1">
 <Clock className="h-3 w-3" />
 <span className="font-medium text-foreground">Realtime via webhook</span>
 </span>
 ) : (
 <span className="flex items-center gap-1">
 <Clock className="h-3 w-3" />
 Last synced:{" "}
 <span className="font-medium text-foreground ml-0.5">
 {timeAgo(conn.last_synced_at)}
 </span>
 {isSyncOverdue(conn.last_synced_at) && (
 <TooltipProvider delayDuration={150}>
 <Tooltip>
 <TooltipTrigger asChild>
 <span
 className="ml-1.5 inline-block h-2 w-2 rounded-full bg-amber-500"
 aria-label="Sync overdue"
 />
 </TooltipTrigger>
 <TooltipContent side="top" className="max-w-xs">
 Sync is overdue — click Sync Now
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )}
 </span>
 )}
 <span>
 Reviews:{" "}
 <span className="font-medium text-foreground">{conn.review_count ?? 0}</span>
 </span>
 {conn.type !== "whatsapp" && (
 <span className="flex items-center gap-1 text-accent dark:text-accent">
 <CalendarClock className="h-3 w-3" />
 {syncLabel}
 </span>
 )}
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}

 {/* First-sync welcome cards for Play Store connections */}
 {!loading && connections
 .filter((c) => c.type === "play_store")
 .map((c) => (
 <FirstSyncWelcomeCard
 key={`welcome-${c.id}`}
 connectionId={c.id}
 initialSyncCompletedAt={c.initial_sync_completed_at}
 />
 ))}

 {/* About Play Store sync — always-available expandable */}
 {!loading && connections.some((c) => c.type === "play_store") && (
 <details className="rounded-lg border bg-card p-4 text-sm">
 <summary className="cursor-pointer font-medium">About Play Store sync</summary>
 <div className="mt-3 text-muted-foreground space-y-2">
 <p>
 Google&apos;s Play Developer API only exposes reviews from the last 7 days — this is
 a platform-wide limit Google applies to every tool. Older reviews aren&apos;t fetchable
 through any API.
 </p>
 <p>
 From the moment you connect, every review you receive is captured and kept in
 ReviewPilot permanently — you&apos;ll never lose another review.
 </p>
 </div>
 </details>
 )}

 <Card className="bg-secondary/30 border-dashed">
 <CardContent className="p-4">
 <p className="text-xs font-medium mb-1">How review syncing works</p>
 <ul className="text-xs text-muted-foreground space-y-1">
 <li>• Reviews sync automatically approximately every 2 hours</li>
 <li>• Use &ldquo;Sync Now&rdquo; anytime to fetch the latest immediately</li>
 <li>• Every synced review is saved to your inbox permanently — you&apos;ll never lose a review</li>
 <li>• If auto-reply is enabled, drafts are generated automatically</li>
 </ul>
 </CardContent>
 </Card>
 </div>
 );
}
