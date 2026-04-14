import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Smartphone, MapPin, Inbox } from "lucide-react";
import Link from "next/link";
import {
  JsonLd,
  SITE_URL,
  SITE_LOGO,
  SITE_OG,
  organizationSchema,
} from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "AI Review Management India — Google & Play Store | ReviewPilot",
  description:
    "Automate Google Business Profile and Play Store review replies with AI. Made-in-India review management from ₹1,500/mo. Start your free 7-day trial today.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AI Review Management India — Google & Play Store | ReviewPilot",
    description:
      "Automate Google Business Profile and Play Store review replies with AI. From ₹1,500/mo — 17× cheaper than Birdeye. Start a free trial.",
    type: "website",
    url: SITE_URL,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot — AI Review Management for India" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Review Management India | ReviewPilot",
    description:
      "Automate Google & Play Store review replies with AI. From ₹1,500/mo. Start your free trial.",
    images: ["/og-image.svg"],
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReviewPilot",
  operatingSystem: "Web",
  applicationCategory: "BusinessApplication",
  description:
    "AI-powered review management for Indian SMBs and app developers. Auto-reply to Google Business Profile and Play Store reviews in seconds.",
  url: SITE_URL,
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

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ReviewPilot",
  url: SITE_URL,
  publisher: { "@type": "Organization", name: "ReviewPilot", logo: SITE_LOGO },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={[organizationSchema, softwareSchema, websiteSchema]} />
      <Hero />

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

      {/* Category moat section */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-background via-teal-50/30 to-background dark:via-teal-950/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-4">
              <span aria-hidden="true">🇮🇳</span> The ReviewPilot moat
            </div>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl max-w-3xl mx-auto">
              The only review management built for Indian apps{" "}
              <span className="text-teal-500">AND</span> local businesses.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Global tools like Birdeye and Podium only manage Google Business
              Profile reviews, and charge enterprise rates for it. App-only
              tools like AppFollow ignore your physical locations. ReviewPilot
              is the single unified inbox for both — priced for Indian SMBs,
              not Fortune 500 enterprises.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6">
              <Smartphone className="h-8 w-8 text-teal-500 mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-2">
                Play Store reviews, done right
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI that respects the 350-character Play Store limit, speaks
                Hindi, Tamil, Telugu, and acknowledges known bugs from your App
                Context Profile.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <MapPin className="h-8 w-8 text-teal-500 mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-2">
                Google Business Profile, automated
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                One-click GBP connection. AI writes brand-voice replies, SMS
                review collection smart-routes 4–5 stars to Google and lower
                scores to private feedback.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <Inbox className="h-8 w-8 text-teal-500 mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-2">
                One unified inbox
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you run a restaurant chain AND a companion app, you stop
                juggling two tabs. Every review, every platform, every
                location — one queue, one dashboard.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" asChild>
              <Link href="/how-it-works">
                See How It Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <HowItWorks />
      <ComparisonTable />

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Start Your Free 7-Day Trial
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
