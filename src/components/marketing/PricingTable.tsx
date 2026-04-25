"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { m, MotionProvider } from "@/components/motion/primitives";

type Billing = "monthly" | "annual";

const PLANS = [
  {
    name: "Starter",
    priceUSD: 16,
    annualUSD: 13,
    description: "For a single location or app",
    features: [
      "1 location OR 1 app",
      "100 AI replies/week",
      "50 SMS/week (Coming soon)",
      "3 team seats",
      "Basic analytics",
    ],
    cta: "Start free trial",
    highlight: false,
    planKey: "starter",
  },
  {
    name: "Growth",
    priceUSD: 32,
    annualUSD: 26,
    description: "For growing businesses and dev studios",
    features: [
      "3 locations OR 3 apps",
      "500 AI replies/week",
      "200 SMS/week (Coming soon)",
      "5 team seats",
      "Full analytics + sentiment",
    ],
    cta: "Start free trial",
    highlight: true,
    planKey: "growth",
  },
  {
    name: "Agency",
    priceUSD: 85,
    annualUSD: 68,
    description: "For agencies managing multiple clients",
    features: [
      "10 locations or apps",
      "Unlimited AI replies",
      "1,000 SMS/week (Coming soon)",
      "10 team seats",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: false,
    planKey: "agency",
  },
  {
    name: "Enterprise",
    description: "For 10+ locations or agency networks",
    features: [
      "Unlimited locations & apps",
      "SLA and dedicated CSM",
      "Custom integrations",
      "SSO / audit logs",
    ],
    cta: "Talk to sales",
    ctaHref: "/demo",
    custom: true,
    planKey: "enterprise",
  },
] as const;

export function PricingTable() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <MotionProvider>
      <div>
        <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-3">
          <Toggle<Billing>
            value={billing}
            onChange={setBilling}
            options={[
              { value: "monthly", label: "Monthly" },
              {
                value: "annual",
                label: (
                  <span className="flex items-center gap-1.5">
                    Annual
                    <span className="rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      −20%
                    </span>
                  </span>
                ),
              },
            ]}
          />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            if ("custom" in plan && plan.custom) {
              return (
                <div
                  key={plan.name}
                  className="flex flex-col rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm"
                >
                  <h3 className="font-sans text-lg font-semibold tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="mt-5">
                    <span className="font-mono text-3xl font-semibold">
                      Custom
                    </span>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="subtle" className="mt-6" asChild>
                    <Link href={plan.ctaHref}>{plan.cta}</Link>
                  </Button>
                </div>
              );
            }

            const paid = plan as Extract<(typeof PLANS)[number], { priceUSD: number }>;
            const price = billing === "annual" ? paid.annualUSD : paid.priceUSD;
            const symbol = "$";
            const isHighlight = paid.highlight;

            return (
              <m.div
                key={paid.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "relative flex flex-col rounded-2xl p-6 backdrop-blur-sm",
                  isHighlight
                    ? "border-transparent bg-card shadow-[0_0_60px_-16px_hsl(var(--ring)/0.6)] before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:p-px before:bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)]"
                    : "border border-border/60 bg-card/40",
                )}
              >
                {isHighlight && (
                  <>
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-2xl bg-card"
                    />
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white shadow-lg">
                      Most popular
                    </span>
                  </>
                )}
                <h3 className="font-sans text-lg font-semibold tracking-tight">
                  {paid.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {paid.description}
                </p>
                <div className="mt-5">
                  <span className="font-mono text-3xl font-semibold tabular-nums">
                    {symbol}
                    {price.toLocaleString()}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">/mo</span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Billed in INR equivalent at checkout
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {paid.features.map((f) => {
                    const soon = f.includes("(Coming soon)");
                    const label = f.replace(" (Coming soon)", "");
                    return (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                        <span className="text-foreground/90">
                          {label}
                          {soon && (
                            <span className="ml-1.5 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                              Soon
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  variant={isHighlight ? "gradient" : "subtle"}
                  className="mt-6"
                  asChild
                >
                  <Link href={`/signup?plan=${paid.planKey}`}>{paid.cta}</Link>
                </Button>
                <p className="mt-3 text-center text-[10px] text-muted-foreground">
                  7-day free trial · No credit card
                </p>
              </m.div>
            );
          })}
        </div>
      </div>
    </MotionProvider>
  );
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/40 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            value === o.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === o.value && (
            <m.span
              layoutId={`toggle-${options.map((x) => x.value).join("-")}`}
              className="absolute inset-0 rounded-full bg-background shadow-sm"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
