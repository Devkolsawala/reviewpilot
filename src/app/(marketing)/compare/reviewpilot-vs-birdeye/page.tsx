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
    a: "ReviewPilot's Starter plan is ₹1,500/month. Birdeye's published India-market quotes typically start around ₹25,000/month for comparable functionality — roughly 17×. [VERIFY current Birdeye pricing before committing as the number moves].",
  },
  {
    q: "Does Birdeye support Google Play Store reviews?",
    a: "Birdeye focuses on Google Business Profile and other local-business review surfaces. Play Store review management is not a core Birdeye capability. [VERIFY Birdeye's current feature set] — if you need Play Store support, ReviewPilot is built for it.",
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
        intro="Birdeye is one of the most established global review management platforms, trusted by large multi-location enterprises. ReviewPilot is a newer India-first alternative built for SMBs and app developers at a fraction of the cost. This comparison uses only publicly available information — we mark [VERIFY] where a specific fact should be confirmed with the vendor before you commit."
        pricingNote="Pricing noted reflects the ReviewPilot Starter plan (₹1,500/mo) vs typical Birdeye India-market quotes; Birdeye pricing is negotiated and should be [VERIFY]-ed with their sales team."
        rows={[
          { feature: "Starting price (monthly)", reviewpilot: "₹1,500", competitor: "~₹25,000 [VERIFY]" },
          { feature: "Google Business Profile replies", reviewpilot: true, competitor: true },
          { feature: "Google Play Store reviews", reviewpilot: true, competitor: "[VERIFY — not a core feature]" },
          { feature: "AI-generated replies", reviewpilot: true, competitor: true },
          { feature: "India-first pricing (INR, UPI)", reviewpilot: true, competitor: false },
          { feature: "SMS review collection", reviewpilot: true, competitor: true },
          { feature: "Annual contract required", reviewpilot: false, competitor: "[VERIFY]" },
          { feature: "7-day free trial, no card", reviewpilot: true, competitor: "[VERIFY]" },
          { feature: "Indian-language AI replies", reviewpilot: true, competitor: "[VERIFY]" },
        ]}
        whenCompetitor={[
          "You're a large multi-location enterprise with ₹25,000+/month review-management budget.",
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
