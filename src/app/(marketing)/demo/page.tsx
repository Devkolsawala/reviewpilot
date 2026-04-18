import type { Metadata } from "next";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";
import { CheckCircle2 } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";

export const metadata: Metadata = {
  title: "Book a Live Demo — AI Review Management India | ReviewPilot",
  description:
    "See ReviewPilot live: AI replies for Google & Play Store reviews, SMS collection, analytics. Book your free 20-minute demo with our India team today.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Book a Live Demo | ReviewPilot",
    description:
      "See AI review management in action. Free 20-minute walkthrough with our India team.",
    url: "https://www.reviewpilot.co.in/demo",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Book a ReviewPilot demo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a ReviewPilot Demo",
    description: "See AI review management in action. Free walkthrough.",
    images: ["/og-image.svg"],
  },
};

const DEMO_BENEFITS = [
  "Personalized walkthrough of the dashboard",
  "See AI reply generation in real-time",
  "Learn how to set up SMS review collection",
  "Get pricing recommendations for your needs",
  "Ask questions to our product team",
];

export default function DemoPage() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <AuroraBackground intensity="subtle" />
      <GridPattern variant="grid" fade className="opacity-[0.3]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="uppercase tracking-[0.15em]">Live demo</span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
              See ReviewPilot{" "}
              <span className="text-gradient-brand font-serif italic">
                in action
              </span>
              .
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Get a personalized demo tailored to your business. Our team will show
              you exactly how ReviewPilot can transform your review-management
              workflow.
            </p>
            <ul className="mt-8 space-y-4">
              {DEMO_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-sm text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
            <DemoRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
