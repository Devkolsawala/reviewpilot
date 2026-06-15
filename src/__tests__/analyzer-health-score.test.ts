// Run with: npm test
//
// Scope: the deterministic Review Health Score. Pins the sub-score math, the
// weighted composite, grade thresholds, determinism, and the low-confidence
// flag. No AI, no I/O — pure function, so the expected numbers are exact.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeHealthScore,
  responseRateBenchmark,
  trendDirection,
  type HealthScoreInput,
} from "../lib/analyzer/health-score";

const base = (overrides: Partial<HealthScoreInput> = {}): HealthScoreInput => ({
  responseRate: 0,
  unrepliedNegativeCount: 0,
  sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
  ratingTrend90d: [],
  reviewCount: 0,
  ...overrides,
});

// ── Sub-score math ───────────────────────────────────────────────────────────

test("response-rate sub-score is the rounded percentage", () => {
  const h = computeHealthScore(base({ responseRate: 0.5, reviewCount: 100 }));
  assert.equal(h.components.responseRate, 50);
});

test("unreplied-negatives sub-score: 20% of feed → 50", () => {
  const h = computeHealthScore(
    base({ unrepliedNegativeCount: 20, reviewCount: 100 })
  );
  assert.equal(h.components.unrepliedNegatives, 50);
});

test("unreplied-negatives sub-score bottoms out at the 40% floor", () => {
  const h = computeHealthScore(
    base({ unrepliedNegativeCount: 40, reviewCount: 100 })
  );
  assert.equal(h.components.unrepliedNegatives, 0);
});

test("sentiment sub-score maps net (pos − neg)/total from -1..1 to 0..100", () => {
  const h = computeHealthScore(
    base({
      reviewCount: 100,
      sentimentBreakdown: { positive: 80, neutral: 10, negative: 10 },
    })
  );
  // net = (80 - 10)/100 = 0.7 → (1.7/2)*100 = 85
  assert.equal(h.components.sentiment, 85);
});

test("recency sub-score is 25 when there is no 90-day trend but reviews exist", () => {
  // freshness 0 (no recent points) + neutral trajectory 0.5 → (0 + 0.5)/2 *100
  const h = computeHealthScore(base({ reviewCount: 100 }));
  assert.equal(h.components.recency, 25);
});

// ── Composite + grades ───────────────────────────────────────────────────────

test("pinned mid composite → score 57, grade C", () => {
  const h = computeHealthScore(
    base({
      responseRate: 0.5,
      unrepliedNegativeCount: 20,
      reviewCount: 100,
      sentimentBreakdown: { positive: 80, neutral: 10, negative: 10 },
    })
  );
  // 50*.30 + 50*.25 + 85*.30 + 25*.15 = 56.75 → 57
  assert.equal(h.score, 57);
  assert.equal(h.grade, "C");
});

test("excellent app → grade A", () => {
  const h = computeHealthScore({
    responseRate: 1,
    unrepliedNegativeCount: 0,
    reviewCount: 100,
    sentimentBreakdown: { positive: 100, neutral: 0, negative: 0 },
    ratingTrend90d: [
      { date: "2026-01-01", avg: 4, count: 50 },
      { date: "2026-03-01", avg: 5, count: 50 },
    ],
  });
  assert.equal(h.grade, "A");
  assert.ok(h.score >= 85, `expected >=85, got ${h.score}`);
});

test("unmanaged, negative app → grade F", () => {
  const h = computeHealthScore(
    base({
      responseRate: 0,
      unrepliedNegativeCount: 50,
      reviewCount: 100,
      sentimentBreakdown: { positive: 5, neutral: 5, negative: 90 },
    })
  );
  assert.equal(h.grade, "F");
  assert.ok(h.score < 40, `expected <40, got ${h.score}`);
});

test("score is always within 0..100 for extreme inputs", () => {
  const hi = computeHealthScore(
    base({ responseRate: 5, reviewCount: 100 }) // out-of-range on purpose
  );
  assert.ok(hi.score >= 0 && hi.score <= 100);
  assert.ok(hi.components.responseRate <= 100);
});

// ── Determinism ──────────────────────────────────────────────────────────────

test("same input yields identical output", () => {
  const input = base({
    responseRate: 0.42,
    unrepliedNegativeCount: 7,
    reviewCount: 63,
    sentimentBreakdown: { positive: 40, neutral: 13, negative: 10 },
    ratingTrend90d: [
      { date: "2026-04-01", avg: 3.2, count: 10 },
      { date: "2026-05-01", avg: 4.1, count: 20 },
    ],
  });
  assert.deepEqual(computeHealthScore(input), computeHealthScore(input));
});

// ── Low-confidence flag ──────────────────────────────────────────────────────

test("lowConfidence is true below 20 reviews, false at/above", () => {
  assert.equal(computeHealthScore(base({ reviewCount: 10 })).lowConfidence, true);
  assert.equal(computeHealthScore(base({ reviewCount: 50 })).lowConfidence, false);
});

// ── Benchmark + trend helpers ────────────────────────────────────────────────

test("responseRateBenchmark interpolates the percentage and stays heuristic", () => {
  const msg = responseRateBenchmark(0.12);
  assert.match(msg, /12%/);
  assert.match(msg, /apps we analyze/);
});

test("trendDirection classifies improving / declining / steady", () => {
  assert.equal(
    trendDirection([
      { date: "2026-01-01", avg: 3, count: 10 },
      { date: "2026-03-01", avg: 4.5, count: 10 },
    ]).label,
    "improving"
  );
  assert.equal(
    trendDirection([
      { date: "2026-01-01", avg: 4.5, count: 10 },
      { date: "2026-03-01", avg: 3, count: 10 },
    ]).label,
    "declining"
  );
  assert.equal(trendDirection([]).label, "not enough recent data");
});
