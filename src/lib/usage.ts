import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getPlan, USAGE_PERIOD } from './plans';

type SupabaseClient = ReturnType<typeof createClient>;

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  planName: string;
  periodLabel: string;
  resetDate: Date;
  upgradeNeeded: boolean;
}

export type UsageField = 'ai_replies_used' | 'sms_sent' | 'reviews_fetched' | 'auto_replies_used';

// ── Shared helpers ─────────────────────────────────────────────────────────────

async function fetchUsage(
  supabase: SupabaseClient | ReturnType<typeof createAdminClient>,
  userId: string
) {
  const periodKey = USAGE_PERIOD.getCurrentPeriodKey();
  const { data } = await (supabase as SupabaseClient)
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('period_key', periodKey)
    .single();
  return data ?? { ai_replies_used: 0, sms_sent: 0, reviews_fetched: 0, auto_replies_used: 0, period_key: periodKey };
}

async function fetchPlan(
  supabase: SupabaseClient | ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string> {
  const { data } = await (supabase as SupabaseClient)
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();
  return data?.plan ?? 'free';
}

async function upsertUsage(
  supabase: SupabaseClient | ReturnType<typeof createAdminClient>,
  userId: string,
  field: UsageField,
  amount: number
) {
  const periodKey = USAGE_PERIOD.getCurrentPeriodKey();
  const client = supabase as SupabaseClient;

  const { data: existing } = await client
    .from('usage')
    .select(`id, ${field}`)
    .eq('user_id', userId)
    .eq('period_key', periodKey)
    .single();

  if (existing) {
    await client
      .from('usage')
      .update({ [field]: ((existing as Record<string, number>)[field] ?? 0) + amount, last_updated: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await client
      .from('usage')
      .insert({ user_id: userId, period_key: periodKey, [field]: amount });
  }
}

// ── Server-side (user session) ─────────────────────────────────────────────────

export async function getUserPlan(userId: string, supabase?: SupabaseClient): Promise<string> {
  const client = supabase ?? createClient();
  return fetchPlan(client, userId);
}

export async function checkUsageLimit(
  userId: string,
  limitType: 'ai_replies' | 'sms' | 'connections',
  supabase?: SupabaseClient
): Promise<UsageCheck> {
  const client = supabase ?? createClient();
  const planId = await fetchPlan(client, userId);
  const plan = getPlan(planId);
  const usage = await fetchUsage(client, userId);

  let current = 0;
  let limit = 0;

  if (limitType === 'ai_replies') {
    current = ((usage.ai_replies_used as number) ?? 0) + ((usage.auto_replies_used as number) ?? 0);
    limit = plan.limits.ai_replies_per_period;
  } else if (limitType === 'sms') {
    current = (usage.sms_sent as number) ?? 0;
    limit = plan.limits.sms_per_period;
  } else {
    // connections — not period-based
    const { count } = await client
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);
    current = count ?? 0;
    limit = plan.limits.connections;
  }

  const isUnlimited = limit === -1;
  const allowed = isUnlimited || current < limit;

  return {
    allowed,
    current,
    limit: isUnlimited ? Infinity : limit,
    remaining: isUnlimited ? Infinity : Math.max(0, limit - current),
    planName: plan.name,
    periodLabel: USAGE_PERIOD.label,
    resetDate: USAGE_PERIOD.getResetDate(),
    upgradeNeeded: !allowed,
  };
}

export async function incrementUsage(
  userId: string,
  field: UsageField,
  amount: number = 1,
  supabase?: SupabaseClient
) {
  const client = supabase ?? createClient();
  await upsertUsage(client, userId, field, amount);
}

// ── Admin (service role) for cron jobs ─────────────────────────────────────────

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function checkUsageLimitAdmin(
  userId: string,
  limitType: 'ai_replies' | 'sms'
): Promise<UsageCheck> {
  const client = getAdminClient();
  const planId = await fetchPlan(client, userId);
  const plan = getPlan(planId);
  const usage = await fetchUsage(client, userId);

  let current = 0;
  const limit = limitType === 'ai_replies'
    ? plan.limits.ai_replies_per_period
    : plan.limits.sms_per_period;

  if (limitType === 'ai_replies') {
    current = ((usage.ai_replies_used as number) ?? 0) + ((usage.auto_replies_used as number) ?? 0);
  } else {
    current = (usage.sms_sent as number) ?? 0;
  }

  const isUnlimited = limit === -1;
  return {
    allowed: isUnlimited || current < limit,
    current,
    limit: isUnlimited ? Infinity : limit,
    remaining: isUnlimited ? Infinity : Math.max(0, limit - current),
    planName: plan.name,
    periodLabel: USAGE_PERIOD.label,
    resetDate: USAGE_PERIOD.getResetDate(),
    upgradeNeeded: !(isUnlimited || current < limit),
  };
}

export async function incrementUsageAdmin(
  userId: string,
  field: UsageField,
  amount: number = 1
) {
  const client = getAdminClient();
  await upsertUsage(client, userId, field, amount);
}

export async function getUserPlanAdmin(userId: string): Promise<string> {
  const client = getAdminClient();
  return fetchPlan(client, userId);
}
