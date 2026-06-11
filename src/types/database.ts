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
  period_key: string; // e.g. '2026-W14' (weekly) or 'test-12345' (test mode)
  ai_replies_used: number;
  auto_replies_used: number;
  sms_sent: number;
  reviews_fetched: number;
  last_updated: string;
  created_at: string;
}

// Plan limits are defined in src/lib/plans.ts — that is the single source of truth.

// ── ASO Analysis (paid feature) ───────────────────────────────────────────────
// Mirrors public.aso_analyses (migration 041). Each row is one immutable
// review-powered App Store Optimization audit for a user + package.

/** A single audited listing factor and its status chip. */
export interface AsoFactorScore {
  /** Points awarded for this factor. */
  score: number;
  /** Max points this factor can contribute. */
  max: number;
  /** Status chip — reuses the resolved/active/at-risk vocabulary from the Theme Map. */
  status: "good" | "warning" | "critical";
  /** Short human-readable explanation of the score (≤120 chars). */
  detail: string;
}

/** Deterministic, code-computed audit of the live listing (no AI). */
export interface AsoScoreBreakdown {
  title: AsoFactorScore;
  short_desc: AsoFactorScore;
  long_desc: AsoFactorScore;
  rating: AsoFactorScore;
  assets: AsoFactorScore;
}

/** Live Play Store listing captured at analysis time. */
export interface AsoListingSnapshot {
  title: string;
  short_description: string;
  long_description: string;
  rating: number | null;
  installs: string | null;
  category: string | null;
  screenshot_count: number;
}

export type AsoKeywordSource = "reviews" | "competitor" | "both";
export type AsoKeywordPriority = "high" | "medium" | "low";

/** One missing keyword opportunity grounded in real reviewer / competitor language. */
export interface AsoKeywordGap {
  keyword: string;
  source: AsoKeywordSource;
  priority: AsoKeywordPriority;
  /** ≤120 chars. */
  rationale: string;
}

/** One section of the suggested long description. */
export interface AsoLongDescriptionSection {
  heading: string;
  body: string;
}

/** AI-generated rewrites + keyword gaps (post-validated in code before storage). */
export interface AsoRecommendations {
  /** Suggested title — enforced ≤30 chars. */
  title: string;
  /** Suggested short description — enforced ≤80 chars. */
  short_description: string;
  long_description: AsoLongDescriptionSection[];
  /** Suggested "What's new" copy, derived only from shipped fixes. May be empty. */
  whats_new: string;
  /** Up to 12 gaps, highest priority first. */
  keyword_gaps: AsoKeywordGap[];
}

export interface AsoAnalysis {
  id: string;
  user_id: string;
  /** Nullable FK to connections(id); null if the connection was removed. */
  app_id: string | null;
  package_name: string;
  listing_snapshot: AsoListingSnapshot;
  /** 0..100 */
  aso_score: number;
  score_breakdown: AsoScoreBreakdown;
  recommendations: AsoRecommendations;
  created_at: string;
}
