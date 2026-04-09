'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getPlan, canUseFeature, type PlanId } from '@/lib/plans';

export function usePlan() {
  const [planId, setPlanId] = useState<string>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, trial_ends_at, owner_id')
        .eq('id', user.id)
        .single();

      if (profile?.owner_id) {
        // Team member — read plan from the workspace owner's profile
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('plan, trial_ends_at')
          .eq('id', profile.owner_id)
          .single();
        setPlanId(ownerProfile?.plan || 'free');
        setTrialEndsAt(ownerProfile?.trial_ends_at || null);
      } else {
        setPlanId(profile?.plan || 'free');
        setTrialEndsAt(profile?.trial_ends_at || null);
      }

      setIsLoading(false);
    }
    load();
  }, []);

  const plan = getPlan(planId);
  const can = (feature: string) => canUseFeature(planId, feature as keyof ReturnType<typeof getPlan>['features']);
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const trialExpired = trialDaysLeft !== null && trialDaysLeft <= 0 && planId === 'free';

  return { planId: planId as PlanId | string, plan, can, trialDaysLeft, trialExpired, isLoading };
}
