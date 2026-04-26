"use client";

import { useState } from "react";
import Link from "next/link";
import { Smartphone, MapPin, Check, ArrowRight, Star, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { m, MotionProvider } from "@/components/motion/primitives";

type PersonaKey = "developers" | "businesses";

const PERSONAS: Record<
  PersonaKey,
  {
    icon: typeof Smartphone;
    label: string;
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
    cta: { label: string; href: string };
  }
> = {
  developers: {
    icon: Smartphone,
    label: "For app developers",
    eyebrow: "Play Store automation",
    title: "Ship faster. Let AI handle your reviews.",
    description:
      "ReviewPilot watches every Play Store review across your apps, drafts on-brand replies within the 350-char limit, and ships them in the reviewer's language.",
    bullets: [
      "Respects Play Store's 350-character reply limit",
      "Replies in Hindi, Tamil, Telugu, English and more",
      "Acknowledges known bugs from your App Context Profile",
      "Bulk-approve queue — triage a week of reviews in 10 minutes",
    ],
    cta: { label: "See Play Store features", href: "/features/google-play-reviews" },
  },
  businesses: {
    icon: MapPin,
    label: "For local businesses",
    eyebrow: "Google Business Profile",
    title: "Every Google review, replied while you sleep.",
    description:
      "Connect your Google Business Profile in one click. AI drafts replies in your brand voice; SMS campaigns route happy customers to Google and critics to private feedback.",
    bullets: [
      "One-click Google Business Profile connection",
      "Smart routing — 4-5★ to Google, 1-3★ to private feedback",
      "Multi-location dashboards for chains and agencies",
      "Response rate from 20% to 95% in under a month",
    ],
    cta: { label: "See GBP features", href: "/features/google-business-profile" },
  },
};

export function PersonaSplit() {
  const [active, setActive] = useState<PersonaKey>("businesses");
  const persona = PERSONAS[active];
  const Icon = persona.icon;

  return (
    <MotionProvider>
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              One product, two personas
            </p>
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
              Built for the way you actually work.
            </h2>
          </div>

          <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1">
            {(Object.keys(PERSONAS) as PersonaKey[]).map((key) => {
              const isActive = key === active;
              const Tab = PERSONAS[key];
              const TabIcon = Tab.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <m.span
                      layoutId="persona-tab"
                      className="absolute inset-0 rounded-full bg-background shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <TabIcon className="relative h-4 w-4" />
                  <span className="relative">{Tab.label}</span>
                </button>
              );
            })}
          </div>

          <m.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-accent" />
                {persona.eyebrow}
              </div>
              <h3 className="mt-4 font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
                {persona.title}
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {persona.description}
              </p>
              <ul className="mt-6 space-y-3">
                {persona.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-foreground/90">{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={persona.cta.href}
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                {persona.cta.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-brand-gradient-soft blur-2xl -z-10" />
              <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl backdrop-blur-sm">
                {active === "developers" ? <DevPreview /> : <BusinessPreview />}
              </div>
            </div>
          </m.div>
        </div>
      </section>
    </MotionProvider>
  );
}

function DevPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">my-android-app · Play Console</span>
        <span className="inline-flex h-5 items-center rounded-full bg-accent/15 px-2 font-medium text-accent">
          12 new
        </span>
      </div>
      {[
        { name: "Ananya", stars: 2, text: "App is slow on Redmi Note 10." },
        { name: "Karthik", stars: 5, text: "Loving the new dark mode, keep it up!" },
        { name: "Meera", stars: 1, text: "Crashes on open — need urgent fix." },
      ].map((r) => (
        <div
          key={r.name}
          className="rounded-lg border border-border/60 bg-background/60 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{r.name}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={
                    i <= r.stars
                      ? "h-2.5 w-2.5 fill-amber-400 text-amber-400"
                      : "h-2.5 w-2.5 text-border"
                  }
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{r.text}</p>
          <div className="mt-2 text-[10px] text-accent font-mono">
            ✨ AI draft · 128/350 chars
          </div>
        </div>
      ))}
    </div>
  );
}

function BusinessPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-mono">
          <Building2 className="h-3 w-3" />
          Paloma Café · Koramangala
        </span>
        <span className="font-mono text-foreground">★ 4.6</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "This week", value: "32" },
          { label: "Replied", value: "32" },
          { label: "Avg time", value: "4m" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border/60 bg-background/60 p-2.5 text-center"
          >
            <p className="font-mono text-lg font-semibold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Ravi · Google Review</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Amazing chole bhature, loved the ambience — will visit again!
        </p>
        <div className="mt-2 rounded-md bg-accent/10 p-2 text-[11px] text-foreground/90">
          Thanks so much, Ravi! We&apos;re thrilled you enjoyed the chole bhature —
          see you again soon.
        </div>
      </div>
    </div>
  );
}
