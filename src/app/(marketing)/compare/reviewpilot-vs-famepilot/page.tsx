import type { Metadata } from "next";
import { CompareLayout } from "@/components/marketing/CompareLayout";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "ReviewPilot vs Famepilot — India Review Management | ReviewPilot",
  description:
    "ReviewPilot vs Famepilot compared: pricing, Play Store support, AI replies, India focus. Two Indian review management tools — which fits your SMB?",
  alternates: { canonical: "/compare/reviewpilot-vs-famepilot" },
  openGraph: {
    title: "ReviewPilot vs Famepilot: Honest Comparison",
    description: "Two Indian review management platforms compared side-by-side.",
    url: `${SITE_URL}/compare/reviewpilot-vs-famepilot`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot vs Famepilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot vs Famepilot",
    description: "Two Indian review tools compared.",
    images: ["/og-image.svg"],
  },
};

const faqs = [
  {
    q: "Is Famepilot also Indian?",
    a: "Yes. Famepilot is one of the Indian review-management platforms targeting local businesses. Both ReviewPilot and Famepilot are India-built — the key differences are pricing, Play Store coverage, and feature depth.",
  },
  {
    q: "Does Famepilot support Play Store reviews?",
    a: "Famepilot is primarily focused on Google Business Profile and multi-location reputation management. [VERIFY Famepilot's current Play Store support] — if native Play Store reply is required, ReviewPilot is explicitly built for it.",
  },
  {
    q: "How does pricing compare?",
    a: "ReviewPilot starts at ₹1,500/month. Famepilot's pricing is [VERIFY — they don't publish it openly, request a quote]. We recommend evaluating both on Starter tiers against your actual location count.",
  },
  {
    q: "Which is better for an app developer?",
    a: "ReviewPilot is the clearer fit for app developers because Play Store review management is a first-class feature, including the 350-char limit and App Context Profiles for known bugs.",
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
  headline: "ReviewPilot vs Famepilot: Which Review Management Tool Is Right for You?",
  description: "Comparison of ReviewPilot and Famepilot for Indian SMBs.",
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
        competitor="Famepilot"
        intro="Famepilot is a well-established Indian review and reputation management platform popular with multi-location brands. ReviewPilot is a newer India-first alternative focused on transparent pricing, unified Google + Play Store inboxes, and SMB affordability."
        pricingNote="Famepilot pricing is quote-based and varies by location count; we mark specific numbers [VERIFY] where unpublished."
        rows={[
          { feature: "Starting price (monthly)", reviewpilot: "₹1,500 (published)", competitor: "[VERIFY — quote-based]" },
          { feature: "Google Business Profile replies", reviewpilot: true, competitor: true },
          { feature: "Google Play Store reviews", reviewpilot: true, competitor: "[VERIFY]" },
          { feature: "AI-generated replies", reviewpilot: true, competitor: "[VERIFY]" },
          { feature: "Indian-language replies", reviewpilot: true, competitor: "[VERIFY]" },
          { feature: "SMS review collection", reviewpilot: true, competitor: true },
          { feature: "Transparent published pricing", reviewpilot: true, competitor: false },
          { feature: "7-day free self-serve trial", reviewpilot: true, competitor: "[VERIFY]" },
        ]}
        whenCompetitor={[
          "You're a large multi-location enterprise (50+ locations) that values an established Indian brand with enterprise account managers.",
          "You need a specific Famepilot feature or existing partnership that ReviewPilot hasn't yet built.",
          "You don't need Play Store coverage.",
        ]}
        whenReviewPilot={[
          "You want transparent published pricing you can evaluate without a sales call.",
          "You need both Google Business Profile AND Play Store in one inbox.",
          "You're an SMB, agency, or indie developer who wants to self-serve.",
          "You want AI replies in Hindi, Tamil, Telugu, and other Indian languages.",
        ]}
        faqs={faqs}
      />
    </>
  );
}
