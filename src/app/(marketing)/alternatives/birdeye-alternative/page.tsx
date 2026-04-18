import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CheckCircle2, XCircle, MinusCircle,
  IndianRupee, Smartphone, Globe,
} from "lucide-react";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Affordable Birdeye Alternative for India — ReviewPilot",
  description:
    "Looking for a Birdeye alternative in India? ReviewPilot is 17× cheaper, supports Play Store reviews, and is built for Indian SMBs. Compare Birdeye vs AppFollow vs ReviewPilot.",
  alternates: { canonical: "/alternatives/birdeye-alternative" },
  openGraph: {
    title: "Birdeye Alternative India — Affordable AI Review Management | ReviewPilot",
    description:
      "ReviewPilot vs Birdeye vs AppFollow: honest comparison for Indian SMBs. 17× cheaper, Play Store + Google Business, INR pricing. Start free.",
    url: `${SITE_URL}/alternatives/birdeye-alternative`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Birdeye alternative India — ReviewPilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Birdeye Alternative for India | ReviewPilot",
    description: "17× cheaper than Birdeye. Play Store + Google Business reviews. INR pricing. Start your free trial.",
    images: ["/og-image.svg"],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best Birdeye Alternative for India in 2026: ReviewPilot vs Birdeye vs AppFollow",
  description:
    "Honest comparison of ReviewPilot, Birdeye, and AppFollow for Indian SMBs and app developers. Covers pricing, Play Store support, Indian language AI, and India-first features.",
  image: SITE_OG,
  author: { "@type": "Organization", name: "ReviewPilot" },
  publisher: {
    "@type": "Organization",
    name: "ReviewPilot",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
  },
  datePublished: "2026-04-14",
  dateModified: "2026-04-14",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is ReviewPilot really 17× cheaper than Birdeye?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReviewPilot's Starter plan is ₹1,500/month — published, self-serve, and billed in INR with UPI support. Birdeye's India-market quotes typically start around ₹25,000/month for comparable functionality, billed in USD on an annual contract. That's roughly 17× more for a tool not designed around Indian SMB workflows. Birdeye's pricing is quote-only, so exact numbers depend on your sales conversation with them.",
      },
    },
    {
      "@type": "Question",
      name: "Does Birdeye support Google Play Store reviews?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Birdeye focuses on Google Business Profile and local-business review surfaces. Play Store review management is not a core Birdeye capability. ReviewPilot is the only India-market tool that handles both Play Store and Google Business Profile in a single inbox.",
      },
    },
    {
      "@type": "Question",
      name: "What does AppFollow do that ReviewPilot doesn't?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AppFollow is a global app store intelligence platform with deeper App Store analytics, sentiment tracking over time, and integrations with Slack and Jira. It is not focused on Google Business Profile reviews. ReviewPilot is the better fit if you need both Play Store and GBP reviews managed together at an India-friendly price.",
      },
    },
    {
      "@type": "Question",
      name: "Can I switch from Birdeye to ReviewPilot without losing data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — new reviews sync automatically once you connect Google Business Profile or Play Console. Historical reply data from Birdeye is not migrated, but ReviewPilot will pull your last 90 days of reviews on the first sync. Our team can walk you through onboarding on a free demo call.",
      },
    },
  ],
};

type FeatureRow = {
  feature: string;
  reviewpilot: boolean | string;
  birdeye: boolean | string;
  appfollow: boolean | string;
};

const ROWS: FeatureRow[] = [
  { feature: "Starting monthly price (INR)", reviewpilot: "₹1,500", birdeye: "~₹25,000 ", appfollow: "~₹8,000 " },
  { feature: "Google Business Profile reviews", reviewpilot: true, birdeye: true, appfollow: false },
  { feature: "Google Play Store reviews", reviewpilot: true, birdeye: false, appfollow: true },
  { feature: "Both GBP + Play Store in one inbox", reviewpilot: true, birdeye: false, appfollow: false },
  { feature: "AI-generated review replies", reviewpilot: true, birdeye: true, appfollow: true },
  { feature: "INR pricing & UPI payments", reviewpilot: true, birdeye: false, appfollow: false },
  { feature: "SMS review collection", reviewpilot: true, birdeye: true, appfollow: false },
  { feature: "Smart routing (4–5★ to Google, 1–3★ private)", reviewpilot: true, birdeye: "Partial", appfollow: false },
  { feature: "7-day free trial, no credit card", reviewpilot: true, birdeye: false, appfollow: false },
  { feature: "India-based support", reviewpilot: true, birdeye: false, appfollow: false },
  { feature: "Enterprise CRM integrations", reviewpilot: false, birdeye: true, appfollow: true },
  { feature: "Multi-location management", reviewpilot: true, birdeye: true, appfollow: false },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return <CheckCircle2 className="h-5 w-5 text-accent mx-auto" />;
  if (value === false)
    return <XCircle className="h-5 w-5 text-red-400/60 mx-auto" />;
  return (
    <span className="text-xs text-muted-foreground text-center block">{value}</span>
  );
}

