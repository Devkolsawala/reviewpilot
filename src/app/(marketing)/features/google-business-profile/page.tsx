import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, MapPin, MessageSquare, Star,
  CheckCircle2, BarChart3, Zap, MessageSquareText,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "AI Replies to Google Business Reviews India | ReviewPilot",
  description:
    "Auto-reply to Google Business Profile reviews with AI. One-click GBP connection, brand-voice replies, SMS review collection. Built for Indian SMBs. ₹1,500/mo.",
  alternates: { canonical: "/features/google-business-profile" },
  openGraph: {
    title: "AI Replies to Google Business Reviews — Built for India | ReviewPilot",
    description:
      "Connect Google Business Profile in one click. AI writes brand-voice replies, SMS collection smart-routes happy customers to Google. From ₹1,500/mo.",
    url: `${SITE_URL}/features/google-business-profile`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Google Business Profile review automation — ReviewPilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Google Business Review Replies India | ReviewPilot",
    description: "Auto-reply to Google Business reviews with AI. Built for Indian SMBs. ₹1,500/mo.",
    images: ["/og-image.svg"],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReviewPilot — Google Business Profile Review Automation",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-powered Google Business Profile review management for Indian SMBs. One-click connection, brand-voice AI replies, and SMS review collection.",
  url: `${SITE_URL}/features/google-business-profile`,
  image: SITE_OG,
  offers: {
    "@type": "Offer",
    price: "1500",
    priceCurrency: "INR",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "1500",
      priceCurrency: "INR",
      unitText: "MONTH",
    },
  },
};

const STEPS = [
  {
    icon: MapPin,
    title: "Connect your Google Business Profile",
    body: "Sign in with the Google account that owns your Business Profile. Select your location (or all locations if you have multiple). ReviewPilot pulls your last 90 days of reviews within minutes.",
  },
  {
    icon: MessageSquare,
    title: "AI learns your brand voice",
    body: "Paste 3–5 of your best existing replies — or choose a tone preset (warm, professional, brief). The AI calibrates to your vocabulary, sentence length, and signing-off style so every reply sounds like you.",
  },
  {
    icon: Zap,
    title: "Set rules and start replying",
    body: "Choose which ratings auto-publish and which land in a draft queue. New reviews sync every few minutes. Approve drafts in one click from your inbox, or let auto-publish handle 5-star reviews entirely.",
  },
];

const BENEFITS = [
  { icon: CheckCircle2, text: "One-click Google Business Profile connection via OAuth" },
  { icon: Star, text: "AI replies calibrated to your industry (restaurant, clinic, retail, etc.)" },
  { icon: MessageSquareText, text: "SMS review collection with smart routing to protect your rating" },
  { icon: BarChart3, text: "Rating trend dashboard — track lift over days and weeks" },
  { icon: Zap, text: "Reply to 30 days of backlog reviews on your first login" },
  { icon: CheckCircle2, text: "Multi-location management — one dashboard for all branches" },
];

export default function GoogleBusinessProfilePage() {
  return (
    <>
      <JsonLd data={schema} />

      {/* Launching-soon banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2.5 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Launching soon.</span> Google Business
            Profile automation is in beta.{" "}
            <Link
              href="/features/google-play-reviews"
              className="underline font-medium hover:text-amber-600 dark:hover:text-amber-200"
            >
              Play Store review management is live today
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <span className="uppercase tracking-[0.15em]">
              Google Business Profile
            </span>
            <span className="ml-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
              Soon
            </span>
          </div>
          <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            AI replies to Google reviews,{" "}
            <span className="text-gradient-brand font-serif italic">
              built for India
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            88% of Indian consumers check Google reviews before visiting a local
            business. ReviewPilot connects to your Google Business Profile in one
            click and handles every reply — in your voice, automatically, from
            ₹1,500/month.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button variant="gradient" size="xl" asChild>
              <Link href="/signup">
                Start free trial
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="subtle" size="xl" asChild>
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="mt-5 font-mono text-[11px] text-muted-foreground">
            7-day free trial · No credit card · Setup in under 5 minutes
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Workflow
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              How Google Business automation works
            </h2>
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Step {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-1 font-sans text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SMS smart routing */}
      <section className="relative py-24 bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                SMS collection
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Collect more reviews — without the risk.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                ReviewPilot&apos;s SMS collection uses{" "}
                <strong className="text-foreground">smart routing</strong>:
                customers who rate 4–5 stars are sent to your Google review page.
                Those who rate 1–3 stars go to a private feedback form — so unhappy
                customers tell you instead of Google.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Indian SMBs using this workflow typically see a 0.3–0.5 star uplift
                in their Google rating within 60 days.
              </p>
              <Button variant="gradient" className="mt-6" asChild>
                <Link href="/signup">
                  Try SMS collection free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-auto text-[11px] font-mono text-accent">
                    → Google review
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Happy customers go straight to Google Maps to leave their review.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  {[0, 1].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  {[0, 1, 2].map((i) => (
                    <Star key={i + "e"} className="h-4 w-4 text-muted-foreground/30" />
                  ))}
                  <span className="ml-auto text-[11px] font-mono text-muted-foreground">
                    → Private feedback
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Unhappy customers reach you directly — before posting publicly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Everything included
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything Indian businesses need.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.text}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
              >
                <b.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm leading-relaxed text-foreground/85">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="relative py-12 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          Also see:{" "}
          <Link href="/features/google-play-reviews" className="text-accent hover:underline">
            Play Store review automation
          </Link>
          {" · "}
          <Link href="/for-local-business" className="text-accent hover:underline">
            ReviewPilot for local businesses
          </Link>
          {" · "}
          <Link href="/blog/how-to-get-more-google-reviews-2026" className="text-accent hover:underline">
            How to get more Google reviews
          </Link>
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
                Start automating your Google reviews today.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                7-day free trial. No credit card. Connect your Business Profile in
                one click.
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
