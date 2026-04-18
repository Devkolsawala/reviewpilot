import type { Metadata } from "next";
import { CompareLayout } from "@/components/marketing/CompareLayout";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "ReviewPilot vs Simplify360 — India Review Tools | ReviewPilot",
  description:
    "ReviewPilot vs Simplify360 compared: pricing, AI replies, Play Store support, India focus. Pick the right review management tool for your SMB.",
  alternates: { canonical: "/compare/reviewpilot-vs-simplify360" },
  openGraph: {
    title: "ReviewPilot vs Simplify360: Honest Comparison",
    description: "Which Indian review management tool is right for you?",
    url: `${SITE_URL}/compare/reviewpilot-vs-simplify360`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot vs Simplify360" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot vs Simplify360",
    description: "Indian review management tools compared.",
    images: ["/og-image.svg"],
  },
};

const faqs = [
  {
    q: "Who is Simplify360 for?",
    a: "Simplify360 is an established Indian customer-experience platform covering social listening, reviews, and support. It targets mid-market and enterprise customers with bundled CX needs.",
  },
  {
    q: "Can I buy just review management from Simplify360?",
    a: "Simplify360's pricing is typically bundled with broader CX modules (social listening + support + reviews) and quoted per account. A standalone review management SKU isn't part of their published offering. If you only need review management, ReviewPilot's ₹1,500/month Starter is a purpose-built, published price you can start with today.",
  },
  {
    q: "Does Simplify360 cover Play Store reviews?",
    a: "Simplify360's strength is social listening and web review surfaces for mid-market brands. Native Play Store review management isn't advertised as a core capability. ReviewPilot treats Play Store as a first-class channel — purpose-built for Indian app developers, with the 350-character limit and App Context Profiles for known bugs handled natively.",
  },
  {
    q: "Which should an indie app developer pick?",
    a: "ReviewPilot — by a wide margin. Simplify360 is priced and built for larger CX operations, not solo developers or small studios managing 1–3 apps.",
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
  headline: "ReviewPilot vs Simplify360: Which Review Management Tool Is Right for You?",
  description: "Comparison of ReviewPilot and Simplify360 for Indian SMBs.",
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
        competitor="Simplify360"
        intro="Simplify360 is an established Indian customer experience platform with social listening, reviews, and support bundled together for mid-market and enterprise customers. ReviewPilot is a focused, SMB-priced review management tool with native Play Store coverage."
        pricingNote="Simplify360 pricing is bundled with their broader CX suite and quoted per account, so exact numbers aren't published publicly."
        rows={[
          { feature: "Starting price (monthly)", reviewpilot: "₹1,500", competitor: "Enterprise bundle" },
          { feature: "Google Business Profile replies", reviewpilot: true, competitor: true },
          { feature: "Google Play Store reviews", reviewpilot: true, competitor: "Not advertised" },
          { feature: "AI-generated replies", reviewpilot: true, competitor: "Tier-dependent" },
          { feature: "India-first (INR, UPI)", reviewpilot: true, competitor: true },
          { feature: "Standalone review management SKU", reviewpilot: true, competitor: "Bundled only" },
          { feature: "Self-serve onboarding", reviewpilot: true, competitor: false },
          { feature: "7-day free trial, no card", reviewpilot: true, competitor: "Demo-only" },
        ]}
        whenCompetitor={[
          "You're a mid-market or enterprise CX team that needs reviews AND social listening AND support in one contract.",
          "You have a dedicated CX/ops team that will configure a larger platform.",
          "Your budget is allocated for enterprise SaaS bundles, not SMB SaaS.",
        ]}
        whenReviewPilot={[
          "You want a focused review-management tool, not a full CX suite.",
          "You need Google Business Profile AND Play Store in one inbox.",
          "You want transparent, self-serve pricing in INR.",
          "You'd rather be live in 10 minutes than in six weeks of onboarding.",
        ]}
        faqs={faqs}
      />
    </>
  );
}
