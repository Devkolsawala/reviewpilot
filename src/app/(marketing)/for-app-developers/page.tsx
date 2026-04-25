import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Smartphone,
  BarChart3,
  Globe,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";

export const metadata: Metadata = {
  title: "Play Store Review Management for App Developers | ReviewPilot",
  description:
    "Reply to every Play Store review with AI. Enforce the 350-char limit, detect known bugs, lift your rating. Built for Indian app developers from $16/mo.",
  alternates: { canonical: "/for-app-developers" },
  openGraph: {
    title: "Play Store Review Management for App Developers | ReviewPilot",
    description:
      "AI replies for Play Store reviews. Enforce 350-char limit, detect known bugs, lift your app rating.",
    url: "https://www.reviewpilot.co.in/for-app-developers",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot for app developers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Store Review Management | ReviewPilot",
    description: "AI-powered Play Store review replies for Indian app devs.",
    images: ["/og-image.svg"],
  },
};

const BENEFITS = [
  {
    icon: Bot,
    title: "AI replies that know your app",
    description:
      "Set up your App Context Profile once — features, known issues, FAQs. AI generates replies that actually help users.",
  },
  {
    icon: Smartphone,
    title: "350-char limit enforced",
    description:
      "Play Store has a 350-character reply limit. ReviewPilot enforces this automatically — no more truncated replies.",
  },
  {
    icon: BarChart3,
    title: "Track rating impact",
    description:
      "See how replies affect ratings over time. Identify which issues drive the most negative reviews.",
  },
  {
    icon: Globe,
    title: "Multi-language support",
    description:
      "Users review in Hindi, Tamil, Telugu, and more. AI replies in the same language as the review.",
  },
  {
    icon: Zap,
    title: "Auto-reply to every rating",
    description:
      "Rules-based: auto-publish 4–5★ drafts, queue 1–3★ for human approval before publish.",
  },
  {
    icon: AlertTriangle,
    title: "Known-issue detection",
    description:
      "When a review mentions a known bug, AI acknowledges it and tells the user a fix is coming.",
  },
];

export default function ForAppDevelopersPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="uppercase tracking-[0.15em]">For app developers</span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Turn 1-star reviews into{" "}
              <span className="text-gradient-brand font-serif italic">
                loyal users
              </span>
              .
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Play Store reviews make or break your app. ReviewPilot uses AI to
              generate context-aware replies that address bugs, answer questions,
              and thank happy users — all within the 350-character limit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Built for shippers
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything an Android team needs.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-colors hover:border-accent/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                  <b.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-sans text-base font-semibold tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {b.description}
                </p>
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
                Stop ignoring your Play Store reviews.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Join hundreds of developers using ReviewPilot to keep a 4+ rating.
                From $16/month.
              </p>
              <div className="mt-8 flex justify-center">
                <Button variant="gradient" size="xl" asChild>
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
