import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type CompareRow = {
  feature: string;
  reviewpilot: string | boolean;
  competitor: string | boolean;
};

export type CompareProps = {
  competitor: string;
  intro: string;
  pricingNote: string;
  rows: CompareRow[];
  whenCompetitor: string[];
  whenReviewPilot: string[];
  faqs: { q: string; a: string }[];
};

function Cell({ value }: { value: string | boolean }) {
  if (value === true)
    return <Check className="h-4 w-4 text-teal-500 mx-auto" aria-label="Yes" />;
  if (value === false)
    return <X className="h-4 w-4 text-muted-foreground/50 mx-auto" aria-label="No" />;
  return <span className="text-sm">{value}</span>;
}

export function CompareLayout({
  competitor,
  intro,
  pricingNote,
  rows,
  whenCompetitor,
  whenReviewPilot,
  faqs,
}: CompareProps) {
  return (
    <>
      <section className="py-20 sm:py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-6">
            Comparison
          </div>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">
            ReviewPilot vs {competitor}: Which Review Management Tool Is Right
            for You?
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            {intro}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">{pricingNote}</p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            Side-by-side comparison
          </h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold">
                    Feature
                  </th>
                  <th className="px-4 py-3 font-heading font-semibold">
                    ReviewPilot
                  </th>
                  <th className="px-4 py-3 font-heading font-semibold">
                    {competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.feature} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{r.feature}</td>
                    <td className="px-4 py-3 text-center">
                      <Cell value={r.reviewpilot} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Cell value={r.competitor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border bg-background p-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              When to choose {competitor}
            </h2>
            <ul className="space-y-3">
              {whenCompetitor.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border-2 border-teal-500 bg-background p-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              When to choose ReviewPilot
            </h2>
            <ul className="space-y-3">
              {whenReviewPilot.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <Check className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-center mb-8">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-white">
            Try ReviewPilot free for 7 days
          </h2>
          <p className="mt-3 text-navy-300 text-sm">
            No credit card. Full access. See the difference yourself.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
          <div className="mt-10 text-sm text-navy-400">
            More comparisons:{" "}
            <Link href="/compare/reviewpilot-vs-birdeye" className="underline hover:text-teal-400">Birdeye</Link>
            {" · "}
            <Link href="/compare/reviewpilot-vs-famepilot" className="underline hover:text-teal-400">Famepilot</Link>
            {" · "}
            <Link href="/compare/reviewpilot-vs-podium" className="underline hover:text-teal-400">Podium</Link>
            {" · "}
            <Link href="/compare/reviewpilot-vs-simplify360" className="underline hover:text-teal-400">Simplify360</Link>
          </div>
        </div>
      </section>
    </>
  );
}
