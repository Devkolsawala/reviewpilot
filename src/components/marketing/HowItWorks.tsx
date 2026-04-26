"use client";

import { Link2, Bot, TrendingUp, Check } from "lucide-react";
import { m, MotionProvider, fadeUp, stagger } from "@/components/motion/primitives";

const STEPS = [
  {
    num: "01",
    icon: Link2,
    title: "Connect in two minutes",
    description:
      "Link Google Business Profile in one click or upload a Play Console service account. Your existing reviews sync instantly.",
    snippet: <ConnectSnippet />,
  },
  {
    num: "02",
    icon: Bot,
    title: "AI drafts every reply",
    description:
      "ReviewPilot watches new reviews, drafts replies in your brand voice, and respects each platform's character limits and language.",
    snippet: <DraftSnippet />,
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Approve or auto-publish",
    description:
      "Review the queue in seconds, set auto-publish rules for high-confidence ratings, and watch your response rate climb to 98%.",
    snippet: <PublishSnippet />,
  },
];

export function HowItWorks() {
  return (
    <MotionProvider>
      <section className="relative py-24 sm:py-32 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
              From sign-up to zero inbox in a morning.
            </h2>
          </div>

          <m.ol
            variants={stagger(0.1, 0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="relative mt-16 grid gap-8 md:grid-cols-3"
          >
            {/* Connecting timeline */}
            <div
              aria-hidden
              className="hidden md:block absolute left-0 right-0 top-6 h-px bg-gradient-to-r from-transparent via-border to-transparent"
            />
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <m.li key={s.num} variants={fadeUp} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background shadow-sm">
                      <Icon className="h-4 w-4 text-accent" />
                      <span className="absolute -top-2 -right-2 font-mono text-[10px] rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-1.5 py-0.5 text-white">
                        {s.num}
                      </span>
                    </span>
                  </div>
                  <h3 className="mt-5 font-sans text-lg font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                  <div className="mt-5">{s.snippet}</div>
                </m.li>
              );
            })}
          </m.ol>
        </div>
      </section>
    </MotionProvider>
  );
}

function ConnectSnippet() {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3 text-xs backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-mono text-muted-foreground">GBP connected</span>
      </div>
      <div className="mt-2 font-mono text-muted-foreground">
        <div>· Syncing locations…</div>
        <div className="text-emerald-600 dark:text-emerald-400">
          <Check className="inline h-3 w-3" /> 3 locations, 248 reviews
        </div>
      </div>
    </div>
  );
}

function DraftSnippet() {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3 text-xs backdrop-blur-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-accent">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        <span className="font-mono">streaming</span>
      </div>
      <p className="text-foreground/90 leading-relaxed">
        Thank you, Priya! Glad you loved the butter chicken — we&apos;ll pass the
        compliment on to chef Rahul
        <span className="ml-0.5 inline-block h-3 w-[1px] bg-foreground animate-pulse" />
      </p>
    </div>
  );
}

function PublishSnippet() {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3 text-xs backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono text-muted-foreground">Auto-publish · 4–5★</span>
        <span className="inline-flex h-5 w-8 items-center rounded-full bg-accent px-0.5">
          <span className="h-4 w-4 rounded-full bg-white translate-x-3" />
        </span>
      </div>
      <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-mono">
        <Check className="inline h-3 w-3" /> 12 replies published today
      </div>
    </div>
  );
}
