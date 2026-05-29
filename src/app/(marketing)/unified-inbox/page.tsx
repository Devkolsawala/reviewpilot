import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Inbox,
  Smartphone,
  Building2,
  MessageCircle,
  Filter,
  Workflow,
  Target,
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

const PAGE_URL = `${SITE_URL}/unified-inbox`;
const WHATSAPP_GREEN = "#25D366";

export const metadata: Metadata = {
  title: "Unified Inbox for Play Store, Google & WhatsApp",
  description:
    "One unified review inbox for Play Store reviews and WhatsApp Business messages, with Google Business Profile reviews coming soon. AI replies across every platform. From $16/mo.",
  alternates: { canonical: "/unified-inbox" },
  openGraph: {
    title: "Unified Inbox — Play Store, Google Reviews & WhatsApp",
    description:
      "Reply to a Play Store review and a WhatsApp message from the same inbox — with Google reviews coming soon. One AI engine. One workflow.",
    url: PAGE_URL,
    type: "website",
    siteName: "ReviewPilot",
    // og:image is provided by ./opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Unified Inbox — Play Store, Google Reviews & WhatsApp",
    description:
      "Reply to every review and message from one inbox. AI-powered. Built for India.",
  },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is a unified review inbox?",
    a: "A unified review inbox is a single workspace where every customer signal across every platform — Play Store reviews and WhatsApp Business messages today, with Google Business Profile reviews coming soon — lands in the same queue. You stop tab-hopping between Play Console and WhatsApp Business; you reply, triage, and analyze in one place.",
  },
  {
    q: "Which platforms does ReviewPilot's unified inbox support?",
    a: "Two platforms today: Google Play Store reviews (via the Play Developer API) and WhatsApp Business messages (via the official WhatsApp Cloud API with Embedded Signup). Google Business Profile reviews (via OAuth) are coming soon. All of them live in the same dashboard with the same AI engine.",
  },
  {
    q: "Can my team reply to reviews and messages from the unified inbox?",
    a: "Yes. Invite teammates by email from Settings → Team. Each invite has a role-based access level — Admin can read and reply across every connected platform, Read-only can monitor reviews and analytics without reply access. Owner-only actions like billing and removing connections stay locked to the workspace owner. Access is enforced by Supabase row-level security on every table, so a teammate never sees data outside the workspace they were invited to.",
  },
  {
    q: "Does the AI use the same tone across all platforms?",
    a: "Yes. The AI uses your App Context Profile — tone, business hours, FAQs, brand voice — across every source. A 1-star Play Store review and a frustrated WhatsApp message get the same considered tone, just shaped to each platform's character limits and conventions.",
  },
  {
    q: "How is this different from Birdeye or AppFollow?",
    a: "Birdeye covers Google reviews and SMS but not Play Store deeply, and starts at roughly $266/month. AppFollow covers Play Store and App Store reviews but not Google Business Profile or WhatsApp. ReviewPilot covers Play Store and WhatsApp from a single $16/month plan, billed in INR equivalent, with Google Business Profile coming soon. We're the only one combining WhatsApp Cloud API and Play Store in one inbox today.",
  },
];

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReviewPilot — Unified Inbox",
  description:
    "One unified inbox for Play Store reviews and WhatsApp Business messages, with Google Business Profile reviews coming soon.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: PAGE_URL,
  image: SITE_OG,
  featureList: [
    "Single queue for Play Store and WhatsApp (Google Business Profile coming soon)",
    "Source-typed badges for fast triage",
    "Single AI engine across every platform",
    "Filter by source, rating, status, date",
    "Bulk approval and one-click publish",
  ],
  offers: {
    "@type": "Offer",
    price: "16",
    priceCurrency: "USD",
    url: `${SITE_URL}/pricing`,
  },
};

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
    {
      "@type": "ListItem",
      position: 2,
      name: "Unified Inbox",
      item: PAGE_URL,
    },
  ],
};

