import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Smartphone, Languages, Zap,
  CheckCircle2, BarChart3, ShieldCheck,
} from "lucide-react";
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
      <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-6">
            <Smartphone className="h-3.5 w-3.5" /> Play Store Review Automation
          </div>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl lg:text-6xl">
            Reply to Play Store Reviews{" "}
            <span className="text-teal-500">Automatically</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Every unanswered 1-star review costs you installs. ReviewPilot drafts
            brand-voice replies for every Play Store review — within the 350-char
            limit, in the reviewer&apos;s language — so you can approve 50 replies in 10
            minutes instead of writing them one by one.
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
            7-day free trial · No credit card · From ₹1,500/month
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-14">
            How Play Store Automation Works
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

      {/* Benefits */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">
            Why Indian App Developers Choose ReviewPilot
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

      {/* The 350-char problem */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold mb-6">
            The Play Store Reply Problem Nobody Talks About
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Google Play Store imposes a strict <strong className="text-foreground">350-character limit</strong> on developer
              replies. Most AI tools ignore this and generate replies that get cut off
              mid-sentence — which looks worse than no reply at all.
            </p>
            <p>
              ReviewPilot enforces the limit on every reply. The AI structures each response
              in three parts: acknowledge the specific issue (80 chars), give a concrete action
              or fix ETA (180 chars), and offer a support channel (60 chars). Every reply
              fits. Every reply is complete.
            </p>
            <p>
              Combined with your <strong className="text-foreground">App Context Profile</strong> — where you list known bugs,
              FAQ answers, and fix ETAs — the AI references real information instead of
              writing &ldquo;we&apos;re looking into it.&rdquo; Reviewers notice the difference. Ratings climb.
            </p>
          </div>
          <div className="mt-8 rounded-xl border-2 border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 p-6">
            <p className="text-sm font-semibold mb-1">Example AI reply (312 characters):</p>
            <p className="text-sm text-muted-foreground italic">
              &ldquo;Hi Rahul, really sorry about the crash on Redmi Note 12. This is a known MIUI 14
              issue and a fix ships in v2.4 this week. If it persists, email support@app.com
              with your Android version — we&apos;ll sort it directly. Thank you for flagging!&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-12 bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          Also see:{" "}
          <Link href="/features/google-business-profile" className="text-teal-600 hover:underline">Google Business Profile automation</Link>
          {" · "}
          <Link href="/for-app-developers" className="text-teal-600 hover:underline">ReviewPilot for app developers</Link>
          {" · "}
          <Link href="/blog/play-store-review-management-2026" className="text-teal-600 hover:underline">Play Store review management guide</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-white">
            Start Replying to Every Play Store Review Today
          </h2>
          <p className="mt-4 text-navy-300">
            7-day free trial. No credit card. Connect your Play Console in under 5 minutes.
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
