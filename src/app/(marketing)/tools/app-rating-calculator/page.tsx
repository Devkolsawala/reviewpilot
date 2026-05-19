/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/marketing/JsonLd";
import { RatingCalculator } from "@/components/tools/RatingCalculator";
import { ToolCTA } from "@/components/tools/ToolCTA";
import { GridPattern } from "@/components/ui/grid-pattern";
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  softwareApplicationSchema,
  SITE_URL,
} from "@/lib/seo/schema";

const PAGE_URL = `${SITE_URL}/tools/app-rating-calculator`;
const LAST_UPDATED = "May 19, 2026";

const HOW_TO_STEPS = [
  {
    name: "Enter your current app rating",
    text: "Add the rating currently shown in Play Console, App Store Connect, or your public store listing. Use two decimals when available.",
  },
  {
    name: "Add your current review count",
    text: "Enter the total number of ratings or reviews behind the displayed score. The larger this number is, the harder the average is to move.",
  },
  {
    name: "Choose your target rating",
    text: "Set the rating threshold you want to reach, such as 4.0 for recovery or 4.5 for a stronger conversion position.",
  },
  {
    name: "Review the 5-star requirement and timeline",
    text: "Use the calculated number of needed 5-star reviews, weekly pace estimate, and 1-star damage warning to plan a realistic recovery campaign.",
  },
];

const FAQS = [
  {
    question: "How is app rating calculated?",
    answer:
      "An app rating is a weighted average of star ratings from users. The simple calculator uses lifetime average math: current rating times review count, plus new ratings, divided by the new total. Store platforms may also weight recent ratings, markets, and app versions differently.",
  },
  {
    question: "Can I improve my Play Store rating without removing old reviews?",
    answer:
      "Yes. You can improve the average by earning new positive reviews and by recovering unhappy users who update old ratings after fixes. Removing old reviews is only possible when they violate policy, so the practical path is better product quality, timely replies, and review recovery.",
  },
  {
    question: "Does the Play Store rating reset after an update?",
    answer:
      "No, a normal Play Store update does not reset your public rating. Google may emphasize recent ratings in some surfaces, but old ratings still matter. Apple lets developers reset the displayed rating for a new app version, while written reviews remain visible.",
  },
  {
    question: "How does Apple App Store rating differ from Play Store?",
    answer:
      "Apple allows developers to reset the displayed average rating when releasing a new version, although existing written reviews stay on the product page. Google Play generally keeps ratings continuous and uses country, device, and recency signals to show users relevant rating views.",
  },
  {
    question: "What's a good app rating in 2026?",
    answer:
      "For most consumer apps, 4.3 stars is the minimum healthy target and 4.5-plus is strong. Below 4.0, install conversion usually suffers because users treat the rating as a quality warning. Competitive categories need both a high rating and fresh review velocity.",
  },
  {
    question: "Why does my rating drop so easily?",
    answer:
      "Ratings drop quickly when your review base is small, recent negative reviews arrive in a cluster, or a bad update affects many active users at once. Early apps are fragile because each new 1-star review represents a larger share of the total average.",
  },
  {
    question: "Can ReviewPilot automate getting more 5-star reviews?",
    answer:
      "ReviewPilot can help teams build compliant review recovery and reply workflows, but it does not buy, gate, or incentivize 5-star reviews. The product helps you reply faster, identify complaint patterns, fix issues, and ask users at appropriate moments.",
  },
  {
    question: "Is this calculator accurate for both Play Store and App Store?",
    answer:
      "The calculator is accurate for simple weighted-average planning on both stores. It cannot perfectly model private platform weighting, country-specific displays, review filtering, or Apple's optional version-rating reset. Use it for planning, then validate progress inside each store console.",
  },
];

const BENCHMARKS = [
  {
    title: "New indie app",
    stats: "3.6 stars, 120 ratings, target 4.2",
    detail:
      "Needs about 90 new 5-star ratings. At 12 ratings per week, that is roughly eight weeks if product quality is stable.",
  },
  {
    title: "Post-update recovery",
    stats: "3.9 stars, 1,000 ratings, target 4.3",
    detail:
      "Needs about 572 new 5-star ratings. Recovery replies that turn existing 1-stars into 4-stars can cut the requirement sharply.",
  },
  {
    title: "Mature category leader",
    stats: "4.35 stars, 50,000 ratings, target 4.5",
    detail:
      "Needs about 15,000 new 5-star ratings. The practical focus should be version-specific sentiment, retention, and preventing new 1-stars.",
  },
];

export const metadata: Metadata = {
  title: "App Rating Calculator — How Many 5-Star Reviews You Need",
  description:
    "Free app rating calculator. Enter your current rating and target — see exactly how many 5-star reviews you need. Works for Play Store and App Store.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "App Rating Calculator — How Many 5-Star Reviews You Need",
    description:
      "Free app rating calculator for Play Store and App Store recovery planning. Calculate the 5-star reviews needed to hit your target.",
    url: PAGE_URL,
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "App Rating Calculator for Play Store and App Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "App Rating Calculator — Free",
    description:
      "Calculate how many 5-star reviews you need to reach your target app rating.",
    images: ["/og-image.svg"],
  },
};

