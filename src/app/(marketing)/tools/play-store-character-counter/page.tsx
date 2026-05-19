/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CharCounter } from "@/components/tools/CharCounter";
import { ToolCTA } from "@/components/tools/ToolCTA";
import { GridPattern } from "@/components/ui/grid-pattern";
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  softwareApplicationSchema,
  SITE_URL,
} from "@/lib/seo/schema";

const PAGE_URL = `${SITE_URL}/tools/play-store-character-counter`;
const LAST_UPDATED = "May 19, 2026";

const HOW_TO_STEPS = [
  {
    name: "Paste your draft developer reply",
    text: "Copy the reply you want to publish in Play Console and paste it into the counter. The live count updates immediately against Google Play's 350-character limit.",
  },
  {
    name: "Check the remaining character count",
    text: "Watch the counter, warning state, and limit indicator. Spaces, punctuation, line breaks, and emojis all affect whether the reply fits.",
  },
  {
    name: "Polish, shorten, or translate with AI",
    text: "Use the AI assist buttons to tighten wording, shorten an over-limit reply, or translate a response into Hinglish while keeping the reply useful.",
  },
  {
    name: "Copy the final reply into Play Console",
    text: "Once the draft is safely under 350 characters, copy it and publish it from Play Console or your connected review-management workflow.",
  },
];

const FAQS = [
  {
    question: "How long can a Play Store reply be?",
    answer:
      "A public developer reply on Google Play can be up to 350 characters. That includes spaces, punctuation, symbols, and emojis. The limit applies to the response you post below a user review, not to your app description or release notes.",
  },
  {
    question: "Does the 350-char limit count spaces?",
    answer:
      "Yes. Spaces count toward the 350-character Play Store reply limit, along with punctuation, line breaks, and visible symbols. A reply that looks short can still exceed the limit if it includes long URLs, repeated spacing, or emoji sequences.",
  },
  {
    question: "Can I exceed 350 characters?",
    answer:
      "No. Play Console will not publish a developer reply above the hard 350-character limit. If you need more detail, post a concise public response and move the deeper troubleshooting to email, support chat, or your help center.",
  },
  {
    question: "What happens if my reply is too long?",
    answer:
      "If a Play Store reply is too long, Play Console blocks or rejects it before publishing. The safest workflow is to draft the helpful version first, then shorten it with a counter so the final text remains specific and under the cap.",
  },
  {
    question: "Does the limit apply to GBP reviews?",
    answer:
      "No. Google Business Profile replies have a much larger limit than Play Store replies, so GBP responses can include more context. This tool is optimized for the Play Store 350-character limit, but it can still count any review reply draft.",
  },
  {
    question: "Can the counter detect emoji length correctly?",
    answer:
      "The counter uses JavaScript string length, which matches most practical copywriting needs but can differ from platform internals for complex emoji, skin-tone modifiers, or flag sequences. If a reply is near 350, leave a small buffer before publishing.",
  },
  {
    question: "Is there a character limit for the original review?",
    answer:
      "The 350-character cap applies to the developer reply, not the original user review. Users can leave longer comments, and you often need to summarize a long complaint into one concise acknowledgement and one concrete next step.",
  },
  {
    question: "Can I count characters in Hindi or other Indic scripts?",
    answer:
      "Yes. You can paste Hindi, Hinglish, Tamil, Marathi, Bengali, Telugu, Kannada, Malayalam, Gujarati, or Punjabi replies into the counter. For complex scripts and emoji, keep a small safety margin below 350 before posting.",
  },
  {
    question: "Does the counter work offline?",
    answer:
      "The visible counting logic runs in your browser after the page loads, but AI polish, shorten, and translate actions require a network request. If you already have the page open, simple character counting continues without sending text anywhere.",
  },
  {
    question: "Why was my 348-char reply rejected?",
    answer:
      "A 348-character reply can be rejected if the platform counts a complex emoji, hidden line break, copied smart quote, or multi-code-unit character differently. Remove emoji, trim whitespace, replace curly punctuation, and aim for 330-340 characters when possible.",
  },
];

