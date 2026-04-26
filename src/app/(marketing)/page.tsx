import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { TrustBar } from "@/components/marketing/TrustBar";
import { PersonaSplit } from "@/components/marketing/PersonaSplit";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { InteractiveDemo } from "@/components/marketing/InteractiveDemo";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { PricingTable } from "@/components/marketing/PricingTable";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
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
    "Automate Google Business Profile and Play Store review replies with AI. Made-in-India review management from $16/mo. Start your free 7-day trial today.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AI Review Management India — Google & Play Store | ReviewPilot",
    description:
      "Automate Google Business Profile and Play Store review replies with AI. From $16/mo — 17× cheaper than Birdeye. Start a free trial.",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "ReviewPilot — AI Review Management for India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Review Management India | ReviewPilot",
    description:
      "Automate Google & Play Store review replies with AI. From $16/mo. Start your free trial.",
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
    price: "16",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "16",
      priceCurrency: "USD",
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

const FAQ_SCHEMA_ITEMS = [
  {
    q: "How much does ReviewPilot cost?",
    a: "Starter is $16/mo (1 location or app, 100 AI replies/week). Growth is $32/mo, Agency is $85/mo. All prices billed in INR equivalent at checkout. All plans include a 7-day free trial.",
  },
  {
    q: "Does ReviewPilot work with Google Play Store reviews?",
    a: "Yes. ReviewPilot connects to Google Play Console via a service account and respects the 350-character reply limit automatically.",
  },
  {
    q: "Can ReviewPilot reply in Hindi and other Indian languages?",
    a: "Yes. English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, and Gujarati are all supported.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_SCHEMA_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[organizationSchema, softwareSchema, websiteSchema, faqSchema]}
      />
      <Hero />
      <TrustBar />
      <PersonaSplit />
      <FeatureGrid />
      <HowItWorks />
      <InteractiveDemo />
      <ComparisonTable />

      <section className="relative overflow-hidden py-24 sm:py-32 bg-muted/20">
        <div className="mx-auto max-w-2xl text-center px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
            Plans that{" "}
            <span className="text-gradient-brand">scale with your stars</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free for 7 days. No credit card. Switch, upgrade, or cancel at
            any time.
          </p>
        </div>
        <div className="mt-12 px-4 sm:px-6 lg:px-8">
          <PricingTable />
        </div>
      </section>

      <FAQ />
      <FinalCTA />
    </>
  );
}
