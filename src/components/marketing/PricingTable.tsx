"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { m, MotionProvider } from "@/components/motion/primitives";
import { PLANS as PLAN_CONFIG } from "@/lib/plans";

const fmt = (n: number) => n.toLocaleString();

type PaidCard = {
  key: "free" | "starter" | "growth" | "agency";
  name: string;
  priceUSD: number;
  description: string;
  everythingIn?: string;
  features: string[];
  cta: string;
  highlight: boolean;
};

const FREE_CARD: PaidCard = {
  key: "free",
  name: "Free",
  priceUSD: PLAN_CONFIG.free.price_usd,
  description: "Full access for 7 days — no card needed",
  features: [
    `${PLAN_CONFIG.free.limits.connections} app or location`,
    `${PLAN_CONFIG.free.limits.ai_replies_per_period} AI replies/week`,
    "Unified inbox + AI reply",
    "WhatsApp Business automation",
    "Daily digest email",
    "Version Impact Analyzer",
  ],
  cta: "Start for free",
  highlight: false,
};

const PAID_CARDS: PaidCard[] = [
  {
    key: "starter",
    name: "Starter",
    priceUSD: PLAN_CONFIG.starter.price_usd,
    description: "For a single location or app",
    everythingIn: "Free",
    features: [
      "Auto-reply to new reviews",
      `${PLAN_CONFIG.starter.limits.ai_replies_per_period} AI replies/week`,
      "Advanced analytics + sentiment",
      `${PLAN_CONFIG.starter.limits.team_members} team seats`,
      `${fmt(PLAN_CONFIG.starter.limits.reviews_stored)} reviews stored`,
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    key: "growth",
    name: "Growth",
    priceUSD: PLAN_CONFIG.growth.price_usd,
    description: "For growing businesses & dev studios",
    everythingIn: "Starter",
    features: [
      `${PLAN_CONFIG.growth.limits.connections} apps or locations`,
      `${PLAN_CONFIG.growth.limits.ai_replies_per_period} AI replies/week`,
      "Bulk reply",
      `ASO Analysis (${PLAN_CONFIG.growth.limits.aso_analyses_per_period}/period)`,
      "Version Impact AI verdict",
      `${PLAN_CONFIG.growth.limits.team_members} team seats`,
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    key: "agency",
    name: "Agency",
    priceUSD: PLAN_CONFIG.agency.price_usd,
    description: "For agencies managing multiple clients",
    everythingIn: "Growth",
    features: [
      `${PLAN_CONFIG.agency.limits.connections} apps or locations`,
      "Unlimited AI replies",
      `ASO Analysis (${PLAN_CONFIG.agency.limits.aso_analyses_per_period}/period)`,
      `${PLAN_CONFIG.agency.limits.team_members} team seats`,
      "5 WhatsApp connections",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
];

/**
 * Public plan-card row. `includeFree` adds the Free card (used on /pricing).
 * The misleading monthly/annual toggle was removed — billing is monthly-only
 * (no annual Razorpay plan IDs exist), so it is replaced by a static billing
 * disclosure line. Card CTAs link to /signup?plan={key} (existing pattern);
 * no billing/checkout code is touched. Enterprise lead lives in a single
 * "Talk to sales" line below the row (see PricingTable render).
 */
export function PricingTable({ includeFree = false }: { includeFree?: boolean }) {
  const cards: PaidCard[] = [
    ...(includeFree ? [FREE_CARD] : []),
    ...PAID_CARDS,
  ];

  const colClass =
    cards.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

  return (
    <MotionProvider>
      <div>
        <p className="text-center text-sm text-muted-foreground">
          Billed monthly · 7-day free trial · No card required
        </p>

        <div
          className={cn(
            "mt-10 grid gap-5 md:grid-cols-2 max-w-6xl mx-auto",
            colClass,
          )}
        >
          {cards.map((card) => {
            const isFree = card.key === "free";
            const isHighlight = card.highlight;

            return (
              <m.div
                key={card.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "relative flex flex-col rounded-2xl p-6 backdrop-blur-sm",
                  isHighlight
                    ? "border-2 border-accent bg-card shadow-[0_0_60px_-16px_hsl(var(--ring)/0.55)] ring-1 ring-accent/40"
                    : "border border-border/60 bg-card/40",
                )}
              >
                {isHighlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white shadow-lg">
                    Most popular
                  </span>
                )}
                <h3 className="font-sans text-lg font-semibold tracking-tight">
                  {card.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
                <div className="mt-5">
                  <span className="font-mono text-3xl font-semibold tabular-nums">
                    ${card.priceUSD.toLocaleString()}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">/mo</span>
                </div>
                {/* INR billing disclosure — paid cards only */}
                {isFree ? (
                  <div className="mt-1 h-4" aria-hidden />
                ) : (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Billed in INR at checkout
                  </p>
                )}

                {card.everythingIn && (
                  <p className="mt-5 text-xs font-medium text-foreground/80">
                    Everything in {card.everythingIn}, plus:
                  </p>
                )}
                <ul
                  className={cn(
                    "flex-1 space-y-2.5",
                    card.everythingIn ? "mt-3" : "mt-5",
                  )}
                >
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isHighlight ? "default" : "subtle"}
                  className="mt-6"
                  asChild
                >
                  <Link href={`/signup?plan=${card.key}`}>{card.cta}</Link>
                </Button>
                {isFree ? (
                  <div className="mt-3 space-y-1 text-center text-[10px] text-muted-foreground">
                    <p>After 7 days, upgrade to keep your account active.</p>
                    <p>No card required</p>
                  </div>
                ) : (
                  <p className="mt-3 text-center text-[10px] text-muted-foreground">
                    7-day free trial · No card
                  </p>
                )}
              </m.div>
            );
          })}
        </div>

        {/* Enterprise lead path — single slim line, replaces the old card. */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Managing 10+ locations or an agency network?{" "}
          <Link
            href="/demo"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Talk to sales →
          </Link>
        </p>
      </div>
    </MotionProvider>
  );
}
