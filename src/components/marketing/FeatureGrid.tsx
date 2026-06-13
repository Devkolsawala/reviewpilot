"use client";

import Link from "next/link";
import {
  Star,
  Sparkles,
  ArrowRight,
  Bell,
  Clock,
  Users,
  Lock,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";

const WHATSAPP_GREEN = "#25D366";
import { cn } from "@/lib/utils";
import {
  m,
  MotionProvider,
  fadeUp,
  stagger,
} from "@/components/motion/primitives";
import { liveFeatures, comingSoonFeatures } from "@/lib/marketing/features";

/**
 * Bento grid — varied card sizes on lg+. Cards are driven by the central
 * feature data in src/lib/marketing/features.ts; only the per-feature visual
 * and grid span are presentational and live here.
 */

// Presentational config keyed by feature id. Hero differentiators come first
// from liveFeatures() ordering, so Review Recovery + AI Insights lead the grid.
const LAYOUT: Record<
  string,
  { span?: string; visual?: React.ReactNode; iconAccent?: string }
> = {
  review_recovery_engine: { span: "lg:col-span-2", visual: <RecoveryVisual /> },
  ai_insights: { visual: <InsightsVisual /> },
  ai_auto_replies: { span: "lg:col-span-2", visual: <AiReplyVisual /> },
  play_store_reviews: { visual: <InboxVisual /> },
  whatsapp_business_automation: {
    span: "lg:col-span-2",
    visual: <WhatsAppVisual />,
    iconAccent: WHATSAPP_GREEN,
  },
  sentiment_analytics: { visual: <SentimentVisual /> },
  review_alerts: { visual: <AlertsVisual /> },
  aso_analysis: { span: "lg:col-span-2", visual: <AsoVisual /> },
  version_impact: { span: "lg:col-span-3", visual: <VersionImpactVisual /> },
};

export function FeatureGrid() {
  const features = liveFeatures();
  const soon = comingSoonFeatures();

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
              Review recovery, AI insights, AI replies, and sentiment analytics
              — replacing a stack of tools with one.
            </p>
          </m.div>

          <m.div
            variants={stagger(0.05, 0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-4 lg:grid-cols-3"
          >
            {features.map((f) => {
              const layout = LAYOUT[f.id] ?? {};
              return (
                <BentoCard
                  key={f.id}
                  className={layout.span}
                  icon={f.icon}
                  iconAccent={layout.iconAccent}
                  title={f.title}
                  description={f.description}
                  visual={layout.visual ?? <DefaultVisual />}
                  href={f.href}
                />
              );
            })}

            {/* Team collaboration — live, but not part of the headline matrix */}
            <BentoCard
              className="lg:col-span-3"
              icon={Users}
              title="Built for teams"
              description="Invite teammates as Admins (full reply and connection access) or Read-only viewers — collaborate on replies without sharing a login or your billing details."
              visual={<TeamVisual />}
            />
          </m.div>

          {/* Coming soon — roadmap signal, not a headline card */}
          {soon.length > 0 && (
            <m.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Coming soon:
              </span>
              {soon.map((f, i) => (
                <span key={f.id} className="inline-flex items-center gap-2">
                  {f.href ? (
                    <Link
                      href={f.href}
                      className="underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {f.title}
                    </Link>
                  ) : (
                    <span>{f.title}</span>
                  )}
                  {i < soon.length - 1 && (
                    <span aria-hidden="true" className="text-border">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </m.p>
          )}

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
  href,
  iconAccent,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  visual: React.ReactNode;
  className?: string;
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

/* ------------- mini visuals ------------- */

function RecoveryVisual() {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 font-mono text-[11px]">
      <p className="text-muted-foreground">
        <span className="text-rose-400">★</span>
        <span className="text-border">★★★★</span>
        {" · "}Refund never arrived, very disappointed.
      </p>
      <div className="flex items-center gap-1.5 text-accent">
        <Sparkles className="h-3 w-3" />
        AI reply with recovery link sent
      </div>
      <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-1.5">
        <span className="text-emerald-600 dark:text-emerald-400">
          Reviewer recovered
        </span>
        <span className="text-foreground/80">
          <span className="text-rose-400">1★</span> → <span className="text-emerald-500">5★</span>
        </span>
      </div>
      <p className="text-foreground/70">Recovery rate this month: 38%</p>
    </div>
  );
}

function InsightsVisual() {
  const themes = [
    { label: "Crashes", pct: 82, tone: "bg-rose-500/70" },
    { label: "Pricing", pct: 54, tone: "bg-amber-500/70" },
    { label: "Support", pct: 71, tone: "bg-emerald-500/70" },
  ];
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 text-[11px]">
      <p className="text-muted-foreground">Theme Map · Net Sentiment +42</p>
      {themes.map((t) => (
        <div key={t.label} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-foreground/80">{t.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className={cn("block h-full rounded-full", t.tone)}
              style={{ width: `${t.pct}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

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
  const rows: { src: string; color?: string; label: string }[] = [
    {
      src: "Play Store",
      color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      label: "New review · replied",
    },
    {
      src: "Play Store",
      color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      label: "5★ · auto-replied",
    },
    {
      src: "Play Store",
      color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      label: "2★ · queued for review",
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
              r.color,
            )}
          >
            {r.src}
          </span>
          <span className="flex-1 truncate text-muted-foreground">
            {r.label}
          </span>
          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
        </div>
      ))}
    </div>
  );
}

function WhatsAppVisual() {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 text-[11px]">
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
      <div className="flex items-center gap-1.5 text-accent">
        <Sparkles className="h-3 w-3" />
        AI drafting
        <span className="inline-flex gap-0.5">
          <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
          <span className="h-1 w-1 rounded-full bg-accent animate-pulse [animation-delay:0.15s]" />
          <span className="h-1 w-1 rounded-full bg-accent animate-pulse [animation-delay:0.3s]" />
        </span>
      </div>
      <div className="flex justify-end">
        <div
          className="rounded-2xl rounded-br-sm border px-3 py-2 leading-relaxed max-w-[80%]"
          style={{
            backgroundColor: `${WHATSAPP_GREEN}10`,
            borderColor: `${WHATSAPP_GREEN}55`,
          }}
        >
          <p className="text-foreground/85">
            Hi! Yes — orders can be cancelled within 30 mins. I&apos;ll cancel
            #4821 and refund instantly.
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

function AlertsVisual() {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 font-mono text-[11px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground">
          <span className="text-rose-400">★</span>
          <span className="text-border">★★★★</span>
          {" · "}Asked for a refund weeks ago, nothing…
        </p>
        <span className="relative shrink-0 text-muted-foreground" aria-hidden="true">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/5 px-2 py-1 text-rose-600 dark:text-rose-400">
          <Sparkles className="h-3 w-3" />
          AI verified negative
        </span>
      </div>
      <p className="text-foreground/70">Alert emailed · also in your bell</p>
    </div>
  );
}

function AsoVisual() {
  const elements = [
    { label: "Title", pct: 72, tone: "bg-amber-500/70" },
    { label: "Short desc", pct: 58, tone: "bg-rose-500/70" },
    { label: "Long desc", pct: 88, tone: "bg-emerald-500/70" },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border border-accent/40 bg-accent/5">
          <span className="font-mono text-base font-semibold leading-none text-accent">
            74
          </span>
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
            ASO
          </span>
        </div>
        <div className="space-y-1 text-[11px]">
          <p className="font-medium text-foreground/90">Listing health</p>
          <p className="text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400">+12</span>{" "}
            keyword gaps found
          </p>
        </div>
      </div>
      <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 text-[11px]">
        {elements.map((e) => (
          <div key={e.label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-foreground/80">{e.label}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn("block h-full rounded-full", e.tone)}
                style={{ width: `${e.pct}%` }}
              />
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 pt-0.5 text-accent">
          <Sparkles className="h-3 w-3" />
          AI rewrite ready
        </div>
      </div>
    </div>
  );
}

function VersionImpactVisual() {
  const themes = [
    { label: "crashes", delta: "▲ +210%", tone: "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400" },
    { label: "performance", delta: "▲ +40%", tone: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" },
    { label: "login", delta: "▼ −60%", tone: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-stretch">
      {/* Per-version rating delta (free core) */}
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="flex items-center gap-1 text-rose-500">
          <ArrowDown className="h-6 w-6" aria-hidden="true" />
          <span className="font-mono text-2xl font-semibold leading-none">0.4</span>
          <span className="text-amber-500">★</span>
        </div>
        <div className="text-[11px] leading-tight">
          <p className="font-medium text-foreground/90">v2.4.1</p>
          <p className="text-muted-foreground">vs v2.4.0</p>
        </div>
      </div>
      {/* Theme deltas (free core) */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 p-3 font-mono text-[11px]">
        {themes.map((t) => (
          <span
            key={t.label}
            className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5", t.tone)}
          >
            {t.label} {t.delta}
          </span>
        ))}
      </div>
      {/* AI verdict — premium layer, telegraphed without implying the whole card is paid */}
      <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/[0.04] p-3 text-[11px]">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
        <span className="flex-1 text-foreground/85">
          AI verdict: “v2.4.1 tripled crash complaints.”
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">
          <Lock className="h-2.5 w-2.5" aria-hidden="true" />
          Growth
        </span>
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
      {ROWS.map((member) => (
        <div
          key={member.name}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[11px]"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
            {member.name.charAt(0)}
          </span>
          <span className="flex-1 truncate text-foreground/80">
            {member.name}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              member.badge,
            )}
          >
            {member.role}
          </span>
        </div>
      ))}
    </div>
  );
}

function DefaultVisual() {
  return <div className="min-h-[80px]" />;
}