const EXAMPLES = [
  {
    label: "Crash complaint",
    review: "App crashes after login.",
    reply:
      "Sorry about the login crash. We found the issue in v4.2 and a fix is rolling out now. Please update and email support@app.com if it still fails.",
  },
  {
    label: "Feature request",
    review: "Need dark mode.",
    reply:
      "Thanks for asking. Dark mode is in our roadmap and we are testing the first version now. We will mention it in release notes when it ships.",
  },
  {
    label: "Billing complaint",
    review: "Charged twice for subscription.",
    reply:
      "Sorry for the duplicate charge. Please email billing@app.com with your order ID and we will investigate the payment and refund status today.",
  },
  {
    label: "5-star praise",
    review: "Great app for tracking expenses.",
    reply:
      "Thanks for the 5-star review. Glad the expense tracking is helping. We are improving category rules next so budgeting feels even faster.",
  },
  {
    label: "Hinglish support",
    review: "OTP nahi aa raha.",
    reply:
      "Sorry, OTP delay frustrating hota hai. We are checking the SMS provider issue. Please retry once and email support@app.com if it still fails.",
  },
  {
    label: "Slow performance",
    review: "Too slow on my phone.",
    reply:
      "Sorry the app feels slow. We improved startup time in the latest update. Please update once, and send your device model if the lag continues.",
  },
];

export const metadata: Metadata = {
  title: "Play Store Character Counter — Free 350 Limit Checker (2026)",
  description:
    "Free Play Store reply character counter with AI polish, shorten, and Hinglish translate. Live count against the 350-char limit. No signup required.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Play Store Character Counter — Free 350 Limit Checker",
    description:
      "Free Play Store reply character counter with AI polish, shorten, and Hinglish translate. Check the 350-character limit before posting.",
    url: PAGE_URL,
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Play Store Character Counter for 350 character replies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Store Character Counter — Free",
    description:
      "Live 350-character counter with AI polish, shorten, and Hinglish translate.",
    images: ["/og-image.svg"],
  },
};

