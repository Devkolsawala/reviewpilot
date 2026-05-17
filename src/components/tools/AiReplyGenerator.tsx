"use client";

import { useCallback, useRef, useState } from "react";
import { Sparkles, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { LanguagePicker } from "./LanguagePicker";
import { VariationCards, type Variation } from "./VariationCards";
import {
  HistoryPanel,
  type HistoryEntry,
} from "./HistoryPanel";
import { PlatformToggle } from "./PlatformToggle";
import { PresetReviewChips } from "./PresetReviewChips";
import { LANGUAGE_BY_CODE } from "@/lib/tools/languages";
import {
  PLATFORM_META,
  type ReplyPlatform,
  type ReplyTone,
  type ReplyPreset,
} from "@/lib/tools/replyPresets";
import { useToolStorage } from "@/lib/tools/useToolStorage";

const TONES: ReplyTone[] = ["Friendly", "Professional", "Apologetic", "Confident"];
const HISTORY_LIMIT = 5;

// Tone enum on the variation cards' history uses lowercase action verbs;
// we surface the action as "polished" (closest fit) since HistoryPanel doesn't
// have a "generated" action label. The visible "Polished (tone)" label is the
// best match without modifying the Phase 1.5 component.
type AiBatch = {
  variations: Variation[];
  actionLabel: string;
  tone: ReplyTone;
  langName: string;
  charLimit: number;
};

export function AiReplyGenerator() {
  // Persisted state — keys are prefixed "reply:" to avoid collision with the
  // char-counter tool which shares the same useToolStorage namespace.
  const [platform, setPlatform] = useToolStorage<ReplyPlatform>(
    "reply:platform",
    "play-store",
    0
  );
  const [review, setReview] = useToolStorage<string>("reply:review", "", 500);
  const [tone, setTone] = useToolStorage<ReplyTone>(
    "reply:tone",
    "Professional",
    0
  );
  const [rating, setRating] = useToolStorage<number>("reply:rating", 3, 0);
  const [lang, setLang] = useToolStorage<string>("reply:lang", "en", 0);
  const [activePresetId, setActivePresetId] = useToolStorage<string | null>(
    "reply:presetId",
    null,
    0
  );
  const [history, setHistory] = useToolStorage<HistoryEntry[]>(
    "reply:history",
    [],
    0
  );

  // Local (non-persisted) state
  const [batch, setBatch] = useState<AiBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  const charLimit = PLATFORM_META[platform].charLimit;
  const reviewChars = review.length;
  const reviewWords = review.trim() ? review.trim().split(/\s+/).length : 0;
  const reviewValid = review.trim().length >= 5;

  const pushHistory = useCallback(
    (entry: Omit<HistoryEntry, "id" | "createdAt">) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newEntry: HistoryEntry = {
        ...entry,
        id,
        createdAt: Date.now(),
      };
      setHistory([newEntry, ...history].slice(0, HISTORY_LIMIT));
    },
    [history, setHistory]
  );

  const handlePickPreset = (preset: ReplyPreset) => {
    setReview(preset.reviewText);
    setRating(preset.suggestedRating);
    setTone(preset.suggestedTone);
    setActivePresetId(preset.id);
    setError(null);
    toast({ title: "Loaded preset — feel free to edit." });
  };

  const handleClearPreset = () => {
    setReview("");
    setActivePresetId("custom");
    setError(null);
  };

  const handlePlatformChange = (next: ReplyPlatform) => {
    if (next === platform) return;
    setPlatform(next);
    // Clear active preset since the chip list changes with platform.
    setActivePresetId(null);
  };

  const generate = async () => {
    if (!reviewValid || loading) return;
    setLoading(true);
    setError(null);
    setCopiedKey(null);

    try {
      const res = await fetch("/api/tools/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review,
          platform,
          tone,
          rating,
          language: lang,
          variations: 3,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Something went wrong. Try again.");
        return;
      }
      const variations: Variation[] = Array.isArray(data?.results)
        ? data.results
            .map((r: { text?: unknown; charCount?: unknown }) => ({
              text: typeof r.text === "string" ? r.text : "",
              charCount:
                typeof r.charCount === "number"
                  ? r.charCount
                  : typeof r.text === "string"
                    ? r.text.length
                    : 0,
            }))
            .filter((v: Variation) => v.text.length > 0)
        : [];
      if (variations.length === 0) {
        setError("AI returned no usable variations. Try again.");
        return;
      }
      const langName: string =
        typeof data?.langName === "string"
          ? data.langName
          : (LANGUAGE_BY_CODE[lang]?.name ?? lang);
      const apiCharLimit: number =
        typeof data?.charLimit === "number" ? data.charLimit : charLimit;
      setBatch({
        variations,
        actionLabel: `${tone} · ${langName}`,
        tone,
        langName,
        charLimit: apiCharLimit,
      });
      // Scroll the output into view on mobile.
      requestAnimationFrame(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1500);
    } catch {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      });
    }
  };

  const handleUseVariation = async (v: Variation) => {
    if (!batch) return;
    try {
      await navigator.clipboard.writeText(v.text);
      toast({ title: "Reply copied — paste it into your reply box." });
    } catch {
      /* clipboard denied — still push to history */
    }
    pushHistory({
      action: "polished",
      tone: batch.tone,
      lang: batch.langName,
      text: v.text,
      charCount: v.charCount,
    });
  };

  const handleRestoreHistory = (entry: HistoryEntry) => {
    // Restoring puts the reply back into view as a single-card batch so the
    // user can re-copy or compare. We don't clobber the current `review` input
    // (which is the *review being replied to*, not the reply itself).
    setBatch({
      variations: [{ text: entry.text, charCount: entry.charCount }],
      actionLabel: `Restored · ${entry.tone ?? "—"} · ${entry.lang ?? "—"}`,
      tone: (entry.tone as ReplyTone) ?? tone,
      langName: entry.lang ?? "",
      charLimit,
    });
    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleClearHistory = () => {
    if (history.length === 0) return;
    if (window.confirm("Clear all history entries?")) setHistory([]);
  };

  return (
    <div className="space-y-6">
      {/* Tool card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-12 h-24 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(139,92,246,0.18),transparent_70%)]"
        />

        {/* Platform toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Platform
          </span>
          <PlatformToggle
            value={platform}
            onChange={handlePlatformChange}
            disabled={loading}
          />
        </div>

        {/* Preset chips */}
        <div className="mt-5">
          <PresetReviewChips
            platform={platform}
            activeId={activePresetId}
            onPick={handlePickPreset}
            onClear={handleClearPreset}
          />
        </div>

        {/* Review textarea */}
        <div className="mt-5">
          <label
            htmlFor="generator-review"
            className="text-xs font-medium text-foreground"
          >
            The customer&apos;s review
          </label>
          <Textarea
            id="generator-review"
            value={review}
            onChange={(e) => {
              setReview(e.target.value);
              if (activePresetId !== "custom") setActivePresetId(null);
            }}
            placeholder="Paste the customer's review here…"
            rows={4}
            className="mt-2 min-h-[110px] resize-y rounded-xl border-border/60 bg-background/70 p-4 text-[15px] leading-relaxed transition-colors focus-visible:border-accent/50"
          />
          <div className="mt-1.5 flex items-center justify-end text-[11px] text-muted-foreground font-mono tabular-nums">
            {reviewChars} chars · {reviewWords} words
          </div>
        </div>

        {/* Tone + Rating */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <fieldset>
            <legend className="text-xs font-medium text-foreground">Tone</legend>
            <div
              role="radiogroup"
              aria-label="Reply tone"
              className="mt-2 flex flex-wrap gap-1.5"
            >
              {TONES.map((t) => {
                const active = tone === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTone(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-transparent bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white"
                        : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium text-foreground">
              Star rating{" "}
              <span className="text-muted-foreground">(optional)</span>
            </legend>
            <div
              role="radiogroup"
              aria-label="Star rating"
              className="mt-2 inline-flex gap-1"
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const active = rating >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    onClick={() => setRating(n)}
                    className="rounded p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Star
                      className={cn(
                        "h-5 w-5",
                        active
                          ? "fill-amber-400 text-amber-400"
                          : "text-border"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Language + Generate */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Language
            </span>
            <LanguagePicker
              value={lang}
              onChange={(code) => setLang(code)}
              disabled={loading}
            />
          </div>

          <Button
            variant="gradient"
            size="lg"
            disabled={!reviewValid || loading}
            onClick={generate}
            className="min-w-[200px]"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {loading ? "Generating…" : "Generate AI reply"}
          </Button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </div>

      {/* Output */}
      <div ref={outputRef}>
        {batch && (
          <div className="space-y-3">
            <VariationCardsPlatformWrapper
              variations={batch.variations}
              actionLabel={batch.actionLabel}
              charLimit={batch.charLimit}
              copiedKey={copiedKey}
              onCopy={handleCopy}
              onUse={handleUseVariation}
            />
            <div className="flex justify-end">
              <Button
                onClick={generate}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {loading ? "Generating new options…" : "Regenerate"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <HistoryPanel
        entries={history}
        onRestore={handleRestoreHistory}
        onClear={handleClearHistory}
      />
    </div>
  );
}

/**
 * VariationCards from Phase 1.5 hard-codes its char-limit threshold to 350.
 * For GBP (4,096) and Other (1,000) we want the over-limit indicator to track
 * the real platform limit. Rather than modify the Phase 1.5 component, we wrap
 * the variations in a thin presentational shell that adds the correct
 * per-card character counter, and let VariationCards handle the rest.
 *
 * Why not just pass through: VariationCards always renders `{charCount} / 350`
 * regardless of platform. Wrapping lets us patch that single visual without
 * touching the shared component.
 */
function VariationCardsPlatformWrapper(props: {
  variations: Variation[];
  actionLabel: string;
  charLimit: number;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onUse: (v: Variation) => void;
}) {
  // For the 350-char Play Store case, the original component already displays
  // the correct limit — pass straight through.
  if (props.charLimit === 350) {
    return (
      <VariationCards
        variations={props.variations}
        actionLabel={props.actionLabel}
        copiedKey={props.copiedKey}
        onCopy={props.onCopy}
        onUse={props.onUse}
      />
    );
  }

  // For larger limits (GBP 4096, Other 1000), render a thin parallel layout
  // that shows the correct limit while keeping the same look-and-feel.
  return (
    <div className="space-y-3">
      <h2 className="font-sans text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
        AI versions
      </h2>
      <div
        className={cn(
          "grid gap-3",
          props.variations.length === 1
            ? "grid-cols-1"
            : props.variations.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 lg:grid-cols-3"
        )}
      >
        {props.variations.map((v, i) => {
          const key = `${i}-${v.charCount}`;
          const over = v.charCount > props.charLimit;
          return (
            <div
              key={key}
              className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm transition-shadow hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_8px_24px_-12px_rgba(139,92,246,0.45)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="inline-flex w-fit items-center gap-1 rounded-md bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-2 py-0.5 text-[11px] font-semibold text-white">
                    Option {i + 1}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {props.actionLabel}
                  </span>
                </div>
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    over
                      ? "text-red-600 dark:text-red-400"
                      : v.charCount > props.charLimit * 0.9
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                  )}
                >
                  {v.charCount} / {props.charLimit}
                </span>
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                {v.text}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => props.onCopy(key, v.text)}
                  size="sm"
                  variant="subtle"
                  className="gap-1.5"
                >
                  {props.copiedKey === key ? "Copied" : "Copy"}
                </Button>
                <Button
                  onClick={() => props.onUse(v)}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Use this
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
