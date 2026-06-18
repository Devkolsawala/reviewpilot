/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/marketing/JsonLd";
import { PlayStoreAnalyzer } from "@/components/tools/PlayStoreAnalyzer";
import { ToolCTA } from "@/components/tools/ToolCTA";
import { GridPattern } from "@/components/ui/grid-pattern";
import {
  breadcrumbSchema,
  faqSchema,
  softwareApplicationSchema,
  SITE_URL,
} from "@/lib/seo/schema";

const PAGE_URL = `${SITE_URL}/tools/play-store-analyzer`;
const LAST_UPDATED = "May 22, 2026";

const FAQS = [
  {
    question: "What does the free Play Store Review Analyzer do?",
    answer:
      "Paste any public Play Store app URL and the analyzer scrapes recent reviews, computes the developer's response rate, counts unreplied negative reviews, breaks down sentiment, surfaces the top complaint and praise themes, and generates a sample AI reply to the worst unanswered review. It's a one-click audit of how an app handles user feedback.",
  },
  {
    question: "Is this really free? Do I need to sign up?",
    answer:
      "Yes, completely free with no signup. You get 3 fresh analyses per day per IP. Cached results from other users are unlimited — if another visitor analyzed the same app recently, you can view the cached report instantly without spending quota.",
  },
  {
    question: "Does it work on any Play Store app?",
    answer:
      "Yes. It works on any publicly listed app on the Indian Play Store — you don't need to own the app or connect Play Console. Paste the URL or the bare package id (e.g. com.example.app) and you'll get an analysis.",
  },
  {
    question: "What data does the analyzer read?",
    answer:
      "Only the public Play Store page: app metadata (name, rating, install count, description) and the most recent visible reviews. We do not access Play Console, the Developer API, or any private data — that requires a separate authenticated connection on the ReviewPilot dashboard.",
  },
  {
    question: "How is the response rate calculated?",
    answer:
      "Response rate is the percentage of analyzed reviews that have a visible developer reply on the Play Store page. The analyzer samples up to 150 of the most recent reviews and counts how many have a public response from the developer.",
  },
  {
    question: "What counts as a 'recoverable' review?",
    answer:
      "Recoverable reviews are 1–3 star reviews that have no developer response yet and contain enough text to act on. These are the highest-leverage replies — a well-written response often nudges the reviewer to update their rating, and even when it doesn't, future users see that the developer cares.",
  },
  {
    question: "Why are some clusters missing or generic?",
    answer:
      "Clusters are AI-generated from a sample of the visible reviews. Apps with very few text reviews, or with reviews dominated by emoji/ratings without comments, can produce sparse clusters. The analyzer prefers to return fewer high-confidence themes over noisy ones.",
  },
  {
    question: "Can I run this on my competitor's app?",
    answer:
      "Yes — that's one of the main use cases. The analyzer reads public data only, so you can benchmark your app's response rate, complaint themes, and sentiment against competitors in the same category. The permanent /insights URL is shareable with your team or stakeholders.",
  },
];

export const metadata: Metadata = {
  title:
    "Free Play Store Review Analyzer — Sentiment & Response Rate Audit",
  description:
    "Free Play Store review analyzer. Paste any app URL to see sentiment breakdown, response rate, unreplied negatives, top complaints, and an AI sample reply. No signup.",
  keywords: [
    "play store review analyzer",
    "play store sentiment analysis",
    "app review audit",
    "google play review analysis tool",
    "app store sentiment analyzer",
    "play store response rate",
    "free app review analyzer",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title:
      "Free Play Store Review Analyzer — Sentiment & Response Rate Audit",
    description:
      "Paste a Play Store URL. Get sentiment, response rate, unreplied negatives, top complaints, and a sample AI reply — in seconds, no signup.",
    url: PAGE_URL,
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Free Play Store Review Analyzer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Play Store Review Analyzer",
    description:
      "Sentiment, response rate, complaint clusters, and a sample AI reply for any Play Store app.",
    images: ["/og-image.svg"],
  },
};

