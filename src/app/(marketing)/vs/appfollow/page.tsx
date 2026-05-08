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

const PAGE_URL = `${SITE_URL}/vs/appfollow`;

export const metadata: Metadata = {
  title: "AppFollow Alternative for Play Store Review Automation",
  description:
    "AppFollow alternative built for Indian app developers. ReviewPilot adds AI replies, Google Business Profile, WhatsApp Business, and INR pricing from $16/mo.",
  alternates: { canonical: "/vs/appfollow" },
  openGraph: {
    title: "AppFollow Alternative — ReviewPilot",
    description:
      "Play Store review automation with AI replies. Plus Google + WhatsApp.",
    url: PAGE_URL,
    type: "article",
    siteName: "ReviewPilot",
    // og:image is provided by ./opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "AppFollow Alternative — ReviewPilot",
    description: "Play Store + GBP + WhatsApp. From $16/mo.",
  },
};

const FAQS = [
  {
    q: "How is ReviewPilot different from AppFollow?",
    a: "AppFollow is a strong Play Store and App Store review monitoring tool focused on app developers. ReviewPilot extends that with AI-drafted replies, Google Business Profile review management, and WhatsApp Business automation — all in a single unified inbox. So if you're an app developer who also wants to manage your support WhatsApp number or your studio's Google reviews, ReviewPilot covers all of it.",
  },
  {
    q: "Does AppFollow support Google Business Profile?",
    a: "No. AppFollow's core focus is mobile app stores — Google Play Store and Apple App Store. Native Google Business Profile (GBP / Google My Business) review management is not part of their product. ReviewPilot supports Google Business Profile via OAuth alongside Play Store and WhatsApp Business in one unified inbox.",
  },
  {
    q: "Does AppFollow do WhatsApp automation?",
    a: "No. AppFollow does not offer WhatsApp Business Cloud API integration. ReviewPilot is a verified Meta Tech Provider with Embedded Signup, real-time Cloud API webhooks, and AI replies inside Meta's 24-hour customer service window.",
  },
  {
    q: "Does ReviewPilot do iOS App Store reviews?",
    a: "Not yet. ReviewPilot focuses on Google Play Store, Google Business Profile, and WhatsApp Business today. If iOS App Store coverage is a hard requirement, AppFollow is the better fit. If Play Store + Google + WhatsApp matters more, ReviewPilot is the only tool that covers all three.",
  },
  {
    q: "Is ReviewPilot India-friendly?",
    a: "Yes. Plans start at $16/month, billed in INR equivalent through Razorpay. UPI, net banking, cards, and wallets all work. AI replies are tuned for Indian English and 7 other Indian languages out of the box.",
  },
  {
    q: "Can I use both ReviewPilot and AppFollow?",
    a: "You can — they're not mutually exclusive. But most teams find ReviewPilot's AI-drafted replies, recovery engine, and unified inbox cover the same ground at a lower monthly cost.",
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
    { "@type": "ListItem", position: 2, name: "AppFollow Alternative", item: PAGE_URL },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "AppFollow Alternative — ReviewPilot for Play Store + Google + WhatsApp",
  description:
    "Honest comparison of ReviewPilot and AppFollow for app developers and SMBs.",
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
    b: "~$160",
  },
  { cap: "Google Play Store reviews", a: <Yes />, b: <Yes /> },
  {
    cap: "iOS App Store reviews",
    a: <No />,
    b: <Yes />,
  },
  {
    cap: "Google Business Profile reviews",
    a: <Yes />,
    b: <No />,
  },
  {
    cap: "WhatsApp Business automation (Cloud API)",
    a: <Yes />,
    b: <No />,
  },
  { cap: "AI-drafted replies", a: <Yes />, b: <Yes /> },
  { cap: "8 Indian languages", a: <Yes />, b: <No /> },
  {
    cap: "INR billing via Razorpay",
    a: <Yes />,
    b: <No />,
  },
];

export default function VsAppFollowPage() {
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
              ReviewPilot vs AppFollow
            </p>
            <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              ReviewPilot vs AppFollow — for{" "}
              <span className="text-gradient-brand font-serif italic">
                Play Store review automation
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              The honest comparison for Indian app developers. AppFollow
              monitors mobile app reviews. ReviewPilot adds AI-drafted
              replies, Google Business Profile, and WhatsApp Business —
              all in one inbox, billed in INR from $16/month.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start 7-day free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/for-app-developers">
                  Play Store review tool for developers
                </Link>
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
              AppFollow is excellent at monitoring Play Store and App Store
              reviews. But for an Indian indie dev or studio that wants
              the AI to actually draft and ship the replies — not just
              alert you that a review came in — and that also wants to
              cover the studio&apos;s Google Business Profile and the
              support WhatsApp number, AppFollow leaves three obvious
              gaps. ReviewPilot fills all three. That&apos;s the difference.
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
                      <th className="px-4 py-3 font-medium">AppFollow</th>
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
              AppFollow pricing reflects their published Free / Starter /
              Growing tier; enterprise plans are quote-only.
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
                AppFollow alternative FAQ
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
                Try the AI-first AppFollow alternative.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                7-day free trial. No credit card. Play Store, Google, and
                WhatsApp — one inbox.
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
