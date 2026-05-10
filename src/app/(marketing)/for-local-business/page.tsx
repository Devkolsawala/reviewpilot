import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Star,
  MessageSquare,
  MessageCircle,
  TrendingUp,
  Clock,
  Users,
  ShieldCheck,
  Crown,
  CheckCircle2,
  Inbox,
  Languages,
  Sparkles,
} from "lucide-react";

const WHATSAPP_GREEN = "#25D366";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";

export const metadata: Metadata = {
  title: "Review Management for Local Business India — Google + WhatsApp",
  description:
    "Review management for Indian local businesses — restaurants, salons, clinics. AI replies for Google reviews and WhatsApp messages in one inbox. From $16/mo.",
  alternates: { canonical: "/for-local-business" },
  openGraph: {
    title: "Review Management for Local Business India — Google + WhatsApp",
    description:
      "AI replies for Google reviews and WhatsApp Business messages. Built for restaurants, salons, clinics, and retailers in India.",
    url: "https://reviewpilot.co.in/for-local-business",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot for local business" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Review Management for Local Business India",
    description: "Google reviews + WhatsApp Business automation for Indian SMBs.",
    images: ["/og-image.svg"],
  },
};

const BENEFITS = [
  {
    icon: MessageSquare,
    title: "Reply to every review",
    description:
      "AI generates personalized replies in your brand voice. Approve or auto-publish — you're in control.",
  },
  {
    icon: Star,
    title: "Collect more reviews",
    description:
      "Send SMS to happy customers with a direct link to leave a Google review. Watch your rating climb.",
  },
  {
    icon: TrendingUp,
    title: "Track your growth",
    description:
      "See rating trends, sentiment analysis, and top keywords. Know exactly what customers love.",
  },
  {
    icon: Clock,
    title: "Save hours every week",
    description:
      "What used to take 2 hours now takes 5 minutes. Bulk-reply to reviews with one click.",
  },
  {
    icon: Users,
    title: "Multi-location support",
    description:
      "Managing multiple locations? See all reviews in one inbox. Perfect for franchise owners.",
  },
  {
    icon: ShieldCheck,
    title: "Catch negative reviews fast",
    description:
      "Get alerts for 1–2 star reviews. Respond before unhappy customers tell their friends.",
  },
];

const USE_CASES = [
  "Restaurants & Cafes",
  "Dentists & Clinics",
  "Salons & Spas",
  "Plumbers & Electricians",
  "Gyms & Fitness Studios",
  "Real Estate Agents",
  "Auto Repair Shops",
  "Hotels & Homestays",
];

