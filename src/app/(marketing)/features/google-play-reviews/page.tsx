import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Smartphone, Languages, Zap,
  CheckCircle2, BarChart3, ShieldCheck,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Reply to Play Store Reviews Automatically | ReviewPilot",
  description:
    "Auto-reply to every Google Play Store review with AI. Respects the 350-char limit, supports Hindi/Tamil/Telugu, lifts your app rating. From ₹1,500/mo.",
  alternates: { canonical: "/features/google-play-reviews" },
  openGraph: {
    title: "Play Store Review Automation — AI Replies for Android Apps | ReviewPilot",
    description:
      "Reply to every Play Store review automatically. AI respects the 350-char limit, detects language, and uses your brand voice. Built for Indian app developers.",
    url: `${SITE_URL}/features/google-play-reviews`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Play Store review automation — ReviewPilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auto-Reply to Play Store Reviews | ReviewPilot",
    description: "AI-powered Play Store review management for Indian app developers. From ₹1,500/mo.",
    images: ["/og-image.svg"],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReviewPilot — Play Store Review Automation",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-powered Play Store review management that auto-replies within the 350-character limit, supports Indian languages, and lifts your app rating.",
  url: `${SITE_URL}/features/google-play-reviews`,
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
    icon: Smartphone,
    title: "Connect your Play Console",
    body: "Upload a service account JSON from Google Cloud Console. ReviewPilot verifies access and pulls your live reviews in under 3 minutes — no developer mode or code changes needed.",
  },
  {
    icon: Languages,
    title: "AI learns your app voice",
    body: "Paste your known bugs, FAQs, support email, and tone guidelines into an App Context Profile. The AI uses this to write replies that reference your actual fix ETAs — not generic placeholders.",
  },
  {
    icon: Zap,
    title: "Set thresholds and go live",
    body: "Choose which star ratings auto-publish and which queue for approval. 5-star: auto-publish. 1-star: draft for review. Replies land on Play Store within seconds of approval.",
  },
];

const BENEFITS = [
  { icon: CheckCircle2, text: "Strict 350-character limit respected on every reply" },
  { icon: Languages, text: "Auto-detects Hindi, Tamil, Telugu, Marathi, Bengali & more" },
  { icon: ShieldCheck, text: "Known bug acknowledgements from your App Context Profile" },
  { icon: BarChart3, text: "Rating trend tracking — see the lift over time" },
  { icon: Zap, text: "Bulk approve drafts in 10 minutes each morning" },
  { icon: CheckCircle2, text: "Reply to historical backlog on day one" },
];

export default function PlayStoreReviewsPage() {
  return (
    <>
      <JsonLd data={schema} />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <Smartphone className="h-3.5 w-3.5 text-accent" />
            <span className="uppercase tracking-[0.15em]">Play Store automation</span>
          </div>
          <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Reply to Play Store reviews{" "}
            <span className="text-gradient-brand font-serif italic">
              automatically
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Every unanswered 1-star review costs you installs. ReviewPilot drafts
            brand-voice replies for every Play Store review — within the 350-char
            limit, in the reviewer&apos;s language — so you can approve 50 replies in
            10 minutes instead of writing them one by one.
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
            7-day free trial · No credit card · From ₹1,500/month
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
              How Play Store automation works
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

      {/* Benefits */}
      <section className="relative py-24 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Why devs pick us
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for Indian app developers.
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

      {/* 350-char section */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            The unspoken problem
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            The Play Store reply limit nobody talks about.
          </h2>
          <div className="mt-8 space-y-5 text-base text-muted-foreground leading-relaxed">
            <p>
              Google Play Store imposes a strict{" "}
              <strong className="text-foreground">350-character limit</strong> on
              developer replies. Most AI tools ignore this and generate replies that
              get cut off mid-sentence — which looks worse than no reply at all.
            </p>
            <p>
              ReviewPilot enforces the limit on every reply. The AI structures each
              response in three parts: acknowledge the specific issue (80 chars),
              give a concrete action or fix ETA (180 chars), and offer a support
              channel (60 chars). Every reply fits. Every reply is complete.
            </p>
            <p>
              Combined with your{" "}
              <strong className="text-foreground">App Context Profile</strong> —
              where you list known bugs, FAQ answers, and fix ETAs — the AI
              references real information instead of writing &ldquo;we&apos;re looking
              into it.&rdquo; Reviewers notice. Ratings climb.
            </p>
          </div>
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              Example AI reply · 312 characters
            </p>
            <p className="mt-3 font-serif text-base italic leading-relaxed text-foreground/90">
              &ldquo;Hi Rahul, really sorry about the crash on Redmi Note 12. This is a
              known MIUI 14 issue and a fix ships in v2.4 this week. If it
              persists, email support@app.com with your Android version —
              we&apos;ll sort it directly. Thank you for flagging!&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="relative py-12 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          Also see:{" "}
          <Link href="/features/google-business-profile" className="text-accent hover:underline">
            Google Business Profile automation
          </Link>
          {" · "}
          <Link href="/for-app-developers" className="text-accent hover:underline">
            ReviewPilot for app developers
          </Link>
          {" · "}
          <Link href="/blog/play-store-review-management-2026" className="text-accent hover:underline">
            Play Store review management guide
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
                Start replying to every Play Store review today.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                7-day free trial. No credit card. Connect your Play Console in under
                5 minutes.
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
