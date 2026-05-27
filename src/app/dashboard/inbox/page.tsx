"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { AIReplyGenerator } from "@/components/dashboard/AIReplyGenerator";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCheck, Inbox, Zap, Info, BookOpen, ChevronDown, Bot, Loader2, ArrowLeft, MessageCircle, X } from "lucide-react";
import { UpgradeGate } from "@/components/dashboard/UpgradeGate";
import { AppSwitcher } from "@/components/dashboard/AppSwitcher";
import { AppVersionFilter } from "@/components/inbox/AppVersionFilter";
import { toast } from "@/components/ui/use-toast";
import { useReviews } from "@/hooks/useReviews";
import { useConnections } from "@/hooks/useConnection";
import { useTeamRole } from "@/hooks/useTeamRole";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { GBP_ENABLED } from "@/lib/feature-flags";
import type { Review } from "@/types/review";

const MOCK_OVERRIDES_PREFIX = "reviewpilot_mock_overrides";
const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

type SourceFilter = "all" | "google_business" | "play_store" | "whatsapp";
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;
type StatusFilter = "all" | "pending" | "drafted" | "published";

function InboxPageInner() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [localReviews, setLocalReviews] = useState<Review[]>([]);
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [deepLinkApplied, setDeepLinkApplied] = useState(false);
 const [activeAppId, setActiveAppId] = useState<string | null>(null); // null = "All Apps"
 const [search, setSearch] = useState("");
 const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
 const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
 const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
 // App version filter — only mounted when source ∈ {all, play_store} because
 // only Play Store reviews carry version metadata. Mutually exclusive:
 // appVersionUnknown=true selects rows with NULL version; otherwise appVersion
 // (when non-null) filters by exact match. Threaded into useReviews so the
 // filter is server-side and works across more than the 200-row fetch cap.
 const [appVersion, setAppVersion] = useState<string | null>(null);
 const [appVersionUnknown, setAppVersionUnknown] = useState(false);
 const { reviews: rawReviews, isMock, updateReview, refetch } = useReviews({ appVersion, appVersionUnknown });
 const { connections } = useConnections();
 const { isReadOnly } = useTeamRole();
 // Theme filter is URL-driven (?theme=<theme> from ThemeMapCard links). The
 // chip above the filter groups lets the user clear it.
 const themeFilter = (searchParams?.get("theme") || "").trim().toLowerCase();
 // Deep link from the Critical Issues card on /dashboard/analytics
 // (?reviewId=<id>). Coexists with ?theme=, but selecting the review never
 // clears an active theme filter.
 const reviewIdFromUrl = (searchParams?.get("reviewId") || "").trim();
 // Brief ring animation after deep-link arrival so the user can locate
 // the row in a long list. Cleared after ~2.5s.
 const [highlightedId, setHighlightedId] = useState<string | null>(null);

 const clearThemeFilter = useCallback(() => {
 const params = new URLSearchParams(Array.from(searchParams?.entries() ?? []));
 params.delete("theme");
 // Per spec: clearing a filter chip also drops the reviewId deep-link
 // so the URL doesn't carry stale state into the post-filter view.
 params.delete("reviewId");
 const qs = params.toString();
 router.replace(`/dashboard/inbox${qs ? `?${qs}` : ""}`, { scroll: false });
 }, [router, searchParams]);

 const clearReviewIdFromUrl = useCallback(() => {
 const params = new URLSearchParams(Array.from(searchParams?.entries() ?? []));
 if (!params.has("reviewId")) return;
 params.delete("reviewId");
 const qs = params.toString();
 router.replace(`/dashboard/inbox${qs ? `?${qs}` : ""}`, { scroll: false });
 }, [router, searchParams]);
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
 const [aiReplyingAll, setAiReplyingAll] = useState(false);
 const [aiReplyProgress, setAiReplyProgress] = useState<{ current: number; total: number } | null>(null);

 // When switching apps, clear the selected review
 const activeConnections = connections.filter((c) => c.is_active);
 const showAppSwitcher = !isMock && activeConnections.length > 1;
 const hasWhatsAppConnection = activeConnections.some((c) => c.type === "whatsapp");

 // Keep local reviews in sync with hook (allow optimistic updates)
 useEffect(() => {
 setLocalReviews(rawReviews);
 }, [rawReviews]);

 // App version control is only relevant when source ∈ {all, play_store}. When
 // the user switches source to whatsapp or google_business, reset version
 // state so stale selections don't leak across mount cycles.
 useEffect(() => {
 if (sourceFilter !== "all" && sourceFilter !== "play_store") {
 if (appVersion !== null) setAppVersion(null);
 if (appVersionUnknown) setAppVersionUnknown(false);
 }
 }, [sourceFilter, appVersion, appVersionUnknown]);

 // Deep link: /dashboard/inbox?review=<id> from the dashboard recent-reviews row.
 // Applies once after reviews load — never overrides a manual selection later.
 useEffect(() => {
 if (deepLinkApplied) return;
 if (localReviews.length === 0) return;
 const id = searchParams?.get("review");
 if (id && localReviews.some((r) => r.id === id)) {
 setSelectedId(id);
 }
 setDeepLinkApplied(true);
 }, [searchParams, localReviews, deepLinkApplied]);

 // Deep link: /dashboard/inbox?reviewId=<id> from the Critical Issues card.
 // Re-runs when reviewIdFromUrl changes so a second click on a different
 // critical review from analytics works. Selecting the review never clears
 // an active ?theme= filter (per spec — they coexist).
 const reviewIdDeepLinkRef = React.useRef<string | null>(null);
 useEffect(() => {
 if (!reviewIdFromUrl) return;
 if (localReviews.length === 0) return;
 // Don't re-apply for the same id (prevents re-running after the user
 // selects something else and we cleaned up the URL on their behalf).
 if (reviewIdDeepLinkRef.current === reviewIdFromUrl) return;
 reviewIdDeepLinkRef.current = reviewIdFromUrl;

 const found = localReviews.find((r) => r.id === reviewIdFromUrl);
 if (found) {
 setSelectedId(found.id);
 setHighlightedId(found.id);
 // Clear the ring after a beat — short enough not to feel sticky.
 const t = setTimeout(() => setHighlightedId(null), 2500);
 return () => clearTimeout(t);
 }
 // Not in the loaded set (older than 5000-row cap, or different user).
 toast({
 title: "Review not found in current view",
 description:
 "It may be outside the loaded review window. Try clearing filters or syncing again.",
 });
 clearReviewIdFromUrl();
 }, [reviewIdFromUrl, localReviews, clearReviewIdFromUrl]);

 // Auto-reload when auto-reply finishes generating replies
 useEffect(() => {
 function handleAutoReplyComplete() { refetch(); }
 window.addEventListener("reviewpilot:auto-reply-complete", handleAutoReplyComplete);
 return () => window.removeEventListener("reviewpilot:auto-reply-complete", handleAutoReplyComplete);
 }, [refetch]);

 const reviews = useMemo(
 () => (GBP_ENABLED ? localReviews : localReviews.filter((r) => r.source !== "google_business")),
 [localReviews]
 );

 // Reviews scoped to the active app (if app switcher is visible)
 const appScopedReviews = useMemo(() => {
 if (!showAppSwitcher || activeAppId === null) return reviews;
 return reviews.filter((r) => r.connection_id === activeAppId);
 }, [reviews, activeAppId, showAppSwitcher]);

 const filteredReviews = useMemo(() => {
 return appScopedReviews.filter((r) => {
 if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
 if (ratingFilter !== "all" && r.rating !== ratingFilter) return false;
 if (statusFilter !== "all" && r.reply_status !== statusFilter) return false;
 if (themeFilter) {
 const t = (r.ai_theme || "").trim().toLowerCase();
 if (t !== themeFilter) return false;
 }
 if (search) {
 const q = search.toLowerCase();
 return (
 r.author_name.toLowerCase().includes(q) ||
 r.review_text.toLowerCase().includes(q)
 );
 }
 return true;
 });
 }, [appScopedReviews, sourceFilter, ratingFilter, statusFilter, search, themeFilter]);

 const selectedReview = filteredReviews.find((r) => r.id === selectedId);
 const pendingCount = appScopedReviews.filter((r) => r.reply_status === "pending").length;
 const totalCount = filteredReviews.length;

 // Keyboard navigation: J/K to move, R to generate
 const handleKeyNav = useCallback(
 (e: KeyboardEvent) => {
 if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
 const idx = filteredReviews.findIndex((r) => r.id === selectedId);
 if (e.key === "j" || e.key === "J") {
 e.preventDefault();
 const next = Math.min(idx + 1, filteredReviews.length - 1);
 if (filteredReviews[next]) setSelectedId(filteredReviews[next].id);
 }
 if (e.key === "k" || e.key === "K") {
 e.preventDefault();
 const prev = Math.max(idx - 1, 0);
 if (filteredReviews[prev]) setSelectedId(filteredReviews[prev].id);
 }
 },
 [filteredReviews, selectedId]
 );

 useEffect(() => {
 document.addEventListener("keydown", handleKeyNav);
 return () => document.removeEventListener("keydown", handleKeyNav);
 }, [handleKeyNav]);

 function handlePublish(reviewId: string, replyText: string) {
 const updates = {
 reply_text: replyText,
 reply_status: "published" as const,
 is_read: true,
 reply_published_at: new Date().toISOString(),
 };
 setLocalReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, ...updates } : r)));
 if (isMock) {
 updateReview(reviewId, updates);
 }
 }

 function handleDraft(reviewId: string, replyText: string) {
 const updates = { reply_text: replyText, reply_status: "drafted" as const, is_read: true };
 setLocalReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, ...updates } : r)));
 if (isMock) {
 updateReview(reviewId, updates);
 }
 }

 function handleBulkPublish() {
 toast({ title: "Generating replies...", description: `Processing ${selectedIds.size} reviews with AI.` });
 setTimeout(() => {
 const updates = { reply_status: "published" as const, reply_text: "Thank you for your feedback!", is_read: true };
 setLocalReviews((prev) =>
 prev.map((r) => selectedIds.has(r.id) ? { ...r, ...updates } : r)
 );
 selectedIds.forEach((id) => updateReview(id, updates));
 toast({ title: "Bulk reply complete", description: `${selectedIds.size} replies published successfully.` });
 setSelectedIds(new Set());
 }, 2000);
 }

 function selectAll() {
 if (selectedIds.size === filteredReviews.length) {
 setSelectedIds(new Set());
 } else {
 setSelectedIds(new Set(filteredReviews.map((r) => r.id)));
 }
 }

 async function handleAiReplyAll() {
 if (aiReplyingAll) return;
 setAiReplyingAll(true);

 if (!isMock) {
 // Real mode: use the currently selected app, or fall back to the first active connection
 try {
 toast({ title: "Applying AI replies…", description: "Processing pending reviews. This may take a moment." });
 // If an app is selected in the switcher, use it directly; otherwise find first active
 let connId = activeAppId;
 if (!connId) {
 const supabase = createClient();
 const { data: conns } = await supabase.from("connections").select("id").eq("is_active", true).limit(1);
 connId = conns?.[0]?.id ?? null;
 }
 if (!connId) {
 toast({ title: "No connection found", description: "Connect Play Store, Google Business Profile, or WhatsApp first in Settings → Connections.", variant: "destructive" });
 setAiReplyingAll(false);
 return;
 }
 const res = await fetch("/api/reviews/fetch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId: connId }) });
 const data = await res.json() as { autoDrafted?: number; autoPublished?: number };
 const total = (data.autoDrafted ?? 0) + (data.autoPublished ?? 0);
 toast({ title: total > 0 ? "AI replies applied!" : "Nothing to process", description: total > 0 ? `${data.autoPublished ?? 0} published · ${data.autoDrafted ?? 0} drafted.` : "No pending reviews found." });
 window.dispatchEvent(new CustomEvent("reviewpilot:auto-reply-complete", { detail: { published: data.autoPublished ?? 0, drafted: data.autoDrafted ?? 0 } }));
 } catch (e) {
 console.error("[AI reply all]", e);
 } finally {
 setAiReplyingAll(false);
 setAiReplyProgress(null);
 }
 return;
 }

 // Mock mode: load app context config and process pending reviews
 try {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 const userId = user?.id ?? "anon";
 const mockKey = `${MOCK_OVERRIDES_PREFIX}_${userId}`;

 // Load app context to get tone + reply mode
 const { data: connections } = await supabase.from("connections").select("id").eq("is_active", true).limit(1);
 const connId = connections?.[0]?.id ?? null;
 let appContextConfig = { tone: "friendly", replyMode: "semi" as "manual" | "semi" | "full", draftLowSafety: true, ratingRange: [1, 5] };
 if (connId) {
 const { data: ctx } = await supabase.from("app_contexts").select("tone,auto_reply_mode,auto_reply_draft_low_ratings,auto_reply_min_rating,auto_reply_max_rating").eq("connection_id", connId).single();
 if (ctx) {
 appContextConfig = {
 tone: ctx.tone ?? "friendly",
 replyMode: ctx.auto_reply_mode === "auto_publish" ? "full" : ctx.auto_reply_mode === "draft_for_review" ? "semi" : "semi",
 draftLowSafety: ctx.auto_reply_draft_low_ratings !== false,
 ratingRange: [ctx.auto_reply_min_rating ?? 1, ctx.auto_reply_max_rating ?? 5],
 };
 }
 }

 // Load overrides
 let overrides: Record<string, Record<string, unknown>> = {};
 try { const s = localStorage.getItem(mockKey); if (s) overrides = JSON.parse(s); } catch { /* ignore */ }

 // Build pending list from mock data
 const [{ mockPlayReviews }, { mockGBPReviews }] = await Promise.all([
 import("@/lib/mock/mock-reviews"),
 import("@/lib/mock/mock-gbp-reviews"),
 ]);
 const allReviews = [
 ...mockPlayReviews.map((r) => ({ id: r.id, source: r.source as "play_store" | "google_business", author_name: r.author_name, rating: r.rating, review_text: r.review_text, base_status: r.reply_status as string })),
 ...(GBP_ENABLED
 ? mockGBPReviews.map((gbp, idx) => ({ id: `gbp-mock-${idx}`, source: "google_business" as const, author_name: gbp.reviewer.displayName, rating: STAR_MAP[gbp.starRating] ?? 3, review_text: gbp.comment, base_status: gbp.reviewReply ? "published" : "pending" }))
 : []),
 ];
 const [minR, maxR] = appContextConfig.ratingRange;
 const pending = allReviews.filter((r) => {
 const status = (overrides[r.id] as { reply_status?: string } | undefined)?.reply_status ?? r.base_status;
 return status === "pending" && r.rating != null && r.rating >= minR && r.rating <= maxR;
 });

 if (pending.length === 0) {
 toast({ title: "Nothing to process", description: "No pending reviews match your AI configuration filter." });
 setAiReplyingAll(false);
 return;
 }

 setAiReplyProgress({ current: 0, total: pending.length });
 let drafted = 0, published = 0, limitHit = false;
 const updatedOverrides = { ...overrides };

 for (let i = 0; i < pending.length; i++) {
 setAiReplyProgress({ current: i, total: pending.length });
 const review = pending[i];
 try {
 const res = await fetch("/api/ai/generate-reply", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ review: { author_name: review.author_name, rating: review.rating, review_text: review.review_text }, tone: appContextConfig.tone, source: review.source }),
 });
 if (res.status === 429) { limitHit = true; window.dispatchEvent(new CustomEvent("reviewpilot:usage-updated")); break; }
 if (!res.ok) continue;
 const data = await res.json() as { reply?: string };
 if (!data.reply) continue;

 const safetyDraft = appContextConfig.draftLowSafety && review.rating != null && review.rating <= 2 && appContextConfig.replyMode === "full";
 const newStatus = (appContextConfig.replyMode === "semi" || safetyDraft) ? "drafted" : "published";
 updatedOverrides[review.id] = { ...(updatedOverrides[review.id] ?? {}), reply_text: data.reply, reply_status: newStatus, is_auto_replied: true, ...(newStatus === "published" ? { reply_published_at: new Date().toISOString() } : {}) };
 if (newStatus === "drafted") drafted++; else published++;
 localStorage.setItem(mockKey, JSON.stringify(updatedOverrides));
 window.dispatchEvent(new CustomEvent("reviewpilot:usage-updated"));
 } catch (e) { console.error("[AI reply all] error:", e); }
 }

 setAiReplyProgress({ current: pending.length, total: pending.length });
 const processed = drafted + published;
 if (limitHit && processed === 0) {
 toast({ title: "AI reply limit reached", description: "You've used all your AI replies for this period. Upgrade or wait for the reset.", variant: "destructive" });
 } else if (limitHit) {
 toast({ title: `Replied to ${processed} review${processed !== 1 ? "s" : ""} — limit reached`, description: `${published} published · ${drafted} drafted. Upgrade or wait for the reset to process the rest.` });
 } else {
 toast({ title: "AI replies complete!", description: `${published} published · ${drafted} drafted. Refresh to see updates.` });
 }
 window.dispatchEvent(new CustomEvent("reviewpilot:auto-reply-complete", { detail: { published, drafted } }));
 } catch (e) {
 console.error("[AI reply all] fatal:", e);
 } finally {
 setAiReplyingAll(false);
 setTimeout(() => setAiReplyProgress(null), 1500);
 }
 }

 return (
 <PageTransition>
 <div className="flex flex-col h-[calc(100vh-7rem)]">
 {/* Sample data banner */}
 {isMock && (
 <div className="flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 mb-3 shrink-0">
 <Info className="h-4 w-4 text-amber-500 shrink-0" />
 <p className="text-xs text-amber-800 dark:text-amber-400">
 Showing <strong>sample data</strong> (40 mock reviews) —{" "}
 <a
 href="/dashboard/settings/connections"
 className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-300"
 >
 connect your Google Business Profile or Play Store
 </a>{" "}
 to see real reviews.
 </p>
 </div>
 )}

 {/* Getting started guide — only shown when viewing sample data */}
 {isMock && <div className="shrink-0"><GettingStartedGuide /></div>}

 <div className="flex flex-col gap-3 mb-4 shrink-0 md:flex-row md:items-center md:justify-between">
 <div className="flex items-center flex-wrap gap-2 md:gap-3 min-w-0">
 <h1 className="font-sans text-2xl md:text-3xl font-semibold tracking-tight">Review Inbox</h1>
 <Badge variant="secondary" className="font-semibold">
 {totalCount} reviews
 </Badge>
 {pendingCount > 0 && (
 <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 font-semibold">
 {pendingCount} pending
 </Badge>
 )}
 </div>
 <div className="flex w-full gap-2 md:w-auto">
 {pendingCount > 0 && (
 <Button
 size="sm"
 onClick={handleAiReplyAll}
 disabled={aiReplyingAll}
 className="bg-accent hover:bg-accent/90 text-white h-12 md:h-9 px-4 md:px-3 flex-1 md:flex-initial"
 >
 {aiReplyingAll ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 {aiReplyProgress
 ? `Replying ${aiReplyProgress.current}/${aiReplyProgress.total}…`
 : "Processing…"}
 </>
 ) : (
 <>
 <Bot className="mr-2 h-4 w-4" />
 Let AI Reply All ({pendingCount})
 </>
 )}
 </Button>
 )}
 <Button variant="outline" size="sm" className="h-12 md:h-9 flex-1 md:flex-initial" onClick={() => {
 setLocalReviews((prev) => prev.map((r) => ({ ...r, is_read: true })));
 toast({ title: "All marked as read" });
 }}>
 <CheckCheck className="mr-2 h-4 w-4" />
 Mark All Read
 </Button>
 </div>
 </div>

 <div className="flex flex-1 min-h-0 rounded-xl border bg-card overflow-hidden shadow-sm">
 {/* Left panel — review list. On mobile: hidden when a review is open. */}
 <div className={cn(
 "flex flex-col border-r shrink-0 w-full min-[1200px]:w-80 min-[1400px]:w-96",
 selectedId ? "hidden min-[1200px]:flex" : "flex"
 )}>
 {/* App switcher — only visible when 2+ active connections */}
 {showAppSwitcher && (
 <AppSwitcher
 connections={activeConnections}
 activeId={activeAppId}
 onChange={(id) => { setActiveAppId(id); setSelectedId(null); }}
 className="border-b"
 />
 )}

 {/* Search and filters */}
 <div className="p-3 border-b space-y-2.5">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search reviews..."
 className="pl-9 h-9"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>

 {/* Applied filter chips — currently only theme (from ThemeMapCard
 deep links). Sits above the filter groups so it's visually distinct
 from the always-present source/status/rating filters. */}
 {themeFilter && (
 <div className="flex flex-wrap items-center gap-1.5">
 <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 whitespace-nowrap w-14 shrink-0">
 Applied
 </span>
 <button
 onClick={clearThemeFilter}
 className={cn(
 "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
 "bg-accent/15 text-accent ring-1 ring-inset ring-accent/40",
 "hover:bg-accent/25 transition-colors"
 )}
 aria-label={`Clear theme filter: ${themeFilter}`}
 >
 <span className="capitalize">Theme: {themeFilter}</span>
 <X className="h-3 w-3" aria-hidden />
 </button>
 </div>
 )}

 {/* Filter groups — wrap to additional lines so every chip stays visible. */}
 <div className="space-y-2">
 <FilterGroup label="Source">
 <FilterChip label="All" active={sourceFilter === "all"} onClick={() => setSourceFilter("all")} />
 {GBP_ENABLED && (
 <FilterChip label="Google" active={sourceFilter === "google_business"} onClick={() => setSourceFilter("google_business")} />
 )}
 <FilterChip label="Play Store" active={sourceFilter === "play_store"} onClick={() => setSourceFilter("play_store")} />
 {hasWhatsAppConnection && (
 <FilterChip label="WhatsApp" active={sourceFilter === "whatsapp"} onClick={() => setSourceFilter("whatsapp")} />
 )}
 </FilterGroup>

 <FilterGroup label="Status">
 <FilterChip label="All" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
 <FilterChip label="Pending" active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} />
 <FilterChip label="Drafted" active={statusFilter === "drafted"} onClick={() => setStatusFilter("drafted")} />
 <FilterChip label="Published" active={statusFilter === "published"} onClick={() => setStatusFilter("published")} />
 </FilterGroup>

 {sourceFilter !== "whatsapp" && (
 <FilterGroup label="Rating">
 <FilterChip label="All" active={ratingFilter === "all"} onClick={() => setRatingFilter("all")} />
 {[1, 2, 3, 4, 5].map((r) => (
 <FilterChip key={r} label={`${r}★`} active={ratingFilter === r} onClick={() => setRatingFilter(r as RatingFilter)} />
 ))}
 </FilterGroup>
 )}

 {(sourceFilter === "all" || sourceFilter === "play_store") && (
 <FilterGroup label="Version">
 <AppVersionFilter
 connectionId={activeAppId}
 appVersion={appVersion}
 appVersionUnknown={appVersionUnknown}
 onChange={({ appVersion: v, appVersionUnknown: u }) => {
 setAppVersion(v);
 setAppVersionUnknown(u);
 }}
 isMock={isMock}
 mockRows={localReviews}
 />
 </FilterGroup>
 )}
 </div>

 {/* Batch actions */}
 <UpgradeGate feature="inbox_bulk_reply" fallback={
 <div className="flex items-center justify-between pt-1">
 <span className="text-[11px] text-muted-foreground opacity-50">Select all (upgrade to unlock)</span>
 <span className="text-[10px] text-muted-foreground hidden sm:inline">
 <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">J</kbd>/<kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">K</kbd> to navigate
 </span>
 </div>
 }>
 <div className="flex items-center justify-between pt-1">
 <button onClick={selectAll} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
 {selectedIds.size === filteredReviews.length && filteredReviews.length > 0 ? "Deselect all" : "Select all"}
 </button>
 <span className="text-[10px] text-muted-foreground hidden sm:inline">
 <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">J</kbd>/<kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">K</kbd> to navigate
 </span>
 </div>
 </UpgradeGate>
 </div>

 {/* Review list */}
 <div className="flex-1 overflow-y-auto min-h-0">
 {filteredReviews.length === 0 ? (
 sourceFilter === "whatsapp" ? (
 <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
 <MessageCircle className="h-8 w-8 mb-2 opacity-40" style={{ color: "#25D366" }} />
 <p className="text-sm font-medium">No WhatsApp messages yet</p>
 <p className="text-xs mt-1 max-w-xs">
 Send a WhatsApp message to your connected business number. It will appear here within a few seconds.
 </p>
 </div>
 ) : (appVersion || appVersionUnknown) ? (
 <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
 <Search className="h-8 w-8 mb-2 opacity-40" />
 <p className="text-sm font-medium">
 {appVersionUnknown
 ? "No reviews are missing version info on this connection."
 : `No reviews on version v${appVersion} yet.`}
 </p>
 <p className="text-xs mt-1 mb-3 max-w-xs">
 {appVersionUnknown
 ? "Every review on this connection has version metadata from Google. Clear the filter to see them all."
 : "Try a different version or clear the filter."}
 </p>
 <button
 onClick={() => { setAppVersion(null); setAppVersionUnknown(false); }}
 className="text-[11px] font-medium text-accent hover:underline underline-offset-2"
 >
 Clear filter
 </button>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
 <Search className="h-8 w-8 mb-2 opacity-40" />
 <p className="text-sm font-medium">No reviews match your filters</p>
 <p className="text-xs mt-1">Try adjusting your search or filters</p>
 </div>
 )
 ) : (
 filteredReviews.map((review) => (
 <div
 key={review.id}
 className={cn(
 "relative transition-shadow",
 highlightedId === review.id &&
 "ring-2 ring-accent rounded-md shadow-[0_0_0_4px_rgba(99,102,241,0.15)]"
 )}
 >
 <ReviewCard
 review={review}
 selected={selectedId === review.id}
 onClick={() => {
 setSelectedId(review.id);
 // Manual selection of a different row → drop the deep-link
 // param so the URL doesn't lie about what's open.
 if (reviewIdFromUrl && reviewIdFromUrl !== review.id) {
 clearReviewIdFromUrl();
 }
 }}
 />
 </div>
 ))
 )}
 </div>

 {/* Keyboard hints — anchored at the bottom of the list pane. Hidden on small
 viewports (no physical keyboard expected). */}
 <div className="hidden md:flex shrink-0 items-center justify-center gap-3 border-t bg-muted/20 px-3 py-1.5 text-[10px] text-muted-foreground/80">
 <span className="inline-flex items-center gap-1">
 <kbd className="rounded bg-card border border-border/60 px-1 py-0.5 font-mono text-[9px]">J</kbd>
 <kbd className="rounded bg-card border border-border/60 px-1 py-0.5 font-mono text-[9px]">K</kbd>
 navigate
 </span>
 <span className="text-muted-foreground/30">·</span>
 <span className="inline-flex items-center gap-1">
 <kbd className="rounded bg-card border border-border/60 px-1 py-0.5 font-mono text-[9px]">R</kbd>
 reply
 </span>
 <span className="text-muted-foreground/30">·</span>
 <span className="inline-flex items-center gap-1">
 <kbd className="rounded bg-card border border-border/60 px-1 py-0.5 font-mono text-[9px]">⌘</kbd>
 <kbd className="rounded bg-card border border-border/60 px-1 py-0.5 font-mono text-[9px]">↵</kbd>
 publish
 </span>
 </div>
 </div>

 {/* Right panel — review detail + AI reply.
 Mobile: full-screen when a review is selected, hidden otherwise.
 Desktop: always visible alongside the list. */}
 <div className={cn(
 "flex-1 flex-col min-w-0 overflow-hidden",
 selectedId ? "flex" : "hidden min-[1200px]:flex"
 )}>
 {/* Mobile back button */}
 {selectedReview && (
 <div className="min-[1200px]:hidden flex items-center gap-2 px-3 py-2.5 border-b bg-card shrink-0">
 <button
 onClick={() => setSelectedId(null)}
 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
 >
 <ArrowLeft className="h-4 w-4" />
 Back to reviews
 </button>
 </div>
 )}
 {selectedReview ? (
 isReadOnly ? (
 <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
 <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
 <Bot className="h-6 w-6 text-muted-foreground" />
 </div>
 <p className="text-sm font-medium">View-only access</p>
 <p className="text-xs text-muted-foreground max-w-xs">
 Your role doesn&apos;t allow replying to reviews. Ask your workspace owner to upgrade your permissions.
 </p>
 </div>
 ) : (
 <AIReplyGenerator
 key={selectedReview.id}
 review={selectedReview}
 isMock={isMock}
 onPublish={handlePublish}
 onDraft={handleDraft}
 onRefetch={refetch}
 />
 )
 ) : (
 <EmptyState
 icon={<Inbox className="h-10 w-10 text-muted-foreground/40" />}
 title="Select a review to reply"
 description="Choose a review from the list to generate an AI-powered reply. Use J/K keys to navigate."
 />
 )}
 </div>
 </div>

 {/* Floating bulk action bar */}
 <UpgradeGate feature="inbox_bulk_reply" fallback={null}>
 {selectedIds.size > 0 && (
 <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
 <div className="flex items-center gap-3 bg-card border shadow-xl rounded-xl px-5 py-3">
 <span className="text-sm font-medium">{selectedIds.size} reviews selected</span>
 <Button size="sm" onClick={handleBulkPublish}>
 <Zap className="mr-2 h-4 w-4" />
 Generate & Publish All
 </Button>
 <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
 Cancel
 </Button>
 </div>
 </div>
 )}
 </UpgradeGate>
 </div>
 </PageTransition>
 );
}

