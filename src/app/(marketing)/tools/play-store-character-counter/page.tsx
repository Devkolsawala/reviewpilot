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
  softwareApplicationSchema,
  SITE_URL,
} from "@/lib/seo/schema";

const PAGE_URL = `${SITE_URL}/tools/play-store-character-counter`;

export const metadata: Metadata = {
  title: "Play Store Character Counter — 350 Limit + AI Assist",
  description:
    "Free Play Store review reply character counter with AI polish, shorten, and Hinglish translate. Live count against the 350-char limit. No signup.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Play Store Reply Character Counter (350 Limit) — Free AI Tool",
    description:
      "Count characters live against Google Play's 350-character reply limit. Polish, shorten, and translate replies with AI. Free, no signup.",
    url: PAGE_URL,
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Play Store Reply Character Counter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Store Reply Character Counter — Free",
    description:
      "Live 350-char counter + AI polish, shorten, and Hinglish translate for Play Store replies.",
    images: ["/og-image.svg"],
  },
};

// FAQ source of truth — rendered both as JSX and as FAQPage JSON-LD.
const FAQS = [
  {
    question: "What is the character limit for Play Store review replies?",
    answer:
      "Google Play caps developer responses at 350 characters, including spaces, punctuation, and emojis. The Play Console will block a reply that exceeds the limit, and any reply you post is publicly visible under the review on every user's device.",
  },
  {
    question: "Can I edit a Play Store review reply after posting?",
    answer:
      "Yes. You can edit or delete a reply at any time from the Play Console (Ratings & reviews → User feedback). Editing replaces the visible response immediately and does not notify the user. Each edit is also surfaced through the Reply API if you've connected one.",
  },
  {
    question: "Does Google Play count emojis as characters?",
    answer:
      "Yes — and most emojis count as more than one character because they're stored as multi-byte Unicode sequences. A single 😊 typically counts as 1–2 characters, but flags and skin-tone variants can use 4–8. Use the live counter above to see the exact length for your reply.",
  },
  {
    question: "Why is my Play Store reply showing as \"too long\"?",
    answer:
      "Almost always the 350-character cap. The Play Console counts characters before HTML escaping, so curly quotes, em dashes, and emojis can push a reply over without the visible word count changing. Paste it into the counter above to see exactly where you stand.",
  },
  {
    question: "Can AI tools help write Play Store replies that fit 350 characters?",
    answer:
      "Yes — the polish and shorten buttons above use a model trained to acknowledge the reviewer first, then respond concretely while staying under 350 characters. For higher volumes (50+ reviews a week), ReviewPilot automates the same flow inside your Play Console workflow.",
  },
];

