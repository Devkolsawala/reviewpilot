import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";

type FAQ = { q: string; a: string };

export interface IntegrationPageProps {
  eyebrow: string;
  h1: React.ReactNode;
  subhead: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  sections: { title: string; body: string; bullets: string[] }[];
  faqs: FAQ[];
  ctaHref?: string;
  ctaLabel?: string;
  cross?: { href: string; label: string }[];
}

export function IntegrationPage({
  eyebrow,
  h1,
  subhead,
  icon: Icon,
  iconColor,
  iconBg,
  sections,
  faqs,
  ctaHref = "/signup",
  ctaLabel = "Start 7-day free trial",
  cross = [],
}: IntegrationPageProps) {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-28">
        <AuroraBackground intensity="subtle" />
        <GridPattern variant="grid" fade className="opacity-[0.3]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              backgroundColor: iconBg ?? "rgba(99,102,241,0.12)",
              color: iconColor ?? "currentColor",
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {h1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {subhead}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button variant="gradient" size="xl" asChild>
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="subtle" size="xl" asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 space-y-16">
        {sections.map((s, i) => (
          <section key={i} className="scroll-mt-32">
            <h2 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
              {s.title}
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {s.body}
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {s.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5 text-xs text-foreground/85 backdrop-blur-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Cross-links */}
      {cross.length > 0 && (
        <section className="py-16 bg-muted/20 border-y border-border/60">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Related
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {cross.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
                >
                  {c.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Questions
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
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

      {/* Final CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-12 sm:p-16 text-center backdrop-blur-sm">
            <Sparkles className="mx-auto h-6 w-6 text-accent" />
            <h2 className="mx-auto mt-4 max-w-2xl font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Try ReviewPilot free for 7 days.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              No credit card required. Plans from $16/month, billed in INR.
            </p>
            <div className="mt-8 flex justify-center">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function buildIntegrationSchemas(opts: {
  pageUrl: string;
  siteUrl: string;
  siteOg: string;
  name: string;
  description: string;
  features: string[];
  breadcrumbName: string;
  faqs: FAQ[];
}) {
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    description: opts.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: opts.pageUrl,
    image: opts.siteOg,
    featureList: opts.features,
    offers: {
      "@type": "Offer",
      price: "16",
      priceCurrency: "USD",
      url: `${opts.siteUrl}/pricing`,
    },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: opts.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: opts.siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Integrations",
        item: `${opts.siteUrl}/integrations`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: opts.breadcrumbName,
        item: opts.pageUrl,
      },
    ],
  };

  return [software, faq, breadcrumb];
}
