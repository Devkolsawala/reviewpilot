// Run with: npm test
//
// What these tests assert (and what they DO NOT assert):
//   PASS-NEW / FAIL-OLD:
//     - Missing reviewId now returns null (skip) instead of producing a row
//       with external_review_id: "". Old code returned the empty-string row.
//   PASS-NEW only (no historical equivalent):
//     - Non-`gp:`-prefixed reviewIds emit a console.warn. There was no warn
//       before. This is observability, not a behavioral regression test.
//
// What we explicitly DO NOT claim a fail-old/pass-new test for:
//   - external_review_id === input.reviewId on a well-formed input. The
//     current transform line `external_review_id: review.reviewId` was
//     already correct in the live code; the production bug is historical
//     data, not a live transform fault. A passing test here proves the
//     contract holds, not that it was previously broken.

import { test } from "node:test";
import assert from "node:assert/strict";
import { transformPlayStoreReview } from "../lib/google/playstore";

// Stub the AI sentiment module — it's imported transitively but we don't
// want network/model calls in unit tests.
// (sentiment.ts is pure-string today; no stub needed. If it ever changes
// to call an LLM, mock it here.)

const baseReview = (overrides: Record<string, unknown> = {}) => ({
  reviewId: "gp:AOqpTOH-base",
  authorName: "Asha P.",
  comments: [
    {
      userComment: {
        text: "Loved the latest update.",
        starRating: 5,
        reviewerLanguage: "en_IN",
        lastModified: { seconds: "1700000000", nanos: 0 },
      },
    },
  ],
  ...overrides,
});

test("transform: well-formed input produces external_review_id === reviewId", () => {
  const result = transformPlayStoreReview(baseReview() as Parameters<typeof transformPlayStoreReview>[0]);
  assert.notEqual(result, null);
  assert.equal(result!.external_review_id, "gp:AOqpTOH-base");
});

test("transform: missing reviewId returns null (regression guard for 'gp: substituted with empty string')", () => {
  const result = transformPlayStoreReview(
    baseReview({ reviewId: undefined }) as Parameters<typeof transformPlayStoreReview>[0]
  );
  // OLD behavior: would return a Review with external_review_id: "".
  // NEW behavior: returns null (row is skipped) because there is no
  // recoverable Play Store id for that row.
  assert.equal(result, null);
});

test("transform: empty-string reviewId returns null", () => {
  const result = transformPlayStoreReview(
    baseReview({ reviewId: "" }) as Parameters<typeof transformPlayStoreReview>[0]
  );
  assert.equal(result, null);
});

test("transform: whitespace-only reviewId returns null", () => {
  const result = transformPlayStoreReview(
    baseReview({ reviewId: "   " }) as Parameters<typeof transformPlayStoreReview>[0]
  );
  assert.equal(result, null);
});

test("transform: non-`gp:` reviewId still produces a row but warns", () => {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: unknown) => { warnings.push(String(msg)); };
  try {
    const result = transformPlayStoreReview(
      baseReview({ reviewId: "weird:format-123" }) as Parameters<typeof transformPlayStoreReview>[0]
    );
    assert.notEqual(result, null);
    assert.equal(result!.external_review_id, "weird:format-123");
    assert.ok(
      warnings.some((w) => w.includes("does not match /^gp:/")),
      `expected a /^gp:/ warning, got: ${JSON.stringify(warnings)}`
    );
  } finally {
    console.warn = origWarn;
  }
});

test("transform: missing userComment returns null", () => {
  const result = transformPlayStoreReview(
    baseReview({ comments: [] }) as Parameters<typeof transformPlayStoreReview>[0]
  );
  assert.equal(result, null);
});
