"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Star,
  PenLine,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Tone = "friendly" | "professional" | "apologetic";

interface Sample {
  id: string;
  label: string;
  source: "Play Store" | "GBP";
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
}

const SAMPLES: Sample[] = [
  {
    id: "play-1",
    label: "Crash complaint",
    source: "Play Store",
    rating: 1,
    text: "App keeps crashing every time I try to log in. Lost all my saved data twice already. Worst app, complete waste of money.",
  },
  {
    id: "play-5",
    label: "5★ praise",
    source: "Play Store",
    rating: 5,
    text: "Genuinely the best budgeting app I've used in India. Clean UI, no ads, and the new dark mode is beautiful. Worth every rupee.",
  },
  {
    id: "gbp-2",
    label: "Bad service",
    source: "GBP",
    rating: 2,
    text: "Waited 45 minutes past my appointment time. Staff was polite but the wait was unacceptable. Won't be coming back.",
  },
  {
    id: "gbp-5",
    label: "Glowing GBP",
    source: "GBP",
    rating: 5,
    text: "Dr. Sharma is incredibly thorough and patient. Took the time to explain everything. Highly recommend for anyone in the Ahmedabad area.",
  },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "apologetic", label: "Apologetic" },
];

const MIN_LEN = 10;
const MAX_LEN = 500;

interface ReplyState {
  text: string;
  elapsedMs: number;
}

interface ErrorState {
  kind: "rate_limited" | "other";
  message: string;
}

