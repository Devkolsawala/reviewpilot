"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
 Star, Bot, RefreshCw, Send, Globe, Smartphone, MessageCircle, Copy, Check,
 Save, Trash2, CheckCircle2, Loader2, AlertTriangle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import type { Review } from "@/types/review";
import { postPlayReply, postGBPReply } from "@/lib/adapters/reviews-adapter";
import { UsageLimitModal } from "./UsageLimitModal";

interface AIReplyGeneratorProps {
 review: Review;
 /** When false, publish/draft go through /api/reviews/reply and persist to Supabase. */
 isMock?: boolean;
 onPublish?: (reviewId: string, replyText: string) => void;
 onDraft?: (reviewId: string, replyText: string) => void;
 onRefetch?: () => void | Promise<void>;
}

type ReplyState = "idle" | "generating" | "review" | "posting" | "done";

const TONES = [
 { label: "Friendly", value: "friendly" },
 { label: "Professional", value: "professional" },
 { label: "Apologetic", value: "apologetic" },
 { label: "Casual", value: "casual" },
] as const;

function starColor(rating: number) {
 if (rating <= 1) return "fill-red-500 text-red-500";
 if (rating === 2) return "fill-orange-500 text-orange-500";
 if (rating === 3) return "fill-amber-500 text-amber-500";
 if (rating === 4) return "fill-lime-500 text-lime-500";
 return "fill-emerald-500 text-emerald-500";
}

const AVATAR_COLORS: Record<string, string> = {
 A: "from-rose-400 to-rose-500", B: "from-orange-400 to-orange-500",
 C: "from-amber-400 to-amber-500", D: "from-emerald-400 to-emerald-500",
 E: "from-[#6366f1] via-[#8b5cf6] to-[#d946ef]", F: "from-cyan-400 to-cyan-500",
 G: "from-sky-400 to-sky-500", H: "from-blue-400 to-blue-500",
 I: "from-indigo-400 to-indigo-500", J: "from-violet-400 to-violet-500",
 K: "from-purple-400 to-purple-500", L: "from-fuchsia-400 to-fuchsia-500",
 M: "from-pink-400 to-pink-500", N: "from-rose-400 to-rose-500",
 P: "from-[#6366f1] via-[#8b5cf6] to-[#d946ef]", R: "from-indigo-400 to-indigo-500",
 S: "from-emerald-400 to-emerald-500", V: "from-sky-400 to-sky-500",
};

function fallbackReply(review: Review): string {
 const firstName = review.author_name.split(" ")[0];
 const rating = review.rating ?? 0;
 if (rating >= 4) {
 return `Thank you for your wonderful review, ${firstName}! We're thrilled you're enjoying the experience. Your support means a lot to us!`;
 } else if (rating === 3) {
 return `Thank you for your feedback, ${firstName}. We appreciate your thoughts and are always looking to improve. Could you share more about what we could do better?`;
 }
 return `We're sorry to hear about your experience, ${firstName}. This isn't the standard we aim for. Please reach out to our support team so we can resolve this for you.`;
}

function deriveInitialState(r: Review): ReplyState {
 if (r.reply_status === "published") return "done";
 if (r.reply_status === "failed") return "review";
 if (r.reply_text) return "review";
 return "idle";
}

// A 'generating' job older than this is treated as dead. Shared by the DB
// status endpoint (server-side) and the mock localStorage lifecycle below so
// the spinner can never run forever after a refresh.
const GEN_STALE_MS = 120_000;

// ── Mock generation lifecycle (Branch B) ─────────────────────────────────────
// Sample/demo reviews are client-only fixtures (ids like "mp-001") with NO row
// in public.reviews, so they can't be stamped server-side. We mirror the exact
// generating→completed→failed state machine in localStorage, keyed by review id,
// so a refresh during/after generation rehydrates instead of losing the reply.
// Real (DB-backed) reviews never touch this — they use the server async path.
type MockGenLS = {
 status: "generating" | "completed" | "failed";
 replyText?: string;
 tone?: string;
 startedAt: number;
};

