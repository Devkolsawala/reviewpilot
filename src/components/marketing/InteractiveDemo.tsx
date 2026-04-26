"use client";

import { useEffect, useState } from "react";
import { Inbox, Bot, BarChart3, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { m, MotionProvider, AnimatePresence } from "@/components/motion/primitives";

const STEPS = [
  {
    key: "inbox",
    icon: Inbox,
    label: "Unified inbox",
    caption: "Every Play Store and Google review in one queue.",
  },
  {
    key: "draft",
    icon: Bot,
    label: "AI drafts the reply",
    caption: "Brand voice, character limits, reviewer's language.",
  },
  {
    key: "analytics",
    icon: BarChart3,
    label: "Spot trends early",
    caption: "Sentiment, keywords, and rating drift — in real time.",
  },
  {
    key: "sms",
    icon: MessageSquare,
    label: "Collect 5★ reviews",
    caption: "SMS campaigns route happy customers to Google automatically.",
  },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function InteractiveDemo() {
  const [active, setActive] = useState<StepKey>("inbox");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setActive((cur) => {
        const idx = STEPS.findIndex((s) => s.key === cur);
        return STEPS[(idx + 1) % STEPS.length].key;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <MotionProvider>
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mx-auto w-fit text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Take the tour
            </p>
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
              Four screens. One product loop.
            </h2>
          </div>

          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="mt-12 grid gap-6 lg:grid-cols-[280px_1fr]"
          >
            {/* Side nav */}
            <nav
              aria-label="Demo steps"
              className="grid grid-cols-2 gap-2 lg:flex lg:flex-col"
            >
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isActive = s.key === active;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActive(s.key)}
                    className={cn(
                      "relative flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-3 text-left transition-colors",
                      isActive
                        ? "border-accent/50 bg-card"
                        : "hover:border-border hover:bg-card/60",
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r bg-[linear-gradient(180deg,#6366f1,#d946ef)]"
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        isActive ? "text-accent" : "text-muted-foreground",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{s.label}</p>
                      <p className="mt-0.5 hidden text-xs text-muted-foreground lg:block">
                        {s.caption}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Screen */}
            <div className="relative aspect-[16/10] rounded-2xl border border-border/60 bg-card/60 p-1.5 shadow-xl shadow-black/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-rose-400/70" />
                  <div className="h-2 w-2 rounded-full bg-amber-400/70" />
                  <div className="h-2 w-2 rounded-full bg-emerald-400/70" />
                </div>
                <div className="mx-auto rounded-md bg-muted/60 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  app.reviewpilot.co.in
                </div>
              </div>

              <div className="relative h-[calc(100%-2rem)] overflow-hidden p-6">
                <AnimatePresence mode="wait">
                  <m.div
                    key={active}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full"
                  >
                    {active === "inbox" && <InboxScreen />}
                    {active === "draft" && <DraftScreen />}
                    {active === "analytics" && <AnalyticsScreen />}
                    {active === "sms" && <SmsScreen />}
                  </m.div>
                </AnimatePresence>
              </div>

              {/* Progress */}
              <div className="absolute inset-x-6 bottom-3 flex gap-1.5">
                {STEPS.map((s) => (
                  <div
                    key={s.key}
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      s.key === active ? "bg-accent" : "bg-border",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </MotionProvider>
  );
}

function InboxScreen() {
  return (
    <div className="flex h-full gap-4">
      <div className="w-48 space-y-1 text-xs">
        {["All · 247", "Unreplied · 12", "5★ · 184", "1–2★ · 6"].map((l, i) => (
          <div
            key={l}
            className={cn(
              "rounded-md px-2.5 py-1.5",
              i === 1 ? "bg-accent/15 text-accent" : "text-muted-foreground",
            )}
          >
            {l}
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-2">
        {[
          { n: "Priya M.", stars: 5, text: "Best butter chicken in Koramangala." },
          { n: "Arjun K.", stars: 2, text: "Delivery was 45 min late twice." },
          { n: "Nisha A.", stars: 5, text: "Friendly staff, quick service." },
        ].map((r) => (
          <div
            key={r.n}
            className="rounded-lg border border-border/60 bg-background/60 p-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{r.n}</span>
              <span className="font-mono text-muted-foreground">
                {"★".repeat(r.stars)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DraftScreen() {
  return (
    <div className="grid h-full gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-border/60 bg-background/60 p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Original review
        </p>
        <p className="mt-2 text-sm">
          Food was great but my bill had an extra dish I didn&apos;t order. Please
          check your billing.
        </p>
        <div className="mt-3 font-mono text-[10px] text-muted-foreground">
          ★★★☆☆ · Google Business · 2h ago
        </div>
      </div>
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
        <p className="text-[10px] uppercase tracking-wider text-accent">
          AI draft · brand voice
        </p>
        <p className="mt-2 text-sm text-foreground/90 leading-relaxed">
          So sorry about the billing mixup — we&apos;ve flagged this to our
          manager. Please DM us your bill details and we&apos;ll refund
          immediately. Glad you enjoyed the food!
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-6 flex-1 rounded-md bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] text-center text-[10px] font-medium text-white leading-6">
            Approve
          </div>
          <div className="h-6 rounded-md border border-border/60 px-3 text-[10px] leading-6 text-muted-foreground">
            Edit
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsScreen() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Avg rating", v: "4.6", t: "+0.4" },
          { l: "Response rate", v: "98%", t: "+42%" },
          { l: "Negative share", v: "6%", t: "-4%" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-lg border border-border/60 bg-background/60 p-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.l}
            </p>
            <p className="mt-1 font-mono text-xl font-semibold">{s.v}</p>
            <p className="text-[10px] text-emerald-500">{s.t}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-lg border border-border/60 bg-background/60 p-4">
        <div className="flex h-full items-end gap-1.5">
          {Array.from({ length: 20 }).map((_, i) => {
            const h = 30 + Math.sin(i / 2) * 25 + i * 2.5;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm bg-[linear-gradient(180deg,rgba(99,102,241,0.7),rgba(139,92,246,0.15))]"
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SmsScreen() {
  return (
    <div className="grid h-full gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-border/60 bg-background/60 p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          SMS campaign
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          Hi Ravi, thanks for dining with us at Paloma today! We&apos;d love your
          feedback — tap to rate us ↓
        </p>
        <div className="mt-3 rounded-md bg-muted/40 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
          paloma.link/r/3xk8
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
          <p className="font-mono text-emerald-600 dark:text-emerald-400">
            4–5 ★ →
          </p>
          <p className="mt-1 text-foreground/80">Public Google review</p>
        </div>
        <div className="flex-1 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs">
          <p className="font-mono text-rose-600 dark:text-rose-400">
            1–3 ★ →
          </p>
          <p className="mt-1 text-foreground/80">Private feedback form</p>
        </div>
      </div>
    </div>
  );
}
