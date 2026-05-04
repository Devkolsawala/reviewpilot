import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Smartphone,
  Building2,
  Clock,
  Layers,
  PieChart,
  BarChart3,
  Mail,
  Users,
  Compass,
  Settings2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Crown,
  Eye,
  Languages,
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
import { PricingTable } from "@/components/marketing/PricingTable";
import { PLANS } from "@/lib/plans";

const PAGE_URL = `${SITE_URL}/features`;

export const metadata: Metadata = {
  title:
    "Features — AI Review Reply, Team Collaboration, Analytics | ReviewPilot",
  description:
    "All ReviewPilot features in one place — AI-generated Play Store and Google review replies, team collaboration with role-based access, sentiment analytics, and more. Plans from $16/month.",
  alternates: { canonical: "/features" },
  openGraph: {
    title:
      "Features — AI Review Reply, Team Collaboration, Analytics | ReviewPilot",
    description:
      "AI replies for Play Store and Google reviews, team collaboration with admin and read-only roles, sentiment analytics, daily digests, and more. Plans from $16/mo.",
    url: PAGE_URL,
    type: "website",
    siteName: "ReviewPilot",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "ReviewPilot — full feature list",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Every ReviewPilot feature, in one place",
    description:
      "AI Play Store and Google review replies, team collaboration, sentiment analytics, daily digest. Plans from $16/month.",
    images: ["/og-image.svg"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Anchor sections
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS: { id: string; label: string }[] = [
  { id: "ai-replies", label: "AI replies" },
  { id: "play-store", label: "Play Store" },
  { id: "google-business", label: "Google Business" },
  { id: "auto-reply", label: "Auto-reply" },
  { id: "bulk-reply", label: "Bulk reply" },
  { id: "sentiment", label: "Sentiment" },
  { id: "analytics", label: "Analytics" },
  { id: "daily-digest", label: "Daily digest" },
  { id: "team-collaboration", label: "Team" },
  { id: "onboarding", label: "Onboarding" },
  { id: "ai-config", label: "Brand voice" },
  { id: "security", label: "Security" },
];

// ─────────────────────────────────────────────────────────────────────────────
// FAQ — single source for both the accordion and the FAQPage JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
const FAQS: { q: string; a: string }[] = [
  {
    q: "Does ReviewPilot work with the Google Play Console?",
    a: "Yes. ReviewPilot connects to the Google Play Developer API through a per-account service account. The two-minute connection wizard walks you through creating the service account, granting it permission on your Play Console, and entering your package name. After that, new reviews are pulled automatically every two hours.",
  },
  {
    q: "Do you support Google Business Profile?",
    a: "Google Business Profile is marked Coming Soon. The integration is in beta, but we are not yet offering it to general customers. Play Store review management is fully live today, so this page is honest about which surface is shipping versus in development.",
  },
  {
    q: "Can my whole team use one ReviewPilot account?",
    a: "Yes. Owners can invite teammates by email as Admin (full reply, app context, and connection access) or Read-only (view reviews and analytics). Team members do not see your billing screen, your Razorpay subscription, or your service-account credentials. Row-level security in the database enforces the boundary.",
  },
  {
    q: "How do you bill for team seats?",
    a: `Team seats are included in every paid plan. Starter includes ${PLANS.starter.limits.team_members} total seats, Growth includes ${PLANS.growth.limits.team_members}, and Agency includes ${PLANS.agency.limits.team_members} (the owner counts as one seat in each plan). There are no per-seat add-ons — pick the plan that fits your team size.`,
  },
  {
    q: "Is my Play Store data secure?",
    a: "Yes. Service-account credentials are encrypted at rest, the database is hosted on Supabase with row-level security on every table, and team-member access is scoped to the owner that invited them. Your data never leaves the AI prompt window once a draft is generated.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Every paid plan includes a seven-day free trial with no credit card required. You can connect your Play Console, generate AI replies, invite teammates, and switch plans during the trial. If you do nothing, the account simply downgrades to Free at the end of the trial.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the billing settings inside the dashboard. Razorpay subscriptions stop renewing at the end of the current period — you keep access until then. There are no cancellation fees and no annual lock-ins.",
  },
  {
    q: "Do you support multiple apps?",
    a: "Yes. Starter covers a single app or location, Growth covers up to three, and Agency covers up to ten. Each connection has its own App Context Profile, so you can tune brand voice per app.",
  },
  {
    q: "Which Indian languages does the AI support?",
    a: "English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, and Gujarati. The AI detects the reviewer's language and responds in the same language by default.",
  },
  {
    q: "How is ReviewPilot different from Birdeye or AppFollow?",
    a: "ReviewPilot is built in India for Indian buyers. Pricing starts at $16/month, billed in INR equivalent through Razorpay at checkout. We focus on Play Store review automation today, with Google Business Profile shipping next. Compare us directly to Birdeye, Famepilot, Podium, and Simplify360 in our compare pages.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD: SoftwareApplication (with offers) + FAQPage
// ─────────────────────────────────────────────────────────────────────────────
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReviewPilot",
  description:
    "AI-powered review management for Indian SMBs and app developers. Auto-reply to Play Store and Google Business Profile reviews, collaborate with role-based team access, and track sentiment in one dashboard.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: PAGE_URL,
  image: SITE_OG,
  offers: [
    {
      "@type": "Offer",
      name: PLANS.starter.name,
      price: PLANS.starter.price_usd.toString(),
      priceCurrency: "USD",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@type": "Offer",
      name: PLANS.growth.name,
      price: PLANS.growth.price_usd.toString(),
      priceCurrency: "USD",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@type": "Offer",
      name: PLANS.agency.name,
      price: PLANS.agency.price_usd.toString(),
      priceCurrency: "USD",
      url: `${SITE_URL}/pricing`,
    },
  ],
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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={[softwareSchema, faqSchema]} />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-24 sm:py-28">
          <AuroraBackground intensity="subtle" />
          <GridPattern variant="grid" fade className="opacity-[0.3]" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="uppercase tracking-[0.15em]">All features</span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Everything you need to manage app and business reviews —{" "}
              <span className="text-gradient-brand font-serif italic">
                in one platform
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              AI replies for Google Play Store reviews today, Google Business
              Profile review management coming soon. Built in India for Indian
              app developers and local businesses, billed in INR.
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
              No credit card required. Plans from $16/month.
            </p>
          </div>
        </section>

        {/* ── Sticky anchor nav ────────────────────────────────── */}
        <nav
          aria-label="Feature sections"
          className="sticky top-14 z-30 hidden border-y border-border/60 bg-background/80 backdrop-blur-md lg:block"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center gap-1 overflow-x-auto py-2 text-xs font-medium">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex shrink-0 rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* ── Feature sections ─────────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 space-y-24">
          {/* AI Replies */}
          <FeatureSection
            id="ai-replies"
            icon={Bot}
            kicker="Drafting"
            h2="AI-powered review replies in your brand voice"
            body="ReviewPilot drafts every reply in three seconds, in the reviewer's language, and in your brand voice. The AI is told about your app or business through your App Context Profile, so the response is specific — not generic. Replies are written to land within platform character limits and never echo back the customer's name."
            bullets={[
              "Replies in your brand voice, tuned per connection",
              "Auto-detects the reviewer's language and responds in kind",
              "350-character Play Store enforcement, baked into the prompt",
            ]}
          />

          {/* Play Store */}
          <FeatureSection
            id="play-store"
            icon={Smartphone}
            kicker="Play Store"
            h2="Google Play Store review management for app developers"
            body="Connect your Google Play Console in two minutes through a guided service-account wizard. After that, new reviews are pulled automatically every two hours, drafts are generated for each one, and you publish with one click — or let auto-reply handle 4–5★ ratings without you."
            bullets={[
              "Per-user Google service account (no shared credentials)",
              "Connection wizard scoped by package name",
              "Automated review polling every two hours via Vercel cron",
            ]}
            link={{
              href: "/features/google-play-reviews",
              label: "Read the Play Store deep-dive",
            }}
          />

          {/* Google Business Profile */}
          <FeatureSection
            id="google-business"
            icon={Building2}
            kicker="Google Business Profile"
            h2="Google Business Profile review management for local businesses"
            body="Google Business Profile review automation is in beta and not yet generally available. We are open about that — Play Store is fully live today, GBP is on the next milestone. The same AI engine, sentiment analytics, and team workflow will apply to your locations when GBP ships."
            bullets={[
              "One unified inbox across every location once live",
              "Same AI brand-voice engine as Play Store",
              "Multi-location support on Growth and Agency plans",
            ]}
            soon
            link={{
              href: "/features/google-business-profile",
              label: "Read the Google Business Profile deep-dive",
            }}
          />

          {/* Auto-Reply */}
          <FeatureSection
            id="auto-reply"
            icon={Clock}
            kicker="Automation"
            h2="Scheduled auto-replies and approval queues"
            body="Decide which reviews you want to handle yourself and which you want ReviewPilot to publish for you. Set a star-rating filter, an automation delay, and an approval policy per connection — five-star reviews can post automatically while one-star reviews wait in a queue for human approval."
            bullets={[
              "Configurable timing per connection",
              "Filter by rating range (e.g. 4–5★ auto, 1–3★ manual)",
              "Approval queue for sensitive replies",
            ]}
          />

          {/* Bulk Reply */}
          <FeatureSection
            id="bulk-reply"
            icon={Layers}
            kicker="Speed"
            h2="Bulk reply to a backlog in minutes"
            body="If you have hundreds of unreplied reviews from before you signed up, bulk reply clears the backlog in one pass. Select a date range or rating filter, generate AI drafts for the entire batch, scan them, and publish in one click. Available on Growth and Agency plans."
            bullets={[
              "Generate dozens of drafts in one click",
              "Filter by rating, date, or keyword before bulk-publishing",
              "Available on Growth and Agency plans",
            ]}
          />

          {/* Sentiment */}
          <FeatureSection
            id="sentiment"
            icon={PieChart}
            kicker="Insights"
            h2="Sentiment analytics with positive, negative, neutral breakdown"
            body="Every review is auto-classified as positive, negative, or neutral, and trended over time. The dashboard surfaces the top keywords driving each bucket so you can see — at a glance — whether the latest release fixed a complaint or introduced a new one."
            bullets={[
              "Positive / negative / neutral breakdown",
              "Trend lines over 7d, 30d, 90d, or custom range",
              "Top keywords per sentiment bucket",
            ]}
          />

          {/* Analytics */}
          <FeatureSection
            id="analytics"
            icon={BarChart3}
            kicker="Dashboard"
            h2="Analytics dashboard for ratings, response rate, and source"
            body="One dashboard for every metric a review program needs to prove its impact. See average rating over time, response rate by week, source breakdown across Play Store and Google, and rating distribution. Switch between 7d, 30d, 90d, or pick a custom range."
            bullets={[
              "Date ranges: 7d, 30d, 90d, custom",
              "Average rating, response rate, reply latency",
              "Source breakdown across every connected platform",
            ]}
          />

          {/* Daily Digest */}
          <FeatureSection
            id="daily-digest"
            icon={Mail}
            kicker="Email"
            h2="Daily summary email with new reviews and replies"
            body="Opt in to a daily digest delivered to your inbox by Resend. The email summarizes new reviews received, replies published, and the day's sentiment shift — with a one-click link back into the dashboard. Compliant with the List-Unsubscribe header so receivers can opt out instantly."
            bullets={[
              "Opt-in from notification settings",
              "List-Unsubscribe header for one-click opt-out",
              "CC limit scales with plan: Starter 1, Growth 3, Agency 5",
            ]}
          />

          {/* Team Collaboration — anchor target from every CTA */}
          <section
            id="team-collaboration"
            className="scroll-mt-32"
            aria-labelledby="team-collaboration-h2"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-accent">
                <Users className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Team collaboration
                </p>
                <h2
                  id="team-collaboration-h2"
                  className="mt-2 font-sans text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  Team review management with role-based access
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Invite teammates as Admin or Read-only, scoped to your
                  account through Supabase row-level security. Team members
                  reply on your behalf without ever seeing your billing screen
                  or your Google service-account credentials. Built so a small
                  India-based team can run reviews like an enterprise — without
                  enterprise pricing.
                </p>
              </div>
            </div>

            {/* Role permission matrix */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Capability
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                          Owner
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          Admin
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          Read-only
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ROLE_MATRIX.map((row) => (
                      <tr key={row.capability}>
                        <td className="px-4 py-3 font-medium text-foreground/90">
                          {row.capability}
                        </td>
                        <RoleCell allowed={row.owner} />
                        <RoleCell allowed={row.admin} />
                        <RoleCell allowed={row.readOnly} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invite flow */}
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
                <h3 className="font-sans text-base font-semibold tracking-tight">
                  How to invite a teammate
                </h3>
                <ol className="mt-4 space-y-2 text-sm text-foreground/85 list-decimal pl-5">
                  <li>Open Settings &rarr; Team in the dashboard</li>
                  <li>Enter their email and pick Admin or Read-only</li>
                  <li>
                    They receive an invite link with a unique token and accept
                    in one click
                  </li>
                  <li>
                    They land directly in your workspace — no separate login
                  </li>
                </ol>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
                <h3 className="font-sans text-base font-semibold tracking-tight">
                  Team seats by plan
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                  <li>
                    <span className="font-medium">Starter</span> &mdash;{" "}
                    {PLANS.starter.limits.team_members} seats (owner + 2)
                  </li>
                  <li>
                    <span className="font-medium">Growth</span> &mdash;{" "}
                    {PLANS.growth.limits.team_members} seats (owner + 4)
                  </li>
                  <li>
                    <span className="font-medium">Agency</span> &mdash;{" "}
                    {PLANS.agency.limits.team_members} seats (owner + 9)
                  </li>
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  Free plan is owner-only. See the full breakdown on{" "}
                  <Link
                    href="/pricing"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    /pricing
                  </Link>
                  .
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Building a multi-app studio? Read the{" "}
              <Link
                href="/for-app-developers"
                className="text-foreground underline-offset-4 hover:underline"
              >
                guide for app developers
              </Link>
              . Running multiple shopfronts? See the{" "}
              <Link
                href="/for-local-business"
                className="text-foreground underline-offset-4 hover:underline"
              >
                guide for local businesses
              </Link>
              .
            </p>
          </section>

          {/* Onboarding */}
          <FeatureSection
            id="onboarding"
            icon={Compass}
            kicker="Onboarding"
            h2="Onboarding wizard, product tour, and tutorial video"
            body="Most ReviewPilot accounts go from zero to first AI reply in under ten minutes. The onboarding wizard guides you through Play Store connection, App Context Profile, and your first reply. An in-app product tour highlights every important screen, and a tutorial video walks through the rest."
            bullets={[
              "Guided wizard for Play Store service-account setup",
              "In-app product tour for the dashboard",
              "Tutorial video on YouTube",
            ]}
            link={{
              href: "https://www.youtube.com/watch?v=WXVq7twjiVw",
              label: "Watch the tutorial video",
              external: true,
            }}
          />

          {/* AI Config */}
          <FeatureSection
            id="ai-config"
            icon={Settings2}
            kicker="Brand voice"
            h2="App Context Profile and tone selector"
            body="Every connection has its own App Context Profile: brand voice, tone (formal, friendly, casual), key features, known issues, and FAQs. The AI uses all of it to write replies that feel like your support team wrote them — not a generic template."
            bullets={[
              "Tone selector per connection",
              "FAQ library that the AI references when answering",
              "Brand-voice notes baked into every prompt",
            ]}
          />

          {/* Security */}
          <FeatureSection
            id="security"
            icon={ShieldCheck}
            kicker="Security"
            h2="Security and compliance for Indian businesses"
            body="ReviewPilot is built on Supabase with row-level security on every table. Service-account credentials are encrypted at rest. Team-member access is scoped to the inviting owner — a teammate cannot see another customer's data, even by mistake. Hosted with India-friendly latency, billed in INR, GDPR-aware."
            bullets={[
              "Row-level security on every Supabase table",
              "Encrypted service-account credentials",
              "Seven-day free trial without a credit card",
            ]}
          />

          {/* Tail card linking to language support */}
          <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                <Languages className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-sans text-base font-semibold tracking-tight">
                  Multi-language: 8 Indian languages supported
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada,
                  Gujarati. Reviews are auto-detected and replies are written
                  in the same language by default.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pricing teaser ───────────────────────────────────── */}
        <section className="relative overflow-hidden py-20 sm:py-24 bg-muted/20 border-t border-border/60">
          <div className="mx-auto max-w-2xl text-center px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Pricing
            </p>
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              Plans from{" "}
              <span className="text-gradient-brand">
                $16/month
              </span>
              .
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every plan includes a seven-day free trial. No credit card. INR
              billing through Razorpay.
            </p>
          </div>
          <div className="mt-12 px-4 sm:px-6 lg:px-8">
            <PricingTable />
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Questions
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Frequently asked questions
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

        {/* ── Final CTA ────────────────────────────────────────── */}
        <section className="relative py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-12 sm:p-16 text-center backdrop-blur-sm">
              <div className="relative">
                <Sparkles
                  className="mx-auto h-6 w-6 text-accent"
                  aria-hidden="true"
                />
                <h2 className="mx-auto mt-4 max-w-2xl font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                  Start your 7-day free trial.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  No credit card required. Connect Play Store in two minutes,
                  invite teammates, and ship your first AI reply today.
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
          </div>
        </section>
      </main>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Local components
// ─────────────────────────────────────────────────────────────────────────────
function FeatureSection({
  id,
  icon: Icon,
  kicker,
  h2,
  body,
  bullets,
  link,
  soon,
}: {
  id: string;
  icon: typeof Bot;
  kicker: string;
  h2: string;
  body: string;
  bullets: string[];
  link?: { href: string; label: string; external?: boolean };
  soon?: boolean;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32"
      aria-labelledby={`${id}-h2`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-accent">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {kicker}
            </p>
            {soon && (
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                Coming soon
              </span>
            )}
          </div>
          <h2
            id={`${id}-h2`}
            className="mt-2 font-sans text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {h2}
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{body}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5 text-xs text-foreground/85 backdrop-blur-sm"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {link && (
            <p className="mt-5 text-sm">
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
                >
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
                >
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

const ROLE_MATRIX: {
  capability: string;
  owner: boolean;
  admin: boolean;
  readOnly: boolean;
}[] = [
  { capability: "View reviews and analytics", owner: true, admin: true, readOnly: true },
  { capability: "Reply to reviews (AI or manual)", owner: true, admin: true, readOnly: false },
  { capability: "Manage Play Store / GBP connections", owner: true, admin: true, readOnly: false },
  { capability: "Edit App Context Profile and brand voice", owner: true, admin: true, readOnly: false },
  { capability: "Invite or remove teammates", owner: true, admin: false, readOnly: false },
  { capability: "Manage billing and subscription", owner: true, admin: false, readOnly: false },
];

function RoleCell({ allowed }: { allowed: boolean }) {
  return (
    <td className="px-4 py-3">
      {allowed ? (
        <CheckCircle2
          className="h-4 w-4 text-accent"
          aria-label="Yes"
        />
      ) : (
        <XCircle
          className="h-4 w-4 text-muted-foreground/50"
          aria-label="No"
        />
      )}
    </td>
  );
}
