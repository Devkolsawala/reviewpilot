/**
 * sync_cadence — all plans now sync every 2 hours via Vercel cron.
 * The legacy 'daily_8am' / 'twice_daily' / 'thrice_daily' string types are kept
 * only so older DB rows and any in-flight code don't break during deploy; the
 * runtime always treats every plan as every-2-hours.
 */
export type SyncCadence = 'every_2h' | 'daily_8am' | 'twice_daily' | 'thrice_daily';

export const PLANS = {
  free: {
    name: 'Free',
    price_inr: 0,
    price_usd: 0,
    sync_cadence: 'every_2h' as SyncCadence,   // every 2 hours (all plans)
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
      priority_support: false,
      analytics_basic: true,
      analytics_advanced: false,
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
    price_usd: 16,
    sync_cadence: 'every_2h' as SyncCadence,   // every 2 hours (all plans)
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
      priority_support: false,
      analytics_basic: true,
      analytics_advanced: true,
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
    price_usd: 32,
    sync_cadence: 'every_2h' as SyncCadence,   // every 2 hours (all plans)
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
      priority_support: false,
      analytics_basic: true,
      analytics_advanced: true,
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
    price_usd: 85,
    sync_cadence: 'every_2h' as SyncCadence,   // every 2 hours (all plans)
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
      priority_support: true,
      analytics_basic: true,
      analytics_advanced: true,
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

/**
 * Max number of CC recipients allowed on digest emails per plan.
 * Free trial / Starter: 0 (no CC). Growth: 3. Pro/Agency: 5.
 */
export function getDigestCcLimit(planId: string): number {
  switch (planId) {
    case "agency":
      return 5;
    case "growth":
      return 3;
    case "starter":
    case "free":
    default:
      return 0;
  }
}

/**
 * Max number of WhatsApp connections allowed on each plan.
 * Returns 0 when the plan doesn't include WhatsApp (upsell required).
 * Returns -1 for unlimited.
 */
export function getWhatsAppConnectionLimit(planId: string): number {
  switch (planId) {
    case "agency":
      return 5;
    case "growth":
      return 1;
    case "starter":
    case "free":
    default:
      return 0;
  }
}

/** Human-readable label shown on the Connections page */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSyncScheduleLabel(_planId: string): string {
  // All plans now sync approximately every 2 hours via the Vercel cron.
  return 'Auto-syncs every 2 hours';
}

/**
 * Whether the automated cron should process this connection right now.
 * Kept as a function for backwards-compat with existing callers, but every
 * plan now runs on the same 2-hour Vercel cron, so this always returns true.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isCronSyncAllowed(_planId: string, _timezone?: string | null): boolean {
  return true;
}
