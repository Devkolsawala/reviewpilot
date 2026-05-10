// Run with: npm test
//
// All tests in this file target NEW code (src/scripts/backfill-merge.ts).
// They cannot fail against pre-fix code because pre-fix code has no
// equivalent merge function. The fail-old/pass-new requirement is enforced
// by the transform tests in playstore-transform.test.ts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { planMerge, pickReplyStatus, type ReviewRow } from "../scripts/backfill-merge";

const blankRow = (overrides: Partial<ReviewRow> = {}): ReviewRow => ({
  id: "row-id",
  external_review_id: "x",
  reply_text: null,
  reply_status: "pending",
  reply_published_at: null,
  reply_first_published_at: null,
  reply_last_edited_at: null,
  reply_edit_count: 0,
  is_read: false,
  is_auto_replied: false,
  skip_auto_reply: false,
  last_seen_in_api_at: null,
  ...overrides,
});

test("reply_status precedence: published > approved > drafted > pending > failed", () => {
  assert.equal(pickReplyStatus("published", "approved"), "published");
  assert.equal(pickReplyStatus("approved", "drafted"), "approved");
  assert.equal(pickReplyStatus("drafted", "pending"), "drafted");
  assert.equal(pickReplyStatus("pending", "failed"), "pending");
  // Symmetry — pickReplyStatus must be commutative on the resulting status
  assert.equal(pickReplyStatus("failed", "drafted"), "drafted");
  assert.equal(pickReplyStatus("pending", "published"), "published");
});

test("merge: corrupt drafted reply wins over canonical pending row", () => {
  const corrupt = blankRow({
    id: "corrupt",
    external_review_id: "2a2b2121-b86a-40c5-81af-3c435e078792",
    reply_text: "Thanks for the kind words! - Dev team",
    reply_status: "drafted",
  });
  const canonical = blankRow({
    id: "canonical",
    external_review_id: "gp:AOqpTOH-real",
    reply_text: null,
    reply_status: "pending",
  });
  const plan = planMerge(corrupt, canonical);
  assert.equal(plan.delete_corrupt, true);
  assert.equal(plan.canonical_update.reply_text, "Thanks for the kind words! - Dev team");
  assert.equal(plan.canonical_update.reply_status, "drafted");
});

test("merge: canonical published wins over corrupt drafted (precedence)", () => {
  const corrupt = blankRow({ reply_status: "drafted", reply_text: "draft" });
  const canonical = blankRow({
    reply_status: "published",
    reply_text: "live reply",
    reply_published_at: "2026-01-01T00:00:00.000Z",
  });
  const plan = planMerge(corrupt, canonical);
  // reply_status stays canonical → no entry in update for it
  assert.equal(plan.canonical_update.reply_status, undefined);
  // reply_text: corrupt is non-null, but rule is "corrupt wins if non-null".
  // We honor the rule literally — the user signed off on it as final.
  assert.equal(plan.canonical_update.reply_text, "draft");
});

test("merge: failed loses to pending (status precedence has failed at bottom)", () => {
  const corrupt = blankRow({ reply_status: "failed" });
  const canonical = blankRow({ reply_status: "pending" });
  const plan = planMerge(corrupt, canonical);
  assert.equal(plan.canonical_update.reply_status, undefined);
});

test("merge: reply_edit_count is MAX, not SUM", () => {
  const corrupt = blankRow({ reply_edit_count: 7 });
  const canonical = blankRow({ reply_edit_count: 3 });
  const plan = planMerge(corrupt, canonical);
  assert.equal(plan.canonical_update.reply_edit_count, 7);
  // Confirm SUM would have been wrong
  assert.notEqual(plan.canonical_update.reply_edit_count, 10);
});

test("merge: boolean flags OR (sticky-true)", () => {
  const corrupt = blankRow({ is_read: true, is_auto_replied: false, skip_auto_reply: true });
  const canonical = blankRow({ is_read: false, is_auto_replied: true, skip_auto_reply: false });
  const plan = planMerge(corrupt, canonical);
  assert.equal(plan.canonical_update.is_read, true);
  assert.equal(plan.canonical_update.skip_auto_reply, true);
  // is_auto_replied was already true on canonical → no update emitted
  assert.equal(plan.canonical_update.is_auto_replied, undefined);
});

test("merge: reply_first_published_at takes the EARLIER timestamp", () => {
  const earlier = "2026-01-01T00:00:00.000Z";
  const later = "2026-02-01T00:00:00.000Z";
  const corrupt = blankRow({ reply_first_published_at: earlier });
  const canonical = blankRow({ reply_first_published_at: later });
  const plan = planMerge(corrupt, canonical);
  assert.equal(plan.canonical_update.reply_first_published_at, earlier);
});

test("merge: reply_last_edited_at and reply_published_at take the LATER timestamp", () => {
  const earlier = "2026-01-01T00:00:00.000Z";
  const later = "2026-02-01T00:00:00.000Z";
  const corrupt = blankRow({
    reply_last_edited_at: later,
    reply_published_at: earlier,
  });
  const canonical = blankRow({
    reply_last_edited_at: earlier,
    reply_published_at: later,
  });
  const plan = planMerge(corrupt, canonical);
  assert.equal(plan.canonical_update.reply_last_edited_at, later);
  // canonical already had the later reply_published_at → no update
  assert.equal(plan.canonical_update.reply_published_at, undefined);
});

test("merge: last_seen_in_api_at is MAX", () => {
  const earlier = "2026-01-01T00:00:00.000Z";
  const later = "2026-05-01T00:00:00.000Z";
  const corrupt = blankRow({ last_seen_in_api_at: earlier });
  const canonical = blankRow({ last_seen_in_api_at: later });
  const plan = planMerge(corrupt, canonical);
  assert.equal(plan.canonical_update.last_seen_in_api_at, undefined);

  const corrupt2 = blankRow({ last_seen_in_api_at: later });
  const canonical2 = blankRow({ last_seen_in_api_at: earlier });
  const plan2 = planMerge(corrupt2, canonical2);
  assert.equal(plan2.canonical_update.last_seen_in_api_at, later);
});

test("merge: reply_text — null on corrupt does not clobber canonical's value", () => {
  const corrupt = blankRow({ reply_text: null });
  const canonical = blankRow({ reply_text: "canonical reply" });
  const plan = planMerge(corrupt, canonical);
  assert.equal(plan.canonical_update.reply_text, undefined);
});

test("merge plan always sets delete_corrupt=true", () => {
  const plan = planMerge(blankRow(), blankRow());
  assert.equal(plan.delete_corrupt, true);
});
