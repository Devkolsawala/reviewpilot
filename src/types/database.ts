export interface Profile {
  id: string;
  full_name?: string;
  company_name?: string;
  plan: "free" | "starter" | "growth" | "agency";
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  onboarding_completed: boolean;
  created_at: string;
}

export interface AppContext {
  id: string;
  connection_id: string;
  description?: string;
  key_features: string[];
  common_questions: string[];
  known_issues: string[];
  tone: "friendly" | "professional" | "casual" | "apologetic" | "custom";
  custom_tone_example?: string;
  support_url?: string;
  additional_instructions?: string;
  auto_reply_enabled: boolean;
  /** manual = no automation; draft_for_review = AI drafts; auto_publish = post without inbox approval (subject to low-star safety). */
  auto_reply_mode?: "manual" | "draft_for_review" | "auto_publish";
  /** When auto_reply_mode is auto_publish, still save 1–2★ as drafted for human review. */
  auto_reply_draft_low_ratings?: boolean;
  auto_reply_min_rating: number;
  auto_reply_max_rating: number;
  // Scheduled auto-reply fields
  schedule_enabled: boolean;
  schedule_time: string;       // "08:00" — 24h HH:MM
  schedule_timezone: string;   // e.g. "Asia/Kolkata"
  schedule_days: boolean[];    // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  schedule_review_age_hours: number; // 12 | 24 | 48 | 168
  schedule_safety_toggle: boolean;   // true = draft negative, false = publish all
  updated_at: string;
}

export interface Usage {
  id: string;
  user_id: string;
  month: string;
  ai_replies_used: number;
  sms_sent: number;
  reviews_processed: number;
}

export const PLAN_LIMITS = {
  free: { connections: 1, ai_replies: 10, sms: 5, team_seats: 1 },
  starter: { connections: 1, ai_replies: 100, sms: 50, team_seats: 1 },
  growth: { connections: 3, ai_replies: Infinity, sms: 200, team_seats: 3 },
  agency: { connections: 20, ai_replies: Infinity, sms: Infinity, team_seats: 5 },
} as const;
