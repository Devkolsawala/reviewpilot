"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { YOUTUBE_DEMO_URL } from "@/lib/constants";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
import { m, MotionProvider, AnimatePresence, fadeUp, stagger } from "@/components/motion/primitives";
import {
  ArrowRight,
  Star,
  Sparkles,
  ChevronDown,
  Play,
  Send,
  CheckCircle2,
  RefreshCw,
  Search,
  MoreVertical,
  MousePointer2,
} from "lucide-react";

export function Hero() {
  return (
    <MotionProvider>
      <section className="relative isolate overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
        {/* Decorative background */}
        <GridPattern className="[--grid-size:56px] opacity-60" fade />
        <AuroraBackground intensity="normal" className="-z-10" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent -z-10"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <m.div
            variants={stagger(0.05, 0.08)}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center"
          >
            {/* Eyebrow pill */}
            <m.div variants={fadeUp}>
              <Link
                href="/features/google-business-profile"
                className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:border-accent/50 hover:text-foreground"
              >
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] animate-pulse" />
                New — Google Business Profile automation
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </m.div>

            {/* Headline */}
            <m.h1
              variants={fadeUp}
              className="mt-6 max-w-4xl text-balance font-sans text-4xl font-semibold tracking-tight text-foreground leading-[1.1] sm:text-5xl lg:text-6xl lg:leading-[1.05]"
            >
              Turn{" "}
              <span className="text-gradient-brand font-serif italic font-normal">
                every review
              </span>{" "}
              into revenue.
            </m.h1>

            <m.p
              variants={fadeUp}
              className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg leading-relaxed"
            >
              AI-drafted replies for Google Play Store reviews and Google
              Business Profile — built for Indian app makers and local businesses.
              From{" "}
              <span className="font-mono text-foreground">$16/mo</span>.
            </m.p>

            {/* CTAs */}
            <m.div
              variants={fadeUp}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
            >
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <a
                  href={YOUTUBE_DEMO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Play className="mr-1.5 h-4 w-4 fill-current" />
                  Watch 2-min demo
                </a>
              </Button>
            </m.div>

            <m.p
              variants={fadeUp}
              className="mt-5 text-xs text-muted-foreground"
            >
              7-day free trial · No credit card · Setup in 5 minutes
            </m.p>
          </m.div>

          {/* Product preview — 3-step automation flow */}
          <m.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto mt-16 max-w-6xl"
          >
            <div className="absolute -inset-x-8 -inset-y-8 rounded-[3rem] bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] blur-3xl -z-10" />
            <FlowDiagram />
          </m.div>

          {/* Scroll chevron */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-12 flex justify-center"
            aria-hidden
          >
            <ChevronDown className="h-5 w-5 animate-bounce text-muted-foreground/60" />
          </m.div>
        </div>
      </section>
    </MotionProvider>
  );
}

/* ----------------------------------------------------------------------- */
/*  FlowDiagram — 3-step automation preview, fully responsive                */
/* ----------------------------------------------------------------------- */

function FlowDiagram() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-start lg:gap-3">
      {/* Step 1 — New review arrives */}
      <FlowStep number={1} title="New Review Arrives">
        <PlayStoreCard mode="incoming" />
      </FlowStep>

      {/* Connector 1 → 2 — circling fetch arrow */}
      <FlowConnector
        label="Auto-Fetch"
        icon={
          <m.span
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-flex"
          >
            <RefreshCw className="h-4 w-4" />
          </m.span>
        }
        delay={0}
      />

      {/* Step 2 — AI drafts response */}
      <FlowStep number={2} title="AI Automates Response">
        <ReviewPilotCard />
      </FlowStep>

      {/* Connector 2 → 3 */}
      <FlowConnector
        label="One-Click Publish"
        icon={<Send className="h-4 w-4" />}
        delay={1.2}
      />

      {/* Step 3 — Reply published */}
      <FlowStep number={3} title="Reply Published">
        <PlayStoreCard mode="published" />
      </FlowStep>

      {/* Loop indicator — spans full width on desktop */}
      <div className="lg:col-span-5">
        <div className="relative mt-2 flex items-center justify-center">
          <div
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.25)_15%,rgba(217,70,239,0.25)_85%,transparent)]"
          />
          <span className="relative inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <m.span
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="inline-flex"
            >
              <RefreshCw className="h-3.5 w-3.5 text-accent" />
            </m.span>
            Automation Loop Continues
          </span>
        </div>
      </div>
    </div>
  );
}

function FlowStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {/* Step pill — anchors to top of card, same vertical position across all 3 columns */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-xs font-semibold text-white shadow-sm shadow-indigo-500/30">
          {number}
        </span>
        <span className="text-sm font-semibold text-foreground sm:text-[15px]">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function FlowConnector({
  label,
  icon,
  delay = 0,
}: {
  label: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center py-2 lg:min-h-[300px] lg:py-0"
      aria-hidden
    >
      {/* Mobile/Tablet — vertical arrow with animated dashed flow */}
      <div className="flex flex-col items-center gap-2 lg:hidden">
        <m.span
          animate={{
            scale: [1, 1.12, 1],
            boxShadow: [
              "0 0 0 0 rgba(99,102,241,0)",
              "0 0 0 6px rgba(99,102,241,0.18)",
              "0 0 0 0 rgba(99,102,241,0)",
            ],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent"
        >
          {icon}
        </m.span>
        <span className="text-[11px] font-medium text-accent">{label}</span>
        <svg width="2" height="28" viewBox="0 0 2 28" className="overflow-visible">
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="28"
            stroke="rgba(99,102,241,0.3)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <m.line
            x1="1"
            y1="0"
            x2="1"
            y2="28"
            stroke="url(#flow-grad-v)"
            strokeWidth="2"
            strokeDasharray="6 22"
            initial={{ strokeDashoffset: 28 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "linear",
              delay,
            }}
          />
          <defs>
            <linearGradient id="flow-grad-v" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Desktop — horizontal arrow with animated dashed flow */}
      <div className="hidden flex-col items-center gap-2 lg:flex lg:w-24 xl:w-32">
        <span className="text-[11px] font-medium text-accent whitespace-nowrap">
          {label}
        </span>
        <m.span
          animate={{
            scale: [1, 1.12, 1],
            boxShadow: [
              "0 0 0 0 rgba(99,102,241,0)",
              "0 0 0 8px rgba(99,102,241,0.18)",
              "0 0 0 0 rgba(99,102,241,0)",
            ],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent"
        >
          {icon}
        </m.span>
        <svg
          width="100%"
          height="6"
          viewBox="0 0 100 6"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <line
            x1="0"
            y1="3"
            x2="100"
            y2="3"
            stroke="rgba(99,102,241,0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <m.line
            x1="0"
            y1="3"
            x2="100"
            y2="3"
            stroke="url(#flow-grad-h)"
            strokeWidth="2"
            strokeDasharray="10 90"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "linear",
              delay,
            }}
          />
          <defs>
            <linearGradient id="flow-grad-h" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Card mocks                                                              */
/* ----------------------------------------------------------------------- */

function CardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-xl shadow-black/5 backdrop-blur-sm sm:p-5">
      {children}
    </div>
  );
}

function PlayStoreHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GooglePlayIcon className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Google Play
        </span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <Search className="h-3.5 w-3.5" />
        <MoreVertical className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function AppRow() {
  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#fef3c7,#fde68a)] text-base">
        <span aria-hidden>$</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          Super Coin – Daily Rewards
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          YKC Innovations
        </p>
      </div>
    </div>
  );
}

function ReviewBlock() {
  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-background/40 p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-9 1.7-9 5v1h18v-1c0-3.3-5.7-5-9-5z" />
          </svg>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={
                i <= 3
                  ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  : "h-3.5 w-3.5 text-border"
              }
            />
          ))}
        </div>
        <span className="ml-auto text-[10px] text-muted-foreground">
          9 Apr 2026
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-foreground">
        It&apos;s a good app — little improvement needed and optimization too.
      </p>
      <p className="mt-2 text-[10px] text-muted-foreground">
        2 people found this review helpful
      </p>
    </div>
  );
}

function PlayStoreCard({ mode }: { mode: "incoming" | "published" }) {
  return (
    <CardFrame>
      <PlayStoreHeader />
      <AppRow />
      <ReviewBlock />

      {mode === "incoming" && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            Did you find this helpful?
          </span>
          <span className="rounded-md border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            Yes
          </span>
          <span className="rounded-md border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            No
          </span>
        </div>
      )}

      {mode === "published" && (
        <div className="mt-3 rounded-xl border border-indigo-200/40 bg-[linear-gradient(135deg,rgba(99,102,241,0.08),rgba(217,70,239,0.05))] p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-foreground">
              YKC Innovations
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 fill-indigo-500 text-white" />
            <span className="ml-auto text-[10px] text-muted-foreground">
              10 Apr 2026
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-foreground">
            Hi there! Thanks for your feedback and 3-star rating. We&apos;re
            always working to improve Super Coin and deliver the best experience
            possible. Your suggestions mean a lot — keep rewarding! 💪
          </p>
        </div>
      )}
    </CardFrame>
  );
}

