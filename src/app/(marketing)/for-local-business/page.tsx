import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Star,
  MessageSquare,
  TrendingUp,
  Clock,
  Users,
  ShieldCheck,
} from "lucide-react";

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
    title: "Reply to Every Review",
    description:
      "AI generates personalized replies in your brand voice. Approve or auto-publish — you're in control.",
  },
  {
    icon: Star,
    title: "Collect More Reviews",
    description:
      "Send SMS to happy customers with a direct link to leave a Google review. Watch your rating climb.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Growth",
    description:
      "See rating trends, sentiment analysis, and top keywords. Know exactly what customers love.",
  },
  {
    icon: Clock,
    title: "Save Hours Every Week",
    description:
      "What used to take 2 hours now takes 5 minutes. Bulk-reply to reviews with one click.",
  },
  {
    icon: Users,
    title: "Multi-Location Support",
    description:
      "Managing multiple locations? See all reviews in one inbox. Perfect for franchise owners.",
  },
  {
    icon: ShieldCheck,
    title: "Catch Negative Reviews Fast",
    description:
      "Get alerts for 1-2 star reviews. Respond quickly before unhappy customers tell their friends.",
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
      <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-6">
              For Local Businesses
            </div>
            <h1 className="font-heading text-4xl font-bold sm:text-5xl">
              Your Google Reviews,{" "}
              <span className="text-teal-500">On Autopilot</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Stop losing customers to competitors with more reviews. ReviewPilot
              helps you reply to every Google Business review with AI, collect
              more reviews via SMS, and track your reputation — all from one
              dashboard.
            </p>
            <div className="mt-8 flex gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">See a Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">
            Why Local Businesses Love ReviewPilot
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <Card key={b.title}>
                <CardContent className="p-6">
                  <b.icon className="h-8 w-8 text-teal-500 mb-4" />
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    {b.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {b.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold mb-8">
            Perfect For
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {USE_CASES.map((uc) => (
              <span
                key={uc}
                className="rounded-full border bg-background px-4 py-2 text-sm font-medium"
              >
                {uc}
              </span>
            ))}
          </div>
          <div className="mt-12">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
