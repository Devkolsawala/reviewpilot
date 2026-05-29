import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Zap,
  Inbox,
  Clock,
  Languages,
  RefreshCw,
  Building2,
  Settings2,
  Users,
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
import { cn } from "@/lib/utils";

const PAGE_URL = `${SITE_URL}/whatsapp-automation`;
const WHATSAPP_GREEN = "#25D366";

export const metadata: Metadata = {
  title: "WhatsApp Business Automation with AI Replies",
  description:
    "Automate WhatsApp Business replies with AI. Meta-approved Embedded Signup, Cloud API webhooks, unified inbox with Play Store reviews (Google reviews coming soon). Built for India. From $16/mo.",
  alternates: { canonical: "/whatsapp-automation" },
  openGraph: {
    title: "WhatsApp Business Automation with AI Replies",
    description:
      "AI replies to every WhatsApp Business message — connect in 60 seconds via Meta Embedded Signup, free replies inside the 24-hour window, unified inbox.",
    url: PAGE_URL,
    type: "website",
    siteName: "ReviewPilot",
    // og:image is provided by ./opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsApp Business Automation with AI Replies",
    description:
      "AI replies for every WhatsApp message. Meta-approved. Free in the 24-hour window.",
  },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is WhatsApp Business automation?",
    a: "WhatsApp Business automation means using software to receive customer messages on your WhatsApp Business number, draft replies automatically with AI, and either send them with a click or post them on autopilot. ReviewPilot handles the entire loop using the official WhatsApp Cloud API, so messages land in your inbox in real time and replies are sent from your verified WABA number.",
  },
  {
    q: "How does ReviewPilot connect to my WhatsApp Business account?",
    a: "Connection takes about 60 seconds via Meta's Embedded Signup. Click 'Connect WhatsApp', sign in with Facebook in a popup, pick the WhatsApp Business Account and phone number you want to connect, and ReviewPilot subscribes the webhook for you. There is no manual API setup, no service-account JSON, no Postman.",
  },
  {
    q: "Is this the official WhatsApp Cloud API?",
    a: "Yes. ReviewPilot uses Meta's official WhatsApp Cloud API for both inbound webhook delivery and outbound sends. Messages are delivered through Meta's infrastructure with full delivery receipts. This is not a grey-market scraper or an unofficial WhatsApp Web bridge.",
  },
  {
    q: "Is ReviewPilot a Meta-approved Tech Provider?",
    a: "Yes. ReviewPilot is a verified Meta Tech Provider with whatsapp_business_messaging and whatsapp_business_management permissions in Advanced Access. Your customers see your verified WhatsApp Business number — not a third-party number.",
  },
  {
    q: "Can the AI reply in Hindi, Gujarati, and other Indian languages?",
    a: "Yes. ReviewPilot's AI detects the customer's language and replies in the same one. English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, and Gujarati are all supported.",
  },
  {
    q: "How long does setup take?",
    a: "Most teams go from sign-up to first AI reply in under 10 minutes. The Embedded Signup itself takes about 60 seconds. After that you fill in your App Context Profile (tone, business hours, FAQs) so the AI knows how to reply, and you're live.",
  },
  {
    q: "Can I review or edit AI replies before they're sent?",
    a: "Yes. Every AI draft can be reviewed and edited inside the inbox before it's sent. You can also enable auto-reply per category, so high-confidence replies fire instantly and the rest wait for your approval.",
  },
  {
    q: "Does this support multiple WhatsApp Business accounts or numbers?",
    a: "Yes. ReviewPilot supports multiple WhatsApp Business Accounts (multi-WABA) and multiple phone numbers per WABA. During Embedded Signup you pick which WABA and which phone number to connect, and you can repeat the flow for additional numbers.",
  },
  {
    q: "What does this cost? Are WhatsApp message charges extra?",
    a: "ReviewPilot starts at $16/month, billed in INR equivalent at checkout. WhatsApp message charges are billed by Meta directly to your WhatsApp Business Account. Because ReviewPilot replies fire within minutes of a customer message — well inside Meta's 24-hour customer service window — replies are nearly always free under Meta's pricing.",
  },
  {
    q: "Can I disconnect anytime?",
    a: "Yes. Disconnect from Settings → Connections in one click. ReviewPilot revokes the access token, unsubscribes the webhook, and removes your encrypted tokens from the database. There are no hidden retention timers.",
  },
];

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReviewPilot — WhatsApp Business Automation",
  description:
    "AI-powered WhatsApp Business automation with Meta-approved Embedded Signup, Cloud API webhooks, and a unified inbox alongside Play Store reviews (Google Business Profile coming soon).",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: PAGE_URL,
  image: SITE_OG,
  featureList: [
    "Meta-approved Embedded Signup via Facebook Login for Business",
    "WhatsApp Cloud API webhook delivery in real time",
    "AI-drafted replies trained on your App Context Profile",
    "Unified inbox alongside Play Store reviews (Google coming soon)",
    "Template management — read, create, submit",
    "Business profile management — about, description, email, address",
    "Multi-WABA and multi-phone-number support",
    "Auto-reply or human approval per category",
    "Free replies inside Meta's 24-hour customer service window",
    "Long-lived Business Integration System User tokens",
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
      name: "WhatsApp Automation",
      item: PAGE_URL,
    },
  ],
};

