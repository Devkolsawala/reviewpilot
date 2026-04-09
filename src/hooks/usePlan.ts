'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getPlan, canUseFeature, type PlanId } from '@/lib/plans';

export function usePlan() {
  const [planId, setPlanId] = useState<string>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, trial_ends_at, created_at')
        .eq('id', user.id)
        .single();
      setPlanId(profile?.plan || 'free');
      setTrialEndsAt(profile?.trial_ends_at || null);
      setIsLoading(false);
    }
    fetch();
  }, []);

  const plan = getPlan(planId);
  const can = (feature: string) => canUseFeature(planId, feature as keyof ReturnType<typeof getPlan>['features']);
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const trialExpired = trialDaysLeft !== null && trialDaysLeft <= 0 && planId === 'free';

  return { planId: planId as PlanId | string, plan, can, trialDaysLeft, trialExpired, isLoading };
}
