import { test } from "node:test";
import assert from "node:assert/strict";
import { previousWindow, metricsFromRows } from "../lib/digest/execMetrics";

test("exec metrics: previousWindow is the same-length window ending at periodStart", () => {
  const periodStart = new Date("2026-06-05T09:00:00.000Z");
  const periodEnd = new Date("2026-06-12T09:00:00.000Z");
  const { prevStart, prevEnd } = previousWindow(periodStart, periodEnd);
  assert.equal(prevEnd.toISOString(), periodStart.toISOString());
  assert.equal(prevStart.toISOString(), "2026-05-29T09:00:00.000Z");
  // Same length
  assert.equal(
    prevEnd.getTime() - prevStart.getTime(),
    periodEnd.getTime() - periodStart.getTime()
  );
});

test("exec metrics: previousWindow handles non-7-day windows", () => {
  const periodStart = new Date("2026-06-12T00:00:00.000Z");
  const periodEnd = new Date("2026-06-12T18:30:00.000Z");
  const { prevStart, prevEnd } = previousWindow(periodStart, periodEnd);
  assert.equal(prevEnd.getTime(), periodStart.getTime());
  assert.equal(prevStart.toISOString(), "2026-06-11T05:30:00.000Z");
});

function row(overrides: Record<string, unknown> = {}) {
  return {
    rating: 4 as number | null,
    reply_status: "published" as string | null,
    review_created_at: "2026-06-10T10:00:00.000Z",
    ai_theme: null as string | null,
    ai_sentiment: null as string | null,
    ai_urgency: null as string | null,
    ai_aspects: null as Record<string, string> | null,
    ...overrides,
  };
}

test("exec metrics: fills previously-stubbed fields from rows", () => {
  const current = [
    row({ rating: 5, reply_status: "published", ai_theme: "great support", ai_sentiment: "positive" }),
    row({ rating: 1, reply_status: "pending", ai_theme: "camera crashes", ai_sentiment: "negative", ai_urgency: "critical" }),
    row({ rating: 2, reply_status: "drafted", ai_theme: "camera crashes", ai_sentiment: "negative" }),
    row({ rating: 4, reply_status: "published", ai_theme: "great support", ai_sentiment: "positive" }),
    row({ rating: 1, reply_status: "pending", ai_theme: "camera crashes", ai_sentiment: "negative" }),
  ];
  const prev = [
    row({ rating: 3, reply_status: "published", ai_theme: "camera crashes" }),
  ];

  const m = metricsFromRows(current, prev);

  assert.equal(m.totalReviews, 5);
  assert.equal(m.totalReviewsPrev, 1);
  assert.equal(m.avgRating, 2.6); // (5+1+2+4+1)/5
  assert.equal(m.avgRatingPrev, 3);
  // Response rate matches the analytics calc: published / (pub+pending+drafted)
  assert.equal(m.responseRate, 40); // 2 of 5
  assert.equal(m.responseRatePrev, 100);
  assert.equal(m.criticalCount, 1);
  // Themes ranked by count, trend vs previous period
  assert.equal(m.topThemes.length, 2);
  assert.equal(m.topThemes[0].theme, "camera crashes");
  assert.equal(m.topThemes[0].count, 3);
  assert.equal(m.topThemes[0].trend, 200); // 1 → 3
  assert.equal(m.topThemes[1].theme, "great support");
  assert.equal(m.topThemes[1].trend, 0); // no prior data → 0
});

test("exec metrics: empty windows produce safe zeros, not NaN", () => {
  const m = metricsFromRows([], []);
  assert.equal(m.totalReviews, 0);
  assert.equal(m.totalReviewsPrev, 0);
  assert.equal(m.avgRating, 0);
  assert.equal(m.avgRatingPrev, 0);
  assert.equal(m.responseRate, 0);
  assert.equal(m.responseRatePrev, 0);
  assert.deepEqual(m.topThemes, []);
  assert.equal(m.criticalCount, 0);
  assert.equal(m.topNegativeAspect, null);
  assert.equal(m.topPositiveAspect, null);
});

test("exec metrics: aspect extremes from ai_aspects", () => {
  const current = [
    row({ rating: 1, ai_aspects: { performance: "negative" } }),
    row({ rating: 2, ai_aspects: { performance: "negative" } }),
    row({ rating: 5, ai_aspects: { support: "positive" } }),
    row({ rating: 5, ai_aspects: { support: "positive" } }),
  ];
  const m = metricsFromRows(current, []);
  assert.equal(m.topNegativeAspect?.aspect, "performance");
  assert.equal(m.topNegativeAspect?.net, -100);
  assert.equal(m.topPositiveAspect?.aspect, "support");
  assert.equal(m.topPositiveAspect?.net, 100);
});
