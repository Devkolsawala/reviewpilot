import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link2, Brain, SlidersHorizontal, CheckCircle2, BarChart3, MessageSquareText } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
import { JsonLd, SITE_URL } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "How AI Review Management Works — Setup in Minutes | ReviewPilot",
  description:
    "How does AI review management work? Connect Google Business Profile or Play Store, train brand voice, set auto-reply rules, go live. Full walkthrough here.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How AI Review Management Works | ReviewPilot",
    description:
      "A 6-step walkthrough of automated Google review reply setup with ReviewPilot.",
    url: `${SITE_URL}/how-it-works`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "How ReviewPilot works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How ReviewPilot Works",
    description: "6-step walkthrough of AI review management setup.",
    images: ["/og-image.svg"],
  },
};

const STEPS = [
  {
    icon: Link2,
    title: "Connect Google Play Store",
    body:
      "Upload a Play Console service account JSON — or simply invite our service account email — and our 3-step wizard walks you through permissions. Most Indian app developers are connected in under two minutes and pulling Play Store reviews on the first sync. Google Business Profile review automation is launching soon.",
  },
  {
    icon: Brain,
    title: "AI learns your brand voice",
    body:
      "Point ReviewPilot at existing replies, upload an App Context Profile, or paste a short tone guide. The AI absorbs your vocabulary, signature phrases, known issues, and escalation preferences. Every future reply sounds like you, not a generic chatbot.",
  },
  {
    icon: SlidersHorizontal,
    title: "Set reply rules & auto-reply thresholds",
    body:
      "Choose which stars auto-publish and which land in draft. A common setup: auto-publish 4–5 star replies, hold 1–3 stars for human approval, escalate mentions of refunds or safety. Rules can change per location or per app at any time.",
  },
  {
    icon: CheckCircle2,
    title: "Approve replies — or run full auto-mode",
    body:
      "Every morning, open the inbox and one-click approve pre-drafted replies. Trust the AI? Flip on full auto-mode and ReviewPilot publishes directly to Google or Play. You stay in control of how much oversight you want.",
  },
  {
    icon: BarChart3,
    title: "Monitor the sentiment dashboard",
    body:
      "Track rating trends, sentiment shifts, top keywords, and which replies are moving the needle. Spot a cluster of 1-star reviews about a new release in under an hour, not next week. Export to CSV for your ops team.",
  },
  {
    icon: MessageSquareText,
    title: "Collect new reviews via SMS",
    body:
      "After a happy visit or transaction, fire an SMS from your list with a smart link. Happy customers route straight to Google; unhappy ones route to private feedback first, protecting your rating. More reviews, higher stars, on autopilot.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How automated Google review reply setup works with ReviewPilot",
  description:
    "A 6-step process for setting up AI review management across Google Business Profile and Play Store.",
  step: STEPS.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.title,
    text: s.body,
  })),
};

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd data={howToSchema} />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="uppercase tracking-[0.15em]">How it works</span>
          </div>
          <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            From zero to auto-reply in{" "}
            <span className="text-gradient-brand font-serif italic">
              10 minutes
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            ReviewPilot turns review management from a daily chore into a
            background process. Here&apos;s the full walkthrough — whether you run one
            restaurant, a 15-city franchise, or a Play Store app with 40 new
            reviews a day.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative space-y-14 sm:space-y-16">
            <div
              aria-hidden
              className="pointer-events-none absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-accent/40 via-border/60 to-transparent sm:left-7"
            />
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative grid gap-6 sm:grid-cols-[auto,1fr] sm:items-start"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm sm:h-14 sm:w-14">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))]"
                  />
                  <span className="relative font-mono text-xs font-semibold text-accent sm:text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <step.icon className="h-4 w-4 text-accent" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                      Step {i + 1}
                    </span>
                  </div>
                  <h2 className="mt-2 font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,rgba(99,102,241,0.12)_0%,rgba(139,92,246,0.08)_50%,rgba(217,70,239,0.12)_100%)] p-12 sm:p-16 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid mask-radial-fade opacity-30"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to see it in your own dashboard?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Free 7-day trial. No credit card. Most teams have AI replies live in
                under 10 minutes.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button variant="gradient" size="xl" asChild>
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="subtle" size="xl" asChild>
                  <Link href="/demo">Book a demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
