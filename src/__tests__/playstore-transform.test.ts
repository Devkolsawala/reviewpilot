// Run with: npm test
//
// Scope: assert the transform's missing-reviewId guard. Google's reviewId
// format is opaque (we have observed both "gp:AOqpTOH..." and bare
// UUID-shaped strings from the live API), so this file does NOT enforce
// any prefix. The transform passes the value through unchanged.
//
// fail-old / pass-new: the missing/empty/whitespace tests fail against the
// pre-fix transform (which returned a Review with external_review_id: "")
// and pass against the new transform (which skips the row).

import { test } from "node:test";
import assert from "node:assert/strict";
import { transformPlayStoreReview } from "../lib/google/playstore";

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

test("transform: well-formed gp: reviewId passes through unchanged", () => {
  const result = transformPlayStoreReview(baseReview() as Parameters<typeof transformPlayStoreReview>[0]);
  assert.notEqual(result, null);
  assert.equal(result!.external_review_id, "gp:AOqpTOH-base");
});

test("transform: UUID-shaped reviewId is accepted (Google returns these for some reviews)", () => {
  const uuid = "2a2b2121-b86a-40c5-81af-3c435e078792";
  const result = transformPlayStoreReview(
    baseReview({ reviewId: uuid }) as Parameters<typeof transformPlayStoreReview>[0]
  );
  assert.notEqual(result, null);
  assert.equal(result!.external_review_id, uuid);
});

test("transform: missing reviewId returns null (regression guard against silent empty-string insert)", () => {
  const result = transformPlayStoreReview(
    baseReview({ reviewId: undefined }) as Parameters<typeof transformPlayStoreReview>[0]
  );
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

test("transform: missing userComment returns null", () => {
  const result = transformPlayStoreReview(
    baseReview({ comments: [] }) as Parameters<typeof transformPlayStoreReview>[0]
  );
  assert.equal(result, null);
});
