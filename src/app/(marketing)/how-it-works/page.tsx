import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link2, Brain, SlidersHorizontal, CheckCircle2, BarChart3, MessageSquareText } from "lucide-react";
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
    title: "1. Connect Google Play Store (Google Business Profile coming soon)",
    body:
      "Upload a Play Console service account JSON — or simply invite our service account email — and our 3-step wizard walks you through permissions. Most users are connected in under two minutes and pulling Play Store reviews on the first sync. Google Business Profile support is on the roadmap once Google approves our API access.",
  },
  {
    icon: Brain,
    title: "2. AI learns your brand voice",
    body:
      "Point ReviewPilot at existing replies, upload an App Context Profile, or paste a short tone guide. The AI absorbs your vocabulary, signature phrases, known issues, and escalation preferences. Every future reply sounds like you, not a generic chatbot.",
  },
  {
    icon: SlidersHorizontal,
    title: "3. Set reply rules & auto-reply thresholds",
    body:
      "Choose which stars auto-publish and which land in draft. A common setup: auto-publish 4–5 star replies, hold 1–3 stars for human approval, escalate mentions of refunds or safety. You can change rules per location or per app at any time.",
  },
  {
    icon: CheckCircle2,
    title: "4. Approve replies — or run full auto-mode",
    body:
      "Every morning, open the inbox and one-click approve pre-drafted replies. Trust the AI? Flip on full auto-mode and ReviewPilot publishes directly to Google or Play. You stay in control of how much oversight you want.",
  },
  {
    icon: BarChart3,
    title: "5. Monitor sentiment dashboard",
    body:
      "Track rating trends, sentiment shifts, top keywords, and which replies are moving the needle. Spot a cluster of 1-star reviews about a new release in under an hour, not next week. Export to CSV for your ops team.",
  },
  {
    icon: MessageSquareText,
    title: "6. Collect new reviews via SMS",
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
      <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-6">
            How It Works
          </div>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">
            How AI Review Management Works — From Zero to Auto-Reply in 10 Minutes
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            ReviewPilot turns review management from a daily chore into a
            background process. Here&apos;s the full setup walkthrough — whether
            you&apos;re running one restaurant, a 15-city franchise, or a Play Store
            app with 40 new reviews a day.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {STEPS.map((step) => (
              <div key={step.title} className="grid gap-6 md:grid-cols-[auto,1fr] items-start">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25">
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold mb-3">
                    {step.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-white">
            Ready to see it in your own dashboard?
          </h2>
          <p className="mt-4 text-navy-300">
            Free 7-day trial. No credit card. Most teams have AI replies live in under 10 minutes.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">Book a Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
