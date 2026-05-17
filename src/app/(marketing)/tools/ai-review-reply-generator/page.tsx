/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/marketing/JsonLd";
import { AiReplyGenerator } from "@/components/tools/AiReplyGenerator";
import { ToolCTA } from "@/components/tools/ToolCTA";
import { GridPattern } from "@/components/ui/grid-pattern";
import {
  breadcrumbSchema,
  faqSchema,
  softwareApplicationSchema,
  SITE_URL,
} from "@/lib/seo/schema";

const PAGE_URL = `${SITE_URL}/tools/ai-review-reply-generator`;

export const metadata: Metadata = {
  title: "Free AI Review Reply Generator — Play Store & GBP (2026)",
  description:
    "Generate AI replies to Play Store and Google reviews in 24 languages. Free, no signup. Smart tone, 3 variations, character-limit aware, Hinglish support.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Free AI Review Reply Generator — Play Store, Google & More",
    description:
      "Generate human-sounding AI replies to Play Store and Google Business Profile reviews. 24 languages, 3 variations, character-limit aware. Free, no signup.",
    url: PAGE_URL,
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AI Review Reply Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Review Reply Generator — 24 Languages, 3 Variations",
    description:
      "Paste a review, pick a tone, generate 3 AI replies that fit Play Store and GBP character limits. Free.",
    images: ["/og-image.svg"],
  },
};

// FAQ source of truth — rendered both as JSX and FAQPage JSON-LD.
const FAQS = [
  {
    question: "Is the AI Review Reply Generator really free?",
    answer:
      "Yes. No signup, no credit card, no quota you'll trip into. Generate as many replies as you need. The rate limit only kicks in at 15 generations per hour per IP to prevent abuse — most users never hit it.",
  },
  {
    question: "What languages does it support?",
    answer:
      "24 languages, including all 10 major Indian languages (Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, plus Hinglish in Roman script) and 14 global languages (Spanish, Portuguese, Arabic, Japanese, Korean, French, German, and more).",
  },
  {
    question: "Will Google penalise AI-generated replies?",
    answer:
      "No — Google doesn't ban AI replies. It penalises spam, low-quality, and templated replies. This tool produces 3 unique variations per request and pulls context from the original review, so replies stay specific and human, not boilerplate.",
  },
  {
    question: "Can I edit the generated replies?",
    answer:
      "Yes. Click \"Use this\" to copy a reply to your clipboard, then paste and edit anywhere — Play Console, GBP, or your inbox. The history panel saves your last 5 generations so you can compare versions before deciding.",
  },
  {
    question: "Does this work for Apple App Store reviews?",
    answer:
      "The tool generates replies that work for any platform — including App Store. Just select \"Other / Custom\" as the platform. Apple App Store allows up to 5,950 characters, so almost any generated reply fits without trimming.",
  },
];

