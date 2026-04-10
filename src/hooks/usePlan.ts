'use client';
import { useEffect, useState } from 'react';
import { getPlan, canUseFeature, type PlanId } from '@/lib/plans';

export function usePlan() {
  const [planId, setPlanId] = useState<string>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionCancelAt, setSubscriptionCancelAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // /api/plan uses the admin client server-side, bypassing RLS so team
        // members correctly inherit their workspace owner's plan.
        const res = await fetch('/api/plan');
        if (res.ok) {
          const data = await res.json();
          setPlanId(data.plan ?? 'free');
          setTrialEndsAt(data.trial_ends_at ?? null);
          setSubscriptionCancelAt(data.subscription_cancel_at ?? null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const plan = getPlan(planId);
  const can = (feature: string) => canUseFeature(planId, feature as keyof ReturnType<typeof getPlan>['features']);
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const trialExpired = trialDaysLeft !== null && trialDaysLeft <= 0 && planId === 'free';

  const cancellationPending = !!subscriptionCancelAt;
  const cancelDate = subscriptionCancelAt ? new Date(subscriptionCancelAt) : null;

  return { planId: planId as PlanId | string, plan, can, trialDaysLeft, trialExpired, isLoading, subscriptionCancelAt, cancellationPending, cancelDate };
}
