export interface Review {
  id: string;
  connection_id?: string;
  source: "google_business" | "play_store";
  external_review_id: string;
  author_name: string;
  rating: number;
  review_text: string;
  review_language: string;
  device_info?: Record<string, unknown>;
  reply_text?: string;
  reply_status: "pending" | "drafted" | "approved" | "published" | "failed";
  reply_published_at?: string;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  keywords: string[];
  is_read: boolean;
  is_auto_replied?: boolean;
  review_created_at: string;
  created_at?: string;
}

export interface ReviewFilter {
  source?: "google_business" | "play_store" | "all";
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