export default function AiReviewReplyGeneratorPage() {
  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Tools", url: `${SITE_URL}/tools` },
      { name: "AI Review Reply Generator", url: PAGE_URL },
    ]),
    softwareApplicationSchema({
      name: "AI Review Reply Generator — ReviewPilot",
      description:
        "Free AI tool to generate review replies in 24 languages. Play Store, Google Business Profile, and any other platform. Character-limit aware, 3 variations per request.",
      url: PAGE_URL,
      applicationCategory: "BusinessApplication",
    }),
    faqSchema(FAQS),
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <GridPattern variant="grid" fade className="opacity-[0.25]" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        {/* Hero */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="uppercase tracking-[0.15em]">Free tool</span>
          </div>
          <h1 className="mt-5 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            Free{" "}
            <span className="text-gradient-brand font-serif italic">
              AI Review Reply
            </span>{" "}
            Generator
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed sm:text-lg">
            Generate human-sounding replies to Play Store and Google Business
            Profile reviews. Pick a tone, pick a language (24 supported), get
            3 variations that fit every platform's character limit. No signup.
          </p>
        </div>

        {/* Tool */}
        <AiReplyGenerator />

        {/* Primary CTA */}
        <ToolCTA
          headline="Replying manually for every review? ReviewPilot auto-replies in your tone."
          body="Connect Play Store and Google Business Profile in minutes. AI replies that fit every character limit, sentiment alerts, and a unified inbox — free for 7 days."
        />

        {/* Cross-link to char counter */}
        <div className="mt-6 rounded-xl border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground backdrop-blur-sm sm:p-5">
          <p>
            <span className="font-medium text-foreground">
              Need to fit a Play Store reply in 350 characters?
            </span>{" "}
            Try the{" "}
            <Link
              href="/tools/play-store-character-counter"
              className="text-foreground underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              Play Store Character Counter
            </Link>{" "}
            — it polishes any reply to fit the limit while keeping your tone.
          </p>
        </div>
      </div>

      {/* SEO content block */}
      <div className="relative mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <article className="prose-tool">
          <section>
            <h2 className="seo-h2">How the AI Review Reply Generator works</h2>
            <p>
              Under the hood, this tool calls Grok (xAI's flagship model) with
              a review-reply prompt that's been tuned over thousands of real
              replies on Play Store and Google Business Profile. It's not the
              same as opening ChatGPT and pasting a review — there are three
              things a purpose-built generator does that a general assistant
              doesn't.
            </p>
            <p>
              First, it enforces the platform's character limit at the prompt
              level <em>and</em> truncates at sentence boundaries if the model
              overshoots, so you don't end up with a 380-character reply that
              the Play Console refuses to post. Second, it produces three
              variations per request so you can pick the best one rather than
              regenerating until you're tired. Third, tone is calibrated
              against the reviewer's rating: a 1-star review gets a different
              shape of empathy than a 5-star one, even with the same tone
              setting. The result is a reply you'd actually post, generated in
              under ten seconds.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">When to use AI for review replies (and when not to)</h2>
            <p>
              AI is excellent at the bulk of what review-reply work actually
              is: producing a clear, contextual acknowledgement at the right
              length, in the right tone, in the right language. If you're
              shipping an app or running a business that gets more than 20
              reviews a week, AI replies in your tone are the difference
              between a 90% reply rate and burning out by Friday afternoon.
              Use it for thank-yous on 5-star reviews, calm acknowledgements
              of feature requests, first-touch responses to bug reports, and
              translated replies on reviews in languages you don't speak.
            </p>
            <p>
              Where AI should hand off to a human: anything that touches legal
              risk (refund disputes that mention "fraud", reviews threatening
              chargebacks or app store reports), brand-critical 1-star reviews
              that have gone viral, reviews from named industry contacts or
              press, and any review whose response will become the de-facto
              public statement on a sensitive issue. The pattern that works
              for most teams: AI drafts every reply, a human reviews and
              approves the negative ones, and only the 4–5 star replies post
              automatically. ReviewPilot's auto-reply rules make exactly that
              workflow one toggle each.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">Writing replies that don't sound AI-generated</h2>
            <p>
              The biggest tell of an AI-generated reply isn't a specific
              phrase — it's the <em>shape</em>. Generic openers, no specific
              details from the review, polite-but-empty middles, and a
              templated sign-off. If you've ever scrolled an app's reviews
              page and felt like the developer was on autopilot, this is what
              you were noticing. Avoiding the look is mostly about five small
              moves:
            </p>
            <ul>
              <li>
                <strong>Reference a specific detail</strong> from the review.
                If the reviewer mentioned PDF export, your reply mentions PDF
                export — not "your feedback on our features".
              </li>
              <li>
                <strong>Cut the warmup.</strong> Drop "Thank you for taking
                the time to leave us your feedback." That phrase eats 50
                characters and signals templated.
              </li>
              <li>
                <strong>Match the reviewer's energy.</strong> Short reviews
                deserve short replies. A two-paragraph response to a one-line
                review reads as defensive.
              </li>
              <li>
                <strong>Vary your sign-offs.</strong> Rotate between "—the
                team", first names, and no sign-off at all. Sameness across
                replies is what makes them feel scripted.
              </li>
              <li>
                <strong>End on substance, not pleasantries.</strong> A
                concrete next step (an ETA, an email, a follow-up link) is
                worth ten "we appreciate your patience"s.
              </li>
            </ul>
            <p>
              The Generate button above produces three variations precisely so
              you can pick the one with the best detail recall. If none of
              them feel right, regenerate — a fresh call usually gives a more
              specific take.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">Play Store vs Google Business Profile reply rules</h2>
            <p>
              The two platforms share a workflow on the surface but diverge
              on the rules of engagement. The 350-character cap on Play Store
              is the most visible difference; the platforms also handle
              links, edits, and reviewer notifications differently. Knowing
              the rules lets you write replies that survive the platform's
              own filters.
            </p>
            <div className="not-prose mt-6 overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Rule</th>
                    <th className="px-4 py-2 text-left font-medium">Play Store</th>
                    <th className="px-4 py-2 text-left font-medium">Google Business Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="px-4 py-2 font-medium">Reply length</td>
                    <td className="px-4 py-2 text-muted-foreground">350 chars (hard cap)</td>
                    <td className="px-4 py-2 text-muted-foreground">4,096 chars</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">URLs in replies</td>
                    <td className="px-4 py-2 text-muted-foreground">Stripped silently</td>
                    <td className="px-4 py-2 text-muted-foreground">Allowed, clickable</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Phone numbers</td>
                    <td className="px-4 py-2 text-muted-foreground">Allowed but unwise</td>
                    <td className="px-4 py-2 text-muted-foreground">Allowed and useful</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Reviewer notified</td>
                    <td className="px-4 py-2 text-muted-foreground">Yes, push + email</td>
                    <td className="px-4 py-2 text-muted-foreground">Yes, email only</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Edits visible</td>
                    <td className="px-4 py-2 text-muted-foreground">Replaces silently</td>
                    <td className="px-4 py-2 text-muted-foreground">Replaces silently</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Practical takeaway: a GBP reply can include an email and a
              phone number; a Play Store reply has to redirect to support
              with just an address (URLs get stripped, leaving a confusing
              bare domain). When the same reply needs to cross platforms,
              draft the GBP version first, then ask the AI to compress it
              into the 350-character Play Store version.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">AI Review Reply Generator vs ChatGPT — when each wins</h2>
            <p>
              ChatGPT is more flexible. It'll happily write a reply, a
              follow-up email, a stern legal response, and a customer-success
              playbook in one thread. If you're handling a single tricky
              review and you want to explore the response from several angles
              before committing, ChatGPT is the right tool. A purpose-built
              generator wins on three axes: <strong>speed</strong> (no prompt
              engineering — the platform, tone, and limit are baked in),{" "}
              <strong>character awareness</strong> (it won't hand you a
              420-character "Play Store reply"), and{" "}
              <strong>multi-language defaults</strong> (24 languages with a
              click, including Hinglish in Roman script).
            </p>
            <p>
              In practice: use ChatGPT for the 5% of replies that need a
              full thought-partner. Use this tool for the other 95% — the
              acknowledge-and-redirect replies that take 30 seconds when
              they're set up right and twenty minutes when they're not.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">How to reply faster — beyond AI generation</h2>
            <p>
              Generating replies is only half the workflow. The other half is
              monitoring, prioritisation, and posting. ReviewPilot adds
              sentiment alerts on new 1-star reviews, auto-reply rules that
              let you publish 4–5 star replies without manual approval, and a
              unified inbox that pulls Play Store, Google Business Profile,
              and WhatsApp Business into one queue. The free 7-day trial
              spins up in under five minutes —{" "}
              <Link
                href="/signup"
                className="text-foreground underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
              >
                start it here
              </Link>
              .
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2" id="faq">
              Frequently Asked Questions
            </h2>
            <div className="not-prose mt-6 space-y-4">
              {FAQS.map((f) => (
                <div
                  key={f.question}
                  className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <h3 className="font-sans text-base font-semibold tracking-tight">
                    {f.question}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </article>
      </div>

      {/* Structured data */}
      {schemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}

      {/* Local prose styles — scoped to this page only */}
      <style>{`
        .prose-tool { color: hsl(var(--foreground)); }
        .prose-tool p { font-size: 15px; line-height: 1.7; color: hsl(var(--muted-foreground)); margin-top: 1rem; }
        .prose-tool p:first-child { margin-top: 0; }
        .prose-tool ul { margin-top: 1rem; padding-left: 1.25rem; color: hsl(var(--muted-foreground)); font-size: 15px; line-height: 1.7; }
        .prose-tool li { margin-top: 0.5rem; }
        .prose-tool li strong { color: hsl(var(--foreground)); font-weight: 600; }
        .prose-tool strong { color: hsl(var(--foreground)); font-weight: 600; }
        .prose-tool em { color: hsl(var(--foreground)); font-style: italic; }
        .seo-h2 { font-family: var(--font-geist-sans, ui-sans-serif, system-ui); font-size: 22px; font-weight: 600; letter-spacing: -0.01em; color: hsl(var(--foreground)); }
        @media (min-width: 640px) { .seo-h2 { font-size: 26px; } }
      `}</style>
    </section>
  );
}
