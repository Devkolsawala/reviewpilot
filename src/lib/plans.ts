/**
 * sync_cadence controls automated cron behaviour:
 *  - 'daily_8am'   : once per day at 8 AM                      (Free)
 *  - 'twice_daily' : twice per day at 8 AM + 8 PM              (Starter / Growth)
 *  - 'thrice_daily': three times per day at 8 AM, 2 PM + 8 PM  (Agency)
 */
export type SyncCadence = 'daily_8am' | 'twice_daily' | 'thrice_daily';

export const PLANS = {
  free: {
    name: 'Free',
    price_inr: 0,
    price_usd: 0,
    sync_cadence: 'daily_8am' as SyncCadence,   // once at 8 AM
    limits: {
      ai_replies_per_period: 10,
      sms_per_period: 5,
      connections: 1,
      team_members: 1,  // total seats (owner only — no invites on free)
      reviews_stored: 100,
    },
    features: {
      auto_reply: false,
      bulk_reply: false,
      sentiment_analysis: false,
      export_data: false,
      white_label: false,
      priority_support: false,
      analytics_basic: true,
      analytics_advanced: false,
      analytics_export: false,
      inbox_ai_reply: true,
      inbox_bulk_reply: false,
      inbox_auto_reply: false,
      campaigns_sms: false,
      campaigns_email: false,
    },
  },
  starter: {
    name: 'Starter',
    price_inr: 1500,
    price_usd: 19,
    sync_cadence: 'twice_daily' as SyncCadence,  // 8 AM + 8 PM
    limits: {
      ai_replies_per_period: 100,
      sms_per_period: 50,
      connections: 1,
      team_members: 3,  // total seats: owner + 2 members
      reviews_stored: 1000,
    },
    features: {
      auto_reply: true,
      bulk_reply: false,
      sentiment_analysis: true,
      export_data: false,
      white_label: false,
      priority_support: false,
      analytics_basic: true,
      analytics_advanced: true,
      analytics_export: false,
      inbox_ai_reply: true,
      inbox_bulk_reply: false,
      inbox_auto_reply: true,
      campaigns_sms: true,
      campaigns_email: true,
    },
  },
  growth: {
    name: 'Growth',
    price_inr: 3000,
    price_usd: 39,
    sync_cadence: 'twice_daily' as SyncCadence,  // 8 AM + 8 PM
    limits: {
      ai_replies_per_period: 500,
      sms_per_period: 200,
      connections: 3,
      team_members: 5,  // total seats: owner + 4 members
      reviews_stored: 10000,
    },
    features: {
      auto_reply: true,
      bulk_reply: true,
      sentiment_analysis: true,
      export_data: true,
      white_label: false,
      priority_support: false,
      analytics_basic: true,
      analytics_advanced: true,
      analytics_export: true,
      inbox_ai_reply: true,
      inbox_bulk_reply: true,
      inbox_auto_reply: true,
      campaigns_sms: true,
      campaigns_email: true,
    },
  },
  agency: {
    name: 'Agency',
    price_inr: 8000,
    price_usd: 99,
    sync_cadence: 'thrice_daily' as SyncCadence, // 8 AM + 2 PM + 8 PM
    limits: {
      ai_replies_per_period: -1, // -1 = unlimited
      sms_per_period: 1000,
      connections: 10,
      team_members: 10, // total seats: owner + 9 members
      reviews_stored: -1, // unlimited
    },
    features: {
      auto_reply: true,
      bulk_reply: true,
      sentiment_analysis: true,
      export_data: true,
      white_label: true,
      priority_support: true,
      analytics_basic: true,
      analytics_advanced: true,
      analytics_export: true,
      inbox_ai_reply: true,
      inbox_bulk_reply: true,
      inbox_auto_reply: true,
      campaigns_sms: true,
      campaigns_email: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  agency: 3,
};

export function isUpgrade(currentPlan: string, targetPlan: string): boolean {
  return (PLAN_HIERARCHY[targetPlan] ?? 0) > (PLAN_HIERARCHY[currentPlan] ?? 0);
}

export function isDowngrade(currentPlan: string, targetPlan: string): boolean {
  return (PLAN_HIERARCHY[targetPlan] ?? 0) < (PLAN_HIERARCHY[currentPlan] ?? 0);
}

export const USAGE_PERIOD = {
  get duration(): 'week' | 'test' {
    if (process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) return 'test';
    return 'week';
  },
  get label(): string {
    if (process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) return 'minute';
    return 'week';
  },
  // Legacy global period key — kept for backward compat but usage.ts now uses getUserPeriodKey
  getCurrentPeriodKey(): string {
    if (process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) {
      const minutes = parseInt(process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) || 1;
      const now = new Date();
      const periodNumber = Math.floor(now.getTime() / (minutes * 60 * 1000));
      return `test-${periodNumber}`;
    }
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  },
  // Legacy global reset date — kept for backward compat
  getResetDate(): Date {
    if (process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) {
      const minutes = parseInt(process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) || 1;
      const now = new Date();
      const currentPeriodStart = Math.floor(now.getTime() / (minutes * 60 * 1000)) * (minutes * 60 * 1000);
      return new Date(currentPeriodStart + minutes * 60 * 1000);
    }
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
  },

  // ── User-specific period key ──────────────────────────────────────────────────
  // Period key format: "p-{periodNumber}-{startDate}" (e.g. "p-2-2026-04-12")
  // Each user has an independent 7-day rolling cycle anchored to their signup date.
  getUserPeriodKey(userStartDate: string | Date): string {
    if (process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) {
      const minutes = parseInt(process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) || 1;
      const periodNumber = Math.floor(Date.now() / (minutes * 60 * 1000));
      return `test-${periodNumber}`;
    }
    const start = new Date(userStartDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const periodNumber = Math.floor(daysSinceStart / 7);
    return `p-${periodNumber}-${start.toISOString().slice(0, 10)}`;
  },

  // Returns when the current 7-day period resets for this specific user
  getUserResetDate(userStartDate: string | Date): Date {
    if (process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) {
      const minutes = parseInt(process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) || 1;
      const currentPeriodStart = Math.floor(Date.now() / (minutes * 60 * 1000)) * (minutes * 60 * 1000);
      return new Date(currentPeriodStart + minutes * 60 * 1000);
    }
    const start = new Date(userStartDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const currentPeriodNumber = Math.floor(daysSinceStart / 7);
    return new Date(start.getTime() + (currentPeriodNumber + 1) * 7 * 86400000);
  },
};

export function getPlan(planId: string): (typeof PLANS)[PlanId] {
  return PLANS[planId as PlanId] ?? PLANS.free;
}

export function canUseFeature(
  planId: string,
  feature: keyof (typeof PLANS)['free']['features']
): boolean {
  const plan = getPlan(planId);
  return (plan.features as Record<string, boolean>)[feature] ?? false;
}

export function getSyncCadence(planId: string): SyncCadence {
  return getPlan(planId).sync_cadence;
}

/** Human-readable label shown on the Connections page */
export function getSyncScheduleLabel(planId: string): string {
  const cadence = getSyncCadence(planId);
  if (cadence === 'daily_8am')   return 'Auto-syncs once daily at 8 AM';
  if (cadence === 'twice_daily') return 'Auto-syncs twice daily (8 AM & 8 PM)';
  return 'Auto-syncs 3× daily (8 AM, 2 PM & 8 PM)';
}

/**
 * Returns true if the automated cron should process this connection right now.
 * Only called for GET (Cloudflare cron) requests — manual POST always proceeds.
 *
 * Each cadence uses a ±30 min window so the hourly Worker always hits at least one window:
 *   daily_8am   → 07:30–08:30
 *   twice_daily → 07:30–08:30 or 19:30–20:30
 *   thrice_daily→ 07:30–08:30 or 13:30–14:30 or 19:30–20:30
 *
 * @param planId   user's plan id
 * @param timezone IANA timezone string (e.g. "Asia/Kolkata"). Defaults to IST.
 */
export function isCronSyncAllowed(planId: string, timezone?: string | null): boolean {
  const cadence = getSyncCadence(planId);
  const tz = timezone || 'Asia/Kolkata';

  let minuteOfDay: number;
  try {
    const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    minuteOfDay = nowLocal.getHours() * 60 + nowLocal.getMinutes();
  } catch {
    minuteOfDay = new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
  }

  const W = 30; // ±30 min window
  const at8AM  = Math.abs(minuteOfDay - 8  * 60) <= W;
  const at2PM  = Math.abs(minuteOfDay - 14 * 60) <= W;
  const at8PM  = Math.abs(minuteOfDay - 20 * 60) <= W;

  if (cadence === 'daily_8am')   return at8AM;
  if (cadence === 'twice_daily') return at8AM || at8PM;
  /* thrice_daily */             return at8AM || at2PM || at8PM;
}
