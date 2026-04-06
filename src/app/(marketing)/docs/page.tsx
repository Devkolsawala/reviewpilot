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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Guides, tutorials, and documentation for ReviewPilot.",
};

const GUIDES = [
  {
    icon: Link2,
    title: "Getting Started",
    description: "Create your account, connect your first platform, and set up AI replies in under 5 minutes.",
    articles: ["Create your ReviewPilot account", "Connect Google Business Profile", "Upload Play Store service account", "Complete the onboarding wizard"],
  },
  {
    icon: Bot,
    title: "AI Reply Configuration",
    description: "Set up your App Context Profile and customize AI reply behavior.",
    articles: ["Create an App Context Profile", "Choose your reply tone", "Set up auto-reply rules", "Test AI replies"],
  },
  {
    icon: MessageSquareText,
    title: "Review Management",
    description: "Learn to use the review inbox, bulk actions, and reply workflow.",
    articles: ["Navigate the review inbox", "Filter and search reviews", "Edit and publish AI replies", "Bulk reply to multiple reviews"],
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Understand your analytics dashboard and track your reputation growth.",
    articles: ["Read the analytics dashboard", "Track rating trends", "Understand sentiment analysis", "Export reports"],
  },
  {
    icon: MessageSquareText,
    title: "SMS & Email Campaigns",
    description: "Collect more reviews from happy customers via SMS and email campaigns.",
    articles: ["Create an SMS campaign", "Build your recipient list", "Track campaign performance", "Set up review landing pages"],
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Manage your subscription, upgrade plans, and understand usage limits.",
    articles: ["Choose the right plan", "Upgrade or downgrade", "View usage and limits", "Payment methods and invoices"],
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
                    <li key={article}>
                      <Link
                        href="#"
                        className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        {article}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
