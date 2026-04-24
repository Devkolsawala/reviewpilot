import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

const FAQ_ITEMS = [
  {
    q: "How much does ReviewPilot cost?",
    a: "Starter is ₹1,500/mo (1 location or app, 100 AI replies/week). Growth is ₹3,000/mo, Agency is ₹8,000/mo, and Enterprise is custom. All paid plans include a 7-day free trial — no credit card required to start.",
  },
  {
    q: "Does ReviewPilot actually work with Google Play Store reviews?",
    a: "Yes. ReviewPilot connects to Google Play Console via a service account you upload in under 5 minutes. We respect the 350-character reply limit automatically, and drafts arrive in the reviewer's language.",
  },
  {
    q: "Is Google Business Profile supported?",
    a: "GBP automation is launching soon and is included on every paid plan. You can connect your GBP today; full auto-reply ships when GBP leaves beta.",
  },
  {
    q: "How does the AI know our brand voice?",
    a: "ReviewPilot learns from 3–5 reply samples you paste in during onboarding, plus an App Context Profile (known bugs, promos, hours, common FAQs). You can also edit every draft before publishing, or set auto-publish rules only for high-confidence 4–5★ replies.",
  },
  {
    q: "Can it reply in Hindi and other Indian languages?",
    a: "Yes — ReviewPilot detects the review's language and replies in the same one. English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, and Gujarati are all supported today.",
  },
  {
    q: "Where is our review data stored? Is it secure?",
    a: "Reviews and drafts are stored in Supabase (Mumbai region for India accounts) with row-level security. We never train AI models on your content; drafts are generated per-review and discarded after you publish.",
  },
  {
    q: "How does cancellation work?",
    a: "Cancel from Settings → Billing at any time. Your plan stays active until the end of the current billing period, then downgrades to a read-only archive view. No retention emails, no friction.",
  },
  {
    q: "Can I manage multiple businesses or apps from one account?",
    a: "Yes. The Growth plan handles up to 3 locations/apps, Agency up to 10, and Enterprise is unlimited.",
  },
];

export function FAQ() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Answered ahead of time
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`item-${i}`}
              className="border-b border-border/60 last:border-b-0"
            >
              <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline hover:text-foreground">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Still have a question?{" "}
          <Link href="/docs" className="text-accent hover:underline">
            Browse the docs
          </Link>{" "}
          or{" "}
          <Link href="/demo" className="text-accent hover:underline">
            book a call
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
