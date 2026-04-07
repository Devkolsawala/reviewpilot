"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsage } from "@/hooks/useUsage";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const PLAN_CARDS = [
  {
    key: "starter",
    name: "Starter",
    price: 1500,
    features: ["1 location or app", "100 AI replies/week", "50 SMS/week", "Auto-reply", "Basic analytics"],
  },
  {
    key: "growth",
    name: "Growth",
    price: 3000,
    popular: true,
    features: ["3 locations or apps", "500 AI replies/week", "200 SMS/week", "Bulk reply", "Full analytics", "Data export"],
  },
  {
    key: "agency",
    name: "Agency",
    price: 8000,
    features: ["10 locations + apps", "Unlimited AI replies", "1000 SMS/week", "White-label", "5 team seats", "Priority support"],
  },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const {
    plan, planId, usage, isLoading,
    totalAiUsed, aiLimit, isAiUnlimited, aiPercent,
    smsUsed, smsLimit, isSmsUnlimited, smsPercent,
    resetDate, periodLabel,
  } = useUsage();

  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  async function handleSubscribe(planKey: string) {
    setLoading(planKey);
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, email: "user@example.com" }),
      });
      const data = await res.json();

      if (data.subscriptionId && typeof window !== "undefined" && window.Razorpay) {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: data.subscriptionId,
          name: "ReviewPilot",
          description: "Monthly Subscription",
          handler: async (response: Record<string, string>) => {
            await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
          },
          theme: { color: "#14b8a6" },
        });
        rzp.open();
      }
    } catch {
      // handle error
    } finally {
      setLoading(null);
    }
  }

  const resetLabel = resetDate.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and billing.</p>
      </div>

      {/* Test mode notice */}
      {isTestMode && (
        <div className="flex items-start gap-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
          <p className="text-purple-800 dark:text-purple-300">
            <strong>Test mode active</strong> — limits reset every minute. Remove{" "}
            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">USAGE_PERIOD_MINUTES</code>{" "}
            from <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> for production weekly reset.
          </p>
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-teal-500" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold font-heading">{plan.name} Plan</p>
              <p className="text-sm text-muted-foreground">
                {planId === "free"
                  ? `Limited to ${aiLimit} AI replies and ${smsLimit} SMS per ${periodLabel}`
                  : "Your subscription is active"}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs capitalize">{planId}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Usage This {periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}</span>
            {isTestMode && (
              <Badge className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                Test Mode
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3" />
            Resets on {resetLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading usage data…</p>
          ) : (
            <>
              <UsageBar
                label="AI Replies"
                used={totalAiUsed}
                total={isAiUnlimited ? null : aiLimit}
                percent={aiPercent}
              />
              <UsageBar
                label="SMS Sent"
                used={smsUsed}
                total={isSmsUnlimited ? null : smsLimit}
                percent={smsPercent}
              />
              <UsageBar
                label="Reviews Fetched"
                used={usage?.reviews_fetched ?? 0}
                total={null}
                percent={0}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Upgrade Your Plan
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_CARDS.map((p) => (
            <Card
              key={p.key}
              className={cn("relative", p.popular && "border-teal-500 shadow-lg")}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-0.5 text-[10px] font-medium text-white">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="font-heading text-lg font-bold">{p.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold font-heading">
                    ₹{p.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-teal-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={p.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(p.key)}
                  disabled={loading === p.key || planId === p.key}
                >
                  {loading === p.key ? "Processing…" : planId === p.key ? "Current Plan" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageBar({
  label, used, total, percent,
}: {
  label: string;
  used: number;
  total: number | null;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {total === null ? `${used} used` : `${used} / ${total}`}
        </span>
      </div>
      {total !== null && (
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              percent > 90 ? "bg-destructive" : percent > 70 ? "bg-amber-500" : "bg-teal-500"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
