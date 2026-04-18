import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,rgba(99,102,241,0.12)_0%,rgba(139,92,246,0.08)_50%,rgba(217,70,239,0.12)_100%)] p-12 sm:p-16 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid mask-radial-fade opacity-30"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[80%] -translate-x-1/2 bg-[linear-gradient(135deg,#6366f1,#d946ef)] opacity-20 blur-3xl"
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Stop losing stars you could have kept.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Connect your first store in under 5 minutes. Your next review gets
              drafted before you finish reading this page.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/demo">Book a 15-min demo</Link>
              </Button>
            </div>
            <p className="mt-5 font-mono text-[11px] text-muted-foreground">
              7-day free trial · No credit card · From ₹1,500/mo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
