import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
    title: "Getting Started",
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
    title: "AI Reply Configuration",
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
    title: "Review Management",
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
    title: "Analytics & Reports",
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
    title: "SMS & Email Campaigns",
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
    title: "Billing & Plans",
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
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-teal-500" />
            <span className="text-sm font-medium text-teal-600">Help Center</span>
          </div>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">
            How Can We Help?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Find guides, tutorials, and answers to common questions about ReviewPilot.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {GUIDES.map((guide) => (
            <Card key={guide.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <guide.icon className="h-8 w-8 text-teal-500 mb-4" />
                <h2 className="font-heading text-lg font-semibold mb-2">{guide.title}</h2>
                <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>
                <ul className="space-y-2">
                  {guide.articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/docs/${article.slug}`}
                        className="flex items-center justify-between group text-sm text-teal-600 hover:text-teal-700"
                      >
                        <span className="hover:underline">{article.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-16 max-w-2xl mx-auto text-center rounded-xl border bg-secondary/40 p-8">
          <h2 className="font-heading text-xl font-bold mb-2">Can&apos;t find what you need?</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Email us at{" "}
            <a href="mailto:dev.kolsawala45@gmail.com" className="text-teal-600 hover:underline">
              dev.kolsawala45@gmail.com
            </a>{" "}
            or book a demo and we&apos;ll walk you through it live.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:underline"
          >
            Book a live demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