export default function UnifiedInboxPage() {
  return (
    <>
      <JsonLd data={[softwareSchema, faqSchema, breadcrumbSchema]} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-28">
          <AuroraBackground intensity="subtle" />
          <GridPattern variant="grid" fade className="opacity-[0.3]" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <Inbox className="h-3.5 w-3.5 text-accent" />
              <span className="uppercase tracking-[0.15em]">
                Unified review inbox
              </span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Unified inbox for Play Store reviews and{" "}
              <span className="text-gradient-brand font-serif italic">
                WhatsApp messages
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Stop tab-hopping between Play Console and WhatsApp Business — with
              Google Business Profile coming soon. Every customer signal —
              review or DM — lands in one queue, with one AI engine drafting
              replies in your tone.
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
            <p className="mt-3 text-xs text-muted-foreground">
              Plans from $16/mo, billed in INR. No credit card.
            </p>
          </div>
        </section>

        {/* Inbox preview / screenshot placeholder */}
        <section className="pb-20 sm:pb-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 backdrop-blur-sm">
              <div className="absolute -inset-x-12 -inset-y-12 rounded-[3rem] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(217,70,239,0.10))] blur-3xl -z-10" />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Your inbox, today
              </p>
              <div className="mt-4 space-y-2">
                {[
                  {
                    src: "Play Store",
                    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                    text: "App keeps crashing on Redmi Note 10 — 1★",
                    badge: "AI drafted",
                  },
                  {
                    src: "Google",
                    color: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                    text: "Loved the chole bhature, will visit again — 5★",
                    badge: "Auto-replied",
                  },
                  {
                    src: "WhatsApp",
                    color: "",
                    waColor: WHATSAPP_GREEN,
                    text: "Hi, can I cancel my order placed an hour ago?",
                    badge: "AI drafted",
                  },
                  {
                    src: "Play Store",
                    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                    text: "Best UPI app, super smooth — 5★",
                    badge: "Auto-replied",
                  },
                  {
                    src: "WhatsApp",
                    color: "",
                    waColor: WHATSAPP_GREEN,
                    text: "Booked a table for 4 at 8pm — confirmed?",
                    badge: "Pending",
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm"
                  >
                    <span
                      className={
                        row.waColor
                          ? "rounded px-2 py-0.5 text-[10px] font-medium"
                          : `rounded px-2 py-0.5 text-[10px] font-medium ${row.color}`
                      }
                      style={
                        row.waColor
                          ? {
                              backgroundColor: `${row.waColor}22`,
                              color: row.waColor,
                            }
                          : undefined
                      }
                    >
                      {row.src}
                    </span>
                    <span className="flex-1 truncate text-foreground/90">
                      {row.text}
                    </span>
                    <span className="hidden sm:inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      {row.badge}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                Stylized preview · the real ReviewPilot inbox shows the same source-typed view across Play Store, Google, and WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section className="py-20 sm:py-24 bg-muted/20 border-y border-border/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Why it matters
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Three platforms, one workflow.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Single-platform tools force you to context-switch every few
                minutes. A unified inbox compounds time, consistency, and
                response rate.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Workflow,
                  title: "No context-switching",
                  body: "Every signal lands in one queue. Filter by source when you want to focus, ignore the source when you want speed.",
                },
                {
                  icon: Target,
                  title: "Reply consistency",
                  body: "Same App Context Profile, same brand voice, same FAQs across every platform. Customers feel one company, not three teams.",
                },
                {
                  icon: Filter,
                  title: "Faster response time",
                  body: "Bulk-approve, source-filter, rating-filter. Clear a hundred-message backlog in minutes, not hours.",
                },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm"
                  >
                    <Icon className="h-5 w-5 text-accent" />
                    <h3 className="mt-4 font-sans text-base font-semibold tracking-tight">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works under the hood */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Under the hood
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              One AI engine. One queue. Source-typed views.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Smartphone,
                  title: "Play Store",
                  body: "Polled every two hours via the Play Developer API. Drafts respect the 350-character reply limit automatically.",
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  icon: Building2,
                  title: "Google Business Profile (soon)",
                  body: "Coming soon — real-time via the GBP API. Multi-location aware. Same AI brand voice across every storefront.",
                  color: "text-blue-600 dark:text-blue-400",
                },
                {
                  icon: MessageCircle,
                  title: "WhatsApp Business",
                  body: "Real-time via the WhatsApp Cloud API webhook. Replies inside Meta's 24-hour window are free.",
                  customColor: WHATSAPP_GREEN,
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.title}
                    className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm"
                  >
                    <Icon
                      className={`h-5 w-5 ${s.color ?? ""}`}
                      style={
                        s.customColor ? { color: s.customColor } : undefined
                      }
                    />
                    <h3 className="mt-4 font-sans text-base font-semibold tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison row */}
        <section className="py-20 sm:py-24 bg-muted/20 border-y border-border/60">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                vs single-platform tools
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Why a unified inbox beats three separate tools.
              </h2>
            </div>
            <div className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Capability</th>
                      <th className="px-4 py-3 font-medium text-accent">
                        ReviewPilot
                      </th>
                      <th className="px-4 py-3 font-medium">Birdeye</th>
                      <th className="px-4 py-3 font-medium">AppFollow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[
                      {
                        cap: "Play Store reviews",
                        a: <CheckCell />,
                        b: <XCell />,
                        c: <CheckCell />,
                      },
                      {
                        cap: "Google Business Profile reviews (soon)",
                        a: (
                          <span className="mx-auto inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            Soon
                          </span>
                        ),
                        b: <CheckCell />,
                        c: <XCell />,
                      },
                      {
                        cap: "WhatsApp Business messages",
                        a: <CheckCell />,
                        b: <XCell />,
                        c: <XCell />,
                      },
                      {
                        cap: "Single AI engine across all sources",
                        a: <CheckCell />,
                        b: <XCell />,
                        c: <XCell />,
                      },
                      {
                        cap: "INR pricing",
                        a: <CheckCell />,
                        b: <XCell />,
                        c: <XCell />,
                      },
                      {
                        cap: "Starting price",
                        a: "$16/mo",
                        b: "~$266/mo",
                        c: "~$160/mo",
                      },
                    ].map((row) => (
                      <tr key={row.cap}>
                        <td className="px-4 py-3 font-medium text-foreground/90">
                          {row.cap}
                        </td>
                        <td className="px-4 py-3">{row.a}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.b}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.c}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
                Unified inbox FAQ
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
                One inbox. Three platforms. Zero tab-switching.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Connect Play Store and WhatsApp in under 10 minutes (Google
                Business Profile coming soon). Start a 7-day free trial — no
                credit card.
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

function CheckCell() {
  return <CheckCircle2 className="h-4 w-4 text-accent" aria-label="Yes" />;
}
function XCell() {
  return (
    <XCircle className="h-4 w-4 text-muted-foreground/50" aria-label="No" />
  );
}
