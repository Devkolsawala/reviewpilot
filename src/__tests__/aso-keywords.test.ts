import { test } from "node:test";
import assert from "node:assert/strict";
import { extractListingKeywords } from "../lib/aso/keywords";

test("aso-keywords: mines meaningful uni/bi-grams from competitor listing text", () => {
  const fragments = [
    "Splitwise: Split Bills", // title
    "Track expenses and split bills with friends", // short desc
    // long desc — repeats reinforce frequency ranking
    "Split bills and track expenses easily. Split shared expenses with " +
      "friends and roommates. Track group expenses, settle up, and split " +
      "rent. Expense tracker for shared bills.",
  ];
  const kws = extractListingKeywords(fragments);

  // Distinctive domain terms surface…
  assert.ok(kws.includes("split"), `expected "split" in ${JSON.stringify(kws)}`);
  assert.ok(kws.includes("expenses"), `expected "expenses" in ${JSON.stringify(kws)}`);
  assert.ok(kws.includes("bills"), `expected "bills" in ${JSON.stringify(kws)}`);
  // …including a two-word phrase.
  assert.ok(
    kws.some((k) => k.includes(" ")),
    `expected at least one bigram in ${JSON.stringify(kws)}`
  );
});

test("aso-keywords: drops stopwords and generic store words", () => {
  const kws = extractListingKeywords([
    "the best free app download it now from google play store",
  ]);
  for (const banned of ["the", "best", "free", "app", "download", "google", "play", "store", "now"]) {
    assert.ok(!kws.includes(banned), `"${banned}" should have been filtered, got ${JSON.stringify(kws)}`);
  }
});

test("aso-keywords: dedupes and caps at the requested max", () => {
  const repeated = Array.from({ length: 50 }, (_, i) => `feature${i} budget planner`).join(" ");
  const kws = extractListingKeywords([repeated], 10);
  assert.ok(kws.length <= 10, `expected <= 10, got ${kws.length}`);
  assert.equal(new Set(kws).size, kws.length, "keywords must be unique");
});

test("aso-keywords: empty / whitespace fragments yield no keywords", () => {
  assert.deepEqual(extractListingKeywords([]), []);
  assert.deepEqual(extractListingKeywords(["", "   ", "\n"]), []);
});
