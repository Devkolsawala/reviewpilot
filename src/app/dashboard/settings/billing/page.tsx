"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  CreditCard,
  Zap,
  RefreshCw,
  AlertTriangle,
  Loader2,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsage } from "@/hooks/useUsage";
import { usePlan } from "@/hooks/usePlan";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isUpgrade, isDowngrade } from "@/lib/plans";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (response: Record<string, unknown>) => void) => void;
    };
  }
}

const PLAN_CARDS = [
  {
    key: "starter",
    name: "Starter",
    price: 1500,
    features: [
      "1 location or app",
      "100 AI replies/week",
      "50 SMS/week (Coming Soon)",
      "3 team seats",
      "Basic analytics",
      "Auto-reply",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: 3000,
    popular: true,
    features: [
      "3 locations or apps",
      "500 AI replies/week",
      "200 SMS/week (Coming Soon)",
      "5 team seats",
      "Full analytics + sentiment",
      "Bulk reply",
      "Data export",
    ],
  },
  {
    key: "agency",
    name: "Agency",
    price: 8000,
    features: [
      "10 locations or apps",
      "Unlimited AI replies",
      "1,000 SMS/week (Coming Soon)",
      "10 team seats",
      "White-label reports",
      "Priority support",
    ],
  },
];

function FeatureItem({ text }: { text: string }) {
  const isComingSoon = text.includes("(Coming Soon)");
  const label = text.replace(" (Coming Soon)", "");
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 text-teal-500 shrink-0" />
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
}

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    plan,
    planId,
    usage,
    isLoading,
    totalAiUsed,
    aiLimit,
    isAiUnlimited,
    aiPercent,
    smsUsed,
    smsLimit,
    isSmsUnlimited,
    smsPercent,
    resetDate,
    periodLabel,
  } = useUsage();
  const { trialExpired, trialDaysLeft, cancellationPending, cancelDate } = usePlan();

  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  const isPaidPlan = planId !== "free";

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? "");
        setUserName(user.user_metadata?.full_name ?? "");
      }
    }
    loadUser();
  }, []);

  const resetLabel = resetDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function openCheckout(planName: string) {
    setLoading(planName);
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Downgrade blocked — show the server's message
        throw new Error(data.error);
      }

      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Razorpay checkout not loaded. Please refresh the page.");
      }

      const options: Record<string, unknown> = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "ReviewPilot",
        description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan — Monthly`,
        handler: async (response: Record<string, string>) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planName,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast({
              title: "Payment successful!",
              description: `You're now on the ${planName.charAt(0).toUpperCase() + planName.slice(1)} plan. Refreshing...`,
            });
            setTimeout(() => window.location.reload(), 1500);
          } else {
            toast({
              title: "Verification failed",
              description: verifyData.error ?? "Contact support.",
              variant: "destructive",
            });
            setLoading(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
            toast({ title: "Payment cancelled", description: "You can try again any time.", variant: "destructive" });
          },
        },
        prefill: { email: userEmail, name: userName },
        theme: { color: "#14B8A6" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: Record<string, unknown>) => {
        const err = response.error as Record<string, string> | undefined;
        toast({ title: "Payment failed", description: err?.description ?? "Please try again.", variant: "destructive" });
        setLoading(null);
      });
      rzp.open();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
      setLoading(null);
    }
  }

  function handlePlanClick(targetPlan: string) {
    // Upgrade from active paid plan needs a confirmation dialog
    if (isPaidPlan && !cancellationPending && isUpgrade(planId as string, targetPlan)) {
      setUpgradeTarget(targetPlan);
    } else {
      openCheckout(targetPlan);
    }
  }

  async function handleCancelSubscription() {
    setLoading("cancel");
    try {
      const res = await fetch("/api/razorpay/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Cancellation scheduled", description: data.message });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  const upgradeTargetCard = PLAN_CARDS.find((p) => p.key === upgradeTarget);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and billing.</p>
      </div>

      {/* Trial expired banner */}
      {trialExpired && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-4 py-4">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Your free trial has ended</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">Choose a plan below to continue using ReviewPilot.</p>
          </div>
        </div>
      )}

      {/* Cancellation pending banner */}
      {cancellationPending && cancelDate && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200">Cancellation scheduled</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              Your plan will remain active until{" "}
              <strong>{cancelDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>
              . After that, your account moves to the free plan.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
            onClick={() => openCheckout(planId as string)}
            disabled={loading !== null}
          >
            Re-subscribe
          </Button>
        </div>
      )}

      {/* Test mode notice */}
      {isTestMode && (
        <div className="flex items-start gap-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
          <p className="text-purple-800 dark:text-purple-300">
            <strong>Test mode active</strong> — limits reset every minute. Remove{" "}
            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">USAGE_PERIOD_MINUTES</code>{" "}
            from <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> for production.
          </p>
        </div>
      )}

      {/* Current plan card */}
      {!trialExpired && (
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
                <p className="text-sm text-muted-foreground mt-0.5">
                  {planId === "free"
                    ? trialDaysLeft !== null && trialDaysLeft > 0
                      ? `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining`
                      : `Limited to ${aiLimit} AI replies per ${periodLabel}`
                    : cancellationPending && cancelDate
                      ? `Active until ${cancelDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                      : "Your subscription is active"}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs capitalize",
                  isPaidPlan && !cancellationPending && "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
                  cancellationPending && "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                )}
              >
                {cancellationPending ? "Cancelling" : planId}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage */}
      {!trialExpired && (
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading usage data…
              </div>
            ) : (
              <>
                <UsageBar label="AI Replies" used={totalAiUsed} total={isAiUnlimited ? null : aiLimit} percent={aiPercent} />
                <UsageBar label="SMS Sent" used={smsUsed} total={isSmsUnlimited ? null : smsLimit} percent={smsPercent} comingSoon />
                <UsageBar label="Reviews Fetched" used={usage?.reviews_fetched ?? 0} total={null} percent={0} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          {trialExpired ? "Choose Your Plan" : isPaidPlan ? "Your Plan" : "Upgrade Your Plan"}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_CARDS.map((p) => {
            const isCurrent = planId === p.key && !cancellationPending;
            const upgrading = isPaidPlan && !cancellationPending && isUpgrade(planId as string, p.key);
            const downgrading = isPaidPlan && !cancellationPending && isDowngrade(planId as string, p.key);
            const isResubscribe = cancellationPending && planId === p.key;

            return (
              <Card
                key={p.key}
                className={cn(
                  "relative",
                  p.popular && !isCurrent && "border-teal-500 shadow-lg",
                  isCurrent && "ring-2 ring-teal-500",
                  downgrading && "opacity-75"
                )}
              >
                {p.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-0.5 text-[10px] font-medium text-white">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-0.5 text-[10px] font-medium text-white">
                    Current Plan
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-heading text-lg font-bold">{p.name}</h3>
                  <p className="mt-2">
                    <span className="text-3xl font-bold font-heading">₹{p.price.toLocaleString("en-IN")}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </p>
                  <ul className="mt-4 space-y-2">
                    {p.features.map((f) => <FeatureItem key={f} text={f} />)}
                  </ul>

                  {/* Button logic */}
                  {isCurrent ? (
                    <Button className="w-full mt-6" variant="secondary" disabled>Current Plan</Button>
                  ) : isResubscribe ? (
                    <Button
                      className="w-full mt-6 bg-teal-600 hover:bg-teal-700"
                      onClick={() => openCheckout(p.key)}
                      disabled={loading === p.key}
                    >
                      {loading === p.key ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</> : "Re-subscribe"}
                    </Button>
                  ) : upgrading ? (
                    <div className="mt-6 space-y-2">
                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={() => handlePlanClick(p.key)}
                        disabled={loading === p.key}
                      >
                        {loading === p.key ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
                        ) : (
                          <><ArrowUp className="mr-2 h-4 w-4" />Upgrade to {p.name}</>
                        )}
                      </Button>
                      <p className="text-[11px] text-center text-muted-foreground">
                        Your current plan will be cancelled and you&apos;ll be billed ₹{p.price.toLocaleString("en-IN")}/mo from today.
                      </p>
                    </div>
                  ) : downgrading ? (
                    <div className="mt-6 space-y-2">
                      <Button className="w-full" variant="outline" disabled>
                        <ArrowDown className="mr-2 h-4 w-4" />Downgrade to {p.name}
                      </Button>
                      <p className="text-[11px] text-center text-muted-foreground">
                        Cancel your current plan first. You can downgrade after it expires.
                      </p>
                    </div>
                  ) : (
                    <Button
                      className={cn("w-full mt-6", trialExpired && "bg-teal-600 hover:bg-teal-700")}
                      variant={p.popular ? "default" : "outline"}
                      onClick={() => openCheckout(p.key)}
                      disabled={loading === p.key}
                    >
                      {loading === p.key ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
                      ) : trialExpired ? "Select Plan" : "Subscribe"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cancel subscription — only for paid, non-pending users */}
      {isPaidPlan && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              Cancel Subscription
            </CardTitle>
            <CardDescription>
              {cancellationPending && cancelDate
                ? `Cancellation scheduled for ${cancelDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. No refunds for the current period.`
                : "Your plan stays active until the end of the current billing period. No refunds for the current period."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50"
              disabled={loading === "cancel" || cancellationPending}
              onClick={() => setCancelDialogOpen(true)}
            >
              {loading === "cancel" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling…</>
              ) : cancellationPending ? (
                "Cancellation Scheduled"
              ) : (
                "Cancel Subscription"
              )}
            </Button>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel your subscription?</DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>You have <strong className="text-foreground">already been charged</strong> for the current billing period. Your <strong className="text-foreground">{plan.name} plan</strong> will remain active until the end of this period.</p>
                      <p>From next month, you will <strong className="text-foreground">not be charged</strong>.</p>
                      <p className="text-amber-600 dark:text-amber-400 font-medium">No refunds are provided for the current billing period.</p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button>
                  <Button variant="destructive" onClick={() => { setCancelDialogOpen(false); handleCancelSubscription(); }}>
                    Yes, Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Upgrade confirmation dialog */}
      {upgradeTargetCard && (
        <Dialog open={!!upgradeTarget} onOpenChange={(open) => { if (!open) setUpgradeTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to {upgradeTargetCard.name}?</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Your current <strong className="text-foreground">{plan.name} plan</strong> will be cancelled immediately and you&apos;ll be charged{" "}
                    <strong className="text-foreground">₹{upgradeTargetCard.price.toLocaleString("en-IN")}/mo</strong> starting today.
                  </p>
                  <p className="text-amber-600 dark:text-amber-400">
                    Unused days from your current plan are not refunded. For best value, upgrade near the end of your billing cycle.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpgradeTarget(null)}>Cancel</Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => { setUpgradeTarget(null); openCheckout(upgradeTargetCard.key); }}
              >
                Confirm Upgrade — ₹{upgradeTargetCard.price.toLocaleString("en-IN")}/mo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function UsageBar({
  label, used, total, percent, comingSoon,
}: {
  label: string; used: number; total: number | null; percent: number; comingSoon?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-1.5">
          {label}
          {comingSoon && (
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-400">
              Soon
            </span>
          )}
        </span>
        <span className="text-muted-foreground">
          {comingSoon ? "Coming Soon" : total === null ? `${used} used` : `${used} / ${total}`}
        </span>
      </div>
      {total !== null && !comingSoon && (
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
