import type { Metadata } from "next";
import { CompareLayout } from "@/components/marketing/CompareLayout";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "ReviewPilot vs Birdeye — Price, Play Store, India Focus | ReviewPilot",
  description:
    "ReviewPilot vs Birdeye compared: pricing, Play Store support, India focus, AI replies. Honest side-by-side for Indian SMBs. Read before you commit.",
  alternates: { canonical: "/compare/reviewpilot-vs-birdeye" },
  openGraph: {
    title: "ReviewPilot vs Birdeye: Honest Comparison",
    description:
      "Pricing, features, Play Store support. Which tool fits your Indian SMB?",
    url: `${SITE_URL}/compare/reviewpilot-vs-birdeye`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot vs Birdeye" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot vs Birdeye",
    description: "Honest comparison for Indian SMBs.",
    images: ["/og-image.svg"],
  },
};

const faqs = [
  {
    q: "Is ReviewPilot really 17× cheaper than Birdeye?",
    a: "ReviewPilot's Starter plan is $16/month — published on our pricing page, billed in INR equivalent at checkout. Birdeye's India-market quotes typically start around $266/month for comparable functionality, billed on an annual contract. That's roughly 17× more. Birdeye pricing is quote-only, so the exact figure depends on your sales call with them.",
  },
  {
    q: "Does Birdeye support Google Play Store reviews?",
    a: "Birdeye focuses on Google Business Profile and other local-business review surfaces. Play Store review management is not part of their core product. If you're an Indian app developer — or an SMB that runs both a storefront and a mobile app — ReviewPilot is the only tool that handles both Play Store and Google Business Profile in a single inbox.",
  },
  {
    q: "What about integrations and enterprise features?",
    a: "Birdeye has deeper integrations with enterprise CRMs, SSO, and multi-brand hierarchies. If you're a large multi-location enterprise, Birdeye's feature depth may justify the price. ReviewPilot is optimized for SMBs and indie devs.",
  },
  {
    q: "Can I migrate from Birdeye to ReviewPilot?",
    a: "Yes — new reviews sync automatically once you connect Google Business Profile. Historical reply data isn't imported, but we're happy to walk you through onboarding on a free demo call.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "ReviewPilot vs Birdeye: Which Review Management Tool Is Right for You?",
  description:
    "Side-by-side comparison of ReviewPilot and Birdeye for Indian SMBs and app developers.",
  image: SITE_OG,
  author: { "@type": "Organization", name: "ReviewPilot" },
  publisher: {
    "@type": "Organization",
    name: "ReviewPilot",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
  },
  datePublished: "2026-04-14",
};

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema, faqSchema]} />
      <CompareLayout
        competitor="Birdeye"
        intro="Birdeye is one of the most established global review management platforms, trusted by large multi-location enterprises. ReviewPilot is a newer India-first alternative built for SMBs and app developers at a fraction of the cost. This comparison uses only publicly available information; because Birdeye's India pricing and feature set are negotiated per account, we recommend confirming specifics with their sales team before you commit."
        pricingNote="The ReviewPilot price shown is our published Starter plan ($16/mo, billed in INR equivalent at checkout). Birdeye is quote-only in India, so the ~$266/mo figure reflects typical market quotes and will vary by contract size."
        rows={[
          { feature: "Starting price (monthly)", reviewpilot: "$16", competitor: "~$266 (quoted)" },
          { feature: "Google Business Profile replies", reviewpilot: true, competitor: true },
          { feature: "Google Play Store reviews", reviewpilot: true, competitor: "Not a core feature" },
          { feature: "AI-generated replies", reviewpilot: true, competitor: true },
          { feature: "India-first pricing (INR, UPI)", reviewpilot: true, competitor: false },
          { feature: "SMS review collection", reviewpilot: true, competitor: true },
          { feature: "Annual contract required", reviewpilot: false, competitor: "Typically yes" },
          { feature: "7-day free trial, no card", reviewpilot: true, competitor: "Demo-only" },
          { feature: "Indian-language AI replies", reviewpilot: true, competitor: "Not advertised" },
        ]}
        whenCompetitor={[
          "You're a large multi-location enterprise with $266+/month review-management budget.",
          "You need deep CRM, SSO, and enterprise integrations out of the box.",
          "Your stakeholders require a Gartner-recognized vendor with decades of history.",
          "You do not need Play Store review management.",
        ]}
        whenReviewPilot={[
          "You're an Indian SMB, agency, or indie app developer with a realistic SaaS budget.",
          "You need Google Business Profile AND Play Store in one inbox.",
          "You want INR pricing, UPI, and India-based support.",
          "You want AI replies in Hindi, Tamil, Telugu and other Indian languages.",
          "You'd rather start with a 7-day trial and no annual contract.",
        ]}
        faqs={faqs}
      />
    </>
  );
}