export default function ForLocalBusinessPage() {
  return (
    <>
      {/* Launching-soon banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2.5 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Launching soon.</span> Google Business
            Profile automation is in beta. Play Store review management is live
            today.
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="uppercase tracking-[0.15em]">For local businesses</span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                Soon
              </span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Your Google reviews and WhatsApp messages,{" "}
              <span className="text-gradient-brand font-serif italic">
                on autopilot
              </span>
              .
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Restaurants, salons, clinics, retailers — you live on Google
              reviews and WhatsApp messages. ReviewPilot uses AI to reply to
              every Google review and every WhatsApp Business DM in your tone,
              in 8 Indian languages, from one inbox.{" "}
              <Link
                href="/whatsapp-automation"
                className="text-foreground underline-offset-4 hover:underline"
              >
                See WhatsApp Business automation →
              </Link>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/demo">See a demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Why they love us
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Made for the teams behind the counter.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-colors hover:border-accent/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                  <b.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-sans text-base font-semibold tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Business — major section, parity-weight with GBP */}
      <section className="relative overflow-hidden py-24 sm:py-32 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
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
                  WhatsApp Business automation
                </span>
              </div>
              <h2 className="mt-6 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Every WhatsApp message your customers send —{" "}
                <span className="text-gradient-brand font-serif italic">
                  answered automatically
                </span>
                .
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                In India, customers expect WhatsApp replies within minutes —
                not hours. A missed message becomes a lost sale, a one-star
                Google review, and a customer who tells their friends.
                ReviewPilot connects to your WhatsApp Business number through
                Meta&apos;s official Embedded Signup, drafts AI replies in
                your tone in 8 Indian languages, and sends them inside the
                24-hour window for free — all from the same inbox where you
                manage your Google reviews.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: ShieldCheck,
                    text: "60-second Embedded Signup via Facebook Login",
                  },
                  {
                    icon: Sparkles,
                    text: "Meta-approved official Cloud API integration",
                  },
                  {
                    icon: Languages,
                    text: "AI replies in Hindi, Gujarati, Tamil & 5 more",
                  },
                  {
                    icon: Inbox,
                    text: "Same inbox as your Google reviews",
                  },
                  {
                    icon: Clock,
                    text: "Free replies inside the 24-hour window",
                  },
                  {
                    icon: CheckCircle2,
                    text: "Multi-WABA & multi-phone-number support",
                  },
                ].map((b) => {
                  const Icon = b.icon;
                  return (
                    <div
                      key={b.text}
                      className="flex items-start gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5 text-xs text-foreground/85 backdrop-blur-sm"
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>{b.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8">
                <Button variant="gradient" size="lg" asChild>
                  <Link href="/whatsapp-automation">
                    See WhatsApp Business automation
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Mock WhatsApp conversation */}
            <div className="relative">
              <div
                className="absolute -inset-6 rounded-[2rem] blur-2xl -z-10"
                style={{
                  backgroundColor: `${WHATSAPP_GREEN}12`,
                }}
              />
              <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${WHATSAPP_GREEN}1f`,
                      color: WHATSAPP_GREEN,
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Paloma Café · Koramangala
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      WhatsApp Business · verified
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex">
                    <div
                      className="rounded-2xl rounded-bl-sm px-3 py-2 leading-relaxed max-w-[80%]"
                      style={{
                        backgroundColor: `${WHATSAPP_GREEN}14`,
                      }}
                    >
                      <p className="font-medium text-[10px] text-muted-foreground">
                        Ravi · 2m ago
                      </p>
                      <p className="mt-0.5 text-foreground/90">
                        Hi, do you have a table for 4 at 8pm tonight?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-accent text-[11px]">
                    <Sparkles className="h-3 w-3" />
                    AI drafting in 2 seconds…
                  </div>
                  <div className="flex justify-end">
                    <div
                      className="rounded-2xl rounded-br-sm border px-3 py-2 leading-relaxed max-w-[80%]"
                      style={{
                        backgroundColor: `${WHATSAPP_GREEN}10`,
                        borderColor: `${WHATSAPP_GREEN}55`,
                      }}
                    >
                      <p className="text-foreground/90">
                        Hi Ravi! Yes, we have a table for 4 at 8pm. I&apos;ll
                        confirm under your name and message you the directions.
                        See you tonight! 🌿
                      </p>
                      <span
                        className="mt-1 inline-flex items-center gap-1 text-[9px] font-medium"
                        style={{ color: WHATSAPP_GREEN }}
                      >
                        ✓✓ Inside 24-hour window — free
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team collaboration */}
      <section className="relative py-24 sm:py-32 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Team collaboration
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Hand off review replies to your team.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              You don&apos;t have time to reply to every review yourself. Bring in
              your store manager, receptionist, or marketing assistant to draft
              and publish replies — without ever giving them access to your
              billing or your Google login.{" "}
              <Link href="/features#team-collaboration" className="text-foreground underline-offset-4 hover:underline">
                See all features
              </Link>
              .
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                  <Crown className="h-4 w-4" />
                </div>
                <h3 className="font-sans text-base font-semibold tracking-tight">
                  Owner-managers
                </h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                <li>Connect Google Business Profile and locations</li>
                <li>Manage Razorpay billing and subscription</li>
                <li>Invite, promote, or remove staff members</li>
                <li>Set the brand voice and auto-reply rules</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="font-sans text-base font-semibold tracking-tight">
                  Store managers &amp; staff
                </h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                <li>Admins reply to reviews and edit AI drafts</li>
                <li>Admins update app context, FAQs, and tone</li>
                <li>Read-only staff can monitor reviews and analytics</li>
                <li>No access to billing, plan, or location credentials</li>
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Team seats: Starter 3 · Growth 5 · Agency 10. See{" "}
            <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">
              pricing
            </Link>{" "}
            for details.
          </p>
        </div>
      </section>

      {/* Use cases */}
      <section className="relative py-24 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Perfect for
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            Works for every local team.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {USE_CASES.map((uc) => (
              <span
                key={uc}
                className="rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm"
              >
                {uc}
              </span>
            ))}
          </div>
          <div className="mt-12">
            <Button variant="gradient" size="xl" asChild>
              <Link href="/signup">
                Get started free
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
