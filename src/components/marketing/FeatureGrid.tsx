"use client";

import {
  Bot,
  MessageSquareText,
  Inbox,
  BarChart3,
  Globe2,
  Building2,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { m, MotionProvider, fadeUp, stagger } from "@/components/motion/primitives";

/**
 * Bento grid — varied card sizes on lg+. Each card has a small live visual.
 * Hover adds a soft accent glow.
 */
export function FeatureGrid() {
  return (
    <MotionProvider>
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Every tool you need
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              The complete review toolkit,
              <br />
              <span className="text-gradient-brand">in one unified inbox.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              AI replies, sentiment analytics, SMS collection, and multi-app
              dashboards — replacing a stack of tools with one.
            </p>
          </m.div>

          <m.div
            variants={stagger(0.05, 0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto]"
          >
            {/* Large — AI auto replies */}
            <BentoCard
              className="lg:col-span-2"
              icon={Bot}
              title="AI replies that sound like you wrote them"
              description="Trained on your brand voice and App Context Profile. Generates replies in 3 seconds, in the reviewer's language, within platform character limits."
              visual={<AiReplyVisual />}
            />

            {/* Medium — Unified inbox */}
            <BentoCard
              icon={Inbox}
              title="One inbox, every surface"
              description="Google Business Profile and Play Store reviews land in one queue. Filter, search, bulk-approve."
              visual={<InboxVisual />}
            />

            {/* Medium — Analytics */}
            <BentoCard
              icon={BarChart3}
              title="Sentiment, trends, keywords"
              description="Know exactly what customers love and where you're losing stars."
              visual={<SentimentVisual />}
            />

            {/* Large — SMS collection */}
            <BentoCard
              className="lg:col-span-2"
              icon={MessageSquareText}
              title="Collect 5★ reviews on autopilot"
              description="SMS campaigns route happy customers straight to Google; critical ones land in private feedback. Protect the public rating automatically."
              visual={<SmsVisual />}
              soon
            />
          </m.div>

          {/* Secondary row — smaller utility cards */}
          <m.div
            variants={stagger(0.05, 0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <MiniCard icon={Globe2} title="8 Indian languages" />
            <MiniCard icon={Building2} title="Agency white-label" />
            <MiniCard icon={Zap} title="3-second drafts" />
            <MiniCard icon={Sparkles} title="Auto-publish rules" />
          </m.div>
        </div>
      </section>
    </MotionProvider>
  );
}

function BentoCard({
  icon: Icon,
  title,
  description,
  visual,
  className,
  soon,
}: {
  icon: typeof Bot;
  title: string;
  description: string;
  visual: React.ReactNode;
  className?: string;
  soon?: boolean;
}) {
  return (
    <m.div
      variants={fadeUp}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm",
        "transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_40px_-12px_hsl(var(--ring)/0.4)]",
        className,
      )}
    >
      <div className="relative flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
          <Icon className="h-4 w-4" />
        </div>
        {soon && (
          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="mt-5 font-sans text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      <div className="mt-6 flex-1">{visual}</div>
    </m.div>
  );
}

function MiniCard({ icon: Icon, title }: { icon: typeof Bot; title: string }) {
  return (
    <m.div
      variants={fadeUp}
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm transition-colors hover:border-accent/40"
    >
      <Icon className="h-4 w-4 text-accent shrink-0" />
      <span className="text-sm font-medium">{title}</span>
    </m.div>
  );
}

/* ------------- mini visuals ------------- */

function AiReplyVisual() {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 font-mono text-[11px]">
      <p className="text-muted-foreground">
        <span className="text-rose-400">★★</span>
        <span className="text-border">★★★</span>
        {" · "}App keeps crashing on my Redmi 🙁
      </p>
      <div className="flex items-center gap-1.5 text-accent">
        <Sparkles className="h-3 w-3" />
        <span className="inline-flex items-center gap-1">
          AI drafting
          <span className="inline-flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse [animation-delay:0.15s]" />
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse [animation-delay:0.3s]" />
          </span>
        </span>
      </div>
      <p className="text-foreground/90 leading-relaxed">
        Sorry about the crashes — we shipped a Redmi-specific fix in v2.3.1.
        Please update and let us know!
      </p>
    </div>
  );
}

function InboxVisual() {
  return (
    <div className="space-y-1.5">
      {[
        { src: "Play Store", color: "bg-emerald-500/15 text-emerald-600" },
        { src: "Google Business", color: "bg-blue-500/15 text-blue-600" },
        { src: "Play Store", color: "bg-emerald-500/15 text-emerald-600" },
      ].map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[11px]"
        >
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", r.color)}>
            {r.src}
          </span>
          <span className="flex-1 truncate text-muted-foreground">
            New review · replied
          </span>
          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
        </div>
      ))}
    </div>
  );
}

function SentimentVisual() {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-16">
        {[40, 55, 48, 70, 62, 85, 95].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-[linear-gradient(180deg,rgba(99,102,241,0.8),rgba(139,92,246,0.2))]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        <span>Mon</span>
        <span>Sun</span>
      </div>
    </div>
  );
}

function SmsVisual() {
  return (
    <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 leading-relaxed">
        <div className="text-emerald-600 dark:text-emerald-400">4–5 ★</div>
        <div className="text-foreground/80">→ Google Reviews</div>
      </div>
      <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-2 leading-relaxed">
        <div className="text-rose-600 dark:text-rose-400">1–3 ★</div>
        <div className="text-foreground/80">→ Private feedback</div>
      </div>
    </div>
  );
}
