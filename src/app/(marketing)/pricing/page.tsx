import type { Metadata } from "next";
import { PricingTable } from "@/components/marketing/PricingTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
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
    { "@type": "Offer", name: "Starter", price: "1500", priceCurrency: "INR", url: `${SITE_URL}/pricing`, availability: "https://schema.org/InStock", description: "1 location or 1 app, 100 AI replies/week, 3 team seats." },
    { "@type": "Offer", name: "Growth", price: "3000", priceCurrency: "INR", url: `${SITE_URL}/pricing`, availability: "https://schema.org/InStock", description: "3 locations or 3 apps, 500 AI replies/week, 5 team seats." },
    { "@type": "Offer", name: "Agency", price: "8000", priceCurrency: "INR", url: `${SITE_URL}/pricing`, availability: "https://schema.org/InStock", description: "10 locations or apps, unlimited AI replies, white-label reports." },
  ],
};

const FAQ = [
  { q: "Is there a free trial?", a: "Yes — every plan includes a 7-day free trial with full access to all features. No credit card required to start." },
  { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
  { q: "What payment methods do you accept?", a: "All major credit/debit cards, UPI, net banking, and wallets via Razorpay." },
  { q: "What happens after the trial ends?", a: "If you don't subscribe, your account moves to the free plan with limited features. Your data is preserved for 30 days." },
  { q: "Do you offer refunds?", a: "We don't offer refunds on subscription payments — and here's why that's actually good for you. Every plan includes a 7-day free trial with full access to every feature, no credit card required. That's your evaluation window: connect your Play Store, train the AI on your brand voice, reply to real reviews, and see the results before you ever pay. If it's not right for you, simply don't subscribe. By skipping refund processing, we keep prices at ₹1,500/month instead of the ₹25,000+ that enterprise competitors charge. If you cancel a paid plan, it stays active until the end of your current billing cycle — you keep everything you paid for." },
  { q: "Can I use ReviewPilot for both Google Business and Play Store?", a: "Google Play Store review management is live today. Google Business Profile automation is launching soon and will be included in every plan at no extra cost." },
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
    <>
      <JsonLd data={[productSchema, faqSchema]} />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Pricing
          </p>
          <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
            Plans that{" "}
            <span className="text-gradient-brand font-serif italic">
              scale with your stars
            </span>
            .
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start free for 7 days. No credit card. Switch, upgrade, or cancel at any
            time.
          </p>
        </div>
      </section>

      <div className="px-4 pb-24 sm:px-6 lg:px-8">
        <PricingTable />
      </div>

      {/* FAQ */}
      <section className="relative py-24 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Before you ask
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-12 w-full">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-border/60 last:border-b-0"
              >
                <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline hover:text-foreground">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