export default function InboxPage() {
 return (
 <Suspense fallback={<div className="h-32" />}>
 <InboxPageInner />
 </Suspense>
 );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
 return (
 <button
 onClick={onClick}
 className={cn(
 "rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors duration-150 ring-1 ring-inset",
 active
 ? "bg-accent/15 text-accent ring-accent/40"
 : "bg-transparent text-muted-foreground ring-border/60 hover:text-foreground hover:bg-muted/40 hover:ring-border"
 )}
 >
 {label}
 </button>
 );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
 return (
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 whitespace-nowrap w-14 shrink-0">
 {label}
 </span>
 <div className="flex flex-wrap items-center gap-1">{children}</div>
 </div>
 );
}

const GUIDE_STEPS = [
 { title: "You're viewing sample reviews", body: "These 40 reviews are for demonstration purposes. They look and work just like real reviews so you can explore every feature before going live." },
 { title: "Try generating an AI reply", body: "Click any review on the left, then hit \"Generate AI Reply\". Our AI will write a professional reply tailored to that review in seconds." },
 { title: "Edit and post the reply", body: "Once the reply is generated, you can edit it freely. Click \"Post Reply\" to publish it, or \"Save Draft\" to review it later." },
 { title: "Use \"Let AI Reply All\" for bulk replies", body: "The teal button at the top replies to all pending reviews at once using your AI settings. Perfect for catching up on a backlog." },
 { title: "Connect your real accounts to go live", body: "Head to Settings → Connections to link Google Play Store, Google Business Profile, or WhatsApp Business. Your real customer reviews and messages will appear here and replies will be sent directly through each platform." },
];

function GettingStartedGuide() {
 const [open, setOpen] = useState(false);

 return (
 <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/10 mb-3 overflow-hidden">
 <button
 onClick={() => setOpen((v) => !v)}
 className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
 >
 <span className="text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-2">
 <BookOpen className="h-4 w-4 shrink-0" />
 How to get started with ReviewPilot →
 </span>
 <ChevronDown
 className={`h-4 w-4 text-amber-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
 />
 </button>

 {open && (
 <ol className="px-4 pb-5 pt-1 space-y-3 list-none m-0 p-0">
 {GUIDE_STEPS.map((step, i) => (
 <li key={i} className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
 <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">
 {i + 1}
 </span>
 <span>
 <strong className="text-foreground">{step.title}.</strong>{" "}{step.body}
 </span>
 </li>
 ))}
 </ol>
 )}
 </div>
 );
}
