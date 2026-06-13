import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeVersionMetrics,
  computeThemeDeltas,
  selectDefaultComparison,
  compareVersions,
  analyzeVersionImpact,
  filterVersionedReviews,
  MIN_REVIEWS_FOR_CONFIDENCE,
  type VersionedReview,
} from "../lib/version-impact/analyze";

function r(overrides: Partial<VersionedReview> = {}): VersionedReview {
  return {
    rating: 5,
    reply_status: "published",
    review_created_at: "2026-01-01T00:00:00.000Z",
    source: "play_store",
    app_version_name: "1.0.0",
    app_version_code: 100,
    ai_theme: null,
    ai_sentiment: null,
    ...overrides,
  };
}

// ── Source / version filtering ────────────────────────────────────────────────

test("filters out non-play_store and version-less reviews", () => {
  const rows: VersionedReview[] = [
    r({ source: "play_store", app_version_name: "1.0.0" }),
    r({ source: "whatsapp", app_version_name: null }),
    r({ source: "google_business", app_version_name: null }),
    r({ source: "play_store", app_version_name: null }), // "version not reported"
    r({ source: "play_store", app_version_name: "  " }), // blank
  ];
  const kept = filterVersionedReviews(rows);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].app_version_name, "1.0.0");
});

test("no versioned reviews → empty result, hasVersionedReviews false", () => {
  const rows: VersionedReview[] = [
    r({ source: "whatsapp", app_version_name: null, rating: 4 }),
    r({ source: "google_business", app_version_name: null, rating: 3 }),
  ];
  const result = analyzeVersionImpact(rows);
  assert.equal(result.versions.length, 0);
  assert.equal(result.hasVersionedReviews, false);
  assert.equal(result.comparison, null);
});

// ── Per-version aggregation ──────────────────────────────────────────────────

test("per-version aggregation: count, avg rating, sentiment split, date range", () => {
  const rows: VersionedReview[] = [
    r({ app_version_name: "2.0.0", app_version_code: 200, rating: 5, review_created_at: "2026-02-01T00:00:00.000Z" }),
    r({ app_version_name: "2.0.0", app_version_code: 200, rating: 4, review_created_at: "2026-02-05T00:00:00.000Z" }),
    r({ app_version_name: "2.0.0", app_version_code: 200, rating: 5, review_created_at: "2026-02-03T00:00:00.000Z" }),
    r({ app_version_name: "2.0.0", app_version_code: 200, rating: 1, review_created_at: "2026-02-02T00:00:00.000Z" }),
    r({ app_version_name: "2.0.0", app_version_code: 200, rating: 2, review_created_at: "2026-02-04T00:00:00.000Z" }),
  ];
  const [v] = computeVersionMetrics(rows);
  assert.equal(v.versionName, "2.0.0");
  assert.equal(v.versionCode, 200);
  assert.equal(v.count, 5);
  assert.equal(v.avgRating, 3.4); // (5+4+5+1+2)/5
  // ratings → sentiment: 5,4,5 positive; 1,2 negative
  assert.equal(v.sentiment.positive, 3);
  assert.equal(v.sentiment.negative, 2);
  assert.equal(v.sentiment.neutral, 0);
  assert.equal(v.sentiment.positivePct, 60);
  assert.equal(v.sentiment.negativePct, 40);
  assert.equal(v.firstSeen, "2026-02-01T00:00:00.000Z");
  assert.equal(v.lastSeen, "2026-02-05T00:00:00.000Z");
});

test("avgRating is null when no rated reviews; sentiment falls back to ai_sentiment", () => {
  const rows: VersionedReview[] = [
    r({ app_version_name: "1.0.0", rating: null, ai_sentiment: "negative" }),
    r({ app_version_name: "1.0.0", rating: null, ai_sentiment: "positive" }),
  ];
  const [v] = computeVersionMetrics(rows);
  assert.equal(v.avgRating, null);
  assert.equal(v.sentiment.positive, 1);
  assert.equal(v.sentiment.negative, 1);
});

// ── Ordering ─────────────────────────────────────────────────────────────────

