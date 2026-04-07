"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { AIReplyGenerator } from "@/components/dashboard/AIReplyGenerator";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCheck, Inbox, Zap, Info, BookOpen, ChevronDown, Copy, Check, Bot, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useReviews } from "@/hooks/useReviews";
import { createClient } from "@/lib/supabase/client";
import type { Review } from "@/types/review";

const MOCK_OVERRIDES_PREFIX = "reviewpilot_mock_overrides";
const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

type SourceFilter = "all" | "google_business" | "play_store";
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;
type StatusFilter = "all" | "pending" | "drafted" | "published";

export default function InboxPage() {
  const { reviews: rawReviews, isMock, updateReview, refetch } = useReviews();
  const [localReviews, setLocalReviews] = useState<Review[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [aiReplyingAll, setAiReplyingAll] = useState(false);
  const [aiReplyProgress, setAiReplyProgress] = useState<{ current: number; total: number } | null>(null);

  // Keep local reviews in sync with hook (allow optimistic updates)
  useEffect(() => {
    setLocalReviews(rawReviews);
  }, [rawReviews]);

  // Auto-reload when auto-reply finishes generating replies
  useEffect(() => {
    function handleAutoReplyComplete() { refetch(); }
    window.addEventListener("reviewpilot:auto-reply-complete", handleAutoReplyComplete);
    return () => window.removeEventListener("reviewpilot:auto-reply-complete", handleAutoReplyComplete);
  }, [refetch]);

  const reviews = localReviews;

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      if (ratingFilter !== "all" && r.rating !== ratingFilter) return false;
      if (statusFilter !== "all" && r.reply_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.author_name.toLowerCase().includes(q) ||
          r.review_text.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, sourceFilter, ratingFilter, statusFilter, search]);

  const selectedReview = filteredReviews.find((r) => r.id === selectedId);
  const pendingCount = reviews.filter((r) => r.reply_status === "pending").length;
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
    const updates = { reply_text: replyText, reply_status: "published" as const, is_read: true };
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
      // Real mode: delegate to the fetch/sync route which processes pending reviews
      try {
        toast({ title: "Applying AI replies…", description: "Processing pending reviews. This may take a moment." });
        const supabase = createClient();
        const { data: connections } = await supabase.from("connections").select("id").eq("is_active", true).limit(1);
        const connId = connections?.[0]?.id;
        if (!connId) {
          toast({ title: "No connection found", description: "Connect a review source first in Settings → Connections.", variant: "destructive" });
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
        ...mockGBPReviews.map((gbp, idx) => ({ id: `gbp-mock-${idx}`, source: "google_business" as const, author_name: gbp.reviewer.displayName, rating: STAR_MAP[gbp.starRating] ?? 3, review_text: gbp.comment, base_status: gbp.reviewReply ? "published" : "pending" })),
      ];
      const [minR, maxR] = appContextConfig.ratingRange;
      const pending = allReviews.filter((r) => {
        const status = (overrides[r.id] as { reply_status?: string } | undefined)?.reply_status ?? r.base_status;
        return status === "pending" && r.rating >= minR && r.rating <= maxR;
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

          const safetyDraft = appContextConfig.draftLowSafety && review.rating <= 2 && appContextConfig.replyMode === "full";
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
      <div className="h-[calc(100vh-7rem)]">
        {/* Sample data banner */}
        {isMock && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 mb-3">
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

        {/* AI workflow test guide — collapsible, amber accent */}
        <TestGuide />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">Review Inbox</h1>
            <Badge variant="secondary" className="font-semibold">
              {totalCount} reviews
            </Badge>
            {pendingCount > 0 && (
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 font-semibold">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={handleAiReplyAll}
                disabled={aiReplyingAll}
                className="bg-teal-600 hover:bg-teal-700 text-white"
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
            <Button variant="outline" size="sm" onClick={() => {
              setLocalReviews((prev) => prev.map((r) => ({ ...r, is_read: true })));
              toast({ title: "All marked as read" });
            }}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100%-5.5rem)] rounded-xl border bg-card overflow-hidden shadow-sm">
          {/* Left panel — review list */}
          <div className="w-full md:w-96 flex flex-col border-r shrink-0">
            {/* Search and filters */}
            <div className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                <FilterChip label="All Sources" active={sourceFilter === "all"} onClick={() => setSourceFilter("all")} />
                <FilterChip label="Google" active={sourceFilter === "google_business"} onClick={() => setSourceFilter("google_business")} />
                <FilterChip label="Play Store" active={sourceFilter === "play_store"} onClick={() => setSourceFilter("play_store")} />
              </div>
              <div className="flex gap-1 flex-wrap">
                <FilterChip label="All" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                <FilterChip label="Pending" active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} />
                <FilterChip label="Drafted" active={statusFilter === "drafted"} onClick={() => setStatusFilter("drafted")} />
                <FilterChip label="Published" active={statusFilter === "published"} onClick={() => setStatusFilter("published")} />
              </div>
              <div className="flex gap-1 flex-wrap">
                <FilterChip label="All Stars" active={ratingFilter === "all"} onClick={() => setRatingFilter("all")} />
                {[1, 2, 3, 4, 5].map((r) => (
                  <FilterChip key={r} label={`${r}★`} active={ratingFilter === r} onClick={() => setRatingFilter(r as RatingFilter)} />
                ))}
              </div>

              {/* Batch actions */}
              <div className="flex items-center justify-between pt-1">
                <button onClick={selectAll} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  {selectedIds.size === filteredReviews.length && filteredReviews.length > 0 ? "Deselect all" : "Select all"}
                </button>
                <span className="text-[10px] text-muted-foreground">
                  <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">J</kbd>/<kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">K</kbd> to navigate
                </span>
              </div>
            </div>

            {/* Review list */}
            <div className="flex-1 overflow-y-auto">
              {filteredReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                  <Search className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No reviews match your filters</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    selected={selectedId === review.id}
                    onClick={() => setSelectedId(review.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right panel — review detail + AI reply */}
          <div className="hidden md:flex flex-1 flex-col">
            {selectedReview ? (
              <AIReplyGenerator
                key={selectedReview.id}
                review={selectedReview}
                isMock={isMock}
                onPublish={handlePublish}
                onDraft={handleDraft}
                onRefetch={refetch}
              />
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
      </div>
    </PageTransition>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
        active
          ? "bg-teal-500 text-white shadow-sm"
          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      }`}
    >
      {label}
    </button>
  );
}

const ENV_SNIPPET =
  "NEXT_PUBLIC_USE_MOCK=true\nGROQ_API_KEY=your_groq_key\nGROQ_MODEL=openai/gpt-oss-120b";

const TEST_STEPS = [
  <>Make sure your <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 font-mono text-[11px]">.env.local</code> contains the two keys shown above.</>,
  <>Start the dev server: <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 font-mono text-[11px]">npm run dev</code></>,
  <>Go to <strong>/dashboard/inbox</strong> in your browser.</>,
  <>You will see <strong>40 mock reviews</strong> (25 Play Store + 15 GBP). Pick any 1★ review to test the full recovery flow.</>,
  <>Click <strong>&quot;Generate AI Reply&quot;</strong> — this calls Groq (real API call when <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 font-mono text-[11px]">GROQ_API_KEY</code> is set) with the mock review text as input. Wait 2–5 seconds.</>,
  <>The generated reply appears in an editable textarea. Check the character count stays under <strong>350</strong>.</>,
  <>Edit the reply if you want, then click <strong>&quot;Post Reply&quot;</strong>. In mock mode the reply is logged to the browser console and terminal — it does NOT actually post to Google.</>,
  <>The card shows a <strong>Replied ✓</strong> badge. Filter by &quot;Published&quot; to confirm it moves to the correct tab.</>,
  <>Test the <strong>&quot;Regenerate&quot;</strong> button — it calls the AI again and replaces the previous draft.</>,
  <>To test the live posting path later, set <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 font-mono text-[11px]">NEXT_PUBLIC_USE_MOCK=false</code> and add real Google credentials. The same UI flow will post the reply to the actual listing.</>,
];

function TestGuide() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyEnv() {
    navigator.clipboard.writeText(ENV_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/10 mb-3 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
      >
        <span className="text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-2">
          <BookOpen className="h-4 w-4 shrink-0" />
          How to test the AI reply workflow →
        </span>
        <ChevronDown
          className={`h-4 w-4 text-amber-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4">
          {/* .env.local snippet */}
          <div>
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mb-1.5">
              Step 1 — Add to <code className="font-mono">.env.local</code>:
            </p>
            <div className="relative rounded-md bg-gray-900 text-green-400 p-3 font-mono text-[11px] leading-relaxed">
              <pre className="whitespace-pre-wrap pr-8">{ENV_SNIPPET}</pre>
              <button
                onClick={copyEnv}
                title="Copy to clipboard"
                className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Steps 2–10 */}
          <ol className="space-y-2.5 list-none m-0 p-0">
            {TEST_STEPS.slice(1).map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
                <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">
                  {i + 2}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
