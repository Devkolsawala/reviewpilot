import type { Metadata } from "next";
import { CompareLayout } from "@/components/marketing/CompareLayout";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "ReviewPilot vs Podium — Pricing, Features Compared | ReviewPilot",
  description:
    "ReviewPilot vs Podium compared: price, Play Store, India focus, AI auto-replies. Honest side-by-side to help Indian SMBs choose the right tool.",
  alternates: { canonical: "/compare/reviewpilot-vs-podium" },
  openGraph: {
    title: "ReviewPilot vs Podium: Honest Comparison",
    description: "Pricing, AI replies, Play Store support. Side-by-side comparison.",
    url: `${SITE_URL}/compare/reviewpilot-vs-podium`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot vs Podium" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot vs Podium",
    description: "Side-by-side comparison for Indian SMBs.",
    images: ["/og-image.svg"],
  },
};

const faqs = [
  {
    q: "Is Podium available in India?",
    a: "Podium primarily serves North American SMBs and multi-location chains. India-market presence, INR invoicing, and local support are limited. If you're running an Indian business, ReviewPilot is purpose-built for your market — INR billing, UPI payments, India-based support, and Indian-language AI replies included.",
  },
  {
    q: "Does Podium have AI review replies?",
    a: "Podium focuses on customer messaging and reviews, with AI reply capabilities gated to higher-tier plans. ReviewPilot includes AI replies on every plan starting at ₹1,500/month — including brand-voice training on your existing replies.",
  },
  {
    q: "How does pricing compare?",
    a: "ReviewPilot Starter is ₹1,500/month — published, self-serve, billed in INR. Podium's plans start around ~₹20,000/month-equivalent (USD-billed) for Indian customers, on an annual contract. For the same core outcome — more replies, higher ratings — ReviewPilot is roughly 13× more efficient on spend, with no annual commitment.",
  },
  {
    q: "Does Podium support Play Store reviews?",
    a: "Play Store review management is not a core Podium capability. If you're an app developer, ReviewPilot is the direct fit.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "ReviewPilot vs Podium: Which Review Management Tool Is Right for You?",
  description: "Comparison of ReviewPilot and Podium for Indian SMBs.",
  image: SITE_OG,
  author: { "@type": "Organization", name: "ReviewPilot" },
  publisher: { "@type": "Organization", name: "ReviewPilot", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` } },
  datePublished: "2026-04-14",
};

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema, faqSchema]} />
      <CompareLayout
        competitor="Podium"
        intro="Podium is a well-known North American customer messaging and review platform, popular with multi-location US SMBs. ReviewPilot is India-built, priced in INR, and adds native Play Store review management for app developers."
        pricingNote="Podium's plans are priced in USD for the North American market; the ~₹20,000 figure below is the typical India-equivalent at current exchange rates."
        rows={[
          { feature: "Starting price (monthly)", reviewpilot: "₹1,500", competitor: "~₹20,000 (USD-billed)" },
          { feature: "Google Business Profile replies", reviewpilot: true, competitor: true },
          { feature: "Google Play Store reviews", reviewpilot: true, competitor: false },
          { feature: "AI-generated replies", reviewpilot: true, competitor: "Tier-dependent" },
          { feature: "India-first pricing (INR, UPI)", reviewpilot: true, competitor: false },
          { feature: "SMS review collection", reviewpilot: true, competitor: true },
          { feature: "Indian-language replies", reviewpilot: true, competitor: "Not advertised" },
          { feature: "7-day free trial, no card", reviewpilot: true, competitor: "Demo-only" },
        ]}
        whenCompetitor={[
          "You're a US-headquartered multi-location chain with an existing Podium deployment.",
          "Customer messaging (SMS chat, payments) is your primary need, not review management.",
          "Your budget comfortably absorbs enterprise SaaS pricing.",
        ]}
        whenReviewPilot={[
          "You're an Indian business or agency that wants INR pricing and local support.",
          "You need Play Store review management — Podium doesn't do it.",
          "You want AI replies in Indian languages.",
          "You'd rather evaluate on a self-serve free trial than book a sales call.",
        ]}
        faqs={faqs}
      />
    </>
  );
}
