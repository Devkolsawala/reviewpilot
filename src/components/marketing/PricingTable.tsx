"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    priceINR: 1500,
    priceUSD: 19,
    annualINR: 1200,
    annualUSD: 15,
    description: "Perfect for a single location or app",
    features: [
      "1 location OR 1 app",
      "100 AI replies/week",
      "50 SMS/week (Coming Soon)",
      "3 team seats",
      "Basic analytics",
      "Auto-reply",
    ],
    cta: "Start Free Trial",
    highlight: false,
    planKey: "starter",
  },
  {
    name: "Growth",
    priceINR: 3000,
    priceUSD: 39,
    annualINR: 2400,
    annualUSD: 31,
    description: "For growing businesses and dev studios",
    features: [
      "3 locations OR 3 apps",
      "500 AI replies/week",
      "200 SMS/week (Coming Soon)",
      "5 team seats",
      "Full analytics + sentiment",
      "Data export",
    ],
    cta: "Start Free Trial",
    highlight: true,
    planKey: "growth",
  },
  {
    name: "Agency",
    priceINR: 8000,
    priceUSD: 99,
    annualINR: 6400,
    annualUSD: 79,
    description: "For agencies managing multiple clients",
    features: [
      "10 locations or apps",
      "Unlimited AI replies",
      "1,000 SMS/week (Coming Soon)",
      "10 team seats",
      "White-label reports",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlight: false,
    planKey: "agency",
  },
];

export function PricingTable() {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-12">
        <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
          <button
            onClick={() => setCurrency("INR")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currency === "INR"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground"
            }`}
          >
            INR (₹)
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currency === "USD"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground"
            }`}
          >
            USD ($)
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              billing === "annual"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Annual
            <span className="ml-1 text-xs text-teal-600">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const price =
            billing === "annual"
              ? currency === "INR"
                ? plan.annualINR
                : plan.annualUSD
              : currency === "INR"
                ? plan.priceINR
                : plan.priceUSD;
          const symbol = currency === "INR" ? "₹" : "$";

          return (
            <Card
              key={plan.name}
              className={`relative ${
                plan.highlight
                  ? "border-teal-500 shadow-lg shadow-teal-500/10 scale-105"
                  : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-4">
                <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-heading">
                    {symbol}
                    {price.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => {
                    const isComingSoon = f.includes("(Coming Soon)");
                    const label = f.replace(" (Coming Soon)", "");
                    return (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                        <span>
                          {label}
                          {isComingSoon && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                              Soon
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  asChild
                >
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  7-day free trial. No credit card required.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
