import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Heart, Target } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
import { JsonLd, SITE_URL, organizationSchema } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "About ReviewPilot — Founders & Made-in-India Story | ReviewPilot",
  description:
    "Meet Dev Kolsawala & Aditya Raj Singh, founders of ReviewPilot. An Indian review management startup built for SMBs at 1/17th the cost of global tools.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About ReviewPilot — Founders & Our Made-in-India Story",
    description:
      "Why we built an India-first review management startup at 1/17th the cost of global tools.",
    url: `${SITE_URL}/about`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "About ReviewPilot founders" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About ReviewPilot",
    description: "Meet the founders behind India's affordable review management SaaS.",
    images: ["/og-image.svg"],
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationSchema} />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <span aria-hidden>🇮🇳</span>
            <span className="uppercase tracking-[0.15em]">Made in India · Founded 2026</span>
          </div>
          <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Built by two founders who were{" "}
            <span className="text-gradient-brand font-serif italic">
              drowning in reviews
            </span>{" "}
            too.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            ReviewPilot exists because we needed it ourselves — and the tools on
            the market were priced for Fortune 500s, not for Indian small
            businesses and indie app developers.
          </p>
        </div>
      </section>

      {/* Origin story */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Our story
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            The ₹25,000 quote that started it all.
          </h2>
          <div className="mt-8 space-y-5 text-base text-muted-foreground leading-relaxed sm:text-lg">
            <p>
              In late 2025, both of us were running our own apps. Not huge, not
              venture-funded — just small, honest products trying to find
              product-market fit. And we were watching, helplessly, as the Play
              Store review queue grew faster than we could reply to it.
            </p>
            <p>
              Every unanswered 1-star review was a tiny cut. Ratings slipped.
              Installs tapered. We&apos;d stay up at 1am replying to reviews in the
              Play Console, typing the same explanations for the same bugs over
              and over, knowing that for every one we answered, three more
              arrived. Indian developers reading this — you know this feeling.
            </p>
            <p>
              So we went looking for a tool. Birdeye. Podium. Simplify360. The
              quotes came back:{" "}
              <span className="font-semibold text-foreground">
                ₹25,000 to ₹45,000 a month
              </span>
              , annual contracts only, and most didn&apos;t even touch Play Store
              reviews. It felt absurd. We were paying more for review software
              than our entire server bill.
            </p>
            <p>
              That&apos;s when Dev turned to Aditya and said the thing most
              Indian founders eventually say:{" "}
              <em>&ldquo;We can build this ourselves.&rdquo;</em> So we did.
              ReviewPilot is what we wished existed — AI review management that
              understands Play Store AND Google Business Profile, speaks Indian
              languages, and costs ₹1,500 a month. A{" "}
              <span className="text-gradient-brand font-semibold">
                seventeenth of Birdeye
              </span>
              . For the same core outcome.
            </p>
          </div>

          {/* Founders */}
          <div className="mt-20 grid gap-6 md:grid-cols-2">
            <FounderCard
              initials="DK"
              gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
              name="Dev Kolsawala"
              role="Co-founder"
              bio="Product and engineering. Previously shipped apps drowning in Play Store reviews — which is how this whole thing started."
              href="https://www.linkedin.com/in/dev-kolsawala-a79637200/"
            />
            <FounderCard
              initials="AR"
              gradient="linear-gradient(135deg,#8b5cf6,#d946ef)"
              name="Aditya Raj Singh"
              role="Co-founder"
              bio="Growth, operations, customer conversations. Spent hundreds of hours interviewing Indian SMBs about their review workflows so ReviewPilot gets the unglamorous details right."
              href="https://www.linkedin.com/in/aditya-raj-s-268636200/"
            />
          </div>
        </div>
      </section>

      {/* Mission + Made-in-India */}
      <section className="relative py-24 bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60">
              <Target className="h-4 w-4 text-accent" />
            </div>
            <h2 className="mt-5 font-sans text-2xl font-semibold tracking-tight">
              Our mission
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Affordable, modern review management for Indian SMBs and app
              developers. We believe the same automation that protects global
              enterprises&apos; ratings should be accessible to a family
              restaurant in Indore or an indie dev in Kochi — without a
              ₹25,000/month invoice.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60">
              <Heart className="h-4 w-4 text-accent" />
            </div>
            <h2 className="mt-5 font-sans text-2xl font-semibold tracking-tight">
              Made in India
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Designed, built, and supported from India. We price in rupees,
              accept UPI, speak your customers&apos; languages, and understand
              that a 4.2-star restaurant in Mumbai has different needs than a
              chain in Kansas. India-first is not a tagline — it&apos;s the
              product.
            </p>
          </div>
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
                Join the movement.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                If you&apos;re an Indian SMB or app developer, ReviewPilot was built
                for you. Try it free for 7 days — no credit card.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button variant="gradient" size="xl" asChild>
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="subtle" size="xl" asChild>
                  <Link href="/how-it-works">See how it works</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FounderCard({
  initials,
  gradient,
  name,
  role,
  bio,
  href,
}: {
  initials: string;
  gradient: string;
  name: string;
  role: string;
  bio: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: gradient }}
        >
          {initials}
        </div>
        <div>
          <h3 className="font-sans text-base font-semibold tracking-tight">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        {bio}
      </p>
      <Button size="sm" variant="subtle" className="mt-5" asChild>
        <Link href={href} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> LinkedIn
        </Link>
      </Button>
    </div>
  );
}
