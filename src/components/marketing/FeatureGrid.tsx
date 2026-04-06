import { Bot, MessageSquareText, Inbox, BarChart3, Globe, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Bot,
    title: "AI Auto-Replies",
    description:
      "Generate context-aware replies in seconds using AI that knows your business. Supports multiple tones and languages.",
  },
  {
    icon: MessageSquareText,
    title: "Review Collection (SMS/QR)",
    description:
      "Send SMS campaigns to collect reviews from happy customers. Smart routing: 4-5 stars go to Google, 1-3 stars go to private feedback.",
  },
  {
    icon: Inbox,
    title: "Unified Inbox",
    description:
      "All your Google Business and Play Store reviews in one place. Filter, search, and bulk-reply without switching tabs.",
  },
  {
    icon: BarChart3,
    title: "Sentiment Analytics",
    description:
      "Track rating trends, sentiment breakdown, and top keywords. Know exactly what customers love and what needs fixing.",
  },
  {
    icon: Globe,
    title: "Multi-Platform",
    description:
      "Manage Google Business Profile reviews AND Google Play Store reviews from a single dashboard. More platforms coming soon.",
  },
  {
    icon: Building2,
    title: "Agency White-Label",
    description:
      "Manage multiple clients from one account. Perfect for marketing agencies handling reviews for dozens of businesses.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Everything You Need to{" "}
            <span className="text-teal-500">Master Your Reviews</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From AI-powered replies to review collection campaigns, ReviewPilot
            gives you the complete toolkit to grow your online reputation.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