export function InteractiveAIDemo() {
  const [review, setReview] = useState<string>(SAMPLES[0]!.text);
  const [tone, setTone] = useState<Tone>("friendly");
  const [rating, setRating] = useState<number>(SAMPLES[0]!.rating);
  const [activeSample, setActiveSample] = useState<string | null>(
    SAMPLES[0]!.id
  );
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<ReplyState | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [copied, setCopied] = useState(false);
  const replyCardRef = useRef<HTMLDivElement | null>(null);

  const charCount = review.length;
  const charValid = charCount >= MIN_LEN && charCount <= MAX_LEN;

  const sampleById = useMemo(() => {
    const m = new Map<string, Sample>();
    for (const s of SAMPLES) m.set(s.id, s);
    return m;
  }, []);

  function pickSample(id: string) {
    const s = sampleById.get(id);
    if (!s) return;
    setActiveSample(id);
    setReview(s.text);
    setRating(s.rating);
    setError(null);
  }

  function clearSample() {
    setActiveSample("custom");
    setReview("");
    setError(null);
  }

  async function generate(nextTone?: Tone) {
    if (!charValid) return;
    const useTone = nextTone ?? tone;
    setLoading(true);
    setError(null);
    setReply(null);
    setCopied(false);
    try {
      const res = await fetch("/api/public/demo-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review,
          tone: useTone,
          rating,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError({
            kind: "rate_limited",
            message: data?.message ?? "Demo limit reached.",
          });
        } else {
          setError({
            kind: "other",
            message:
              data?.message ??
              "Something went wrong on our end. Please try again in a moment — or start your 7-day free trial to use the full product.",
          });
        }
        return;
      }
      setReply({
        text: String(data.reply ?? ""),
        elapsedMs: Number(data.elapsedMs ?? 0),
      });
      // Smooth-scroll the reply into view on mobile so the user sees it.
      requestAnimationFrame(() => {
        replyCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    } catch (e) {
      console.error("[demo] fetch failed", e);
      setError({
        kind: "other",
        message:
          "Network error. Please try again in a moment — or start your 7-day free trial to use the full product.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    if (!reply?.text) return;
    try {
      await navigator.clipboard.writeText(reply.text);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      });
    }
  }

  function tryAnotherTone() {
    const order: Tone[] = ["friendly", "professional", "apologetic"];
    const idx = order.indexOf(tone);
    const next = order[(idx + 1) % order.length]!;
    setTone(next);
    generate(next);
  }

  return (
    <section
      id="try-the-ai"
      aria-labelledby="try-the-ai-heading"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      {/* Soft gradient backdrop — visually separates this section from neighbours */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.06),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(217,70,239,0.05),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Try it live
          </p>
          <h2
            id="try-the-ai-heading"
            className="mt-3 font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl"
          >
            Try the AI yourself.
          </h2>
          <p className="mt-4 text-balance text-muted-foreground">
            No signup. No credit card. Paste a review and watch ReviewPilot
            reply.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-xl shadow-black/5 backdrop-blur-sm sm:p-7">
          {/* Sample review chips */}
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLES.map((s) => {
              const active = s.id === activeSample;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickSample(s.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-accent/50 bg-accent/10 text-foreground"
                      : "border-border/60 bg-background/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                  )}
                >
                  <span className="font-mono text-amber-500" aria-hidden>
                    {"★".repeat(s.rating)}
                  </span>
                  <span>{s.label}</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    · {s.source}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={clearSample}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                activeSample === "custom"
                  ? "border-accent/50 bg-accent/10 text-foreground"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
              )}
            >
              <PenLine className="h-3 w-3" aria-hidden />
              Write your own
            </button>
          </div>

          {/* Textarea */}
          <div className="mt-5">
            <label htmlFor="demo-review" className="sr-only">
              Review text
            </label>
            <Textarea
              id="demo-review"
              value={review}
              onChange={(e) => {
                setReview(e.target.value.slice(0, MAX_LEN));
                if (activeSample !== "custom") setActiveSample(null);
              }}
              placeholder="Paste a real review or write one here. 10–500 characters."
              maxLength={MAX_LEN}
              rows={4}
              className="resize-none bg-background/60"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span
                className={cn(
                  "text-muted-foreground",
                  !charValid && charCount > 0 && "text-amber-600"
                )}
              >
                {charCount < MIN_LEN
                  ? `Add at least ${MIN_LEN - charCount} more character${
                      MIN_LEN - charCount === 1 ? "" : "s"
                    }`
                  : "Looks good"}
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {charCount} / {MAX_LEN}
              </span>
            </div>
          </div>

          {/* Tone + rating */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <fieldset>
              <legend className="text-xs font-medium text-foreground">
                Tone
              </legend>
              <div
                role="radiogroup"
                aria-label="Reply tone"
                className="mt-2 flex flex-wrap gap-2"
              >
                {TONES.map((t) => {
                  const active = tone === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs transition-colors",
                        active
                          ? "border-accent/60 bg-accent/10 text-foreground"
                          : "border-border/60 bg-background/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                      )}
                    >
                      {t.label}
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

          {/* Generate button */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="gradient"
              size="lg"
              disabled={!charValid || loading}
              onClick={() => generate()}
              className="min-w-[220px]"
            >
              {loading ? (
                <>
                  <TypingDots />
                  <span className="ml-2">Generating…</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Generate AI reply
                </>
              )}
            </Button>
          </div>

          {/* Reply card */}
          <div
            ref={replyCardRef}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-6"
          >
            {error && error.kind === "rate_limited" && (
              <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-950/40">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden
                  />
                  <div className="text-sm">
                    <p className="text-foreground">
                      You&apos;ve hit the demo limit (5 replies per hour). Want
                      to keep going?{" "}
                      <span className="font-semibold">
                        Start your 7-day free trial
                      </span>{" "}
                      and get{" "}
                      <span className="font-semibold">30 AI replies</span> — no
                      credit card needed.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Need more? Paid plans start at ₹1,500/mo with higher
                      weekly limits.
                    </p>
                    <div className="mt-3">
                      <Button variant="gradient" size="sm" asChild>
                        <Link href="/signup">
                          Start free trial
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && error.kind === "other" && (
              <div className="rounded-xl border border-rose-300/40 bg-rose-50/60 p-4 dark:border-rose-500/30 dark:bg-rose-950/40">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                    aria-hidden
                  />
                  <p className="text-sm text-foreground">{error.message}</p>
                </div>
              </div>
            )}

            {reply && !error && (
              <div className="rounded-xl border border-accent/30 bg-[linear-gradient(135deg,rgba(99,102,241,0.05),rgba(217,70,239,0.04))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    AI reply
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Generated in {(reply.elapsedMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                  {reply.text}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={copyReply}
                    aria-label="Copy reply to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={tryAnotherTone}
                    disabled={loading}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Try another tone
                  </Button>
                  <Button variant="gradient" size="sm" asChild>
                    <Link href="/signup">
                      Start free trial
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

function TypingDots() {
  return (
    <span aria-hidden className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90 [animation-delay:300ms]" />
    </span>
  );
}
