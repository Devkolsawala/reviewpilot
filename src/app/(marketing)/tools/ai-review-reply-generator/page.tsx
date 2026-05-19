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
  howToSchema,
  softwareApplicationSchema,
  SITE_URL,
} from "@/lib/seo/schema";

const PAGE_URL = `${SITE_URL}/tools/ai-review-reply-generator`;
const LAST_UPDATED = "May 19, 2026";

const HOW_TO_STEPS = [
  {
    name: "Paste the customer review",
    text: "Copy the Play Store, Google Business Profile, Trustpilot, or App Store review into the input box. Include the star rating when available so the reply matches the user's sentiment.",
  },
  {
    name: "Choose platform, rating, tone, and language",
    text: "Select the platform, star rating, reply tone, and language. ReviewPilot supports 24 languages, including Hindi and Hinglish, and keeps Play Store replies inside the 350-character limit.",
  },
  {
    name: "Generate three reply variations",
    text: "Click generate to receive three contextual replies. Compare the variations for specificity, empathy, and fit with your brand voice before choosing one.",
  },
  {
    name: "Copy, edit, and publish the best reply",
    text: "Copy the strongest reply, make any factual edits, and publish it in Play Console, Google Business Profile, Trustpilot, App Store Connect, or your review inbox.",
  },
  {
    name: "Save sensitive reviews for manual review",
    text: "Use AI for speed, but manually approve legal, billing, fraud, safety, or public-incident replies before posting them publicly.",
  },
];

const FAQS = [
  {
    question: "Is the AI review reply generator really free?",
    answer:
      "Yes. The free AI review reply generator works without signup, credit card, or a trial gate. You can paste a review, choose a tone and language, and generate reply variations immediately. ReviewPilot's paid product is for teams that need automation, inboxes, and approval workflows.",
  },
  {
    question: "Will Google penalize AI-generated review replies?",
    answer:
      "Google does not ban AI-generated replies by default. The risk is low-quality, repetitive, misleading, or spam-like responses. Use specific replies, verify factual claims, and keep sensitive cases under human approval. For policy detail, read our guide: Will Google penalize AI replies?",
  },
  {
    question: "What is the Play Store character limit for replies?",
    answer:
      "Google Play developer replies have a 350-character limit, including spaces and punctuation. The AI Review Reply Generator is character-limit aware for Play Store replies, and you can refine any draft with the Play Store Character Counter before publishing.",
  },
  {
    question: "Can I generate replies in Hindi or Hinglish?",
    answer:
      "Yes. You can generate Hindi, Hinglish, and other Indian-language replies for users who review in local language or Roman script. For recovery replies, check tone carefully so the response sounds respectful rather than like a literal translation.",
  },
  {
    question: "How does the AI Review Reply Generator differ from ChatGPT?",
    answer:
      "ChatGPT is flexible, but it needs prompting every time. ReviewPilot's generator is purpose-built for review replies: platform selection, star rating, tone presets, language choices, three variations, and character-limit awareness are already built into the workflow.",
  },
  {
    question: "Do I need to sign up to use the tool?",
    answer:
      "No signup is required for the free tool. You can generate replies directly in the browser. Sign up only when you want ReviewPilot to connect to Play Store or Google Business Profile, monitor reviews, draft replies automatically, and manage approvals.",
  },
  {
    question: "Can businesses use this for Google Business Profile replies?",
    answer:
      "Yes. Choose Google Business Profile as the platform and generate replies for local business reviews, including restaurants, salons, clinics, agencies, and service businesses. GBP replies can be longer than Play Store replies, so use the extra room for useful offline resolution details.",
  },
  {
    question: "Does it work for Trustpilot or Apple App Store reviews?",
    answer:
      "Yes. Use the custom or closest platform setting for Trustpilot and Apple App Store reviews. The reply structure still works: acknowledge the issue, reference the specific detail, explain the action, and end with a helpful next step.",
  },
  {
    question: "How accurate is the AI compared to a human reply?",
    answer:
      "AI is strong at first drafts, tone matching, translation, and shortening. Humans are better at facts the model cannot know, sensitive judgment, and legal risk. The best workflow uses AI for speed and a human check for negative or high-stakes reviews.",
  },
  {
    question: "Can I use ReviewPilot to auto-reply to every review?",
    answer:
      "ReviewPilot can automate review replies with rules, but you should not auto-send every category. A safe setup auto-sends low-risk 4-star and 5-star replies, while 1-star, billing, safety, legal, and fraud-related reviews require human approval before publishing.",
  },
];

