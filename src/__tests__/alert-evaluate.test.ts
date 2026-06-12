import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ALERT_PREFS,
  matchKeyword,
  normalizeKeywords,
  shouldAlert,
  starString,
  truncateExcerpt,
  type AlertableReview,
} from "../lib/alerts/evaluate";

function review(overrides: Partial<AlertableReview> = {}): AlertableReview {
  return {
    id: "r1",
    rating: 1,
    review_text: "App keeps crashing, total waste of money",
    ai_sentiment: "negative",
    ai_urgency: "medium",
    alerted_at: null,
    ...overrides,
  };
}

test("alerts: AI-confirmed negative 1★ review alerts on rating", () => {
  const v = shouldAlert(review(), DEFAULT_ALERT_PREFS);
  assert.equal(v.alert, true);
  assert.equal(v.reason, "rating");
});

test("alerts: 1★ review with POSITIVE AI sentiment does NOT alert (false-alarm gate)", () => {
  const v = shouldAlert(
    review({ rating: 1, ai_sentiment: "positive", review_text: "Love it! 5 stars in my heart" }),
    DEFAULT_ALERT_PREFS
  );
  assert.equal(v.alert, false);
});

test("alerts: 2★ review with NEUTRAL AI sentiment does NOT alert", () => {
  const v = shouldAlert(review({ rating: 2, ai_sentiment: "neutral" }), DEFAULT_ALERT_PREFS);
  assert.equal(v.alert, false);
});

test("alerts: already-alerted review never alerts again", () => {
  const v = shouldAlert(
    review({ alerted_at: "2026-06-11T10:00:00Z" }),
    DEFAULT_ALERT_PREFS
  );
  assert.equal(v.alert, false);
});

test("alerts: negative 4★ review above min_rating does not alert without urgency/keyword", () => {
  const v = shouldAlert(
    review({ rating: 4, ai_urgency: "low", review_text: "meh, getting worse" }),
    DEFAULT_ALERT_PREFS
  );
  assert.equal(v.alert, false);
});

test("alerts: high/critical urgency alerts even above the rating threshold", () => {
  for (const urgency of ["high", "critical"]) {
    const v = shouldAlert(review({ rating: 3, ai_urgency: urgency }), DEFAULT_ALERT_PREFS);
    assert.equal(v.alert, true, `urgency=${urgency}`);
    assert.equal(v.reason, "urgency");
  }
});

test("alerts: keyword match alerts above the rating threshold", () => {
  const v = shouldAlert(
    review({ rating: 3, ai_urgency: "low", review_text: "I want a REFUND immediately" }),
    { ...DEFAULT_ALERT_PREFS, keywords: ["refund"] }
  );
  assert.equal(v.alert, true);
  assert.equal(v.reason, "keyword");
  assert.equal(v.matchedKeyword, "refund");
});

test("alerts: keyword matching is word-boundary, not substring", () => {
  assert.equal(matchKeyword("this is refundable", ["refund"]), null);
  assert.equal(matchKeyword("no refund given", ["refund"]), "refund");
  assert.equal(matchKeyword("REFUND please", ["refund"]), "refund");
  assert.equal(matchKeyword(null, ["refund"]), null);
});

test("alerts: regex special characters in keywords are escaped", () => {
  assert.equal(matchKeyword("costs $50 (wow)", ["$50"]), "$50");
  assert.equal(matchKeyword("anything", ["a+b"]), null);
});

test("alerts: rating null falls through to urgency/keyword paths", () => {
  const v = shouldAlert(
    review({ rating: null, ai_urgency: "low", review_text: "nothing special" }),
    DEFAULT_ALERT_PREFS
  );
  assert.equal(v.alert, false);
  const v2 = shouldAlert(review({ rating: null, ai_urgency: "high" }), DEFAULT_ALERT_PREFS);
  assert.equal(v2.alert, true);
});

test("alerts: truncateExcerpt caps at 300 chars with ellipsis", () => {
  const long = "x".repeat(500);
  const out = truncateExcerpt(long, 300);
  assert.equal(out.length, 300);
  assert.ok(out.endsWith("…"));
  assert.equal(truncateExcerpt("short"), "short");
  assert.equal(truncateExcerpt(null), "");
});

test("alerts: starString renders rating", () => {
  assert.equal(starString(1), "★☆☆☆☆");
  assert.equal(starString(5), "★★★★★");
  assert.equal(starString(null), "☆☆☆☆☆");
});

test("alerts: normalizeKeywords lowercases, dedupes, enforces caps", () => {
  assert.deepEqual(normalizeKeywords(["Refund", "  SCAM ", "refund", ""]), ["refund", "scam"]);
  assert.equal(normalizeKeywords("not-an-array"), null);
  assert.equal(normalizeKeywords([1, 2]), null);
  assert.equal(normalizeKeywords(["x".repeat(31)]), null);
  assert.equal(
    normalizeKeywords(Array.from({ length: 11 }, (_, i) => `kw${i}`)),
    null
  );
  assert.deepEqual(
    normalizeKeywords(Array.from({ length: 10 }, (_, i) => `kw${i}`))?.length,
    10
  );
});
