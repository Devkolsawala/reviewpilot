"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { YOUTUBE_DEMO_URL } from "@/lib/constants";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
import { m, MotionProvider, fadeUp, stagger } from "@/components/motion/primitives";
import {
  ArrowRight,
  Star,
  Sparkles,
  ChevronDown,
  MessageSquare,
  TrendingUp,
  Play,
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

          {/* Product preview — tilted dashboard frame */}
          <m.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto mt-16 max-w-5xl [perspective:2000px]"
          >
            <div className="absolute -inset-x-16 -inset-y-8 rounded-[3rem] bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] blur-3xl -z-10" />
            <div className="relative rounded-2xl border border-border/60 bg-card/80 p-1.5 shadow-2xl shadow-black/20 backdrop-blur-sm">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="mx-auto flex h-6 max-w-xs items-center justify-center rounded-md bg-muted/60 px-3 text-[11px] text-muted-foreground font-mono">
                    app.reviewpilot.co.in/inbox
                  </div>
                </div>
              </div>

              {/* Dashboard mock content */}
              <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_1.2fr]">
                {/* Review card */}
                <div className="rounded-xl border border-border/60 bg-background/60 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-xs font-semibold text-white">
                      RS
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Rahul Sharma
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={
                              i <= 2
                                ? "h-3 w-3 fill-amber-400 text-amber-400"
                                : "h-3 w-3 text-border"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      2h ago
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    App crashes every time I try to download a status. Please fix!
                  </p>
                  <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-accent">
                      <Sparkles className="h-3 w-3" />
                      AI draft · brand voice
                    </div>
                    <p className="mt-1.5 text-sm text-foreground leading-relaxed">
                      We&apos;re sorry about the crashes, Rahul. Our team has
                      shipped a fix in v2.3.1 — please update. Thank you for your
                      patience!
                    </p>
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 rounded-md bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] py-1.5 text-center text-[11px] font-medium text-white">
                        Approve & publish
                      </div>
                      <div className="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
                        Edit
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Avg rating" value="4.6" trend="+0.3" />
                    <StatCard label="Response rate" value="98%" trend="+42%" />
                    <StatCard label="Reviews / wk" value="247" trend="+18" />
                  </div>

                  {/* Mini chart */}
                  <div className="flex-1 rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Reviews over time
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500">
                        <TrendingUp className="h-3 w-3" />
                        +24%
                      </span>
                    </div>
                    <div className="mt-4 flex h-24 items-end gap-1.5">
                      {[30, 45, 38, 60, 52, 72, 68, 85, 78, 92, 88, 100].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-[linear-gradient(180deg,rgba(99,102,241,0.6),rgba(139,92,246,0.2))]"
                            style={{ height: `${h}%` }}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
                    <MessageSquare className="h-4 w-4 text-accent" />
                    <span className="text-xs text-muted-foreground">
                      12 new reviews replied overnight
                    </span>
                  </div>
                </div>
              </div>
            </div>
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

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[10px] text-emerald-500">{trend}</p>
    </div>
  );
}
