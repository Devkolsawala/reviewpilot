/**
 * Builds the data payload that drives the digest email.
 *
 * Uses the service-role Supabase client so it can run from the cron path with
 * no user session. All time windows are computed from `now` plus the user's
 * timezone (read from digest_preferences, defaulting to Asia/Kolkata).
 *
 * Auto vs manual reply distinction:
 *   The reviews table has no `reply_source` column. We approximate by using
 *   the existing `is_auto_replied` flag set by the auto-reply pipeline:
 *     repliesAuto   = published replies in window with is_auto_replied=true
 *     repliesManual = published replies in window with is_auto_replied!=true
 *   This is best-effort — replies posted manually after an auto-draft will
 *   still show as auto. A real reply_source column would be more accurate.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/plans";
import { startOfTodayInTzAsUtc } from "./tz";

export type DigestPeriod = "daily" | "weekly";

export type DigestPayload = {
  period: DigestPeriod;
  periodStart: Date;
  periodEnd: Date;
  hasActivity: boolean;
  totals: {
    newReviews: number;
    repliesSent: number;
    repliesAuto: number;
    repliesManual: number;
    pendingReplies: number;
    avgRating: number | null;
    avgRatingDelta: number | null;
  };
  ratingBreakdown: { star: 1 | 2 | 3 | 4 | 5; count: number }[];
  sentiment: { positive: number; neutral: number; negative: number };
  topKeywords: { word: string; count: number }[];
  lowestRatedReview: {
    id: string;
    rating: number;
    author: string;
    excerpt: string;
    deepLink: string;
    needsReply: boolean;
  } | null;
  quota: {
    aiRepliesUsed: number;
    aiRepliesLimit: number;
    plan: string;
  };
};

type ReviewRow = {
  id: string;
  rating: number | null;
  reply_status: string | null;
  reply_published_at: string | null;
  is_auto_replied: boolean | null;
  sentiment: string | null;
  keywords: string[] | null;
  author_name: string | null;
  review_text: string | null;
  review_created_at: string;
};

function excerpt(text: string | null, max = 140): string {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function aggregateRows(rows: ReviewRow[], priorRows: ReviewRow[]) {
  const ratedRows = rows.filter((r) => r.rating != null);
  const totalRated = ratedRows.length;
  const avgRating = totalRated
    ? ratedRows.reduce((s, r) => s + (r.rating || 0), 0) / totalRated
    : null;

  const priorRated = priorRows.filter((r) => r.rating != null);
  const priorAvg = priorRated.length
    ? priorRated.reduce((s, r) => s + (r.rating || 0), 0) / priorRated.length
    : null;
  const avgRatingDelta =
    avgRating != null && priorAvg != null
      ? Math.round((avgRating - priorAvg) * 10) / 10
      : null;

  const repliesSent = rows.filter((r) => r.reply_status === "published").length;
  const repliesAuto = rows.filter(
    (r) => r.reply_status === "published" && r.is_auto_replied === true
  ).length;
  const repliesManual = repliesSent - repliesAuto;
  const pendingReplies = rows.filter(
    (r) => r.reply_status === "pending" || r.reply_status === "drafted"
  ).length;

  const ratingBreakdown = ([1, 2, 3, 4, 5] as const).map((star) => ({
    star,
    count: rows.filter((r) => r.rating === star).length,
  }));

  const sentiment = {
    positive: rows.filter((r) => r.sentiment === "positive").length,
    neutral: rows.filter(
      (r) => r.sentiment === "neutral" || r.sentiment === "mixed"
    ).length,
    negative: rows.filter((r) => r.sentiment === "negative").length,
  };

  const keywordFreq: Record<string, number> = {};
  for (const r of rows) {
    for (const kw of r.keywords || []) {
      const normalised = kw.trim().toLowerCase();
      if (!normalised) continue;
      keywordFreq[normalised] = (keywordFreq[normalised] || 0) + 1;
    }
  }
  const topKeywords = Object.entries(keywordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([word, count]) => ({ word, count }));

  return {
    totals: {
      newReviews: rows.length,
      repliesSent,
      repliesAuto,
      repliesManual,
      pendingReplies,
      avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
      avgRatingDelta,
    },
    ratingBreakdown,
    sentiment,
    topKeywords,
  };
}

function pickLowestRated(rows: ReviewRow[]): DigestPayload["lowestRatedReview"] {
  const candidates = rows
    .filter(
      (r) =>
        r.rating != null &&
        r.rating < 4 &&
        (r.reply_status === "pending" || r.reply_status === "drafted")
    )
    .sort((a, b) => (a.rating || 0) - (b.rating || 0));
  if (!candidates.length) return null;
  const r = candidates[0];
  return {
    id: r.id,
    rating: r.rating || 0,
    author: r.author_name || "Anonymous",
    excerpt: excerpt(r.review_text, 180),
    deepLink: `/dashboard/inbox?reviewId=${r.id}`,
    needsReply: true,
  };
}

// ── Mock builder ──────────────────────────────────────────────────────────────

async function buildMockPayload(period: DigestPeriod, now: Date): Promise<DigestPayload> {
  const { MOCK_REVIEWS } = await import("@/lib/mock-data");
  const days = period === "daily" ? 1 : 7;
  const periodStart = new Date(now.getTime() - days * 86_400_000);

  const rows: ReviewRow[] = MOCK_REVIEWS.map((r) => ({
    id: r.id,
    rating: r.rating ?? null,
    reply_status: r.reply_status,
    reply_published_at: null,
    is_auto_replied: r.is_auto_replied ?? false,
    sentiment: r.sentiment,
    keywords: r.keywords ?? [],
    author_name: r.author_name,
    review_text: r.review_text,
    review_created_at: r.review_created_at,
  }));
  const inWindow = rows.filter(
    (r) => new Date(r.review_created_at) >= periodStart
  );
  // Force at least some activity so dev test sends look representative
  const sample = inWindow.length ? inWindow : rows.slice(0, 6);
  const prior = rows
    .filter(
      (r) =>
        new Date(r.review_created_at) <
          new Date(periodStart.getTime()) &&
        new Date(r.review_created_at) >=
          new Date(periodStart.getTime() - days * 86_400_000)
    )
    .slice(0, sample.length);

  const agg = aggregateRows(sample, prior);
  return {
    period,
    periodStart,
    periodEnd: now,
    hasActivity: sample.length > 0,
    ...agg,
    lowestRatedReview: pickLowestRated(sample),
    quota: {
      aiRepliesUsed: 12,
      aiRepliesLimit: 100,
      plan: "starter",
    },
  };
}

// ── Real builder ──────────────────────────────────────────────────────────────

export async function buildDigest(
  userId: string,
  period: DigestPeriod,
  now: Date
): Promise<DigestPayload> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return buildMockPayload(period, now);
  }

  const supabase = createAdminClient();

  // Resolve timezone (digest_preferences → fallback)
  const { data: prefs } = await supabase
    .from("digest_preferences")
    .select("timezone")
    .eq("user_id", userId)
    .maybeSingle();
  const timezone = prefs?.timezone || "Asia/Kolkata";

  // Period bounds
  let periodStart: Date;
  if (period === "daily") {
    periodStart = startOfTodayInTzAsUtc(now, timezone);
  } else {
    periodStart = new Date(now.getTime() - 7 * 86_400_000);
  }
  const periodEnd = now;
  const windowMs = periodEnd.getTime() - periodStart.getTime();
  const priorStart = new Date(periodStart.getTime() - windowMs);

  // Fetch this user's connections
  const { data: connections } = await supabase
    .from("connections")
    .select("id")
    .eq("user_id", userId);
  const connIds = (connections || []).map((c) => c.id);

  let rows: ReviewRow[] = [];
  let priorRows: ReviewRow[] = [];

  if (connIds.length > 0) {
    const { data: currentData } = await supabase
      .from("reviews")
      .select(
        "id, rating, reply_status, reply_published_at, is_auto_replied, sentiment, keywords, author_name, review_text, review_created_at"
      )
      .in("connection_id", connIds)
      .gte("review_created_at", periodStart.toISOString())
      .lt("review_created_at", periodEnd.toISOString())
      .limit(2000);
    rows = (currentData as ReviewRow[]) || [];

    const { data: priorData } = await supabase
      .from("reviews")
      .select(
        "id, rating, reply_status, reply_published_at, is_auto_replied, sentiment, keywords, author_name, review_text, review_created_at"
      )
      .in("connection_id", connIds)
      .gte("review_created_at", priorStart.toISOString())
      .lt("review_created_at", periodStart.toISOString())
      .limit(2000);
    priorRows = (priorData as ReviewRow[]) || [];
  }

  const agg = aggregateRows(rows, priorRows);

  // Quota — read profile + current usage row
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, usage_period_start, created_at")
    .eq("id", userId)
    .single();
  const planId = profile?.plan || "free";
  const planConfig = getPlan(planId);
  const aiLimit = planConfig.limits.ai_replies_per_period;

  const periodAnchor =
    profile?.usage_period_start || profile?.created_at || new Date().toISOString();
  const { USAGE_PERIOD } = await import("@/lib/plans");
  const periodKey = USAGE_PERIOD.getUserPeriodKey(periodAnchor);
  const { data: usageRow } = await supabase
    .from("usage")
    .select("ai_replies_used, auto_replies_used")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .maybeSingle();
  const aiUsed =
    (usageRow?.ai_replies_used ?? 0) + (usageRow?.auto_replies_used ?? 0);

  const totals = agg.totals;
  const hasActivity =
    totals.newReviews > 0 ||
    totals.repliesSent > 0 ||
    totals.pendingReplies > 0;

  return {
    period,
    periodStart,
    periodEnd,
    hasActivity,
    ...agg,
    lowestRatedReview: pickLowestRated(rows),
    quota: {
      aiRepliesUsed: aiUsed,
      aiRepliesLimit: aiLimit,
      plan: planId,
    },
  };
}