export default function PlayStoreAnalyzerPage() {
  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Tools", url: `${SITE_URL}/tools` },
      { name: "Play Store Review Analyzer", url: PAGE_URL },
    ]),
    softwareApplicationSchema({
      name: "Play Store Review Analyzer",
      description:
        "Free Play Store review analyzer. Sentiment breakdown, response rate, unreplied negative count, AI topic clustering, and sample reply for any public Play Store app.",
      url: PAGE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (web)",
    }),
    faqSchema(FAQS),
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <GridPattern variant="grid" fade className="opacity-[0.25]" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="uppercase tracking-[0.15em]">Free tool</span>
          </div>
          <h1 className="mt-5 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            Free{" "}
            <span className="text-gradient-brand font-serif italic">
              Play Store Review
            </span>{" "}
            Analyzer
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed sm:text-lg">
            Paste any Play Store app URL and get a one-page audit: sentiment
            breakdown, developer response rate, unreplied negative reviews, top
            complaint and praise themes, plus a sample AI reply to the worst
            unanswered review.
          </p>
        </div>

        <PlayStoreAnalyzer />

        <ToolCTA
          headline="Running this audit on your own app every week? ReviewPilot does it daily."
          body="Connect Play Console and we monitor new reviews, auto-draft replies in your tone, and alert you when sentiment shifts."
        />
      </div>

      <div className="relative mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <article className="prose-tool">
          <section>
            <h2 className="seo-h2">What is a Play Store Review Analyzer?</h2>
            <p>
              A Play Store review analyzer reads the public reviews on a
              Google Play app listing and turns them into a one-page audit. It
              calculates the developer's response rate, surfaces the most
              common complaint and praise themes, and highlights the unreplied
              negative reviews that are most worth answering. Indie developers
              use it to benchmark against competitors. Marketing teams use it
              to spot category-wide pain points. Investors and analysts use it
              to quickly read the customer pulse of an app without spending
              hours scrolling Play Store reviews.
            </p>
            <p>
              ReviewPilot's free analyzer is built around the metrics that
              actually move ratings: response rate (a public trust signal
              future users scan for), unreplied negative count (the queue
              that's quietly costing you stars), and recoverable reviews
              (1–3 star reviewers who left enough context that a real reply
              could change their mind).
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">How it works</h2>
            <ul>
              <li>
                We scrape the public Play Store page for app metadata and the
                most recent visible reviews — no Play Console access required.
              </li>
              <li>
                Metrics like response rate, unreplied negatives, and the 90-day
                rating trend are computed directly from the scraped data.
              </li>
              <li>
                Complaint and praise themes are clustered by an AI model
                trained for Indian SaaS reviews (English, Hindi, Hinglish,
                plus other Indian languages).
              </li>
              <li>
                One sample AI reply is generated for the worst unanswered
                review, so you can see the quality bar a tool like ReviewPilot
                would hold up across your full inbox.
              </li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2" id="faq">Frequently Asked Questions</h2>
            <div className="not-prose mt-6 space-y-4">
              {FAQS.map((f) => (
                <div
                  key={f.question}
                  className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <h3 className="font-sans text-base font-semibold tracking-tight">
                    {f.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">Related free tools</h2>
            <p>
              Pair the analyzer with the{" "}
              <Link
                href="/tools/ai-review-reply-generator"
                className="tool-link"
              >
                AI Review Reply Generator
              </Link>{" "}
              to draft replies to the negatives it surfaces, the{" "}
              <Link
                href="/tools/play-store-character-counter"
                className="tool-link"
              >
                Play Store Character Counter
              </Link>{" "}
              to keep them under the 350-character limit, and the{" "}
              <Link href="/tools/app-rating-calculator" className="tool-link">
                App Rating Calculator
              </Link>{" "}
              to model the impact on your overall score. You can also browse
              existing{" "}
              <Link href="/insights" className="tool-link">
                Play Store app review reports
              </Link>{" "}
              for apps others have already analyzed.
            </p>
          </section>

          <p className="mt-10 text-xs text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </article>
      </div>

      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}

      <style>{`
        .prose-tool { color: hsl(var(--foreground)); }
        .prose-tool p { font-size: 15px; line-height: 1.7; color: hsl(var(--muted-foreground)); margin-top: 1rem; }
        .prose-tool p:first-child { margin-top: 0; }
        .prose-tool ul { margin-top: 1rem; padding-left: 1.25rem; color: hsl(var(--muted-foreground)); font-size: 15px; line-height: 1.7; }
        .prose-tool li { margin-top: 0.5rem; }
        .seo-h2 { font-family: var(--font-geist-sans, ui-sans-serif, system-ui); font-size: 22px; font-weight: 600; letter-spacing: 0; color: hsl(var(--foreground)); }
        .tool-link { color: hsl(var(--foreground)); text-decoration: underline; text-decoration-color: hsl(var(--accent) / 0.4); text-underline-offset: 2px; }
        .tool-link:hover { text-decoration-color: hsl(var(--accent)); }
        @media (min-width: 640px) { .seo-h2 { font-size: 26px; } }
      `}</style>
    </section>
  );
}
