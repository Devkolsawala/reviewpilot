import { test } from "node:test";
import assert from "node:assert/strict";
import { renderDailyDigest } from "../lib/email/templates/dailyDigest";
import type { DigestPayload } from "../lib/digest/aggregate";

const RENDER_OPTS = {
  userName: "Dev",
  appUrl: "https://reviewpilot.app",
  unsubscribeToken: "tok",
};

function basePayload(overrides: Partial<DigestPayload> = {}): DigestPayload {
  return {
    period: "weekly",
    periodStart: new Date("2026-06-05T09:00:00.000Z"),
    periodEnd: new Date("2026-06-12T09:00:00.000Z"),
    hasActivity: true,
    totals: {
      newReviews: 5,
      repliesSent: 3,
      repliesAuto: 2,
      repliesManual: 1,
      pendingReplies: 2,
      avgRating: 4.2,
      avgRatingDelta: 0.1,
    },
    ratingBreakdown: [1, 2, 3, 4, 5].map((star) => ({
      star: star as 1 | 2 | 3 | 4 | 5,
      count: 1,
    })),
    sentiment: { positive: 3, neutral: 1, negative: 1 },
    topKeywords: [],
    lowestRatedReview: null,
    quota: { aiRepliesUsed: 5, aiRepliesLimit: 100, plan: "starter" },
    ...overrides,
  };
}

const WEEKLY_EXTRAS = {
  ratingTrend: [
    { date: "2026-06-06", avg_rating: 4.5, count: 2 },
    { date: "2026-06-10", avg_rating: 3.0, count: 1 },
  ],
  avgThisWeek: 4.2,
  avgLastWeek: 4.0,
  recovery: { rate: 50, recovered: 2, totalNegative: 4 },
};

test("weekly digest: renders rating trend and recovery sections", () => {
  const { html, text } = renderDailyDigest(
    basePayload({ weekly: WEEKLY_EXTRAS }),
    RENDER_OPTS
  );
  assert.ok(html.includes("Rating Trend"));
  assert.ok(html.includes("▲")); // 4.2 vs 4.0 → up arrow
  assert.ok(html.includes("Recovery"));
  assert.ok(html.includes("50%"));
  assert.ok(html.includes("2 of 4 negative reviews improved"));
  assert.ok(text.includes("Rating trend: 4.2★ this week vs 4.0★ last week"));
  assert.ok(text.includes("Recovery: 50% — 2 of 4 negative reviews improved"));
});

test("weekly digest: recovery section omitted when recovery is null (zero monitored negatives)", () => {
  const { html, text } = renderDailyDigest(
    basePayload({ weekly: { ...WEEKLY_EXTRAS, recovery: null } }),
    RENDER_OPTS
  );
  assert.ok(!html.includes(">Recovery<"));
  assert.ok(!text.includes("Recovery:"));
  // Rating trend still present
  assert.ok(html.includes("Rating Trend"));
});

test("weekly digest: recovery section omitted when totalNegative is 0", () => {
  const { html } = renderDailyDigest(
    basePayload({
      weekly: {
        ...WEEKLY_EXTRAS,
        recovery: { rate: 0, recovered: 0, totalNegative: 0 },
      },
    }),
    RENDER_OPTS
  );
  assert.ok(!html.includes(">Recovery<"));
});

test("weekly digest: down arrow when this week is worse", () => {
  const { html } = renderDailyDigest(
    basePayload({
      weekly: { ...WEEKLY_EXTRAS, avgThisWeek: 3.5, avgLastWeek: 4.0 },
    }),
    RENDER_OPTS
  );
  assert.ok(html.includes("▼"));
});

test("daily digest: no weekly sections when payload.weekly is absent", () => {
  const { html, text } = renderDailyDigest(
    basePayload({ period: "daily" }), // no weekly field
    RENDER_OPTS
  );
  assert.ok(!html.includes("Rating Trend"));
  assert.ok(!html.includes(">Recovery<"));
  assert.ok(!text.includes("Rating trend:"));
  assert.ok(!text.includes("Recovery:"));
});