const MOCK_GEN_PREFIX = "rp:gen:";
const mockGenKey = (reviewId: string) => `${MOCK_GEN_PREFIX}${reviewId}`;

function readMockGen(reviewId: string): MockGenLS | null {
 if (typeof window === "undefined") return null;
 try {
 const raw = window.localStorage.getItem(mockGenKey(reviewId));
 return raw ? (JSON.parse(raw) as MockGenLS) : null;
 } catch {
 return null;
 }
}

function writeMockGen(reviewId: string, value: MockGenLS): void {
 if (typeof window === "undefined") return;
 try {
 window.localStorage.setItem(mockGenKey(reviewId), JSON.stringify(value));
 } catch {
 // ignore (e.g. private-browsing quota exceeded)
 }
}

function clearMockGen(reviewId: string): void {
 if (typeof window === "undefined") return;
 try {
 window.localStorage.removeItem(mockGenKey(reviewId));
 } catch {
 // ignore
 }
}

export function AIReplyGenerator({
 review,
 isMock = false,
 onPublish,
 onDraft,
 onRefetch,
}: AIReplyGeneratorProps) {
 const [state, setState] = useState<ReplyState>(() => deriveInitialState(review));
 const [reply, setReply] = useState(review.reply_text || "");
 const [tone, setTone] = useState("friendly");
 const [copied, setCopied] = useState(false);
 // Generation error surfaced by the async (persisted) flow: "failed" = the
 // server job reported failure; "timeout" = the client gave up polling after
 // ~90s. Cleared whenever a fresh Generate/Regenerate starts.
 const [genError, setGenError] = useState<null | "failed" | "timeout">(null);
 const [limitModal, setLimitModal] = useState<{
 open: boolean;
 planName?: string;
 limit?: number;
 resetDate?: string;
 periodLabel?: string;
 }>({ open: false });

 // Ref-based in-flight guard. React state updates are async and batched,
 // so two rapid clicks can both see `state === "idle"` before React re-renders.
 // A ref updates synchronously so the second click sees `true` and bails out.
 const inFlightRef = useRef(false);

 // Polling machinery for the async (persisted) generation flow.
 // pollRef holds the active interval; currentGenerationIdRef pins the click we
 // started so a status response from an older/newer job can be told apart;
 // pollStartRef stamps when we began polling for the ~90s client timeout.
 const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const pollStartRef = useRef<number>(0);
 const currentGenerationIdRef = useRef<string | null>(null);
 // Mock-only: schedules the stale→failed flip for a 'generating' fixture that
 // was interrupted by a refresh (no server job exists to resume it).
 const mockStaleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 const stopPolling = useCallback(() => {
 if (pollRef.current) {
 clearInterval(pollRef.current);
 pollRef.current = null;
 }
 }, []);

 // Reads the server-side status for THIS review and advances the UI. Pure read
 // — it never triggers a new generation. Used both by the active poll loop and
 // (once) on mount/review-change to rehydrate after a refresh.
 const pollStatus = useCallback(async () => {
 // Client-side safety net so the spinner can't run forever.
 if (pollStartRef.current && Date.now() - pollStartRef.current > 90_000) {
 stopPolling();
 setGenError("timeout");
 inFlightRef.current = false;
 setState((s) => (s === "generating" ? "idle" : s));
 return;
 }
 try {
 const res = await fetch(`/api/reviews/${review.id}/generation-status`, {
 cache: "no-store",
 });
 if (!res.ok) return; // transient — keep polling
 const data = await res.json();
 if (data.generation_status === "completed") {
 stopPolling();
 inFlightRef.current = false;
 setGenError(null);
 if (data.reply_text) setReply(data.reply_text);
 setState("review");
 window.dispatchEvent(new CustomEvent("reviewpilot:usage-updated"));
 await onRefetch?.();
 } else if (data.generation_status === "failed") {
 stopPolling();
 inFlightRef.current = false;
 setGenError("failed");
 setState((s) => (s === "generating" ? "idle" : s));
 }
 // "generating" / "idle" / null → keep polling
 } catch {
 // Network blip — keep polling; the 90s timeout still bounds it.
 }
 }, [review.id, onRefetch, stopPolling]);

 const startPolling = useCallback(() => {
 stopPolling();
 pollStartRef.current = Date.now();
 pollRef.current = setInterval(() => {
 void pollStatus();
 }, 1500);
 void pollStatus(); // immediate first check
 }, [pollStatus, stopPolling]);

 useEffect(() => {
 setReply(review.reply_text || "");
 setState(deriveInitialState(review));
 // eslint-disable-next-line react-hooks/exhaustive-deps -- selected review identity / reply fields only
 }, [review.id, review.reply_text, review.reply_status]);

 // On review select / page mount — READ the persisted generation status and
 // rehydrate. CRITICAL: this only reads; it must NEVER start a new generation.
 // Real reviews read the DB status endpoint; mock fixtures read localStorage.
 // Published rows are terminal in both modes.
 useEffect(() => {
 let cancelled = false;
 const cleanup = () => {
 cancelled = true;
 stopPolling();
 if (mockStaleTimerRef.current) {
 clearTimeout(mockStaleTimerRef.current);
 mockStaleTimerRef.current = null;
 }
 };

 if (review.reply_status === "published") return cleanup;

 // ── Mock fixtures: rehydrate from localStorage ──────────────────────────
 if (isMock) {
 const g = readMockGen(review.id);
 if (g) {
 if (g.status === "generating") {
 const age = Date.now() - (g.startedAt ?? 0);
 if (age > GEN_STALE_MS) {
 // Interrupted by a refresh and now stale — no job to resume.
 writeMockGen(review.id, { ...g, status: "failed" });
 setGenError("failed");
 } else {
 if (g.tone) setTone(g.tone);
 setGenError(null);
 setState("generating");
 // There is no server worker for fixtures; flip to failed once the
 // staleness window elapses so the spinner can't run forever.
 mockStaleTimerRef.current = setTimeout(() => {
 const cur = readMockGen(review.id);
 if (cur) writeMockGen(review.id, { ...cur, status: "failed" });
 setGenError("timeout");
 setState((s) => (s === "generating" ? "idle" : s));
 }, GEN_STALE_MS - age);
 }
 } else if (g.status === "completed") {
 if (g.tone) setTone(g.tone);
 if (g.replyText) {
 setReply(g.replyText);
 setState("review");
 }
 } else if (g.status === "failed") {
 setGenError("failed");
 }
 }
 // none → keep the state derived from reply_text/reply_status above
 return cleanup;
 }

 // ── Real reviews: rehydrate from the DB status endpoint ─────────────────
 (async () => {
 try {
 const res = await fetch(`/api/reviews/${review.id}/generation-status`, {
 cache: "no-store",
 });
 if (!res.ok || cancelled) return;
 const data = await res.json();
 if (cancelled) return;
 if (data.generation_status === "generating") {
 currentGenerationIdRef.current = data.generation_id ?? null;
 setGenError(null);
 setState("generating");
 startPolling();
 } else if (data.generation_status === "completed") {
 if (data.reply_text) {
 setReply(data.reply_text);
 setState("review");
 }
 } else if (data.generation_status === "failed") {
 setGenError("failed");
 }
 // idle/null → keep the state derived above
 } catch {
 // Ignore — derived state from reply_text/reply_status still applies.
 }
 })();
 return cleanup;
 // eslint-disable-next-line react-hooks/exhaustive-deps -- per-review rehydrate on identity change only
 }, [review.id]);

 // Belt-and-suspenders: clear any live interval/timer if we unmount mid-poll.
 useEffect(
 () => () => {
 stopPolling();
 if (mockStaleTimerRef.current) {
 clearTimeout(mockStaleTimerRef.current);
 mockStaleTimerRef.current = null;
 }
 },
 [stopPolling]
 );

 const isPlayStore = review.source === "play_store";
 const charLimit = isPlayStore ? 350 : 4096;
 const overLimit = reply.length > charLimit;

 const initials = review.author_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
 const firstLetter = review.author_name[0]?.toUpperCase() || "A";
 const avatarGradient = AVATAR_COLORS[firstLetter] || "from-[#6366f1] via-[#8b5cf6] to-[#d946ef]";

 const isDrafted = review.reply_status === "drafted" || review.reply_status === "approved";
 const isFailed = review.reply_status === "failed";
 const showAiDraftBadge = isDrafted && review.is_auto_replied;

 async function handleGenerate() {
 // Synchronous guard via ref — blocks duplicate fires even when React
 // hasn't flushed the "generating" state yet (rapid double-clicks, event
 // replays, StrictMode dev re-invocation).
 if (inFlightRef.current) return;
 if (state === "generating" || state === "posting") return;
 inFlightRef.current = true;
 setGenError(null);
 setState("generating");

 // Real reviews use the persisted async flow: the server stamps a
 // generation_id, runs Grok off-request (survives a refresh), and we poll the
 // status endpoint until it terminates. Mock mode keeps the old synchronous
 // { reply } behaviour (no persistence, no real row to poll).
 if (!isMock) {
 try {
 const res = await fetch("/api/ai/generate-reply", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 review: {
 id: review.id,
 author_name: review.author_name,
 rating: review.rating,
 review_text: review.review_text,
 },
 tone,
 source: review.source,
 connectionId: review.connection_id,
 reviewId: review.id,
 mode: "async",
 }),
 });
 if (res.status === 429) {
 const data = await res.json().catch(() => ({}));
 inFlightRef.current = false;
 setState("idle");
 setLimitModal({
 open: true,
 planName: data.planName,
 limit: data.limit,
 resetDate: data.resetDate,
 periodLabel: data.periodLabel,
 });
 return;
 }
 if (!res.ok) throw new Error("API error");
 const data = await res.json();
 currentGenerationIdRef.current = data.generationId ?? null;
 // Generation now lives server-side; release the click guard and poll.
 inFlightRef.current = false;
 startPolling();
 } catch {
 inFlightRef.current = false;
 setGenError("failed");
 setState(reply ? "review" : "idle");
 }
 return;
 }

 // ── Mock mode: synchronous xAI call, lifecycle persisted to localStorage ──
 // The fetch itself is unchanged. We additionally persist generating→
 // completed→failed to localStorage (keyed by review id) so a refresh during
 // or after generation rehydrates instead of losing the reply.
 const startedAt = Date.now();
 writeMockGen(review.id, { status: "generating", tone, startedAt });
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 30000);
 try {
 const res = await fetch("/api/ai/generate-reply", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 review: {
 id: review.id,
 author_name: review.author_name,
 rating: review.rating,
 review_text: review.review_text,
 },
 tone,
 source: review.source,
 connectionId: review.connection_id,
 reviewId: review.id,
 }),
 signal: controller.signal,
 });
 clearTimeout(timeout);
 if (res.status === 429) {
 const data = await res.json().catch(() => ({}));
 // No generation happened (limit) — don't leave a stuck 'generating' key.
 clearMockGen(review.id);
 setState("idle");
 setLimitModal({
 open: true,
 planName: data.planName,
 limit: data.limit,
 resetDate: data.resetDate,
 periodLabel: data.periodLabel,
 });
 return;
 }
 if (!res.ok) throw new Error("API error");
 const data = await res.json();
 const finalReply = data.reply || fallbackReply(review);
 writeMockGen(review.id, { status: "completed", replyText: finalReply, tone, startedAt });
 setReply(finalReply);
 // Notify sidebar + billing page to refresh usage counters
 window.dispatchEvent(new CustomEvent("reviewpilot:usage-updated"));
 setState("review");
 } catch (err: unknown) {
 clearTimeout(timeout);
 const e = err as { name?: string };
 if (e.name === "AbortError") {
 writeMockGen(review.id, { status: "failed", tone, startedAt });
 toast({
 title: "AI is taking longer than usual",
 description: "Click Regenerate to try again.",
 variant: "destructive",
 });
 inFlightRef.current = false;
 setGenError("failed");
 setState(reply ? "review" : "idle");
 return;
 }
 // Graceful fallback reply — persist it as completed so a refresh shows the
 // same text (matches the on-screen result).
 const fb = fallbackReply(review);
 writeMockGen(review.id, { status: "completed", replyText: fb, tone, startedAt });
 setReply(fb);
 inFlightRef.current = false;
 setState("review");
 return;
 } finally {
 inFlightRef.current = false;
 }
 }

 async function persistPublish() {
 console.log("[PUBLISH] Sending to API:", { reviewId: review.id, replyText: reply });
 const res = await fetch("/api/reviews/reply", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 reviewId: review.id,
 replyText: reply,
 action: "publish",
 }),
 });
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
 throw new Error((data as { error?: string }).error || "Publish failed");
 }
 onPublish?.(review.id, reply);
 await onRefetch?.();
 }

 async function persistDraft() {
 const res = await fetch("/api/reviews/reply", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 reviewId: review.id,
 replyText: reply,
 action: "save_draft",
 }),
 });
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
 throw new Error((data as { error?: string }).error || "Could not save draft");
 }
 onDraft?.(review.id, reply);
 await onRefetch?.();
 }

 async function persistDiscard() {
 const res = await fetch("/api/reviews/reply", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 reviewId: review.id,
 action: "discard_reply",
 }),
 });
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
 throw new Error((data as { error?: string }).error || "Could not discard reply");
 }
 await onRefetch?.();
 }

 async function handlePost() {
 if (!reply || overLimit) return;
 setState("posting");
 try {
 if (!isMock) {
 await persistPublish();
 } else {
 if (review.source === "play_store") {
 await postPlayReply(review.external_review_id, "reviewpilot_mock", reply);
 } else {
 await postGBPReply(review.external_review_id, reply);
 }
 onPublish?.(review.id, reply);
 await onRefetch?.();
 }
 // Published — generation lifecycle for this row is done.
 clearMockGen(review.id);
 setState("done");
 toast({
 title: "Reply published",
 description: "Your reply has been submitted successfully.",
 });
 } catch (e: unknown) {
 setState("review");
 const msg = e instanceof Error ? e.message : "Something went wrong.";
 toast({
 title: "Failed to post reply",
 description: msg,
 variant: "destructive",
 });
 }
 }

 async function handleSaveDraft() {
 try {
 if (!isMock) {
 await persistDraft();
 } else {
 onDraft?.(review.id, reply);
 }
 // Draft is now persisted (DB row, or mock-overrides localStorage) — the
 // generation-lifecycle key is no longer the source of truth for this row.
 clearMockGen(review.id);
 toast({ title: "Draft saved", description: "Reply saved as draft." });
 } catch (e: unknown) {
 const msg = e instanceof Error ? e.message : "Could not save draft.";
 toast({ title: "Save failed", description: msg, variant: "destructive" });
 }
 }

 function handleCopy() {
 navigator.clipboard.writeText(reply);
 setCopied(true);
 toast({ title: "Copied to clipboard" });
 setTimeout(() => setCopied(false), 2000);
 }

 const sentimentColor: Record<string, string> = {
 positive: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
 negative: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
 neutral: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400",
 mixed: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
 };

 return (
 <div className="flex flex-col flex-1 min-h-0">
 <div className="p-6 border-b">
 <div className="flex items-start gap-3">
 <div className={cn(
 "h-12 w-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0",
 avatarGradient
 )}>
 {initials}
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="font-semibold">{review.author_name}</h3>
 {review.source === "play_store" ? (
 <Badge variant="secondary" className="text-[10px]">
 <Smartphone className="mr-1 h-3 w-3" /> Play Store
 </Badge>
 ) : review.source === "whatsapp" ? (
 <Badge
 variant="secondary"
 className="text-[10px] text-white"
 style={{ backgroundColor: "#25D366" }}
 >
 <MessageCircle className="mr-1 h-3 w-3" /> WhatsApp
 </Badge>
 ) : (
 <Badge variant="secondary" className="text-[10px]">
 <Globe className="mr-1 h-3 w-3" /> Google Business
 </Badge>
 )}
 {review.reply_status === "published" && (
 <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300">
 Published
 {review.reply_published_at && (
 <span className="ml-1 font-normal opacity-80">
 · {timeAgo(review.reply_published_at)}
 </span>
 )}
 </Badge>
 )}
 {showAiDraftBadge && (
 <Badge className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
 <Sparkles className="mr-1 h-3 w-3 inline" /> AI Draft
 </Badge>
 )}
 {isFailed && (
 <Badge variant="destructive" className="text-[10px]">Failed</Badge>
 )}
 </div>
 <div className="flex items-center gap-2 mt-1">
 <div className="flex gap-0.5">
 {review.rating == null ? (
 <span className="text-xs text-muted-foreground">—</span>
 ) : (
 [1, 2, 3, 4, 5].map((i) => (
 <Star
 key={i}
 className={cn(
 "h-4 w-4",
 i <= (review.rating ?? 0) ? starColor(review.rating ?? 0) : "text-muted-foreground/20"
 )}
 />
 ))
 )}
 </div>
 <span className="text-xs text-muted-foreground">{timeAgo(review.review_created_at)}</span>
 {/* Defensive: when the reviewer edits their rating on the store side, the
     numeric rating updates but stale sentiment can persist in the DB until
     the next sync rewrites it. Derive from current rating so the badge is
     never out-of-sync with what the user just sees in the stars. */}
 {(() => {
 const derivedSentiment =
 review.rating == null
 ? review.sentiment
 : review.rating >= 4
 ? "positive"
 : review.rating <= 2
 ? "negative"
 : "neutral";
 const displaySentiment =
 review.sentiment === "mixed" ? "mixed" : derivedSentiment;
 return (
 <Badge variant="secondary" className={cn("text-[10px] capitalize", sentimentColor[displaySentiment])}>
 {displaySentiment}
 </Badge>
 );
 })()}
 {review.edited_at && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
 title={`Reviewer edited this review ${timeAgo(review.edited_at)}`}
 >
 Edited · {timeAgo(review.edited_at)}
 </Badge>
 )}
 </div>
 </div>
 </div>
 <p className="mt-4 text-sm leading-relaxed">{review.review_text}</p>
 {review.keywords.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-3">
 {review.keywords.map((kw) => (
 <Badge key={kw} variant="outline" className="text-[10px]">{kw}</Badge>
 ))}
 </div>
 )}
 </div>

 {state === "done" && (
 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto min-h-0">
 <div className="relative mb-4">
 <div
 aria-hidden
 className="absolute inset-0 -m-2 rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.25),rgba(217,70,239,0.25))] blur-xl"
 />
 <div className="relative h-14 w-14 rounded-full bg-[linear-gradient(135deg,#10b981_0%,#6366f1_55%,#d946ef_100%)] ring-4 ring-card flex items-center justify-center shadow-[0_0_24px_-6px_rgba(99,102,241,0.55)]">
 <CheckCircle2 className="h-7 w-7 text-white" />
 </div>
 </div>
 <h3 className="font-sans text-lg font-semibold tracking-tight">Replied</h3>
 <p className="text-sm text-muted-foreground mt-1">
 Your reply to <span className="text-foreground font-medium">{review.author_name}</span> is now live.
 </p>
 <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
 {review.reply_published_at
 ? `Sent ${timeAgo(review.reply_published_at)}`
 : "Sent just now"}
 </p>
 {reply && (
 <div className="mt-5 max-w-md w-full rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 text-left">
 <div className="flex items-center justify-between mb-1.5">
 <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 Your reply
 </span>
 <button
 type="button"
 onClick={() => { setState("review"); }}
 className="text-[11px] font-medium text-accent hover:underline underline-offset-2"
 >
 Edit reply
 </button>
 </div>
 <p className="border-l-2 border-accent/40 pl-3 text-sm text-foreground/90 leading-relaxed italic">
 &ldquo;{reply}&rdquo;
 </p>
 </div>
 )}
 </div>
 )}

 {state === "idle" && (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 overflow-y-auto min-h-0">
 {genError && (
 <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-300 max-w-sm text-left">
 <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
 <p>
 {genError === "timeout"
 ? "Still working — the AI is taking longer than expected. Try again in a moment."
 : "Reply generation failed. Please try again."}
 </p>
 </div>
 )}
 <div className="rounded-2xl bg-accent/10 dark:bg-accent/10 p-5">
 <Bot className="h-10 w-10 text-accent mx-auto" />
 </div>
 <div>
 <h3 className="font-semibold text-base mb-1">Generate an AI Reply</h3>
 <p className="text-sm text-muted-foreground max-w-xs mx-auto">
 Choose a tone, then let AI craft a professional reply in seconds.
 </p>
 </div>
 <div className="flex gap-1.5 flex-wrap justify-center">
 {TONES.map((t) => (
 <button
 key={t.value}
 type="button"
 onClick={() => setTone(t.value)}
 className={cn(
 "rounded-full px-4 py-2 text-sm sm:px-3 sm:py-1.5 sm:text-xs font-medium transition-all duration-150 min-h-[40px] sm:min-h-0",
 tone === t.value
 ? "bg-accent text-white shadow-sm"
 : "bg-secondary text-muted-foreground hover:text-foreground"
 )}
 >
 {t.label}
 </button>
 ))}
 </div>
 <Button onClick={handleGenerate} size="lg" className="h-12 sm:h-11 w-full sm:w-auto px-8">
 <Bot className="mr-2 h-4 w-4" />
 Generate AI Reply
 </Button>
 </div>
 )}

 {state === "generating" && (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 overflow-y-auto min-h-0">
 <div className="rounded-2xl bg-accent/10 dark:bg-accent/10 p-5">
 <Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" />
 </div>
 <div>
 <h3 className="font-semibold text-base mb-1">Generating reply...</h3>
 <p className="text-sm text-muted-foreground">
 AI is crafting a {tone} response for {review.rating != null ? `${review.rating}★` : "this"} review.
 </p>
 </div>
 </div>
 )}

 {state === "review" && (
 <>
 <div className="flex-1 p-6 space-y-4 overflow-y-auto">
 {isFailed && (
 <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-300">
 <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
 <p>Posting to the store failed. Edit the reply if needed and try again.</p>
 </div>
 )}
 {genError && (
 <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-300">
 <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
 <p>
 {genError === "timeout"
 ? "Still working — the AI is taking longer than expected. Click Regenerate to try again."
 : "Reply generation failed. Click Regenerate to try again."}
 </p>
 </div>
 )}
 <div className="flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-2">
 <Bot className="h-4 w-4 text-accent" />
 <span className="text-sm font-medium">AI Reply</span>
 </div>
 <div className="flex gap-1.5 flex-wrap">
 {TONES.map((t) => (
 <button
 key={t.value}
 type="button"
 onClick={() => setTone(t.value)}
 className={cn(
 "rounded-full px-3.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium transition-all duration-150 min-h-[36px] sm:min-h-0",
 tone === t.value
 ? "bg-accent text-white shadow-sm"
 : "bg-secondary text-muted-foreground hover:text-foreground"
 )}
 >
 {t.label}
 </button>
 ))}
 </div>
 </div>

 <Textarea
 value={reply}
 onChange={(e) => setReply(e.target.value)}
 placeholder="Edit the generated reply before publishing…"
 rows={6}
 className="resize-none transition-colors focus:border-accent/40 text-base sm:text-sm"
 />

 <div className="flex items-center justify-between">
 <span className={cn(
 "text-xs font-medium tabular-nums",
 overLimit ? "text-destructive" : reply.length > charLimit * 0.85 ? "text-amber-500" : "text-muted-foreground"
 )}>
 {reply.length} / {charLimit}
 {isPlayStore && <span className="text-muted-foreground font-normal"> chars (Play Store limit)</span>}
 </span>
 <button
 type="button"
 onClick={handleCopy}
 disabled={!reply}
 className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-40 transition-colors"
 >
 {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
 {copied ? "Copied" : "Copy"}
 </button>
 </div>
 </div>

 <div className="border-t p-4 flex flex-wrap gap-2">
 <Button
 variant="outline"
 onClick={handleGenerate}
 className="flex-1 min-w-[120px] h-12 sm:h-10"
 >
 <RefreshCw className="mr-2 h-4 w-4" />
 Regenerate
 </Button>
 {reply && (
 <Button
 variant="outline"
 onClick={handleSaveDraft}
 className="px-3 h-12 w-12 sm:h-10 sm:w-auto"
 title="Save as draft"
 aria-label="Save as draft"
 >
 <Save className="h-4 w-4" />
 </Button>
 )}
 {reply && (
 <Button
 variant="ghost"
 onClick={async () => {
 setReply("");
 setGenError(null);
 setState("idle");
 // Discarding clears the generation lifecycle for this row.
 clearMockGen(review.id);
 if (!isMock) {
 try {
 await persistDiscard();
 } catch (e: unknown) {
 const msg = e instanceof Error ? e.message : "Could not reset reply status.";
 toast({ title: "Reset failed", description: msg, variant: "destructive" });
 }
 }
 }}
 className="px-3 h-12 w-12 sm:h-10 sm:w-auto text-muted-foreground hover:text-destructive"
 title="Discard reply"
 aria-label="Discard reply"
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 )}
 {isDrafted && reply && (
 <Button
 onClick={handlePost}
 disabled={overLimit}
 className="flex-1 min-w-[140px] h-12 sm:h-10 bg-indigo-600 hover:bg-indigo-700"
 >
 <Send className="mr-2 h-4 w-4" />
 Approve &amp; Publish
 </Button>
 )}
 {(!isDrafted || !reply) && reply && (
 <Button
 onClick={handlePost}
 disabled={overLimit}
 className="flex-1 min-w-[120px] h-12 sm:h-10"
 >
 <Send className="mr-2 h-4 w-4" />
 {isFailed ? "Retry publish" : "Post Reply"}
 </Button>
 )}
 </div>
 </>
 )}

 {state === "posting" && (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 overflow-y-auto min-h-0">
 <div className="rounded-2xl bg-accent/10 dark:bg-accent/10 p-5">
 <Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" />
 </div>
 <div>
 <h3 className="font-semibold text-base mb-1">Posting reply...</h3>
 <p className="text-sm text-muted-foreground">
 Submitting to {review.source === "play_store" ? "Google Play Store" : review.source === "whatsapp" ? "WhatsApp" : "Google Business Profile"}…
 </p>
 </div>
 </div>
 )}

 <UsageLimitModal
 open={limitModal.open}
 onClose={() => setLimitModal({ open: false })}
 limitType="ai_replies"
 planName={limitModal.planName}
 limit={limitModal.limit}
 resetDate={limitModal.resetDate}
 periodLabel={limitModal.periodLabel}
 />
 </div>
 );
}
