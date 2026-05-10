"use client";

import Link from "next/link";
import {
  Bot,
  MessageSquareText,
  MessageCircle,
  Inbox,
  BarChart3,
  Globe2,
  Sparkles,
  Star,
  Zap,
  Users,
  ArrowRight,
} from "lucide-react";

const WHATSAPP_GREEN = "#25D366";
import { cn } from "@/lib/utils";
import { m, MotionProvider, fadeUp, stagger } from "@/components/motion/primitives";

/**
 * Bento grid — varied card sizes on lg+. Each card has a small live visual.
 * Hover adds a soft accent glow.
 */
export function FeatureGrid() {
  return (
    <MotionProvider>
      <section id="features" className="relative overflow-hidden py-24 sm:py-32">
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
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
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
              title="One unified inbox, three platforms"
              description="Play Store, Google Business Profile, and WhatsApp Business messages all land in one queue. Filter, search, bulk-approve."
              visual={<InboxVisual />}
              href="/unified-inbox"
            />

            {/* Medium — Analytics */}
            <BentoCard
              icon={BarChart3}
              title="Sentiment, trends, keywords"
              description="Know exactly what customers love and where you're losing stars."
              visual={<SentimentVisual />}
            />

            {/* Large — WhatsApp Business */}
            <BentoCard
              className="lg:col-span-2"
              icon={MessageCircle}
              iconAccent={WHATSAPP_GREEN}
              title="WhatsApp Business automation, AI-powered"
              description="AI replies to every customer WhatsApp message — connected in 60 seconds via Meta Embedded Signup, fully Meta-approved. Replies inside the 24-hour window are free."
              visual={<WhatsAppVisual />}
              href="/whatsapp-automation"
            />

            {/* Medium — SMS collection */}
            <BentoCard
              icon={MessageSquareText}
              title="Collect 5★ reviews on autopilot"
              description="SMS campaigns route happy customers straight to Google; critical ones land in private feedback."
              visual={<SmsVisual />}
              soon
            />

            {/* Wide — Team collaboration */}
            <BentoCard
              className="lg:col-span-2"
              icon={Users}
              title="Built for teams"
              description="Invite teammates as Admins (full reply and connection access) or Read-only viewers — collaborate on Play Store and Google replies without sharing a login or your billing details."
              visual={<TeamVisual />}
            />
          </m.div>

          {/* Secondary row — smaller utility cards */}
          <m.div
            variants={stagger(0.05, 0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-4 grid gap-4 sm:grid-cols-3"
          >
            <MiniCard icon={Globe2} title="8 Indian languages" />
            <MiniCard icon={Zap} title="3-second drafts" />
            <MiniCard icon={Sparkles} title="Auto-publish rules" />
          </m.div>

          <div className="mt-10 text-center">
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              See all features
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
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
  href,
  iconAccent,
}: {
  icon: typeof Bot;
  title: string;
  description: string;
  visual: React.ReactNode;
  className?: string;
  soon?: boolean;
  href?: string;
  iconAccent?: string;
}) {
  const inner = (
    <>
      <div className="relative flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60"
          style={iconAccent ? { color: iconAccent } : undefined}
        >
          <Icon className={cn("h-4 w-4", !iconAccent && "text-accent")} />
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
      {href && (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent">
          Learn more
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  );

  const sharedClass = cn(
    "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm",
    "transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_40px_-12px_hsl(var(--ring)/0.4)]",
    className,
  );

  if (href) {
    return (
      <m.div variants={fadeUp} className={sharedClass + " block"}>
        <Link href={href} className="absolute inset-0 z-10" aria-label={title} />
        {inner}
      </m.div>
    );
  }

  return (
    <m.div variants={fadeUp} className={sharedClass}>
      {inner}
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
  const rows: { src: string; color?: string; whatsapp?: boolean; label: string }[] = [
    {
      src: "Play Store",
      color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      label: "New review · replied",
    },
    {
      src: "WhatsApp",
      whatsapp: true,
      label: "New message · AI drafted",
    },
    {
      src: "Google",
      color: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
      label: "New review · auto-replied",
    },
  ];
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[11px]"
        >
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              !r.whatsapp && r.color,
            )}
            style={
              r.whatsapp
                ? {
                    backgroundColor: `${WHATSAPP_GREEN}22`,
                    color: WHATSAPP_GREEN,
                  }
                : undefined
            }
          >
            {r.src}
          </span>
          <span className="flex-1 truncate text-muted-foreground">
            {r.label}
          </span>
          {!r.whatsapp && (
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          )}
        </div>
      ))}
    </div>
  );
}

function WhatsAppVisual() {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 text-[11px]">
      {/* Inbound */}
      <div className="flex">
        <div
          className="rounded-2xl rounded-bl-sm px-3 py-2 leading-relaxed max-w-[80%]"
          style={{
            backgroundColor: `${WHATSAPP_GREEN}14`,
            color: "currentColor",
          }}
        >
          <span className="font-medium">+91 98•••• 12345</span>
          <p className="mt-0.5 text-foreground/85">
            Hi, can I cancel the order I placed an hour ago?
          </p>
        </div>
      </div>
      {/* AI drafting */}
      <div className="flex items-center gap-1.5 text-accent">
        <Sparkles className="h-3 w-3" />
        AI drafting
        <span className="inline-flex gap-0.5">
          <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
          <span className="h-1 w-1 rounded-full bg-accent animate-pulse [animation-delay:0.15s]" />
          <span className="h-1 w-1 rounded-full bg-accent animate-pulse [animation-delay:0.3s]" />
        </span>
      </div>
      {/* Outbound draft */}
      <div className="flex justify-end">
        <div
          className="rounded-2xl rounded-br-sm border px-3 py-2 leading-relaxed max-w-[80%]"
          style={{
            backgroundColor: `${WHATSAPP_GREEN}10`,
            borderColor: `${WHATSAPP_GREEN}55`,
          }}
        >
          <p className="text-foreground/85">
            Hi! Yes — orders can be cancelled within 30 mins. I&apos;ll
            cancel #4821 and refund instantly.
          </p>
          <span
            className="mt-1 inline-flex items-center gap-1 text-[9px] font-medium"
            style={{ color: WHATSAPP_GREEN }}
          >
            ✓✓ Inside 24-hour window — free
          </span>
        </div>
      </div>
    </div>
  );
}

function SentimentVisual() {
  return (
    <div className="flex h-full min-h-[140px] flex-col">
      <div className="flex flex-1 items-end gap-1">
        {[40, 55, 48, 70, 62, 85, 95].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-[linear-gradient(180deg,rgba(99,102,241,0.8),rgba(139,92,246,0.2))]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        <span>Mon</span>
        <span>Sun</span>
      </div>
    </div>
  );
}

function TeamVisual() {
  const ROWS = [
    { name: "Priya S.", role: "Owner", badge: "bg-accent/15 text-accent" },
    { name: "Aman R.", role: "Admin", badge: "bg-blue-500/15 text-blue-600" },
    {
      name: "Neha K.",
      role: "Read-only",
      badge: "bg-muted-foreground/15 text-muted-foreground",
    },
  ];
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      {ROWS.map((m) => (
        <div
          key={m.name}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[11px]"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
            {m.name.charAt(0)}
          </span>
          <span className="flex-1 truncate text-foreground/80">{m.name}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              m.badge,
            )}
          >
            {m.role}
          </span>
        </div>
      ))}
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
