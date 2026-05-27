export type ReviewSource = "google_business" | "play_store" | "whatsapp";

export interface Review {
  id: string;
  connection_id?: string;
  source: ReviewSource;
  external_review_id: string;
  author_name: string;
  /** Nullable — WhatsApp messages have no rating */
  rating: number | null;
  review_text: string;
  review_language: string;
  /** ISO 3166-1 alpha-2 derived from review_language locale region. Null when locale has no region. */
  reviewer_country?: string | null;
  device_info?: Record<string, unknown>;
  /** Play Store app version installed at review time, e.g. "1.2.3". NULL when API omitted it (per Google docs, may be absent). Only populated for source = "play_store". */
  app_version_name?: string | null;
  /** Play Store integer app version code, e.g. 12345. Used for correct numeric sort of versions in inbox dropdown. NULL when API omitted it. */
  app_version_code?: number | null;
  /** For WhatsApp, the customer's phone number in E.164 format (e.g. +919812345678) */
  author_id?: string | null;
  /** When true, skip the AI auto-reply for this row (e.g. non-text WhatsApp messages) */
  skip_auto_reply?: boolean;
  reply_text?: string;
  reply_status: "pending" | "drafted" | "approved" | "published" | "failed";
  reply_published_at?: string;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  keywords: string[];
  is_read: boolean;
  is_auto_replied?: boolean;
  review_created_at: string;
  created_at?: string;
  // AI insights (populated by classifyReviewInsights via
  // /api/internal/classify-insights). Null until classified.
  ai_theme?: string | null;
  ai_emotion?:
    | "frustrated"
    | "angry"
    | "disappointed"
    | "satisfied"
    | "delighted"
    | "confused"
    | "hopeful"
    | "neutral"
    | null;
  ai_urgency?: "low" | "medium" | "high" | "critical" | null;
  ai_sentiment?: "positive" | "neutral" | "negative" | null;
  ai_insights_classified_at?: string | null;
  // Phase 2 — Aspect-Based Sentiment Analysis. Maps aspect name (e.g. "food",
  // "performance") to that aspect's sentiment in the review. Only aspects the
  // review explicitly mentions are present.
  ai_aspects?: Record<string, "positive" | "neutral" | "negative"> | null;
  ai_aspects_classified_at?: string | null;
  // Recovery tracking (Active Issues engine, migration 034)
  is_recoverable?: boolean;
  issue_label?: string | null;
  original_rating?: number | null;
  recovery_status?: "none" | "monitoring" | "recovered" | "unrecovered";
  recovery_detected_at?: string | null;
  // Set when the cron observes the upstream review with different text or
  // rating than what we stored. Drives the "Edited" badge in the UI. (037)
  edited_at?: string | null;
}

export interface Issue {
  id: string;
  user_id: string;
  connection_id: string;
  label: string;
  description?: string | null;
  status: "active" | "fixed" | "dismissed";
  review_count: number;
  avg_rating: number | null;
  first_seen_at: string;
  fixed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewFilter {
  source?: ReviewSource | "all";
  rating?: number | "all";
  status?: "pending" | "drafted" | "published" | "all";
  search?: string;
  dateRange?: { from: Date; to: Date };
}

/** Raw format as returned by Google My Business API v4 */
export interface GBPReview {
  name: string; // "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
  reviewId: string;
  reviewer: {
    profilePhotoUrl: string;
    displayName: string;
    isAnonymous: boolean;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment: string;
  createTime: string; // ISO 8601
  updateTime: string; // ISO 8601
  reviewReply: { comment: string; updateTime: string } | null;
}

/** Raw device metadata from Play Store API */
export interface PlayStoreDeviceMetadata {
  productName: string;
  manufacturer: string;
  deviceClass: string;
  screenWidthPx: number;
  screenHeightPx: number;
  nativePlatform: string;
  screenDensityDpi: number;
  glEsVersion: number;
  cpuModel: string;
  cpuMake: string;
  ramMb: number;
}

/** Raw format as returned by Google Play Developer API v3 reviews.list */
export interface RawPlayStoreReview {
  reviewId: string;
  authorName: string;
  comments: Array<{
    userComment: {
      text: string;
      lastModified: { seconds: string; nanos: number };
      starRating: number;
      reviewerLanguage: string;
      device: string;
      androidOsVersion: number;
      appVersionCode: number;
      appVersionName: string;
      thumbsUpCount: number;
      thumbsDownCount: number;
      deviceMetadata: PlayStoreDeviceMetadata;
    };
  }>;
}
