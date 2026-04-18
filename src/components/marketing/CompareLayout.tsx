import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";

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
    return <Check className="h-4 w-4 text-accent mx-auto" aria-label="Yes" />;
  if (value === false)
    return <X className="h-4 w-4 text-muted-foreground/50 mx-auto" aria-label="No" />;
  return <span className="text-sm text-foreground/85">{value}</span>;
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
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-28">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="uppercase tracking-[0.15em]">Comparison</span>
          </div>
          <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient-brand font-serif italic">
              ReviewPilot
            </span>{" "}
            vs {competitor}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {intro}
          </p>
          <p className="mx-auto mt-4 max-w-xl font-mono text-[11px] text-muted-foreground">
            {pricingNote}
          </p>
        </div>
      </section>

      {/* Table */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Feature matrix
            </p>
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
              Side-by-side comparison
            </h2>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center font-sans text-xs font-semibold">
                    <span className="text-gradient-brand">ReviewPilot</span>
                  </th>
                  <th className="px-4 py-4 text-center font-sans text-xs font-semibold text-muted-foreground">
                    {competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.feature}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-3 text-foreground/85 font-medium">
                      {r.feature}
                    </td>
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

      {/* When to choose */}
      <section className="relative py-20 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <h2 className="font-sans text-lg font-semibold tracking-tight">
              When to choose {competitor}
            </h2>
            <ul className="mt-4 space-y-3">
              {whenCompetitor.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-2xl bg-card p-8 shadow-[0_0_60px_-16px_hsl(var(--ring)/0.6)] before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:p-px before:bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)]">
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-2xl bg-card"
            />
            <h2 className="font-sans text-lg font-semibold tracking-tight">
              When to choose{" "}
              <span className="text-gradient-brand">ReviewPilot</span>
            </h2>
            <ul className="mt-4 space-y-3">
              {whenReviewPilot.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Answered ahead
            </p>
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-10 w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-border/60 last:border-b-0"
              >
                <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline hover:text-foreground">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
                Try ReviewPilot free for 7 days.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                No credit card. Full access. See the difference yourself.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button variant="gradient" size="xl" asChild>
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="subtle" size="xl" asChild>
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
              <div className="mt-10 text-xs text-muted-foreground">
                More comparisons:{" "}
                <Link href="/compare/reviewpilot-vs-birdeye" className="hover:text-accent hover:underline">Birdeye</Link>
                {" · "}
                <Link href="/compare/reviewpilot-vs-famepilot" className="hover:text-accent hover:underline">Famepilot</Link>
                {" · "}
                <Link href="/compare/reviewpilot-vs-podium" className="hover:text-accent hover:underline">Podium</Link>
                {" · "}
                <Link href="/compare/reviewpilot-vs-simplify360" className="hover:text-accent hover:underline">Simplify360</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
