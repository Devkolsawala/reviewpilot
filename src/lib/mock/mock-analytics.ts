/**
 * Mock analytics derived from the 25 Play Store + 15 GBP reviews.
 * Play Store:  5×1★ + 4×2★ + 5×3★ + 5×4★ + 6×5★ = 25  (sum 78, avg 3.12)
 * GBP:         3×1★ + 2×2★ + 3×3★ + 3×4★ + 4×5★ = 15  (sum 48, avg 3.20)
 * Combined:    40 reviews, sum 126, avg 3.15
 * Replied: 2 play (mp-021, mp-022) + 7 GBP = 9 / 40 = 22.5% → 23%
 */

export const mockAnalytics = {
  totalReviews: 40,
  averageRating: 3.2,

  ratingDistribution: {
    1: 8,   // 5 play + 3 gbp
    2: 6,   // 4 play + 2 gbp
    3: 8,   // 5 play + 3 gbp
    4: 8,   // 5 play + 3 gbp
    5: 10,  // 6 play + 4 gbp
  } as Record<number, number>,

  repliedCount: 9,
  pendingReplyCount: 31,
  replyRate: 22.5,

  reviewsThisMonth: 28,
  reviewsLastMonth: 12,

  sentimentBreakdown: {
    positive: 16,  // 4★ + 5★ reviews
    neutral: 8,    // 3★ reviews
    negative: 14,  // 1★ + 2★ reviews
  },

  topKeywords: [
    "crash",
    "battery drain",
    "ads",
    "wait time",
    "storage full",
    "food quality",
    "original quality",
    "batch download",
    "slow",
    "recommend",
  ],

  // Last 6 months — week-over-week trend shaped to show improvement
  monthlyTrend: [
    { month: "Nov 2025", avgRating: 2.7, count: 4 },
    { month: "Dec 2025", avgRating: 2.9, count: 5 },
    { month: "Jan 2026", avgRating: 3.1, count: 6 },
    { month: "Feb 2026", avgRating: 3.0, count: 7 },
    { month: "Mar 2026", avgRating: 3.3, count: 9 },
    { month: "Apr 2026", avgRating: 3.2, count: 9 },
  ],
};

export type MockAnalytics = typeof mockAnalytics;
