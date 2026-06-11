import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { LiveStatsBar } from "@/components/marketing/LiveStatsBar";
import { InteractiveAIDemo } from "@/components/marketing/InteractiveAIDemo";
import { TrustBar } from "@/components/marketing/TrustBar";
import { PersonaSplit } from "@/components/marketing/PersonaSplit";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { InteractiveDemo } from "@/components/marketing/InteractiveDemo";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { PricingTable } from "@/components/marketing/PricingTable";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { ThreePlatformBand } from "@/components/marketing/ThreePlatformBand";
import {
  JsonLd,
  SITE_URL,
  SITE_LOGO,
  SITE_OG,
  organizationSchema,
} from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "AI Review Management Software India — Play Store, Google & WhatsApp",
  description:
    "Review management software for India. AI replies for Play Store and WhatsApp Business, plus a Review Recovery Engine and AI Insights, in one unified inbox. From $16/mo. 7-day free trial.",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "AI Review Management Software India — Play Store, Google & WhatsApp",
    description:
      "AI replies for Play Store reviews and WhatsApp messages, plus review recovery and AI insights — one unified inbox. Made for India. From $16/mo.",
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
    title: "AI Review Management India — Play Store, Google & WhatsApp",
    description:
      "AI replies for Play Store and WhatsApp, plus review recovery, in one inbox. From $16/mo.",
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
    "AI-powered review management for Indian SMBs and app developers. Auto-reply to Play Store reviews and WhatsApp Business messages in one unified inbox, with a Review Recovery Engine and AI Insights. Google Business Profile support is coming soon.",
  url: SITE_URL,
  image: SITE_OG,
  featureList: [
    "AI replies for Google Play Store reviews",
    "Review Recovery Engine — convert negative reviewers into promoters",
    "AI Insights — theme map and aspect-based sentiment",
    "ASO Analysis — audit your Play Store listing against your own review data",
    "WhatsApp Business automation via official Cloud API",
    "Meta-approved Embedded Signup for WhatsApp",
    "Sentiment analytics with Net Sentiment Score",
    "Team collaboration with role-based access",
  ],
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
    q: "Does ReviewPilot work with WhatsApp Business?",
    a: "Yes. ReviewPilot is a Meta-approved Tech Provider with the official WhatsApp Cloud API. Connect via Embedded Signup in 60 seconds, and inbound messages land in your unified inbox in real time alongside your Play Store reviews.",
  },
  {
    q: "Is the WhatsApp integration official and Meta-approved?",
    a: "Yes. ReviewPilot has whatsapp_business_messaging and whatsapp_business_management permissions in Meta Advanced Access. This is the official WhatsApp Cloud API — not a grey-market scraper or unofficial bridge.",
  },
  {
    q: "Can I reply to WhatsApp messages and Play Store reviews from the same inbox?",
    a: "Yes. ReviewPilot's unified inbox combines Play Store reviews and WhatsApp Business messages in one queue, with one AI engine drafting replies in your tone. Google Business Profile reviews are coming soon.",
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
      <Hero statsBar={<LiveStatsBar />} />
      <InteractiveAIDemo />
      <ThreePlatformBand />
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
