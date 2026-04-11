'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getPlan, USAGE_PERIOD } from '@/lib/plans';
import type { PlanId } from '@/lib/plans';

export interface UsageData {
  ai_replies_used: number;
  auto_replies_used: number;
  sms_sent: number;
  reviews_fetched: number;
  period_key: string;
}

export function useUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [planId, setPlanId] = useState<string>('free');
  // usage_period_start drives the user-specific rolling 7-day window.
  // Falls back to "now" if the API hasn't returned it yet.
  const [periodStart, setPeriodStart] = useState<string>(() => new Date().toISOString());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      // Fetch plan + user-specific period start via /api/plan so team members
      // get the owner's plan and period anchor (bypasses RLS on the server).
      const planRes = await fetch('/api/plan');
      let resolvedPeriodStart = new Date().toISOString();
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlanId(planData.plan ?? 'free');
        if (planData.usage_period_start) {
          resolvedPeriodStart = planData.usage_period_start;
          setPeriodStart(resolvedPeriodStart);
        }
      }

      // Now we know which period_key to read
      const userPeriodKey = USAGE_PERIOD.getUserPeriodKey(resolvedPeriodStart);
      const { data: usageRow } = await supabase
        .from('usage')
        .select('ai_replies_used, auto_replies_used, sms_sent, reviews_fetched, period_key')
        .eq('user_id', user.id)
        .eq('period_key', userPeriodKey)
        .single();

      setUsage(
        usageRow ?? {
          ai_replies_used: 0,
          auto_replies_used: 0,
          sms_sent: 0,
          reviews_fetched: 0,
          period_key: userPeriodKey,
        }
      );
    } catch (err) {
      console.error('[useUsage] Error fetching usage:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Re-fetch whenever an AI reply is generated anywhere in the app
    function handleUsageUpdated() { refresh(); }
    window.addEventListener("reviewpilot:usage-updated", handleUsageUpdated);
    return () => window.removeEventListener("reviewpilot:usage-updated", handleUsageUpdated);
  }, [refresh]);

  const plan = getPlan(planId as PlanId);
  const totalAiUsed = (usage?.ai_replies_used ?? 0) + (usage?.auto_replies_used ?? 0);
  const aiLimit = plan.limits.ai_replies_per_period as number;
  const isAiUnlimited = aiLimit === -1;
  const smsLimit = plan.limits.sms_per_period as number;
  const isSmsUnlimited = smsLimit === -1;

  return {
    usage,
    planId,
    plan,
    isLoading,
    refresh,
    totalAiUsed,
    aiLimit,
    isAiUnlimited,
    aiRemaining: isAiUnlimited ? Infinity : Math.max(0, aiLimit - totalAiUsed),
    aiPercent: isAiUnlimited ? 0 : Math.min(100, (totalAiUsed / aiLimit) * 100),
    smsUsed: usage?.sms_sent ?? 0,
    smsLimit,
    isSmsUnlimited,
    smsPercent: isSmsUnlimited ? 0 : Math.min(100, ((usage?.sms_sent ?? 0) / smsLimit) * 100),
    resetDate: USAGE_PERIOD.getUserResetDate(periodStart),
    periodLabel: USAGE_PERIOD.label,
  };
}
