import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, MapPin, MessageSquare, Star,
  CheckCircle2, BarChart3, Zap, MessageSquareText,
} from "lucide-react";
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

      {/* Coming Soon banner */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3 text-center">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Launching Soon.</span> AI-powered Google Business Profile review automation for Indian local businesses is launching soon. <Link href="/features/google-play-reviews" className="underline font-medium">Google Play Store review management is live today</Link> — reply to every Android review with AI in minutes.
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-6">
            <MapPin className="h-3.5 w-3.5" /> Google Business Profile Automation
            <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 text-[10px] font-semibold">Coming Soon</span>
          </div>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl lg:text-6xl">
            AI Replies to Google Business Reviews{" "}
            <span className="text-teal-500">Built for India</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            88% of Indian consumers check Google reviews before visiting a local
            business. ReviewPilot connects to your Google Business Profile in one click
            and handles every reply — in your voice, automatically, from ₹1,500/month.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            7-day free trial · No credit card · Setup in under 5 minutes
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-14">
            How Google Business Review Automation Works
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25 mb-4">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">
                  Step {i + 1}
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SMS smart routing callout */}
      <section className="py-20 bg-gradient-to-b from-background via-teal-50/30 to-background dark:via-teal-950/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              <h2 className="font-heading text-3xl font-bold mb-4">
                Collect More Reviews — Without the Risk
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ReviewPilot&apos;s SMS review collection uses <strong className="text-foreground">smart routing</strong>:
                customers who rate their experience 4–5 stars are sent directly to your
                Google review page. Those who rate 1–3 stars are routed to a private
                feedback form — so unhappy customers tell you instead of Google.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Indian SMBs using this workflow typically see a 0.3–0.5 star uplift in
                their Google rating within 60 days.
              </p>
              <Button asChild>
                <Link href="/signup">
                  Try SMS Collection Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-muted-foreground ml-auto">→ Google Review</span>
                </div>
                <p className="text-xs text-muted-foreground">Happy customers go straight to Google Maps to leave their review.</p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <Star className="h-4 w-4 text-muted-foreground/30" />
                  <Star className="h-4 w-4 text-muted-foreground/30" />
                  <Star className="h-4 w-4 text-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground ml-auto">→ Private Feedback</span>
                </div>
                <p className="text-xs text-muted-foreground">Unhappy customers reach you directly — before posting publicly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">
            Everything Indian Businesses Need
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.text} className="flex items-start gap-3 rounded-xl border bg-card p-5">
                <b.icon className="h-5 w-5 text-teal-500 mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-12 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          Also see:{" "}
          <Link href="/features/google-play-reviews" className="text-teal-600 hover:underline">Play Store review automation</Link>
          {" · "}
          <Link href="/for-local-business" className="text-teal-600 hover:underline">ReviewPilot for local businesses</Link>
          {" · "}
          <Link href="/blog/how-to-get-more-google-reviews-2026" className="text-teal-600 hover:underline">How to get more Google reviews</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-white">
            Start Automating Your Google Reviews Today
          </h2>
          <p className="mt-4 text-navy-300">
            7-day free trial. No credit card. Connect your Business Profile in one click.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
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