test("versions sorted newest-first by code, NULL codes last", () => {
  const rows: VersionedReview[] = [
    r({ app_version_name: "1.0.0", app_version_code: 100 }),
    r({ app_version_name: "3.0.0", app_version_code: 300 }),
    r({ app_version_name: "2.0.0", app_version_code: 200 }),
    r({ app_version_name: "9.9.9", app_version_code: null, review_created_at: "2026-03-01T00:00:00.000Z" }),
  ];
  const versions = computeVersionMetrics(rows);
  assert.deepEqual(
    versions.map((v) => v.versionName),
    ["3.0.0", "2.0.0", "1.0.0", "9.9.9"]
  );
});

// ── Low-sample flagging ──────────────────────────────────────────────────────

test("low-sample flag set below the threshold", () => {
  const few = Array.from({ length: MIN_REVIEWS_FOR_CONFIDENCE - 1 }, () =>
    r({ app_version_name: "1.0.0", app_version_code: 100 })
  );
  const many = Array.from({ length: MIN_REVIEWS_FOR_CONFIDENCE }, () =>
    r({ app_version_name: "2.0.0", app_version_code: 200 })
  );
  const versions = computeVersionMetrics([...few, ...many]);
  const v1 = versions.find((v) => v.versionName === "1.0.0")!;
  const v2 = versions.find((v) => v.versionName === "2.0.0")!;
  assert.equal(v1.lowSample, true);
  assert.equal(v2.lowSample, false);
});

// ── Default comparison selection ─────────────────────────────────────────────

test("default comparison skips low-sample versions for the baseline", () => {
  const versions = computeVersionMetrics([
    ...Array.from({ length: 10 }, () => r({ app_version_name: "3.0.0", app_version_code: 300 })),
    ...Array.from({ length: 2 }, () => r({ app_version_name: "2.0.0", app_version_code: 200 })), // low sample
    ...Array.from({ length: 10 }, () => r({ app_version_name: "1.0.0", app_version_code: 100 })),
  ]);
  const def = selectDefaultComparison(versions);
  assert.deepEqual(def, { versionAName: "1.0.0", versionBName: "3.0.0" });
});

test("default comparison falls back to immediate predecessor when none has enough data", () => {
  const versions = computeVersionMetrics([
    ...Array.from({ length: 10 }, () => r({ app_version_name: "2.0.0", app_version_code: 200 })),
    ...Array.from({ length: 2 }, () => r({ app_version_name: "1.0.0", app_version_code: 100 })), // low sample
  ]);
  const def = selectDefaultComparison(versions);
  assert.deepEqual(def, { versionAName: "1.0.0", versionBName: "2.0.0" });
});

test("single version → no default comparison", () => {
  const versions = computeVersionMetrics(
    Array.from({ length: 8 }, () => r({ app_version_name: "1.0.0", app_version_code: 100 }))
  );
  assert.equal(versions.length, 1);
  assert.equal(selectDefaultComparison(versions), null);

  const result = analyzeVersionImpact(
    Array.from({ length: 8 }, () => r({ app_version_name: "1.0.0", app_version_code: 100 }))
  );
  assert.equal(result.hasVersionedReviews, true);
  assert.equal(result.comparison, null);
});

// ── Theme deltas ─────────────────────────────────────────────────────────────

test("theme deltas: rise %, fall %, brand-new theme (null pct)", () => {
  const reviewsA: VersionedReview[] = [
    ...Array.from({ length: 2 }, () => r({ ai_theme: "crashes", rating: 1 })),
    ...Array.from({ length: 5 }, () => r({ ai_theme: "login", rating: 2 })),
  ];
  const reviewsB: VersionedReview[] = [
    ...Array.from({ length: 6 }, () => r({ ai_theme: "crashes", rating: 1 })),
    ...Array.from({ length: 2 }, () => r({ ai_theme: "login", rating: 2 })),
    ...Array.from({ length: 3 }, () => r({ ai_theme: "new ui", rating: 3 })),
  ];
  const deltas = computeThemeDeltas(reviewsA, reviewsB);

  const crashes = deltas.find((d) => d.theme === "crashes")!;
  assert.equal(crashes.countA, 2);
  assert.equal(crashes.countB, 6);
  assert.equal(crashes.delta, 4);
  assert.equal(crashes.changePct, 200);
  assert.equal(crashes.direction, "up");

  const login = deltas.find((d) => d.theme === "login")!;
  assert.equal(login.delta, -3);
  assert.equal(login.changePct, -60);
  assert.equal(login.direction, "down");

  const newUi = deltas.find((d) => d.theme === "new ui")!;
  assert.equal(newUi.countA, 0);
  assert.equal(newUi.changePct, null); // brand new
  assert.equal(newUi.direction, "up");
});

