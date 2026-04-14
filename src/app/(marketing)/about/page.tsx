import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Heart, Target } from "lucide-react";
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
    description: "Meet the founders behind India&apos;s affordable review management SaaS.",
    images: ["/og-image.svg"],
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationSchema} />

      <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-6">
            <span aria-hidden="true">🇮🇳</span> Made in India · Founded 2026
          </div>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">
            Built by two Indian founders who were drowning in reviews too.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            ReviewPilot exists because we needed it ourselves — and the tools
            on the market were priced for Fortune 500s, not for Indian small
            businesses and indie app developers.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold mb-6">
            Our origin story
          </h2>
          <div className="space-y-5 text-muted-foreground leading-relaxed text-lg">
            <p>
              In late 2025, both of us were running our own apps. Not huge, not
              venture-funded — just small, honest products trying to find
              product-market fit. And we were watching, helplessly, as the
              Play Store review queue grew faster than we could reply to it.
            </p>
            <p>
              Every unanswered 1-star review was a tiny cut. Ratings slipped.
              Installs tapered. We&apos;d stay up at 1am replying to reviews in
              the Play Console, typing the same explanations for the same bugs
              over and over, knowing that for every one we answered, three more
              arrived. Indian developers reading this — you know this feeling.
            </p>
            <p>
              So we went looking for a tool. Birdeye. Podium. Simplify360. The
              quotes came back: <span className="font-semibold text-foreground">₹25,000 to ₹45,000 a month</span>,
              annual contracts only, and most didn&apos;t even touch Play Store
              reviews. It felt absurd. We were paying more for review software
              than our entire server bill.
            </p>
            <p>
              That&apos;s when Dev turned to Aditya and said the thing most
              Indian founders eventually say:{" "}
              <em>&ldquo;We can build this ourselves.&rdquo;</em> So we did.
              ReviewPilot is what we wished existed — AI review management that
              understands Play Store AND Google Business Profile, speaks Indian
              languages, and costs ₹1,500 a month. A seventeenth of Birdeye.
              For the same core outcome.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold font-heading">
                  DK
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">Dev Kolsawala</h3>
                  <p className="text-xs text-muted-foreground">Co-founder</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Product and engineering. Previously shipped apps drowning in
                Play Store reviews — which is how this whole thing started.
              </p>
              <Button size="sm" variant="outline" asChild>
                {/* TODO: add LinkedIn URL */}
                <Link href="https://www.linkedin.com/in/dev-kolsawala-a79637200/">
                  <ExternalLink className="mr-2 h-4 w-4" /> LinkedIn
                </Link>
              </Button>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold font-heading">
                  AR
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">Aditya Raj Singh</h3>
                  <p className="text-xs text-muted-foreground">Co-founder</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Growth, operations, customer conversations. Spent hundreds of
                hours interviewing Indian SMBs about their review workflows so
                ReviewPilot gets the unglamorous details right.
              </p>
              <Button size="sm" variant="outline" asChild>
                {/* TODO: add LinkedIn URL */}
                <Link href="https://www.linkedin.com/in/aditya-raj-s-268636200/">
                  <ExternalLink className="mr-2 h-4 w-4" /> LinkedIn
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border bg-background p-8">
            <Target className="h-8 w-8 text-teal-500 mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-3">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Affordable, modern review management for Indian SMBs and app
              developers. We believe the same automation that protects global
              enterprises&apos; ratings should be accessible to a family restaurant
              in Indore or an indie dev in Kochi — without a ₹25,000/month
              invoice.
            </p>
          </div>
          <div className="rounded-xl border bg-background p-8">
            <Heart className="h-8 w-8 text-teal-500 mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-3">Made in India</h2>
            <p className="text-muted-foreground leading-relaxed">
              Designed, built, and supported from India. We price in rupees,
              accept UPI, speak your customers&apos; languages, and understand that
              a 4.2-star restaurant in Mumbai has different needs than a chain
              in Kansas. India-first is not a tagline — it&apos;s the product.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-white">
            Join the movement.
          </h2>
          <p className="mt-4 text-navy-300">
            If you&apos;re an Indian SMB or app developer, ReviewPilot was built for
            you. Try it free for 7 days — no credit card.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
