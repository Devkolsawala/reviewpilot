import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

const PAGE_URL = `${SITE_URL}/vs/birdeye`;

export const metadata: Metadata = {
  title: "Birdeye Alternative for Indian Businesses",
  description:
    "Affordable Birdeye alternative for India. ReviewPilot adds Play Store + WhatsApp Business automation, AI replies in 8 Indian languages, INR pricing from $16/mo.",
  alternates: { canonical: "/vs/birdeye" },
  openGraph: {
    title: "Birdeye Alternative for Indian Businesses — ReviewPilot",
    description:
      "ReviewPilot vs Birdeye: pricing, Play Store, WhatsApp, AI, India focus.",
    url: PAGE_URL,
    type: "article",
    siteName: "ReviewPilot",
    // og:image is provided by ./opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Birdeye Alternative for Indian Businesses",
    description: "From $16/mo. Play Store + Google + WhatsApp.",
  },
};

const FAQS = [
  {
    q: "Is ReviewPilot really cheaper than Birdeye?",
    a: "ReviewPilot's Starter plan is $16/month, billed in INR equivalent at checkout — published transparently on our pricing page. Birdeye is quote-only in India and typical market quotes start around $266/month on annual contracts. That's roughly 17× more for comparable review-management functionality.",
  },
  {
    q: "Does Birdeye support Google Play Store reviews?",
    a: "Birdeye focuses on Google Business Profile and other local-business review surfaces. Deep Play Store review management is not part of their core product, so app developers (and SMBs that run both a storefront and a mobile app) won't get a single inbox for both. ReviewPilot handles Play Store, Google Business Profile, and WhatsApp Business in one unified inbox.",
  },
  {
    q: "Does Birdeye have WhatsApp Business automation?",
    a: "Yes — Birdeye does support WhatsApp Business as a customer messaging channel. The differentiator is pricing and packaging: Birdeye is quote-only on annual contracts that typically start around $266/month, while ReviewPilot bundles WhatsApp Business automation, Play Store, and Google Business Profile review management on a self-serve $16/month plan billed in INR.",
  },
  {
    q: "When does Birdeye still make sense?",
    a: "If you're a large multi-location enterprise that needs deep CRM integrations, SSO, and dedicated CSM support — and budget isn't a constraint — Birdeye's feature depth may justify the price. ReviewPilot is built for Indian SMBs, indie app developers, and agencies that need affordable, India-friendly review management.",
  },
  {
    q: "Can I migrate from Birdeye to ReviewPilot?",
    a: "Yes. New reviews sync automatically once you connect Google Business Profile. Historical reply data isn't imported, but we're happy to walk you through onboarding on a free demo call.",
  },
  {
    q: "Does ReviewPilot bill in INR?",
    a: "Yes. Plans are quoted in USD on the pricing page for clarity, but checkout converts to INR via Razorpay. UPI, net banking, cards, and wallets are all supported.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Birdeye Alternative", item: PAGE_URL },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Birdeye Alternative for Indian Businesses — ReviewPilot",
  description:
    "Honest comparison of ReviewPilot and Birdeye, focused on pricing, Play Store, WhatsApp, and India-friendly billing.",
  image: SITE_OG,
  author: { "@type": "Organization", name: "ReviewPilot" },
  publisher: {
    "@type": "Organization",
    name: "ReviewPilot",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
  },
  datePublished: "2026-05-08",
  mainEntityOfPage: PAGE_URL,
};

const ROWS = [
  {
    cap: "Starting price (monthly)",
    a: "$16 (~₹1,500)",
    b: "~$266 (quoted)",
  },
  { cap: "Google Business Profile reviews", a: <Yes />, b: <Yes /> },
  {
    cap: "Google Play Store reviews",
    a: <Yes />,
    b: <No />,
  },
  {
    cap: "WhatsApp Business automation (Cloud API)",
    a: <Yes />,
    b: <Yes />,
  },
  { cap: "AI-drafted replies", a: <Yes />, b: <Yes /> },
  { cap: "8 Indian languages", a: <Yes />, b: <No /> },
  {
    cap: "INR billing via Razorpay",
    a: <Yes />,
    b: <No />,
  },
  {
    cap: "Self-serve signup (no sales call)",
    a: <Yes />,
    b: <No />,
  },
  {
    cap: "Annual contract required",
    a: <No />,
    b: <Yes />,
  },
];

export default function VsBirdeyePage() {
  return (
    <>
      <JsonLd data={[articleSchema, faqSchema, breadcrumbSchema]} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-28">
          <AuroraBackground intensity="subtle" />
          <GridPattern variant="grid" fade className="opacity-[0.3]" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              ReviewPilot vs Birdeye
            </p>
            <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              ReviewPilot vs Birdeye —{" "}
              <span className="text-gradient-brand font-serif italic">
                affordable review management
              </span>{" "}
              for Indian businesses.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Honest comparison. ReviewPilot adds Play Store + WhatsApp Business
              automation that Birdeye doesn&apos;t cover, ships AI replies in
              8 Indian languages, and bills in INR through Razorpay — at a
              fraction of Birdeye&apos;s annual-contract pricing.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start 7-day free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why we built it */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
              Why we built ReviewPilot
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Birdeye is a great enterprise tool. But for the Indian
              restaurant owner, the salon chain, the indie app developer
              with three Play Store apps — Birdeye is built for a different
              customer. The pricing, the annual contract, the sales call,
              the lack of Play Store and WhatsApp coverage — none of it
              matches how Indian SMBs actually buy or work. ReviewPilot
              exists to be the tool that does. Self-serve sign-up, INR
              billing, three platforms in one inbox, AI replies in your
              tone in eight Indian languages, $16 to start.
            </p>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-16 sm:py-20 bg-muted/20 border-y border-border/60">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
              Side-by-side comparison
            </h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Capability</th>
                      <th className="px-4 py-3 font-medium text-accent">
                        ReviewPilot
                      </th>
                      <th className="px-4 py-3 font-medium">Birdeye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ROWS.map((r) => (
                      <tr key={r.cap}>
                        <td className="px-4 py-3 font-medium text-foreground/90">
                          {r.cap}
                        </td>
                        <td className="px-4 py-3">{r.a}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.b}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Pricing reflects Birdeye&apos;s typical India market quotes;
              their pricing is negotiated per account, so confirm specifics
              with their sales team.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Questions
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Birdeye alternative FAQ
              </h2>
            </div>
            <Accordion type="single" collapsible className="mt-10">
              {FAQS.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-base font-medium">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-12 sm:p-16 text-center backdrop-blur-sm">
              <Sparkles className="mx-auto h-6 w-6 text-accent" />
              <h2 className="mx-auto mt-4 max-w-2xl font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Try the affordable Birdeye alternative.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                7-day free trial. No credit card. INR billing. Three
                integrations in one unified inbox.
              </p>
              <div className="mt-8 flex justify-center">
                <Button variant="gradient" size="xl" asChild>
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Yes() {
  return <CheckCircle2 className="h-4 w-4 text-accent" aria-label="Yes" />;
}
function No() {
  return (
    <XCircle className="h-4 w-4 text-muted-foreground/50" aria-label="No" />
  );
}
