export const PLANS = {
  free: {
    name: 'Free',
    price_inr: 0,
    price_usd: 0,
    limits: {
      ai_replies_per_period: 10,
      sms_per_period: 5,
      connections: 1,
      team_members: 1,
      reviews_stored: 100,
    },
    features: {
      auto_reply: false,
      bulk_reply: false,
      sentiment_analysis: false,
      export_data: false,
      white_label: false,
      priority_support: false,
    },
  },
  starter: {
    name: 'Starter',
    price_inr: 1500,
    price_usd: 19,
    limits: {
      ai_replies_per_period: 100,
      sms_per_period: 50,
      connections: 1,
      team_members: 1,
      reviews_stored: 1000,
    },
    features: {
      auto_reply: true,
      bulk_reply: false,
      sentiment_analysis: true,
      export_data: false,
      white_label: false,
      priority_support: false,
    },
  },
  growth: {
    name: 'Growth',
    price_inr: 3000,
    price_usd: 39,
    limits: {
      ai_replies_per_period: 500,
      sms_per_period: 200,
      connections: 3,
      team_members: 3,
      reviews_stored: 10000,
    },
    features: {
      auto_reply: true,
      bulk_reply: true,
      sentiment_analysis: true,
      export_data: true,
      white_label: false,
      priority_support: false,
    },
  },
  agency: {
    name: 'Agency',
    price_inr: 8000,
    price_usd: 99,
    limits: {
      ai_replies_per_period: -1, // -1 = unlimited
      sms_per_period: 1000,
      connections: 10,
      team_members: 5,
      reviews_stored: -1, // unlimited
    },
    features: {
      auto_reply: true,
      bulk_reply: true,
      sentiment_analysis: true,
      export_data: true,
      white_label: true,
      priority_support: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const USAGE_PERIOD = {
  get duration(): 'week' | 'test' {
    if (process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) return 'test';
    return 'week';
  },
  get label(): string {
    if (process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES) return 'minute (test mode)';
    return 'week';
  },
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
};

export function getPlan(planId: string): (typeof PLANS)[PlanId] {
  return PLANS[planId as PlanId] ?? PLANS.free;
}

export function canUseFeature(
  planId: string,
  feature: keyof (typeof PLANS)['free']['features']
): boolean {
  return getPlan(planId).features[feature];
}