test("theme deltas: themes with no movement are dropped, sorted by magnitude", () => {
  const reviewsA: VersionedReview[] = [r({ ai_theme: "stable", rating: 4 })];
  const reviewsB: VersionedReview[] = [
    r({ ai_theme: "stable", rating: 4 }), // unchanged → dropped
    ...Array.from({ length: 5 }, () => r({ ai_theme: "ads", rating: 1 })),
  ];
  const deltas = computeThemeDeltas(reviewsA, reviewsB);
  assert.equal(deltas.length, 1);
  assert.equal(deltas[0].theme, "ads");
});

// ── Full comparison ──────────────────────────────────────────────────────────

test("compareVersions: rating/count/sentiment deltas computed B - A", () => {
  const rows: VersionedReview[] = [
    // v1.0.0 (older): 4 reviews, avg 4.5, all positive
    ...Array.from({ length: 4 }, () => r({ app_version_name: "1.0.0", app_version_code: 100, rating: 5 })),
    // make avg 4.5 → one of them is 3? keep simple: ratings [5,5,4,4] avg 4.5
  ];
  rows[2].rating = 4;
  rows[3].rating = 4;
  // v2.0.0 (newer): 6 reviews, avg 2.0, mostly negative
  for (let i = 0; i < 6; i++) {
    rows.push(r({ app_version_name: "2.0.0", app_version_code: 200, rating: i < 4 ? 1 : 4 }));
  }

  const cmp = compareVersions(rows, "1.0.0", "2.0.0")!;
  assert.equal(cmp.versionA.versionName, "1.0.0");
  assert.equal(cmp.versionB.versionName, "2.0.0");
  assert.equal(cmp.versionA.avgRating, 4.5);
  assert.equal(cmp.versionB.avgRating, 2); // (1+1+1+1+4+4)/6 = 2
  assert.equal(cmp.ratingDelta, -2.5);
  assert.equal(cmp.countDelta, 2); // 6 - 4
  // A: 100% positive; B: 4 neg / 2 pos → negPct 67, posPct 33
  assert.equal(cmp.sentimentDelta.negativePct, cmp.versionB.sentiment.negativePct - 0);
});

test("compareVersions returns null when a version is absent", () => {
  const rows: VersionedReview[] = [r({ app_version_name: "1.0.0", app_version_code: 100 })];
  assert.equal(compareVersions(rows, "1.0.0", "9.9.9"), null);
});

test("analyzeVersionImpact honours an explicit requested pair", () => {
  const rows: VersionedReview[] = [
    ...Array.from({ length: 6 }, () => r({ app_version_name: "1.0.0", app_version_code: 100, rating: 5 })),
    ...Array.from({ length: 6 }, () => r({ app_version_name: "2.0.0", app_version_code: 200, rating: 3 })),
    ...Array.from({ length: 6 }, () => r({ app_version_name: "3.0.0", app_version_code: 300, rating: 1 })),
  ];
  // Default would be 2.0.0 → 3.0.0; request 1.0.0 → 3.0.0 instead.
  const result = analyzeVersionImpact(rows, { versionAName: "1.0.0", versionBName: "3.0.0" });
  assert.equal(result.comparison!.versionA.versionName, "1.0.0");
  assert.equal(result.comparison!.versionB.versionName, "3.0.0");
  assert.equal(result.comparison!.ratingDelta, -4); // 1 - 5
});
