"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: 1500,
    features: ["1 location or app", "100 AI replies/mo", "50 SMS/mo", "Basic analytics"],
  },
  {
    key: "growth",
    name: "Growth",
    price: 3000,
    popular: true,
    features: ["3 locations or apps", "Unlimited AI replies", "200 SMS/mo", "Full analytics", "Weekly digest"],
  },
  {
    key: "agency",
    name: "Agency",
    price: 8000,
    features: ["10 locations + 10 apps", "Unlimited everything", "White-label", "5 team seats", "Priority support"],
  },
];

export default function BillingPage() {
  const [currentPlan] = useState("free");
  const [loading, setLoading] = useState<string | null>(null);

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
      // Error handling
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and billing.
        </p>
      </div>

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
              <p className="text-lg font-bold font-heading capitalize">{currentPlan} Plan</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan === "free"
                  ? "Limited to 10 AI replies and 5 SMS per month"
                  : "Your subscription is active"}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {currentPlan === "free" ? "Free" : "Active"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Usage</CardTitle>
          <CardDescription>Resets on the 1st of every month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar label="AI Replies" used={7} total={10} />
          <UsageBar label="SMS Sent" used={2} total={5} />
          <UsageBar label="Reviews Processed" used={20} total={50} />
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Upgrade Your Plan
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.key}
              className={cn(
                "relative",
                plan.popular && "border-teal-500 shadow-lg"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-0.5 text-[10px] font-medium text-white">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold font-heading">
                    ₹{plan.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-teal-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loading === plan.key || currentPlan === plan.key}
                >
                  {loading === plan.key
                    ? "Processing..."
                    : currentPlan === plan.key
                      ? "Current Plan"
                      : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct > 90 ? "bg-destructive" : pct > 70 ? "bg-amber-500" : "bg-teal-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
