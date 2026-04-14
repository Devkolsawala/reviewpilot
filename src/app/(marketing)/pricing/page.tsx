import type { Metadata } from "next";
import { PricingTable } from "@/components/marketing/PricingTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { JsonLd, SITE_URL } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Pricing — AI Review Management from ₹1,500/mo | ReviewPilot",
  description:
    "Simple review management software pricing for India. Starter ₹1,500/mo, Growth ₹3,000, Agency ₹8,000. Start your 7-day free trial — no card required.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — AI Review Management from ₹1,500/mo | ReviewPilot",
    description:
      "Transparent India-first pricing for AI review management. Plans from ₹1,500/mo. Start your free 7-day trial.",
    url: `${SITE_URL}/pricing`,
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot Pricing — From ₹1,500/mo",
    description: "AI review management plans for Indian SMBs. Try free for 7 days.",
    images: ["/og-image.svg"],
  },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "ReviewPilot",
  description:
    "AI-powered review management software for Indian businesses and app developers.",
  brand: { "@type": "Brand", name: "ReviewPilot" },
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "1500",
      priceCurrency: "INR",
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
      description: "1 location or 1 app, 100 AI replies/week, 3 team seats.",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "3000",
      priceCurrency: "INR",
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
      description: "3 locations or 3 apps, 500 AI replies/week, 5 team seats.",
    },
    {
      "@type": "Offer",
      name: "Agency",
      price: "8000",
      priceCurrency: "INR",
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
      description: "10 locations or apps, unlimited AI replies, white-label reports.",
    },
  ],
};

const FAQ = [
  {
    q: "Is there a free trial?",
    a: "Yes! Every plan includes a 7-day free trial with full access to all features. No credit card required to start.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards, UPI, net banking, and wallets through our payment partner Razorpay.",
  },
  {
    q: "What happens after the trial ends?",
    a: "If you don't subscribe, your account moves to the free plan with limited features. Your data is preserved for 30 days.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes, we offer a full refund within 7 days of purchase if you're not satisfied. No questions asked.",
  },
  {
    q: "Can I use ReviewPilot for both Google Business and Play Store?",
    a: "Yes! All plans support both platforms. The connection limit determines how many locations or apps you can manage simultaneously.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingPage() {
  return (
    <div className="py-20 sm:py-28">
      <JsonLd data={[productSchema, faqSchema]} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Scale as you grow. No hidden fees.
          </p>
        </div>

        <PricingTable />

        {/* FAQ */}
        <div className="mt-24 max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