export default function WhatsAppAutomationPage() {
  return (
    <>
      <JsonLd data={[softwareSchema, faqSchema, breadcrumbSchema]} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-28">
          <AuroraBackground intensity="subtle" />
          <GridPattern variant="grid" fade className="opacity-[0.3]" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
              style={{
                borderColor: `${WHATSAPP_GREEN}55`,
                backgroundColor: `${WHATSAPP_GREEN}14`,
                color: WHATSAPP_GREEN,
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="uppercase tracking-[0.15em]">
                Meta-approved Tech Provider
              </span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              WhatsApp Business automation with AI replies —{" "}
              <span className="text-gradient-brand font-serif italic">
                built for Indian businesses
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Inbound messages land in your ReviewPilot inbox in real time via
              the official WhatsApp Cloud API. Our AI drafts a reply trained on
              your business — approve, edit, or auto-send within Meta&apos;s 24-hour
              window. Connect in 60 seconds with Embedded Signup.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start 7-day free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/integrations/whatsapp-business">
                  See the integration
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card required. Plans from $16/month, billed in INR.
            </p>
          </div>
        </section>

        {/* Problem */}
        <section className="relative py-20 sm:py-24 border-t border-border/60">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              The problem
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Your customers DM you on WhatsApp.{" "}
              <span className="text-gradient-brand">
                Missing one costs you a sale, a star, and a review.
              </span>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed text-lg">
              Indian customers expect instant replies on WhatsApp — that&apos;s the
              channel they trust. But manual replies don&apos;t scale past a few
              dozen messages a day, and a missed message becomes a lost sale,
              a one-star Google review, and a slow drag on your WABA quality
              rating. ReviewPilot closes the loop automatically: every inbound
              WhatsApp message gets an AI-drafted reply within seconds — in
              your tone, in the customer&apos;s language, sent from your verified
              WhatsApp Business number.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="relative py-20 sm:py-24 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                From sign-up to live in under 10 minutes.
              </h2>
            </div>
            <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  num: "01",
                  icon: ShieldCheck,
                  title: "Connect via Facebook",
                  body: "Click 'Continue with Facebook'. Meta's Embedded Signup pops up, you log in, and you pick your WABA and phone number. About 60 seconds.",
                },
                {
                  num: "02",
                  icon: MessageCircle,
                  title: "Customer messages you",
                  body: "Inbound messages hit Meta's webhook in real time. ReviewPilot validates the X-Hub-Signature-256 and stores the message in your inbox.",
                },
                {
                  num: "03",
                  icon: Sparkles,
                  title: "AI drafts a reply",
                  body: "Our AI uses your App Context Profile — tone, business hours, FAQs — to draft a reply in the customer's language. Drafts arrive in under 3 seconds.",
                },
                {
                  num: "04",
                  icon: Zap,
                  title: "Auto-send or approve",
                  body: "Auto-reply per category, or approve every draft yourself. Replies inside Meta's 24-hour window are free, so fast replies keep your bill at zero.",
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.num}
                    className="relative rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-background shadow-sm">
                        <Icon className="h-4 w-4 text-accent" />
                      </span>
                      <span className="font-mono text-[11px] rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-2 py-0.5 text-white">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="mt-5 font-sans text-base font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {step.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Feature grid */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Features
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you need to run WhatsApp on autopilot.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "One-click Embedded Signup",
                  body: "Meta's Facebook Login for Business. No service accounts, no manual API setup, no Postman.",
                },
                {
                  icon: Sparkles,
                  title: "Meta-approved official integration",
                  body: "Verified Tech Provider with whatsapp_business_messaging and whatsapp_business_management in Advanced Access.",
                },
                {
                  icon: Languages,
                  title: "AI replies in your tone and language",
                  body: "Trained on your App Context Profile. Detects the customer's language and replies in the same one.",
                },
                {
                  icon: Inbox,
                  title: "Unified inbox",
                  body: "WhatsApp messages live alongside Play Store reviews — Google reviews coming soon. One AI engine, one workflow.",
                },
                {
                  icon: MessageCircle,
                  title: "Template management",
                  body: "Read existing message templates and submit new ones for approval — without leaving ReviewPilot.",
                },
                {
                  icon: Building2,
                  title: "Business profile management",
                  body: "Update WhatsApp About, description, email, and address from inside the dashboard.",
                },
                {
                  icon: Settings2,
                  title: "Multi-WABA & multi-number",
                  body: "Connect multiple WhatsApp Business Accounts and multiple phone numbers per WABA.",
                },
                {
                  icon: Clock,
                  title: "24-hour-window aware",
                  body: "ReviewPilot replies inside Meta's free customer-service window — replies are nearly always free.",
                },
                {
                  icon: RefreshCw,
                  title: "Real-time webhooks",
                  body: "Cloud API webhook delivery with X-Hub-Signature-256 verification. Not polling — instant.",
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-colors hover:border-accent/40"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-4 font-sans text-base font-semibold tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {f.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-20 sm:py-24 bg-muted/20 border-y border-border/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Who it&apos;s for
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Built for businesses where WhatsApp is the front door.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Restaurants & cloud kitchens",
                  body: "Order confirmations, menu questions, table bookings, complaint recovery. Reply in seconds, protect your Zomato and Google ratings.",
                },
                {
                  title: "Clinics & salons",
                  body: "Appointment confirmations, rescheduling, post-visit follow-ups, review requests. Save your front desk hours every day.",
                },
                {
                  title: "D2C / ecommerce brands",
                  body: "Order status, return queries, sizing help, abandoned-cart recovery. AI handles the FAQ flood; humans handle escalations.",
                },
              ].map((u) => (
                <div
                  key={u.title}
                  className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm"
                >
                  <h3 className="font-sans text-lg font-semibold tracking-tight">
                    {u.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {u.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                ReviewPilot vs alternatives
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
                A clearer way to handle{" "}
                <span className="text-gradient-brand font-serif italic">
                  WhatsApp at scale
                </span>
                .
              </h2>
              <p className="mt-4 text-sm text-muted-foreground">
                Three real options for an Indian SMB. Side-by-side, on the
                criteria that actually decide the bill at the end of the month.
              </p>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block mt-12">
              <WhatsAppComparisonTable />
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden mt-10 space-y-4">
              <WhatsAppComparisonCards />
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Need a deeper integration view?{" "}
              <Link
                href="/integrations/whatsapp-business"
                className="text-foreground underline-offset-4 hover:underline"
              >
                See the WhatsApp Business API integration page
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Internal-link block */}
        <section className="py-20 sm:py-24 bg-muted/20 border-y border-border/60">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  href: "/unified-inbox",
                  title: "Unified inbox",
                  body: "WhatsApp + Play Store in one queue (Google reviews soon).",
                  icon: Inbox,
                },
                {
                  href: "/for-local-business",
                  title: "For local businesses",
                  body: "Restaurants, salons, clinics — WhatsApp now, Google reviews soon.",
                  icon: Users,
                },
                {
                  href: "/integrations",
                  title: "All integrations",
                  body: "Play Store, WhatsApp Business, Google Business Profile (soon).",
                  icon: Settings2,
                },
              ].map((l) => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-accent/40"
                  >
                    <Icon className="h-5 w-5 text-accent" />
                    <h3 className="mt-4 font-sans text-base font-semibold tracking-tight">
                      {l.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {l.body}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                      Read more
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
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
                WhatsApp automation FAQ
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
                Connect WhatsApp in 60 seconds.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Start a 7-day free trial. No credit card. Embedded Signup,
                AI replies, and a unified inbox out of the box.
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

type CellValue = boolean | string;

type ComparisonRow = {
  capability: string;
  reviewpilot: CellValue;
  agent: CellValue;
  diy: CellValue;
};

const COMPARISON_COLUMNS = [
  {
    key: "reviewpilot" as const,
    name: "ReviewPilot",
    tagline: "AI + official Cloud API",
    badge: "Recommended",
    highlight: true,
  },
  {
    key: "agent" as const,
    name: "In-house support agent",
    tagline: "Manual replies, one inbox",
    highlight: false,
  },
  {
    key: "diy" as const,
    name: "DIY on raw Cloud API",
    tagline: "Build & maintain yourself",
    highlight: false,
  },
];

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    capability: "Time to first reply",
    reviewpilot: "~60 seconds via Embedded Signup",
    agent: "1–2 weeks to hire & train",
    diy: "1–4 weeks of dev work",
  },
  {
    capability: "Monthly cost in India",
    reviewpilot: "From $16/mo (~₹1,500)",
    agent: "₹15,000–₹35,000 / agent",
    diy: "Dev salary + Meta charges",
  },
  {
    capability: "AI-drafted replies",
    reviewpilot: true,
    agent: false,
    diy: "Build & host it yourself",
  },
  {
    capability: "Unified inbox — WhatsApp + Play Store + Google",
    reviewpilot: true,
    agent: false,
    diy: false,
  },
  {
    capability: "Official Meta Tech Provider",
    reviewpilot: "Verified, Advanced Access",
    agent: "—",
    diy: "Apply & wait for approval",
  },
  {
    capability: "Multi-WABA & multi-number",
    reviewpilot: true,
    agent: "Per-agent licensing",
    diy: "Build routing yourself",
  },
  {
    capability: "Encrypted token storage (AES-256-GCM)",
    reviewpilot: true,
    agent: "—",
    diy: "Implement yourself",
  },
  {
    capability: "Indian-language replies (8 languages)",
    reviewpilot: true,
    agent: "Depends on hire",
    diy: false,
  },
  {
    capability: "Pricing in INR with GST invoice",
    reviewpilot: true,
    agent: true,
    diy: false,
  },
  {
    capability: "Scales 24/7 without adding headcount",
    reviewpilot: true,
    agent: false,
    diy: true,
  },
];

function ComparisonCell({
  value,
  highlight,
}: {
  value: CellValue;
  highlight: boolean;
}) {
  if (typeof value === "boolean") {
    return value ? (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full",
          highlight
            ? "bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)]"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        )}
        aria-label="Yes"
      >
        <CheckCircle2 className="h-4 w-4" />
      </span>
    ) : (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60"
        aria-label="No"
      >
        <XCircle className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "text-sm leading-snug",
        highlight ? "text-foreground font-medium" : "text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

function WhatsAppComparisonTable() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[26%]" />
          <col className="w-[22%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="text-left align-bottom px-5 py-6 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Capability
            </th>
            {COMPARISON_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-6 align-bottom text-center",
                  col.highlight &&
                    "bg-[linear-gradient(180deg,rgba(99,102,241,0.08),rgba(217,70,239,0.04))]",
                )}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "font-sans text-sm font-semibold tracking-tight whitespace-normal",
                      col.highlight ? "text-foreground" : "text-foreground/70",
                    )}
                  >
                    {col.name}
                  </span>
                  {col.badge && (
                    <span className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
                      {col.badge}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground whitespace-normal">
                    {col.tagline}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.capability}>
              <td className="border-t border-border/60 px-5 py-4 align-middle text-sm font-medium text-foreground/90">
                {row.capability}
              </td>
              {COMPARISON_COLUMNS.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "border-t border-border/60 px-4 py-4 text-center align-middle",
                    col.highlight &&
                      "bg-[linear-gradient(180deg,rgba(99,102,241,0.06),rgba(217,70,239,0.03))]",
                  )}
                >
                  <ComparisonCell
                    value={row[col.key]}
                    highlight={col.highlight}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WhatsAppComparisonCards() {
  return (
    <>
      {COMPARISON_COLUMNS.map((col) => (
        <div
          key={col.key}
          className={cn(
            "rounded-2xl border bg-card/60 backdrop-blur-sm p-5",
            col.highlight
              ? "border-accent/40 bg-[linear-gradient(180deg,rgba(99,102,241,0.06),rgba(217,70,239,0.03))] shadow-[0_0_32px_-12px_hsl(var(--ring)/0.4)]"
              : "border-border/60",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-sans text-base font-semibold tracking-tight">
                {col.name}
              </h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {col.tagline}
              </p>
            </div>
            {col.badge && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
                {col.badge}
              </span>
            )}
          </div>
          <ul className="mt-4 space-y-3 border-t border-border/60 pt-4">
            {COMPARISON_ROWS.map((row) => (
              <li
                key={row.capability}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="text-foreground/80 break-words min-w-0 leading-snug">
                  {row.capability}
                </span>
                <span className="shrink-0 text-right">
                  <ComparisonCell
                    value={row[col.key]}
                    highlight={col.highlight}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