const EXAMPLES = [
  {
    industry: "Mobile app",
    review: "1-star: App crashes every time I try to export my invoice. Useless after the latest update.",
    reply:
      "Sorry about the export crash. We found a bug in the latest build and a fix is rolling out this week. Please email support@app.com with your device model so we can help faster.",
    count: 168,
    language: "English",
  },
  {
    industry: "Restaurant",
    review: "3-star: Food was good but service bahut slow tha. 40 minutes wait karna pada.",
    reply:
      "Sorry for the slow service. Food accha laga, ye sunkar khushi hui, but 40-minute wait acceptable nahi hai. We have added staff for peak hours this week.",
    count: 156,
    language: "Hinglish",
  },
  {
    industry: "Beauty salon",
    review: "5-star: Loved the haircut and the stylist understood exactly what I wanted.",
    reply:
      "Thank you for the lovely review. We're glad the haircut matched what you had in mind. We'll share this with the stylist and hope to see you again soon.",
    count: 148,
    language: "English",
  },
  {
    industry: "SaaS app",
    review: "3-star: Good dashboard, but please add export by team member. Current CSV is too broad.",
    reply:
      "Thanks for the precise request. Team-member export is already in our reporting backlog, and your CSV use case helps us prioritize it. We'll update release notes when it ships.",
    count: 166,
    language: "English",
  },
  {
    industry: "E-commerce app",
    review: "1-star: Order late, support ne bas copy paste reply diya. Refund kab milega?",
    reply:
      "Sorry, this should not have felt copy-pasted. Please share your order ID at support@shop.com and we'll check the delivery delay and refund status today.",
    count: 148,
    language: "Hinglish",
  },
  {
    industry: "Fitness app",
    review: "5-star: The streak reminders helped me work out 20 days in a row. Great app!",
    reply:
      "20 days in a row is a strong streak. Thanks for sharing it with us, and we're glad the reminders helped you stay consistent. More progress tools are coming soon.",
    count: 153,
    language: "English",
  },
];

export const metadata: Metadata = {
  title: "AI Review Reply Generator — Free, 350-char Play Store & GBP (2026)",
  description:
    "Free AI review reply generator for Play Store, Google, and Trustpilot reviews. 24 languages, 3 variations, character-limit aware, no signup. Try it now.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "AI Review Reply Generator — Free, 350-char Play Store & GBP",
    description:
      "Free AI review reply generator for Play Store, Google, Trustpilot, and App Store reviews. Generate 3 reply variations in 24 languages.",
    url: PAGE_URL,
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AI Review Reply Generator for Play Store and Google reviews",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Review Reply Generator — Free",
    description:
      "Generate review replies in 24 languages with 3 variations and Play Store character-limit awareness.",
    images: ["/og-image.svg"],
  },
};

