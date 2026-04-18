import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Star,
  MessageSquare,
  TrendingUp,
  Clock,
  Users,
  ShieldCheck,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";

export const metadata: Metadata = {
  title: "Google Review Automation for Local Businesses India | ReviewPilot",
  description:
    "Reply to Google reviews with AI, collect new reviews via SMS, and track sentiment. Google review automation built for Indian SMBs from ₹1,500/mo.",
  alternates: { canonical: "/for-local-business" },
  openGraph: {
    title: "Google Review Automation for Local Businesses | ReviewPilot",
    description:
      "AI replies to Google Business Profile reviews, SMS review collection, sentiment analytics.",
    url: "https://www.reviewpilot.co.in/for-local-business",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot for local business" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Review Automation | ReviewPilot",
    description: "AI-powered Google review management for Indian local businesses.",
    images: ["/og-image.svg"],
  },
};

const BENEFITS = [
  {
    icon: MessageSquare,
    title: "Reply to every review",
    description:
      "AI generates personalized replies in your brand voice. Approve or auto-publish — you're in control.",
  },
  {
    icon: Star,
    title: "Collect more reviews",
    description:
      "Send SMS to happy customers with a direct link to leave a Google review. Watch your rating climb.",
  },
  {
    icon: TrendingUp,
    title: "Track your growth",
    description:
      "See rating trends, sentiment analysis, and top keywords. Know exactly what customers love.",
  },
  {
    icon: Clock,
    title: "Save hours every week",
    description:
      "What used to take 2 hours now takes 5 minutes. Bulk-reply to reviews with one click.",
  },
  {
    icon: Users,
    title: "Multi-location support",
    description:
      "Managing multiple locations? See all reviews in one inbox. Perfect for franchise owners.",
  },
  {
    icon: ShieldCheck,
    title: "Catch negative reviews fast",
    description:
      "Get alerts for 1–2 star reviews. Respond before unhappy customers tell their friends.",
  },
];

const USE_CASES = [
  "Restaurants & Cafes",
  "Dentists & Clinics",
  "Salons & Spas",
  "Plumbers & Electricians",
  "Gyms & Fitness Studios",
  "Real Estate Agents",
  "Auto Repair Shops",
  "Hotels & Homestays",
];

export default function ForLocalBusinessPage() {
  return (
    <>
      {/* Launching-soon banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2.5 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Launching soon.</span> Google Business
            Profile automation is in beta. Play Store review management is live
            today.
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="uppercase tracking-[0.15em]">For local businesses</span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                Soon
              </span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Your Google reviews,{" "}
              <span className="text-gradient-brand font-serif italic">
                on autopilot
              </span>
              .
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Stop losing customers to competitors with more reviews. ReviewPilot
              helps you reply to every Google Business review with AI, collect
              more reviews via SMS, and track your reputation — from one
              dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/demo">See a demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Why they love us
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Made for the teams behind the counter.
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

      {/* Use cases */}
      <section className="relative py-24 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Perfect for
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            Works for every local team.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {USE_CASES.map((uc) => (
              <span
                key={uc}
                className="rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm"
              >
                {uc}
              </span>
            ))}
          </div>
          <div className="mt-12">
            <Button variant="gradient" size="xl" asChild>
              <Link href="/signup">
                Get started free
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
