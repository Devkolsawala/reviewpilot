"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Star, Bot, RefreshCw, Send, Globe, Smartphone, Copy, Check,
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
  E: "from-teal-400 to-teal-500", F: "from-cyan-400 to-cyan-500",
  G: "from-sky-400 to-sky-500", H: "from-blue-400 to-blue-500",
  I: "from-indigo-400 to-indigo-500", J: "from-violet-400 to-violet-500",
  K: "from-purple-400 to-purple-500", L: "from-fuchsia-400 to-fuchsia-500",
  M: "from-pink-400 to-pink-500", N: "from-rose-400 to-rose-500",
  P: "from-teal-400 to-teal-500", R: "from-indigo-400 to-indigo-500",
  S: "from-emerald-400 to-emerald-500", V: "from-sky-400 to-sky-500",
};

function fallbackReply(review: Review): string {
  const firstName = review.author_name.split(" ")[0];
  if (review.rating >= 4) {
    return `Thank you for your wonderful review, ${firstName}! We're thrilled you're enjoying the experience. Your support means a lot to us!`;
  } else if (review.rating === 3) {
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
  const [limitModal, setLimitModal] = useState<{
    open: boolean;
    planName?: string;
    limit?: number;
    resetDate?: string;
    periodLabel?: string;
  }>({ open: false });

  useEffect(() => {
    setReply(review.reply_text || "");
    setState(deriveInitialState(review));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- selected review identity / reply fields only
  }, [review.id, review.reply_text, review.reply_status]);

  const isPlayStore = review.source === "play_store";
  const charLimit = isPlayStore ? 350 : 4096;
  const overLimit = reply.length > charLimit;

  const initials = review.author_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const firstLetter = review.author_name[0]?.toUpperCase() || "A";
  const avatarGradient = AVATAR_COLORS[firstLetter] || "from-teal-400 to-teal-500";

  const isDrafted = review.reply_status === "drafted" || review.reply_status === "approved";
  const isFailed = review.reply_status === "failed";
  const showAiDraftBadge = isDrafted && review.is_auto_replied;

  async function handleGenerate() {
    // Guard: ignore re-clicks while a request is already in flight.
    // Prevents duplicate xAI billing if the user mashes the button.
    if (state === "generating" || state === "posting") return;
    setState("generating");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
      setReply(data.reply || fallbackReply(review));
      // Notify sidebar + billing page to refresh usage counters
      window.dispatchEvent(new CustomEvent("reviewpilot:usage-updated"));
    } catch (err: unknown) {
      clearTimeout(timeout);
      const e = err as { name?: string };
      if (e.name === "AbortError") {
        toast({ title: "AI took too long", description: "Using a quick reply instead. You can edit it below." });
      }
      setReply(fallbackReply(review));
    } finally {
      setState("review");
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i <= review.rating ? starColor(review.rating) : "text-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(review.review_created_at)}</span>
              <Badge variant="secondary" className={cn("text-[10px] capitalize", sentimentColor[review.sentiment])}>
                {review.sentiment}
              </Badge>
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
          <div className="rounded-full bg-green-100 dark:bg-green-950/30 p-4 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Replied ✓</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your reply to {review.author_name} is now live.
          </p>
          {reply && (
            <div className="rounded-lg bg-secondary/50 p-4 max-w-md text-left">
              <p className="text-sm text-muted-foreground italic">&ldquo;{reply}&rdquo;</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => { setState("review"); }}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Edit reply
          </button>
        </div>
      )}

      {state === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 overflow-y-auto min-h-0">
          <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/20 p-5">
            <Bot className="h-10 w-10 text-teal-500 mx-auto" />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1">Generate an AI Reply</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Choose a tone, then let AI craft a professional reply in seconds.
            </p>
          </div>
          <div className="flex gap-1 flex-wrap justify-center">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  tone === t.value
                    ? "bg-teal-500 text-white shadow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button onClick={handleGenerate} size="lg" className="px-8">
            <Bot className="mr-2 h-4 w-4" />
            Generate AI Reply
          </Button>
        </div>
      )}

      {state === "generating" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 overflow-y-auto min-h-0">
          <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/20 p-5">
            <Loader2 className="h-10 w-10 text-teal-500 animate-spin mx-auto" />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1">Generating reply...</h3>
            <p className="text-sm text-muted-foreground">
              AI is crafting a {tone} response for {review.rating}★ review.
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-teal-500" />
                <span className="text-sm font-medium">AI Reply</span>
              </div>
              <div className="flex gap-1">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
                      tone === t.value
                        ? "bg-teal-500 text-white shadow-sm"
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
              className="resize-none transition-colors focus:border-teal-300"
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
              disabled={state === "generating"}
              className="flex-1 min-w-[120px]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            {reply && (
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="px-3"
                title="Save as draft"
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
            {reply && (
              <Button
                variant="ghost"
                onClick={async () => {
                  setReply("");
                  setState("idle");
                  if (!isMock) {
                    try {
                      await persistDiscard();
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : "Could not reset reply status.";
                      toast({ title: "Reset failed", description: msg, variant: "destructive" });
                    }
                  }
                }}
                className="px-3 text-muted-foreground hover:text-destructive"
                title="Discard reply"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {isDrafted && reply && (
              <Button
                onClick={handlePost}
                disabled={overLimit}
                className="flex-1 min-w-[140px] bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Approve &amp; Publish
              </Button>
            )}
            {(!isDrafted || !reply) && reply && (
              <Button
                onClick={handlePost}
                disabled={overLimit}
                className="flex-1 min-w-[120px]"
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
          <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/20 p-5">
            <Loader2 className="h-10 w-10 text-teal-500 animate-spin mx-auto" />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1">Posting reply...</h3>
            <p className="text-sm text-muted-foreground">
              Submitting to {review.source === "play_store" ? "Google Play Store" : "Google Business Profile"}…
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