export default function AiReviewReplyGeneratorPage() {
  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Tools", url: `${SITE_URL}/tools` },
      { name: "AI Review Reply Generator", url: PAGE_URL },
    ]),
    softwareApplicationSchema({
      name: "AI Review Reply Generator",
      description:
        "Free AI review reply generator for Play Store, Google Business Profile, Trustpilot, and App Store reviews with tone presets, 24 languages, and 3 variations.",
      url: PAGE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (web)",
    }),
    howToSchema({
      name: "How to use ReviewPilot's free AI Review Reply Generator",
      description:
        "Generate platform-aware AI replies for app and business reviews in five steps.",
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
            Free{" "}
            <span className="text-gradient-brand font-serif italic">
              AI Review Reply
            </span>{" "}
            Generator
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed sm:text-lg">
            AI review reply generator for Play Store, Google Business Profile,
            Trustpilot, and App Store reviews. Paste a review, choose tone and
            language, then generate three character-aware reply options with no
            signup.
          </p>
        </div>

        <AiReplyGenerator />

        <ToolCTA
          headline="Replying manually for every review? ReviewPilot auto-drafts in your tone."
          body="Connect Play Store and Google Business Profile in minutes. AI replies that fit character limits, sentiment alerts, and a unified inbox."
        />
      </div>

      <div className="relative mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <article className="prose-tool">
          <section>
            <h2 className="seo-h2">What is an AI Review Reply Generator?</h2>
            <p>
              An AI review reply generator is a tool that turns customer
              reviews into polished, platform-ready responses. It reads the
              rating, sentiment, language, and complaint topic, then produces a
              reply that acknowledges the reviewer and gives a clear next step.
              App developers use it for Play Store reviews, local businesses
              use it for Google reviews, and support teams use it anywhere
              public feedback affects trust.
            </p>
            <p>
              A dedicated generator beats raw ChatGPT prompts because the
              workflow is already shaped around reviews. You do not have to
              remember the Play Store reply limit, explain tone rules, ask for
              three variations, or rewrite the prompt for Hindi and Hinglish.
              The tool knows the job: respond fast, stay specific, avoid
              generic apologies, and fit the platform. That is the difference
              between a general chatbot and a review operations tool.
            </p>
            <p>
              For app teams, the payoff is reply coverage. A high reply rate
              builds confidence for future installers scanning your reviews.
              For local businesses, it keeps Google Business Profile reviews
              from looking ignored. For founders, it cuts a repetitive support
              task down to one approval decision.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">
              How to use ReviewPilot's free AI Review Reply Generator
            </h2>
            <p>
              The free ai review reply generator is designed for one-review
              workflows: paste, generate, copy, publish. These five steps keep
              the result useful without slowing you down.
            </p>
            {/* TODO: screenshot - paste-review-step */}
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
                  {index === 1 && <>{/* TODO: screenshot - tone-language-step */}</>}
                  {index === 2 && <>{/* TODO: screenshot - variations-step */}</>}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">AI review reply examples by industry</h2>
            <p>
              The best AI replies do not sound like a template. They name the
              issue, match the reviewer's emotional intensity, and avoid
              promising facts you cannot verify. These examples show the level
              of specificity you should expect before publishing.
            </p>
            <div className="not-prose mt-6 grid gap-4 sm:grid-cols-2">
              {EXAMPLES.map((example) => (
                <div
                  key={example.industry}
                  className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {example.industry} · {example.language} · {example.count} chars
                  </p>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    Original review
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {example.review}
                  </p>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    Generated AI reply
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
              AI review reply generator vs ChatGPT vs paid tools
            </h2>
            <p>
              A chatgpt review reply alternative should save prompting time,
              not just produce different wording. This comparison shows where
              ReviewPilot's free tool fits against general AI chatbots and
              enterprise review platforms.
            </p>
            <div className="not-prose mt-6 overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Tool</th>
                    <th className="px-4 py-3 text-left font-medium">Free</th>
                    <th className="px-4 py-3 text-left font-medium">Limit aware</th>
                    <th className="px-4 py-3 text-left font-medium">Best for</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="px-4 py-3 font-medium">ReviewPilot Free Tool</td>
                    <td className="px-4 py-3 text-muted-foreground">Yes, no signup</td>
                    <td className="px-4 py-3 text-muted-foreground">Yes, with tones, languages, 3 variations</td>
                    <td className="px-4 py-3 text-muted-foreground">Indie devs and SMBs replying fast</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Raw ChatGPT</td>
                    <td className="px-4 py-3 text-muted-foreground">Limited free tier</td>
                    <td className="px-4 py-3 text-muted-foreground">Only if prompted correctly</td>
                    <td className="px-4 py-3 text-muted-foreground">Complex one-off replies</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">AppFollow</td>
                    <td className="px-4 py-3 text-muted-foreground">Paid platform</td>
                    <td className="px-4 py-3 text-muted-foreground">Workflow-dependent</td>
                    <td className="px-4 py-3 text-muted-foreground">Larger app review teams</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Birdeye</td>
                    <td className="px-4 py-3 text-muted-foreground">Paid platform</td>
                    <td className="px-4 py-3 text-muted-foreground">Not Play Store-first</td>
                    <td className="px-4 py-3 text-muted-foreground">Multi-location local businesses</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              For indie developers, the free tool wins because it solves the
              exact daily job: generate an ai response to app reviews, keep it
              under the Play Store limit, produce three variations, and avoid a
              signup flow when you only need a reply now.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">When AI replies work and when to write your own</h2>
            <p>
              AI replies work best when the public response has a repeatable
              structure and low factual risk. Use AI for 5-star thank-yous,
              crash acknowledgements after a known bug, feature-request
              responses, multi-language replies, and fast first drafts for
              repetitive review queues.
            </p>
            <ul>
              <li>Great fit: praise, routine complaints, feature requests, and translation.</li>
              <li>Good fit with approval: 1-star app reviews, refund frustration, and account-access problems.</li>
              <li>Manual only: legal threats, fraud accusations, factually incorrect claims, public scandals, and safety incidents.</li>
            </ul>
            <p>
              The trust-building workflow is simple: let AI draft, then use
              human judgment where the wrong sentence could create policy,
              legal, or brand risk. Auto reply to Play Store reviews should be
              reserved for low-risk segments, not every review.
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
                    {f.answer.includes("Will Google penalize AI replies?") ? (
                      <>
                        Google does not ban AI-generated replies by default.
                        The risk is low-quality, repetitive, misleading, or
                        spam-like responses. Use specific replies, verify
                        factual claims, and keep sensitive cases under human
                        approval. Read{" "}
                        <Link
                          href="/blog/will-google-penalize-ai-generated-replies-play-store"
                          className="tool-link"
                        >
                          Will Google penalize AI replies?
                        </Link>
                      </>
                    ) : (
                      f.answer
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">Related free tools</h2>
            <p>
              After generating a reply, tighten it with the{" "}
              <Link href="/tools/play-store-character-counter" className="tool-link">
                Play Store Character Counter
              </Link>{" "}
              or estimate rating recovery with the{" "}
              <Link href="/tools/app-rating-calculator" className="tool-link">
                App Rating Calculator
              </Link>
              . For the complete review operating model, use the{" "}
              <Link href="/play-store-reviews-guide" className="tool-link">
                Play Store Reviews Guide
              </Link>
              .
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">Try ReviewPilot for full automation</h2>
            <p>
              The free generator is built for one review at a time. ReviewPilot
              handles the full workflow: new-review monitoring, sentiment
              alerts, 350-character-aware Play Store drafts, multi-language
              replies, approval rules, and auto-replies for low-risk positive
              reviews. If review volume is becoming a weekly support burden,
              compare the free tool with the full product on{" "}
              <Link href="/pricing" className="tool-link">pricing</Link>.
            </p>
            <p>
              Related reading:{" "}
              <Link href="/blog/chatgpt-prompts-play-store-replies" className="tool-link">
                ChatGPT prompts for Play Store replies
              </Link>{" "}
              and{" "}
              <Link href="/blog/multi-language-play-store-reply-strategy-localized-ai" className="tool-link">
                multi-language Play Store reply strategy
              </Link>
              .
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