const FAQS = [
  {
    q: "Is ReviewPilot really 17× cheaper than Birdeye?",
    a: "ReviewPilot's Starter plan is ₹1,500/month — published, self-serve, and billed in INR with UPI support. Birdeye's India-market quotes typically start around ₹25,000/month for comparable functionality, billed in USD on an annual contract. That's roughly 17× more for a tool not designed around Indian SMB workflows. Birdeye's pricing is quote-only, so exact numbers depend on your sales conversation with them.",
  },
  {
    q: "Does Birdeye support Google Play Store reviews?",
    a: "Birdeye focuses on Google Business Profile and local-business review surfaces. Play Store review management is not a core Birdeye capability. ReviewPilot is the only India-market tool that handles both Play Store and Google Business Profile in a single inbox.",
  },
  {
    q: "What does AppFollow do that ReviewPilot doesn't?",
    a: "AppFollow is a global app store intelligence platform with deeper App Store analytics, sentiment tracking over time, and integrations with Slack and Jira. It is not focused on Google Business Profile reviews. ReviewPilot is the better fit if you need both Play Store and GBP reviews managed together at an India-friendly price.",
  },
  {
    q: "Can I switch from Birdeye to ReviewPilot without losing data?",
    a: "Yes — new reviews sync automatically once you connect Google Business Profile or Play Console. Historical reply data from Birdeye is not migrated, but ReviewPilot will pull your last 90 days of reviews on the first sync. Our team can walk you through onboarding on a free demo call.",
  },
];

