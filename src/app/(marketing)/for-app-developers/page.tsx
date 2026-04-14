import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Bot,
  Smartphone,
  BarChart3,
  Globe,
  Zap,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Play Store Review Management for App Developers | ReviewPilot",
  description:
    "Reply to every Play Store review with AI. Enforce the 350-char limit, detect known bugs, lift your rating. Built for Indian app developers from ₹1,500/mo.",
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
    title: "AI Replies That Know Your App",
    description:
      "Set up your App Context Profile once — features, known issues, FAQs. AI generates replies that actually help users.",
  },
  {
    icon: Smartphone,
    title: "350-Char Limit Enforced",
    description:
      "Play Store has a 350-character reply limit. ReviewPilot enforces this automatically — no more truncated replies.",
  },
  {
    icon: BarChart3,
    title: "Track Rating Impact",
    description:
      "See how your replies affect ratings over time. Identify which issues drive the most negative reviews.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description:
      "Users review in Hindi, Tamil, Telugu, and more. AI replies in the same language as the review.",
  },
  {
    icon: Zap,
    title: "Auto-Reply to All Ratings",
    description:
      "Set up auto-reply rules: auto-publish replies to 4-5 star reviews, draft-for-approval for 1-3 stars.",
  },
  {
    icon: AlertTriangle,
    title: "Known Issue Detection",
    description:
      "When a review mentions a known bug, AI acknowledges it and tells the user a fix is coming.",
  },
];

export default function ForAppDevelopersPage() {
  return (
    <>
      <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-6">
              For App Developers
            </div>
            <h1 className="font-heading text-4xl font-bold sm:text-5xl">
              Turn 1-Star Reviews Into{" "}
              <span className="text-teal-500">Loyal Users</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Play Store reviews make or break your app. ReviewPilot uses AI to
              generate context-aware replies that address bugs, answer questions,
              and thank happy users — all within the 350-character limit.
            </p>
            <div className="mt-8 flex gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">
            Built for App Developers
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

      {/* CTA */}
      <section className="py-20 bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-white">
            Stop Ignoring Your Play Store Reviews
          </h2>
          <p className="mt-4 text-navy-300">
            Join hundreds of developers who use ReviewPilot to maintain a 4+ star
            rating. Starting at just ₹1,500/month.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