/* ----------------------------------------------------------------------- */
/*  Phase machine timing (ms) for ReviewPilotCard                            */
/* ----------------------------------------------------------------------- */

const REPLY_TEXT =
  "Hi there! Thanks for your feedback and 3-star rating. We're always working to improve Super Coin and deliver the best experience possible. Your suggestions mean a lot — keep rewarding! 💪";

const PHASE = {
  // typing chars one at a time
  TYPE_PER_CHAR: 22,
  TYPE_TOTAL: REPLY_TEXT.length * 22, // ≈ 4.6s
  // pause after typing finishes
  PAUSE_AFTER_TYPING: 700,
  // cursor travels from top-right to button
  CURSOR_MOVE: 1100,
  // button pressed
  CLICK_DOWN: 200,
  // toast visible
  TOAST_HOLD: 2400,
  // gap before restart
  RESET_GAP: 600,
};

type Phase = "typing" | "cursor" | "click" | "published" | "reset";

function ReviewPilotCard() {
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    function clearAll() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function runCycle() {
      if (cancelled) return;
      // 1) TYPING — char by char
      setPhase("typing");
      setCharCount(0);
      let i = 0;
      function typeStep() {
        if (cancelled) return;
        i++;
        setCharCount(i);
        if (i < REPLY_TEXT.length) {
          timers.push(setTimeout(typeStep, PHASE.TYPE_PER_CHAR));
        } else {
          // 2) PAUSE → CURSOR
          timers.push(
            setTimeout(() => {
              if (cancelled) return;
              setPhase("cursor");
              // 3) CURSOR moves, then CLICK
              timers.push(
                setTimeout(() => {
                  if (cancelled) return;
                  setPhase("click");
                  // 4) CLICK → PUBLISHED toast
                  timers.push(
                    setTimeout(() => {
                      if (cancelled) return;
                      setPhase("published");
                      // 5) hold then reset
                      timers.push(
                        setTimeout(() => {
                          if (cancelled) return;
                          setPhase("reset");
                          timers.push(setTimeout(runCycle, PHASE.RESET_GAP));
                        }, PHASE.TOAST_HOLD)
                      );
                    }, PHASE.CLICK_DOWN)
                  );
                }, PHASE.CURSOR_MOVE)
              );
            }, PHASE.PAUSE_AFTER_TYPING)
          );
        }
      }
      typeStep();
    }

    runCycle();
    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  return (
    <CardFrame>
      {/* Position-relative wrapper so we can absolutely place the cursor + toast */}
      <div className="relative">
        {/* Header — real ReviewPilot logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="ReviewPilot"
              className="h-6 w-6 shrink-0"
            />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              ReviewPilot
            </span>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-[10px] font-semibold text-white">
            D
          </span>
        </div>

      {/* Fetched review */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Fetched Review
        </p>
        <div className="rounded-xl border border-border/50 bg-background/40 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-9 1.7-9 5v1h18v-1c0-3.3-5.7-5-9-5z" />
              </svg>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={
                    i <= 3
                      ? "h-3 w-3 fill-amber-400 text-amber-400"
                      : "h-3 w-3 text-border"
                  }
                />
              ))}
            </div>
            <span className="ml-auto text-[10px] text-muted-foreground">
              9 Apr 2026
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-foreground">
            It&apos;s a good app — little improvement needed and optimization
            too.
          </p>
        </div>
      </div>

      {/* AI Drafted Response — animated typing */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            <m.span
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex"
            >
              <Sparkles className="h-3 w-3" />
            </m.span>
            AI Drafted Response
          </span>
          <m.span
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(99,102,241,0.0)",
                "0 0 0 4px rgba(99,102,241,0.18)",
                "0 0 0 0 rgba(99,102,241,0.0)",
              ],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
          >
            AI
          </m.span>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-accent/30 bg-accent/[0.04] p-3">
          {/* Shimmer sweep — indicates active generation */}
          <m.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.12),transparent)]"
            animate={{ left: ["-33%", "133%"] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 0.8,
            }}
          />
          <TypingReply charCount={charCount} />
          <div className="relative mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[10px] text-muted-foreground">
              Tone: Friendly
              <ChevronDown className="h-3 w-3" />
            </span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              203 / 350
            </span>
          </div>
        </div>
      </div>

        {/* Approve button — scales when "clicked" by the demo cursor */}
        <m.button
          type="button"
          animate={
            phase === "click"
              ? { scale: 0.95 }
              : {
                  scale: 1,
                  boxShadow: [
                    "0 6px 18px -6px rgba(99,102,241,0.45)",
                    "0 8px 24px -4px rgba(217,70,239,0.55)",
                    "0 6px 18px -6px rgba(99,102,241,0.45)",
                  ],
                }
          }
          transition={
            phase === "click"
              ? { duration: 0.18, ease: "easeOut" }
              : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
          className="mt-4 flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-3 py-2.5 text-[13px] font-semibold text-white sm:text-sm"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="truncate">Approve &amp; Auto-Post</span>
          <Send className="h-4 w-4 shrink-0" />
        </m.button>

        {/* Demo cursor — appears after typing, glides to button, "clicks" */}
        <AnimatePresence>
          {(phase === "cursor" || phase === "click") && (
            <m.div
              key="demo-cursor"
              aria-hidden
              initial={{ top: "8%", left: "82%", opacity: 0, scale: 0.6 }}
              animate={
                phase === "cursor"
                  ? { top: "92%", left: "50%", opacity: 1, scale: 1 }
                  : { top: "92%", left: "50%", opacity: 1, scale: 0.85 }
              }
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{
                duration: phase === "cursor" ? 1.0 : 0.15,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
            >
              {/* Click ripple */}
              {phase === "click" && (
                <m.span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent"
                  initial={{ width: 0, height: 0, opacity: 0.7 }}
                  animate={{ width: 36, height: 36, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              )}
              <MousePointer2
                className="h-5 w-5 rotate-12 fill-foreground text-foreground drop-shadow-md"
                strokeWidth={1.5}
              />
            </m.div>
          )}
        </AnimatePresence>

        {/* "Reply published" toast — slides up after click */}
        <AnimatePresence>
          {phase === "published" && (
            <m.div
              key="published-toast"
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-0 z-30 flex justify-center"
            >
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3.5 py-2.5 shadow-lg shadow-emerald-500/20 dark:border-emerald-500/30 dark:bg-emerald-950/60">
                <m.span
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 16,
                    delay: 0.05,
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                </m.span>
                <div className="text-left">
                  <p className="text-[12px] font-semibold leading-tight text-emerald-900 dark:text-emerald-100">
                    Reply Published
                  </p>
                  <p className="text-[10px] leading-tight text-emerald-700/80 dark:text-emerald-300/80">
                    Live on Google Play
                  </p>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </CardFrame>
  );
}

/**
 * Renders the AI reply text driven by parent's char-count progress so the
 * typing animation can be choreographed with cursor + click + toast.
 * Reserves final height so layout never jumps mid-cycle.
 */
function TypingReply({ charCount }: { charCount: number }) {
  const text = REPLY_TEXT;
  const isTyping = charCount < text.length;

  return (
    <p
      className="relative text-[12px] leading-snug text-foreground"
      style={{ minHeight: "5.5em" }}
    >
      {text.slice(0, charCount)}
      {isTyping && (
        <m.span
          aria-hidden
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          className="ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 bg-accent align-baseline"
        />
      )}
    </p>
  );
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#34A853"
        d="M3.6 21.3c-.4-.2-.6-.7-.6-1.2V3.9c0-.5.2-1 .6-1.2l9.7 9.3-9.7 9.3z"
      />
      <path
        fill="#FBBC04"
        d="M16.6 16.4l-3.3-3.3 3.3-3.3 4.1 2.3c.8.5.8 1.6 0 2l-4.1 2.3z"
      />
      <path
        fill="#EA4335"
        d="M13.3 12l-9.7 9.3c.3.2.7.2 1.2-.1L16.6 16l-3.3-4z"
      />
      <path
        fill="#4285F4"
        d="M13.3 12L4.8 2.8c-.5-.3-.9-.3-1.2-.1L13.3 12z"
      />
    </svg>
  );
}