export default function BirdeyeAlternativePage() {
  return (
    <>
      <JsonLd data={[articleSchema, faqSchema]} />

      {/* Hero */}
      <section className="py-20 sm:py-28 ">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/60 border border-border/60 backdrop-blur-sm px-3 py-1 text-sm text-accent mb-6">
            <IndianRupee className="h-3.5 w-3.5" /> Birdeye Alternative India
          </div>
          <h1 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            The Affordable Birdeye Alternative{" "}
            <span className="text-accent">Built for India</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Birdeye charges Indian SMBs ~₹25,000/month. ReviewPilot does the
            same core job — AI review replies for Google Business Profile and
            Play Store — for ₹1,500/month. That&apos;s 17× cheaper, with INR billing,
            UPI payments, and Indian-language AI replies included.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free Trial — No Card <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See Pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            7-day free trial · Plans from ₹1,500/month · No annual contract
          </p>
        </div>
      </section>

      {/* Pricing callout */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-center mb-10">
            The Price Gap Is Not Small
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60-2 border-border/60 bg-card/40 backdrop-blur-sm p-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)] text-white font-sans font-semibold tracking-tight text-sm mx-auto mb-3">
                RP
              </div>
              <p className="font-sans text-lg font-semibold tracking-tight mb-1">ReviewPilot</p>
              <p className="text-3xl font-bold text-accent font-sans">₹1,500</p>
              <p className="text-sm text-muted-foreground mt-1">per month · Starter</p>
              <div className="mt-4 space-y-2 text-sm text-left">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> GBP + Play Store</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> Indian languages</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> UPI / INR billing</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> No annual contract</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 text-center opacity-80">
              <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-sans text-lg font-semibold tracking-tight mb-1">Birdeye</p>
              <p className="text-3xl font-bold text-foreground font-sans">~₹25,000</p>
              <p className="text-sm text-muted-foreground mt-1">per month · quote-only</p>
              <div className="mt-4 space-y-2 text-sm text-left">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> GBP reviews</div>
                <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400/60 shrink-0" /> No Play Store</div>
                <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400/60 shrink-0" /> USD billing</div>
                <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400/60 shrink-0" /> Annual contract</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 text-center opacity-80">
              <Smartphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-sans text-lg font-semibold tracking-tight mb-1">AppFollow</p>
              <p className="text-3xl font-bold text-foreground font-sans">~₹8,000</p>
              <p className="text-sm text-muted-foreground mt-1">per month · USD-billed plans</p>
              <div className="mt-4 space-y-2 text-sm text-left">
                <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400/60 shrink-0" /> No GBP reviews</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> Play Store reviews</div>
                <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400/60 shrink-0" /> USD billing</div>
                <div className="flex items-center gap-2"><MinusCircle className="h-4 w-4 text-amber-400 shrink-0" /> Free tier limited</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Competitor pricing is based on publicly available information and should be verified with each vendor before purchasing.
          </p>
        </div>
      </section>

      {/* Full comparison table */}
      <section className="py-20 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-sans text-3xl font-semibold tracking-tight text-center mb-12">
            Full Feature Comparison
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-sans font-semibold tracking-tight w-1/2">Feature</th>
                  <th className="p-4 font-sans font-semibold tracking-tight text-accent w-[17%]">ReviewPilot</th>
                  <th className="p-4 font-sans font-semibold tracking-tight text-muted-foreground w-[17%]">Birdeye</th>
                  <th className="p-4 font-sans font-semibold tracking-tight text-muted-foreground w-[17%]">AppFollow</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="p-4 text-muted-foreground">{row.feature}</td>
                    <td className="p-4"><Cell value={row.reviewpilot} /></td>
                    <td className="p-4"><Cell value={row.birdeye} /></td>
                    <td className="p-4"><Cell value={row.appfollow} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Data as per Google
          </p>
        </div>
      </section>

      {/* When to choose each */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-sans text-3xl font-semibold tracking-tight text-center mb-12">
            Which Tool Is Right for You?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60-2 border-border/60 bg-card/40 backdrop-blur-sm p-6">
              <p className="font-sans font-semibold tracking-tight mb-4 text-accent">
                Choose ReviewPilot if…
              </p>
              <ul className="space-y-3">
                {[
                  "You're an Indian SMB or indie app developer",
                  "You need Play Store AND Google Business reviews together",
                  "You want INR billing, UPI, and India-based support",
                  "You need AI replies in Hindi, Tamil, Telugu, and more",
                  "You want a 7-day free trial with no annual commitment",
                  "Your budget is ₹1,500–₹8,000/month",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6">
              <p className="font-sans font-semibold tracking-tight mb-4 text-muted-foreground">
                Choose Birdeye if…
              </p>
              <ul className="space-y-3">
                {[
                  "You're a large enterprise with a ₹25,000+/month budget",
                  "You need deep CRM, SSO, and enterprise integrations",
                  "You manage 50+ locations across multiple countries",
                  "You don't need Play Store review management",
                  "Your stakeholders require a Gartner-recognised vendor",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <MinusCircle className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6">
              <p className="font-sans font-semibold tracking-tight mb-4 text-muted-foreground">
                Choose AppFollow if…
              </p>
              <ul className="space-y-3">
                {[
                  "You only care about app store analytics (not GBP)",
                  "You need deep App Store (iOS) review management",
                  "You want Slack / Jira integrations for your dev team",
                  "You don't manage Google Business Profile locations",
                  "Your primary market is global, not India-specific",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <MinusCircle className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-sans text-3xl font-semibold tracking-tight text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-5">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6">
                <h3 className="font-sans font-semibold tracking-tight mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-10 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          Also see:{" "}
          <Link href="/compare/reviewpilot-vs-birdeye" className="text-accent hover:underline">Detailed ReviewPilot vs Birdeye comparison</Link>
          {" · "}
          <Link href="/features/google-business-profile" className="text-accent hover:underline">Google Business Profile automation</Link>
          {" · "}
          <Link href="/features/google-play-reviews" className="text-accent hover:underline">Play Store review automation</Link>
          {" · "}
          <Link href="/pricing" className="text-accent hover:underline">ReviewPilot pricing</Link>
          {" · "}
          <Link href="/blog/best-review-management-software-india-2026" className="text-accent hover:underline">Best review management software India 2026</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 ">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-sans text-3xl font-semibold tracking-tight text-white">
            Switch from Birdeye. Keep Your Reviews Answered.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Set up takes under 5 minutes. No annual contract. 7-day free trial.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">Book a Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
