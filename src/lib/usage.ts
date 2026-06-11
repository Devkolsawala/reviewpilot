import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getPlan, USAGE_PERIOD } from './plans';

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Server-only admin client used for profile lookups. Profile RLS does not
 * permit a team member to read the workspace owner's row, so usage helpers
 * use the service-role key to resolve `owner_id`, `usage_period_start`, and
 * `plan` regardless of the caller. The caller is always pre-authenticated
 * by the route — this client is only used for reads keyed on a known userId.
 */
function getProfileAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

export type UsageField = 'ai_replies_used' | 'sms_sent' | 'reviews_fetched' | 'auto_replies_used' | 'aso_analyses_used';

// ── Shared helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches plan, usage_period_start, and created_at in a single query.
 * Used to compute the user-specific period key without a second DB round-trip.
 */
async function fetchProfile(
  supabase: SupabaseClient | ReturnType<typeof createAdminClient>,
  userId: string
): Promise<{ plan: string; usage_period_start: string | null; created_at: string | null }> {
  // Always use the admin client: a team member calling this for the workspace
  // owner's id would otherwise be blocked by RLS on profiles, fall back to
  // defaults, and compute the wrong period_key (anchoring usage to "today"
  // instead of the owner's signup date — which silently lost increments).
  void supabase;
  const admin = getProfileAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('plan, usage_period_start, created_at')
    .eq('id', userId)
    .single();
  return data ?? { plan: 'free', usage_period_start: null, created_at: null };
}

/**
 * Resolves the workspace-owner user id for any caller.
 * If the caller is a team member, returns the owner's id so that quota,
 * limit checks, and seat-scoped resources (connections) all bill against
 * the single workspace row instead of the member's empty row.
 * If the caller is themselves the workspace owner, returns their own id.
 */
async function resolveOwnerId(
  supabase: SupabaseClient | ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string> {
  // Use admin client for consistency with fetchProfile — though the member's
  // own profile is readable via RLS, this avoids any future policy drift.
  void supabase;
  const admin = getProfileAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('owner_id')
    .eq('id', userId)
    .single();
  return (data?.owner_id as string | null) ?? userId;
}

/** Returns the user's period start date, falling back to created_at then now(). */
function getPeriodStartDate(profile: { usage_period_start: string | null; created_at: string | null }): string {
  return profile.usage_period_start || profile.created_at || new Date().toISOString();
}

async function fetchUsage(
  supabase: SupabaseClient | ReturnType<typeof createAdminClient>,
  userId: string,
  periodKey: string
) {
  const { data } = await (supabase as SupabaseClient)
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('period_key', periodKey)
    .single();
  return data ?? { ai_replies_used: 0, sms_sent: 0, reviews_fetched: 0, auto_replies_used: 0, aso_analyses_used: 0, period_key: periodKey };
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
  amount: number,
  periodKey: string
) {
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
  limitType: 'ai_replies' | 'sms' | 'connections' | 'aso_analyses',
  supabase?: SupabaseClient
): Promise<UsageCheck> {
  const client = supabase ?? createClient();
  // Resolve to the workspace owner so quota is pooled across all team
  // members (admin/operator generations all count against the same row).
  const effectiveId = await resolveOwnerId(client, userId);
  const profile = await fetchProfile(client, effectiveId);
  const planId = profile.plan ?? 'free';
  const plan = getPlan(planId);
  const startDate = getPeriodStartDate(profile);
  const periodKey = USAGE_PERIOD.getUserPeriodKey(startDate);
  const usage = await fetchUsage(client, effectiveId, periodKey);

  let current = 0;
  let limit = 0;

  if (limitType === 'ai_replies') {
    current = ((usage.ai_replies_used as number) ?? 0) + ((usage.auto_replies_used as number) ?? 0);
    limit = plan.limits.ai_replies_per_period;
  } else if (limitType === 'sms') {
    current = (usage.sms_sent as number) ?? 0;
    limit = plan.limits.sms_per_period;
  } else if (limitType === 'aso_analyses') {
    current = (usage.aso_analyses_used as number) ?? 0;
    limit = plan.limits.aso_analyses_per_period;
  } else {
    // connections — not period-based; scoped to the workspace owner so
    // an operator adding a connection still counts against the seat limit.
    const { count } = await client
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', effectiveId)
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
    resetDate: USAGE_PERIOD.getUserResetDate(startDate),
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
  // Pool usage against the workspace owner so admin/operator generations
  // all decrement the same quota the owner sees.
  const effectiveId = await resolveOwnerId(client, userId);
  const profile = await fetchProfile(client, effectiveId);
  const startDate = getPeriodStartDate(profile);
  const periodKey = USAGE_PERIOD.getUserPeriodKey(startDate);
  await upsertUsage(client, effectiveId, field, amount, periodKey);
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
  const profile = await fetchProfile(client, userId);
  const planId = profile.plan ?? 'free';
  const plan = getPlan(planId);
  const startDate = getPeriodStartDate(profile);
  const periodKey = USAGE_PERIOD.getUserPeriodKey(startDate);
  const usage = await fetchUsage(client, userId, periodKey);

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
    resetDate: USAGE_PERIOD.getUserResetDate(startDate),
    upgradeNeeded: !(isUnlimited || current < limit),
  };
}

export async function incrementUsageAdmin(
  userId: string,
  field: UsageField,
  amount: number = 1
) {
  const client = getAdminClient();
  const profile = await fetchProfile(client, userId);
  const startDate = getPeriodStartDate(profile);
  const periodKey = USAGE_PERIOD.getUserPeriodKey(startDate);
  await upsertUsage(client, userId, field, amount, periodKey);
}

export async function getUserPlanAdmin(userId: string): Promise<string> {
  const client = getAdminClient();
  return fetchPlan(client, userId);
}