export default function PlayStoreCharacterCounterPage() {
  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Tools", url: `${SITE_URL}/tools` },
      { name: "Play Store Character Counter", url: PAGE_URL },
    ]),
    softwareApplicationSchema({
      name: "Play Store Character Counter",
      description:
        "Free Play Store reply character counter with AI polish, shorten, and Hinglish translate for Google's 350-character developer reply limit.",
      url: PAGE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (web)",
    }),
    howToSchema({
      name: "How to use the Play Store Character Counter",
      description:
        "Count, shorten, polish, and publish Google Play developer replies under the 350-character limit.",
      url: PAGE_URL,
      steps: HOW_TO_STEPS,
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
            <span className="text-gradient-brand font-serif italic">
              Play Store Character Counter
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed sm:text-lg">
            Play store character counter for Google Play developer replies:
            paste your draft, track the 350-character limit live, and use AI to
            polish, shorten, or translate replies before publishing.
          </p>
        </div>

        <CharCounter />

        <ToolCTA
          headline="Need to handle every Play Store review, not just count one reply?"
          body="ReviewPilot drafts 350-character-aware replies, flags negative reviews, and keeps your Play Store workflow moving."
        />
      </div>

      <div className="relative mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <article className="prose-tool">
          <section>
            <h2 className="seo-h2">What is the Play Store Character Counter?</h2>
            <p>
              The Play Store Character Counter is a free 350 character counter
              for Play Store developer replies. Google Play limits public
              responses to user reviews, so a reply that feels clear in a doc
              can still be rejected when you paste it into Play Console. This
              tool shows the live character count while you write, then helps
              shorten, polish, or translate the draft without losing the point.
            </p>
            <p>
              App developers use it when replying to crashes, billing issues,
              feature requests, angry 1-star reviews, and happy 5-star reviews.
              The goal is not to make replies tiny; it is to make them specific
              enough to reassure the reviewer and future readers while staying
              inside the hard limit. A good Play Store reply has one
              acknowledgement, one useful fact, and one next step.
            </p>
            <ul>
              <li>Use it before publishing a developer response in Play Console.</li>
              <li>Use it to shorten AI-generated replies without making them generic.</li>
              <li>Use it for Hindi, Hinglish, and Indic-script response drafts.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">How to use the Play Store Character Counter</h2>
            <p>
              The workflow is built around the real Google Play developer reply
              length constraint. Draft the helpful response first, then let the
              tool show exactly how much you need to cut.
            </p>
            <div className="not-prose mt-6 space-y-4">
              {HOW_TO_STEPS.map((step, index) => (
                <div
                  key={step.name}
                  className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <h3 className="font-sans text-base font-semibold tracking-tight">
                    Step {index + 1}: {step.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">
              Real Play Store reply examples within 350 characters
            </h2>
            <p>
              The strongest short replies are not vague. They acknowledge the
              exact issue, say what happens next, and avoid long greetings that
              waste characters. These examples all fit under the Play Store
              reply character count.
            </p>
            <div className="not-prose mt-6 grid gap-4 sm:grid-cols-2">
              {EXAMPLES.map((example) => (
                <div
                  key={example.label}
                  className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {example.label} · {example.reply.length} chars
                  </p>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    Review
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {example.review}
                  </p>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    Reply
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {example.reply}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">
              Why does Google enforce a 350-character reply limit?
            </h2>
            <p>
              Google has never published a detailed rationale for the exact
              number, but the product logic is clear. Play Store reviews are
              read on phones, often while a user is deciding whether to install
              an app. A short developer reply keeps the review feed scannable,
              discourages long defensive arguments, and pushes developers to
              resolve details through support channels instead of public
              threads.
            </p>
            <p>
              The constraint also improves reply quality when teams respect it.
              A 350-character response has enough room for empathy, one fact,
              and one action. It does not have room for a legal essay, repeated
              apology, or copied support macro. If you are building an
              integration, the{" "}
              <Link href="/blog/play-store-developer-reply-api-guide" className="tool-link">
                Play Store Developer Reply API
              </Link>{" "}
              workflow should enforce this limit before sending a response to
              Google.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">
              Character counter vs Google Play Console's built-in counter
            </h2>
            <p>
              Play Console helps at the final publishing step. ReviewPilot's
              counter helps before that, when you are still drafting, editing,
              translating, or asking AI to shorten a response.
            </p>
            <div className="not-prose mt-6 overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Feature</th>
                    <th className="px-4 py-3 text-left font-medium">ReviewPilot counter</th>
                    <th className="px-4 py-3 text-left font-medium">Play Console</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="px-4 py-3 font-medium">Live 350 count</td>
                    <td className="px-4 py-3 text-muted-foreground">Yes, before login</td>
                    <td className="px-4 py-3 text-muted-foreground">Yes, inside console</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">AI shorten</td>
                    <td className="px-4 py-3 text-muted-foreground">Yes</td>
                    <td className="px-4 py-3 text-muted-foreground">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Hinglish translate</td>
                    <td className="px-4 py-3 text-muted-foreground">Yes</td>
                    <td className="px-4 py-3 text-muted-foreground">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">No console access needed</td>
                    <td className="px-4 py-3 text-muted-foreground">Yes</td>
                    <td className="px-4 py-3 text-muted-foreground">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              That difference matters for agencies, founders, translators, and
              support teammates who should draft replies but may not have{" "}
              <Link href="/blog/google-play-console-permissions-reply-reviews-guide" className="tool-link">
                Google Play Console permissions
              </Link>
              . They can produce a ready-to-publish response without touching
              production console access.
            </p>
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
              Generate a complete reply with the{" "}
              <Link href="/tools/ai-review-reply-generator" className="tool-link">
                AI Review Reply Generator
              </Link>{" "}
              and estimate recovery math with the{" "}
              <Link href="/tools/app-rating-calculator" className="tool-link">
                App Rating Calculator
              </Link>
              . For strategy, read the{" "}
              <Link href="/blog/how-google-play-rating-algorithm-works" className="tool-link">
                Play Store rating algorithm
              </Link>{" "}
              guide or the{" "}
              <Link href="/play-store-reviews-guide" className="tool-link">
                Play Store Reviews Guide
              </Link>
              .
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">Try ReviewPilot for reply automation</h2>
            <p>
              The counter is useful when you are writing one reply. ReviewPilot
              is built for teams handling every review: it monitors new Play
              Store feedback, drafts 350-character-aware responses, flags
              negative reviews, routes sensitive cases for approval, and keeps
              reply rate high. If reply volume is turning into support debt,
              see <Link href="/pricing" className="tool-link">pricing</Link>{" "}
              and decide whether automation is cheaper than manual review ops.
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
