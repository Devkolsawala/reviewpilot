import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";

export const metadata: Metadata = {
  title: "ReviewPilot — AI-Powered Review Management for India",
  description:
    "Manage Google Business Profile and Play Store reviews with AI auto-replies, SMS review collection, and analytics. Starting at ₹1,500/month.",
  openGraph: {
    title: "ReviewPilot — Turn Reviews Into Revenue",
    description:
      "AI-powered review management for local businesses and app developers. Auto-reply, analytics, SMS campaigns. 10x cheaper than global tools.",
    type: "website",
    url: "https://reviewpilot.in",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ReviewPilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot — AI-Powered Review Management",
    description: "Manage Google & Play Store reviews with AI auto-replies. Starting at ₹1,500/mo.",
    images: ["/og-image.png"],
  },
};
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { TestimonialCarousel } from "@/components/marketing/TestimonialCarousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Social proof bar */}
      <section className="border-y bg-secondary/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted by 100+ businesses and app developers across India
          </p>
          <div className="flex items-center justify-center gap-8 sm:gap-12 opacity-40">
            {["TechCorp", "FreshBites", "AppStudio", "HealthPlus", "EduLearn"].map(
              (name) => (
                <div
                  key={name}
                  className="font-heading font-bold text-lg text-muted-foreground"
                >
                  {name}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Your Competitors Have{" "}
            <span className="text-amber-500">150+ Reviews</span>. You Have 12.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            88% of consumers trust online reviews as much as personal
            recommendations. Businesses that reply to reviews see 12% higher
            ratings on average. Yet most businesses ignore their reviews because
            replying takes too long.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <p className="text-3xl font-bold font-heading text-teal-500">
                88%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                trust reviews like recommendations
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold font-heading text-teal-500">
                +12%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                higher ratings when you reply
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold font-heading text-teal-500">
                3s
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                avg AI reply time
              </p>
            </div>
          </div>
        </div>
      </section>

      <FeatureGrid />
      <HowItWorks />
      <ComparisonTable />
      <TestimonialCarousel />

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Start Your Free 14-Day Trial
          </h2>
          <p className="mt-4 text-lg text-navy-300">
            No credit card required. Set up in under 5 minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-navy-800 border-navy-700 text-white placeholder:text-navy-400"
            />
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