export default function AppRatingCalculatorPage() {
  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Tools", url: `${SITE_URL}/tools` },
      { name: "App Rating Calculator", url: PAGE_URL },
    ]),
    softwareApplicationSchema({
      name: "App Rating Calculator",
      description:
        "Free app rating calculator that shows how many 5-star reviews are needed to reach a target Play Store or App Store rating.",
      url: PAGE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (web)",
    }),
    howToSchema({
      name: "How to use the App Rating Calculator",
      description:
        "Calculate the number of 5-star reviews needed to lift an app rating to a target score.",
      url: PAGE_URL,
      steps: HOW_TO_STEPS,
    }),
    faqSchema(FAQS),
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <GridPattern variant="grid" fade className="opacity-[0.25]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="uppercase tracking-[0.15em]">Free tool</span>
          </div>
          <h1 className="mt-5 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="text-gradient-brand font-serif italic">
              App Rating Calculator
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed sm:text-lg">
            App rating calculator for Play Store and App Store teams: enter
            your current score, review count, and target rating to see exactly
            how many new 5-star reviews you need. It also estimates timeline
            and shows how fragile the climb is when new 1-star reviews arrive.
          </p>
        </div>

        <RatingCalculator />

        <ToolCTA
          headline="Need more than a rating estimate? ReviewPilot helps recover reviews."
          body="Connect Play Store, triage negative reviews, draft replies, and track recovery workflows before rating damage compounds."
        />
      </div>

      <div className="relative mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <article className="prose-tool">
          <section>
            <h2 className="seo-h2">What is an App Rating Calculator?</h2>
            <p>
              An app rating calculator tells you how many new 5-star reviews
              you need to move from your current average rating to a target
              score. Instead of guessing whether a 3.8 can become a 4.5 this
              quarter, you can see the weighted-average math immediately and
              decide whether the plan is realistic.
            </p>
            <p>
              The tool is useful for founders, product managers, ASO teams,
              support leads, and indie developers who need a clear recovery
              number. It works for Play Store rating calculator planning,
              App Store rating calculator planning, and any other star-rating
              system that uses a 1-to-5 average. The exact public store score
              can still vary because Google and Apple apply private filtering
              and weighting, but the weighted average gives you the cleanest
              baseline for planning.
            </p>
            <ul>
              <li>Use it after a bad release damages your rating.</li>
              <li>Use it before an in-app review prompt campaign.</li>
              <li>Use it to decide whether review recovery is faster than new acquisition.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">How to use the App Rating Calculator</h2>
            <p>
              The calculator has four inputs and updates live, so you can test
              aggressive and conservative rating-recovery scenarios without a
              spreadsheet.
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
            <h2 className="seo-h2">What is the math behind app rating calculations?</h2>
            <p>
              App ratings are averages, so every new rating joins the ratings
              that already exist. If your current rating is 3.8 across 1,000
              reviews, the current star total is 3,800. Each new 5-star review
              adds five points to the numerator and one review to the
              denominator. The calculator finds the smallest whole number of
              5-star reviews where the new average meets your target.
            </p>
            <p>
              Early reviews matter more because the denominator is small. Ten
              new 5-star reviews can transform an app with 20 ratings, but the
              same ten ratings barely move an app with 20,000. Mature apps
              usually need recovery of existing unhappy users, not just new
              praise. When a 1-star reviewer updates to 4 stars, you gain
              three points without increasing the denominator, which is why
              review recovery can beat raw review collection.
            </p>
            <p>
              Apple and Google can display ratings differently. Apple gives
              developers an option to reset the displayed rating when releasing
              a new version, although written reviews stay visible. Google Play
              does not offer a normal rating reset after an update and may show
              users ratings weighted by country, device, or recency. Treat this
              calculator as the planning layer, then verify actual movement in
              Play Console or App Store Connect.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">What are realistic time-to-target benchmarks?</h2>
            <p>
              Recovery speed depends on your current review base and weekly
              rating velocity. These benchmarks show why the same target can be
              easy for a new app and unrealistic for a mature one.
            </p>
            <div className="not-prose mt-6 grid gap-4 sm:grid-cols-3">
              {BENCHMARKS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <h3 className="font-sans text-base font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {item.stats}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">What can't this rating projection tool predict?</h2>
            <p>
              The calculator cannot predict private ranking signals, review
              filtering, country-specific display logic, uninstall spikes, or
              review velocity decay. It also cannot know whether your next
              update will fix the complaint cluster that caused the rating
              drop. A 5-star requirement is not a growth strategy by itself;
              it is a diagnostic number.
            </p>
            <ul>
              <li>It cannot tell whether Google will filter suspicious reviews.</li>
              <li>It cannot model every recency weight inside Play Store.</li>
              <li>It cannot replace product fixes for crashes, billing issues, or broken onboarding.</li>
              <li>It cannot guarantee install conversion once the rating improves.</li>
            </ul>
            <p>
              Use the number to plan. Use review analysis to understand why
              users rated you poorly. Then use replies, fixes, and compliant
              review prompts to make the rating movement durable.
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
            <h2 className="seo-h2">Related free tools for app review recovery</h2>
            <p>
              Pair the <Link href="/tools/ai-review-reply-generator" className="tool-link">AI Review Reply Generator</Link>{" "}
              with the <Link href="/tools/play-store-character-counter" className="tool-link">Play Store Character Counter</Link>{" "}
              when you need to reply to unhappy users before asking for updated
              ratings. For the full operating model, use the{" "}
              <Link href="/play-store-reviews-guide" className="tool-link">
                Play Store Reviews Guide
              </Link>
              .
            </p>
          </section>

          <section className="mt-10">
            <h2 className="seo-h2">How ReviewPilot supports review recovery</h2>
            <p>
              ReviewPilot is built for the workflow after the math: detect the
              negative reviews driving the rating down, draft specific replies,
              track complaint themes, and help teams recover users after fixes
              ship. If the calculator says you need hundreds of 5-star reviews,
              the faster path is often a disciplined recovery flow plus better
              prompts after positive moments. ReviewPilot turns that into a
              weekly process instead of a panic spreadsheet. See{" "}
              <Link href="/pricing" className="tool-link">pricing</Link> when
              you are ready to automate the workflow.
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