export default function PlayStoreCharacterCounterPage() {
  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Tools", url: `${SITE_URL}/tools` },
      { name: "Play Store Character Counter", url: PAGE_URL },
    ]),
    softwareApplicationSchema({
      name: "Play Store Reply Character Counter",
      description:
        "Free Play Store review reply character counter with AI polish, shorten, and Hinglish translate. Live count against the 350-character limit.",
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
            Play Store Reply{" "}
            <span className="text-gradient-brand font-serif italic">
              Character Counter
            </span>{" "}
            (350 Limit)
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed sm:text-lg">
            Count characters live against Google Play's 350-character reply
            limit. Polish, shorten, or translate to Hinglish with AI — no signup,
            no quotas you'll trip over.
          </p>
        </div>

        {/* Tool */}
        <CharCounter />

        {/* CTA */}
        <ToolCTA />

        {/* Related tool */}
        <div className="mt-6 rounded-xl border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground backdrop-blur-sm sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
            Related tool
          </p>
          <p className="mt-2">
            Generate a reply from scratch with the{" "}
            <Link
              href="/tools/ai-review-reply-generator"
              className="text-foreground underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              AI Review Reply Generator
            </Link>{" "}
            — 3 variations in 24 languages, then drop the best one into the
            counter above to polish it for 350 characters.
          </p>
        </div>
      </div>

      {/* SEO content block */}
      <div className="relative mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <article className="prose-tool">
          <section>
            <h2 className="seo-h2">
              Why Google Play limits replies to 350 characters
            </h2>
            <p>
              The 350-character cap on Play Store developer replies is older
              than most apps on the store — it was set when reviews were a
              column inside the original Android Market and the assumption was
              that responses would render on a 320-pixel screen without
              scrolling. Google has redesigned the reviews surface several
              times since, but the cap has never moved, because the constraint
              quietly serves three goals.
            </p>
            <p>
              First, it forces developers to be concrete. A 350-character reply
              has room for one acknowledgement, one specific response, and a
              path forward — and nothing else. That structure is exactly what
              future readers scanning your listing want to see. Second, the
              cap discourages copy-pasted boilerplate. A 1,500-character
              templated apology reads like a press release; a 280-character
              reply reads like a person. Third, the limit makes the reviews
              feed scannable on a phone, where every Play Store visitor
              actually lives.
            </p>
            <p>
              The practical effect: every reply is a writing exercise. The
              counter above turns that exercise into a visible feedback loop —
              you see exactly how close you are to the cap as you write, and
              the AI tools cut, polish, or translate the moment you go over.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">
              How to write a great Play Store reply under 350 characters
            </h2>
            <p>
              A reply that fits comfortably under 350 follows the same shape
              every time: <strong>acknowledge → specific → action</strong>.
              Acknowledge what the reviewer said (one short sentence), respond
              to the specific point they raised (one sentence), and end with a
              concrete next step — a support email, a feature ETA, or an
              invitation to update the review once a fix lands.
            </p>
            <p>
              The mistake almost every developer makes early on: leading with
              "Thank you for your feedback!" That phrase eats 28 characters,
              adds zero information, and signals "templated reply" to every
              future reader. Cut it. Start with the substance.
            </p>
            <p>
              Three worked examples below show what changes when you respect
              the structure. Each pair uses the same review:{" "}
              <em>
                "Crashes whenever I try to export a PDF. Otherwise the app is
                great."
              </em>
            </p>

            <div className="not-prose mt-6 grid gap-4 sm:grid-cols-3">
              <ExampleCard
                tag="Too long · 412 chars"
                tagClass="text-red-600 dark:text-red-400"
                badReply={
                  "Hi there! Thank you so much for taking the time to leave us your feedback — we really appreciate it. We're so sorry to hear that you've been experiencing crashes when trying to export a PDF. This is definitely not the experience we want our users to have. Please could you reach out to our support team at support@example.com so we can look into this and make sure we get it resolved for you as soon as possible."
                }
              />
              <ExampleCard
                tag="Good · 312 chars"
                tagClass="text-emerald-600 dark:text-emerald-400"
                badReply={
                  "Thanks for flagging the PDF export crash — that's a regression we shipped in 4.1.2 and the fix is already in review for 4.1.3 (out next week). If you can email support@example.com with your device model, we'll send you a build to test before it goes live. Sorry for the rough edge."
                }
              />
              <ExampleCard
                tag="Excellent · 247 chars"
                tagClass="text-emerald-600 dark:text-emerald-400"
                badReply={
                  "PDF export crash is a known issue in 4.1.2 — fix lands in 4.1.3 next week. Email support@example.com with your device and we'll send the test build today. Really sorry for the friction, and thanks for sticking with us otherwise."
                }
              />
            </div>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">
              Does reply length affect Play Store ranking?
            </h2>
            <p>
              Indirectly — and the indirection is the part that confuses most
              developers. Google has never published a ranking weight for
              reply length, and there's no signal in the Play Console that
              suggests one. What Google <em>does</em> measure, and what shows
              up in the Play Console "Reviews benchmarks" tab, is{" "}
              <strong>reply rate</strong> and{" "}
              <strong>average response time</strong>. Apps that reply to a
              higher share of reviews — and faster — see better long-tail
              install conversion because their store listing reads as actively
              maintained.
            </p>
            <p>
              Length matters because it drives reply rate. A developer trying
              to write 400-character replies will reply to fewer reviews than
              one who's comfortable shipping a tight 240-character response.
              Over a quarter, the developer with the disciplined shorter
              format will end up with a higher overall reply rate, and that
              rate is what Play Console surfaces to the ranking signals that
              do affect visibility. The 350-char counter isn't just a limit —
              it's the constraint that keeps your reply rate above 90%.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">
              When to use AI to polish a Play Store reply
            </h2>
            <p>
              The honest answer: when you have the right reply in your head
              but the wrong number of characters on the screen. The Polish
              button above isn't a content generator — it's an editor. It
              takes the substance you've already written and tightens it
              against the 350-character cap in the tone you selected.
            </p>
            <p>
              The Shorten button is the same idea pushed harder. It only
              activates when your draft is over 350, and it preserves the
              acknowledge → specific → action structure while cutting
              redundancy. Translate covers the case Indian developers know
              well: a Hindi-only reviewer leaving feedback in Devanagari, or
              a Hinglish review that deserves a Hinglish response so it
              doesn't read like a customer-service script.
            </p>
            <p>
              Where the free tool stops and ReviewPilot starts: this page is
              one reply at a time. If you're shipping a popular app on the
              Play Store, you're getting 50–500 reviews a week — that's where
              automated drafts inside the Play Console workflow, sentiment
              alerts on new 1-stars, and a unified inbox start paying for
              themselves. The{" "}
              <Link
                href="/features/google-play-reviews"
                className="text-foreground underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
              >
                Play Store automation
              </Link>{" "}
              feature does exactly that.
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
        .prose-tool strong { color: hsl(var(--foreground)); font-weight: 600; }
        .prose-tool em { color: hsl(var(--foreground)); font-style: italic; }
        .seo-h2 { font-family: var(--font-geist-sans, ui-sans-serif, system-ui); font-size: 22px; font-weight: 600; letter-spacing: -0.01em; color: hsl(var(--foreground)); }
        @media (min-width: 640px) { .seo-h2 { font-size: 26px; } }
      `}</style>
    </section>
  );
}

function ExampleCard({
  tag,
  tagClass,
  badReply,
}: {
  tag: string;
  tagClass: string;
  badReply: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
      <div className={`font-mono text-[11px] uppercase tracking-wider ${tagClass}`}>
        {tag}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-foreground/85">
        {badReply}
      </p>
    </div>
  );
}
