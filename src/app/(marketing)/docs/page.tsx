import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Link2,
  Bot,
  MessageSquareText,
  BarChart3,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { SITE_URL } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Help Center — Review Management Guides & Tutorials | ReviewPilot",
  description:
    "Guides for connecting Google Business Profile, Play Store, setting up AI reply rules, and reading analytics. Explore ReviewPilot's help center now.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "Help Center | ReviewPilot",
    description:
      "Guides and tutorials for review management with ReviewPilot.",
    url: `${SITE_URL}/docs`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot help center" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot Help Center",
    description: "Guides and tutorials for AI review management.",
    images: ["/og-image.svg"],
  },
};

const GUIDES = [
  {
    icon: Link2,
    title: "Getting started",
    description: "Create your account, connect your first platform, and set up AI replies in under 5 minutes.",
    articles: [
      { label: "Create your ReviewPilot account", slug: "create-your-reviewpilot-account" },
      { label: "Connect Google Business Profile", slug: "connect-google-business-profile" },
      { label: "Upload Play Store service account", slug: "upload-play-store-service-account" },
      { label: "Complete the onboarding wizard", slug: "complete-onboarding-wizard" },
    ],
  },
  {
    icon: Bot,
    title: "AI reply configuration",
    description: "Set up your App Context Profile and customize AI reply behavior.",
    articles: [
      { label: "Create an App Context Profile", slug: "create-app-context-profile" },
      { label: "Choose your reply tone", slug: "choose-reply-tone" },
      { label: "Set up auto-reply rules", slug: "set-up-auto-reply-rules" },
      { label: "Test AI replies", slug: "test-ai-replies" },
    ],
  },
  {
    icon: MessageSquareText,
    title: "Review management",
    description: "Learn to use the review inbox, bulk actions, and reply workflow.",
    articles: [
      { label: "Navigate the review inbox", slug: "navigate-review-inbox" },
      { label: "Filter and search reviews", slug: "filter-and-search-reviews" },
      { label: "Edit and publish AI replies", slug: "edit-and-publish-ai-replies" },
      { label: "Bulk reply to multiple reviews", slug: "bulk-reply-multiple-reviews" },
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics & reports",
    description: "Understand your analytics dashboard and track your reputation growth.",
    articles: [
      { label: "Read the analytics dashboard", slug: "read-analytics-dashboard" },
      { label: "Track rating trends", slug: "track-rating-trends" },
      { label: "Understand sentiment analysis", slug: "understand-sentiment-analysis" },
      { label: "Export reports", slug: "export-reports" },
    ],
  },
  {
    icon: MessageSquareText,
    title: "SMS & email campaigns",
    description: "Collect more reviews from happy customers via SMS and email campaigns.",
    articles: [
      { label: "Create an SMS campaign", slug: "create-sms-campaign" },
      { label: "Build your recipient list", slug: "build-recipient-list" },
      { label: "Track campaign performance", slug: "track-campaign-performance" },
      { label: "Set up review landing pages", slug: "set-up-review-landing-pages" },
    ],
  },
  {
    icon: CreditCard,
    title: "Billing & plans",
    description: "Manage your subscription, upgrade plans, and understand usage limits.",
    articles: [
      { label: "Choose the right plan", slug: "choose-right-plan" },
      { label: "Upgrade or downgrade", slug: "upgrade-or-downgrade" },
      { label: "View usage and limits", slug: "view-usage-and-limits" },
      { label: "Payment methods and invoices", slug: "payment-methods-and-invoices" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5 text-accent" />
            <span className="uppercase tracking-[0.15em]">Help center</span>
          </div>
          <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
            How can we{" "}
            <span className="text-gradient-brand font-serif italic">help</span>?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Guides, tutorials, and answers to common questions about ReviewPilot.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <div
              key={guide.title}
              className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-colors hover:border-accent/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                <guide.icon className="h-4 w-4" />
              </div>
              <h2 className="mt-4 font-sans text-base font-semibold tracking-tight">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {guide.description}
              </p>
              <ul className="mt-5 space-y-2">
                {guide.articles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/docs/${article.slug}`}
                      className="group flex items-center justify-between text-sm text-foreground/80 hover:text-accent"
                    >
                      <span>{article.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-border/60 bg-card/40 p-8 text-center backdrop-blur-sm">
          <h2 className="font-sans text-xl font-semibold tracking-tight">
            Can&apos;t find what you need?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Email us at{" "}
            <a
              href="mailto:dev.kolsawala45@gmail.com"
              className="text-accent hover:underline"
            >
              dev.kolsawala45@gmail.com
            </a>{" "}
            or book a demo and we&apos;ll walk you through it live.
          </p>
          <Link
            href="/demo"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            Book a live demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
