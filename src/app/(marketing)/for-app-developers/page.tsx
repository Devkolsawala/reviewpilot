import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Smartphone,
  BarChart3,
  Globe,
  Zap,
  AlertTriangle,
  Crown,
  Users,
  MessageCircle,
} from "lucide-react";

const WHATSAPP_GREEN = "#25D366";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";

export const metadata: Metadata = {
  title: "Play Store Review Management for App Developers",
  description:
    "Reply to every Play Store review with AI. Enforce the 350-char limit, detect known bugs, lift your rating. Built for Indian app developers from $16/mo.",
  alternates: { canonical: "/for-app-developers" },
  openGraph: {
    title: "Play Store Review Management for App Developers",
    description:
      "AI replies for Play Store reviews. Enforce 350-char limit, detect known bugs, lift your app rating.",
    url: "https://www.reviewpilot.co.in/for-app-developers",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot for app developers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Store Review Management",
    description: "AI-powered Play Store review replies for Indian app devs.",
    images: ["/og-image.svg"],
  },
};

const BENEFITS = [
  {
    icon: Bot,
    title: "AI replies that know your app",
    description:
      "Set up your App Context Profile once — features, known issues, FAQs. AI generates replies that actually help users.",
  },
  {
    icon: Smartphone,
    title: "350-char limit enforced",
    description:
      "Play Store has a 350-character reply limit. ReviewPilot enforces this automatically — no more truncated replies.",
  },
  {
    icon: BarChart3,
    title: "Track rating impact",
    description:
      "See how replies affect ratings over time. Identify which issues drive the most negative reviews.",
  },
  {
    icon: Globe,
    title: "Multi-language support",
    description:
      "Users review in Hindi, Tamil, Telugu, and more. AI replies in the same language as the review.",
  },
  {
    icon: Zap,
    title: "Auto-reply to every rating",
    description:
      "Rules-based: auto-publish 4–5★ drafts, queue 1–3★ for human approval before publish.",
  },
  {
    icon: AlertTriangle,
    title: "Known-issue detection",
    description:
      "When a review mentions a known bug, AI acknowledges it and tells the user a fix is coming.",
  },
];

export default function ForAppDevelopersPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="uppercase tracking-[0.15em]">For app developers</span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Turn 1-star reviews into{" "}
              <span className="text-gradient-brand font-serif italic">
                loyal users
              </span>
              .
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Play Store reviews make or break your app. ReviewPilot uses AI to
              generate context-aware replies that address bugs, answer questions,
              and thank happy users — all within the 350-character limit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Built for shippers
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything an Android team needs.
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

      {/* WhatsApp Business — mid-weight section */}
      <section
        className="relative py-20 sm:py-24 border-y border-border/60"
        style={{ backgroundColor: `${WHATSAPP_GREEN}06` }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
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
                  Bonus — WhatsApp Business
                </span>
              </div>
              <h2 className="mt-4 font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
                Have a support WhatsApp number?{" "}
                <span className="text-gradient-brand">
                  Plug it into the same inbox.
                </span>
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
                Indian app users — especially paid-app users — DM you on
                WhatsApp for support. Connect your WhatsApp Business number
                via Meta Embedded Signup and inbound messages land alongside
                your Play Store reviews. Same AI engine, same App Context
                Profile, same brand voice — for both surfaces.
              </p>
              <div className="mt-5">
                <Link
                  href="/whatsapp-automation"
                  className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  See WhatsApp Business automation
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div
              className="hidden lg:flex h-32 w-32 items-center justify-center rounded-3xl"
              style={{
                backgroundColor: `${WHATSAPP_GREEN}1f`,
                color: WHATSAPP_GREEN,
              }}
            >
              <MessageCircle className="h-16 w-16" />
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
              Scale beyond a solo dev.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              As the team grows, bring in co-founders, community managers, and
              support engineers with scoped access. No shared logins, no shared
              billing — just review replies handled by the right person.{" "}
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
                  Founders &amp; owners
                </h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                <li>Connect the Play Store service account</li>
                <li>Manage billing, subscription, and plan changes</li>
                <li>Invite, promote, or remove teammates</li>
                <li>Configure auto-reply rules and brand voice</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-accent">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="font-sans text-base font-semibold tracking-tight">
                  Admin &amp; Read-only members
                </h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                <li>Admins draft, edit, and publish review replies</li>
                <li>Admins manage app contexts and connections</li>
                <li>Read-only members can view reviews and analytics</li>
                <li>Neither sees your Razorpay or billing screen</li>
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

      {/* CTA */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,rgba(99,102,241,0.12)_0%,rgba(139,92,246,0.08)_50%,rgba(217,70,239,0.12)_100%)] p-12 sm:p-16 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid mask-radial-fade opacity-30"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Stop ignoring your Play Store reviews.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Join hundreds of developers using ReviewPilot to keep a 4+ rating.
                From $16/month.
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
    </>
  );
}
