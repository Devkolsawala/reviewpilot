import type { Metadata } from "next";
import { PricingTable } from "@/components/marketing/PricingTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing starting at ₹1,500/mo. 7-day free trial, no credit card required.",
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

export default function PricingPage() {
  return (
    <div className="py-20 sm:py-28">
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
