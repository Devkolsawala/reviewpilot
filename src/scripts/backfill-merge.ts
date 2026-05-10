// Pure merge logic for the external_review_id backfill. Extracted from the
// runner script so it can be unit-tested without a database. Given a
// "corrupt" row (UUID in external_review_id, possibly bearing user-touched
// state) and a "canonical" row (the gp:-prefixed row that already exists for
// the same author+text+rating+time-window), produce the merged row payload
// to UPDATE onto the canonical row, plus a deletion flag for the corrupt row.
//
// Merge rules — locked in with the user, do not change without sign-off:
//   reply_text                 — corrupt wins if non-null
//   reply_status               — precedence: published > approved > drafted > pending > failed
//   reply_published_at         — non-null wins; both → MAX
//   reply_first_published_at   — non-null wins; both → MIN
//   reply_last_edited_at       — non-null wins; both → MAX
//   reply_edit_count           — MAX
//   is_read                    — OR
//   is_auto_replied            — OR
//   skip_auto_reply            — OR
//   last_seen_in_api_at        — MAX
//
// Identity / Google-sourced / derived columns are NEVER merged from the
// corrupt row — the canonical row's values are authoritative.

export interface ReviewRow {
  id: string;
  external_review_id: string;
  reply_text: string | null;
  reply_status: "pending" | "drafted" | "approved" | "published" | "failed";
  reply_published_at: string | null;
  reply_first_published_at: string | null;
  reply_last_edited_at: string | null;
  reply_edit_count: number | null;
  is_read: boolean | null;
  is_auto_replied: boolean | null;
  skip_auto_reply: boolean | null;
  last_seen_in_api_at: string | null;
}

export type ReplyStatus = ReviewRow["reply_status"];

const REPLY_STATUS_RANK: Record<ReplyStatus, number> = {
  published: 4,
  approved: 3,
  drafted: 2,
  pending: 1,
  failed: 0,
};

export function pickReplyStatus(a: ReplyStatus, b: ReplyStatus): ReplyStatus {
  return REPLY_STATUS_RANK[a] >= REPLY_STATUS_RANK[b] ? a : b;
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function minIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

export interface MergePlan {
  /** Patch to UPDATE onto the canonical row (id = canonical.id). */
  canonical_update: Partial<ReviewRow>;
  /** Whether to DELETE the corrupt row after the update lands. Always true
   *  on a real merge; the field exists for symmetry / future flags. */
  delete_corrupt: true;
  /** Per-field decisions, for human-readable dry-run output. */
  decisions: Array<{ field: keyof ReviewRow; from: "corrupt" | "canonical" | "both" | "neither"; value: unknown }>;
}

/** Build the merge plan for a (corrupt, canonical) pair. Pure — no I/O. */
export function planMerge(corrupt: ReviewRow, canonical: ReviewRow): MergePlan {
  const update: Partial<ReviewRow> = {};
  const decisions: MergePlan["decisions"] = [];

  // reply_text — corrupt wins if non-null, else canonical
  if (corrupt.reply_text != null && corrupt.reply_text !== canonical.reply_text) {
    update.reply_text = corrupt.reply_text;
    decisions.push({ field: "reply_text", from: "corrupt", value: corrupt.reply_text });
  } else {
    decisions.push({
      field: "reply_text",
      from: corrupt.reply_text != null ? "both" : (canonical.reply_text != null ? "canonical" : "neither"),
      value: canonical.reply_text,
    });
  }

  // reply_status — precedence-based
  const mergedStatus = pickReplyStatus(corrupt.reply_status, canonical.reply_status);
  if (mergedStatus !== canonical.reply_status) {
    update.reply_status = mergedStatus;
    decisions.push({ field: "reply_status", from: "corrupt", value: mergedStatus });
  } else {
    decisions.push({ field: "reply_status", from: "canonical", value: mergedStatus });
  }

  // reply_published_at — non-null wins; both → MAX
  const mergedPublished = maxIso(corrupt.reply_published_at, canonical.reply_published_at);
  if (mergedPublished !== canonical.reply_published_at) {
    update.reply_published_at = mergedPublished;
    decisions.push({ field: "reply_published_at", from: "corrupt", value: mergedPublished });
  } else {
    decisions.push({ field: "reply_published_at", from: "canonical", value: mergedPublished });
  }

  // reply_first_published_at — non-null wins; both → MIN
  const mergedFirst = minIso(corrupt.reply_first_published_at, canonical.reply_first_published_at);
  if (mergedFirst !== canonical.reply_first_published_at) {
    update.reply_first_published_at = mergedFirst;
    decisions.push({ field: "reply_first_published_at", from: "corrupt", value: mergedFirst });
  } else {
    decisions.push({ field: "reply_first_published_at", from: "canonical", value: mergedFirst });
  }

  // reply_last_edited_at — non-null wins; both → MAX
  const mergedLast = maxIso(corrupt.reply_last_edited_at, canonical.reply_last_edited_at);
  if (mergedLast !== canonical.reply_last_edited_at) {
    update.reply_last_edited_at = mergedLast;
    decisions.push({ field: "reply_last_edited_at", from: "corrupt", value: mergedLast });
  } else {
    decisions.push({ field: "reply_last_edited_at", from: "canonical", value: mergedLast });
  }

  // reply_edit_count — MAX
  const corruptEdits = corrupt.reply_edit_count ?? 0;
  const canonicalEdits = canonical.reply_edit_count ?? 0;
  const mergedEdits = Math.max(corruptEdits, canonicalEdits);
  if (mergedEdits !== canonicalEdits) {
    update.reply_edit_count = mergedEdits;
    decisions.push({ field: "reply_edit_count", from: "corrupt", value: mergedEdits });
  } else {
    decisions.push({ field: "reply_edit_count", from: "canonical", value: mergedEdits });
  }

  // is_read — OR (sticky true)
  const mergedRead = !!corrupt.is_read || !!canonical.is_read;
  if (mergedRead !== !!canonical.is_read) {
    update.is_read = mergedRead;
    decisions.push({ field: "is_read", from: "corrupt", value: mergedRead });
  } else {
    decisions.push({ field: "is_read", from: "canonical", value: mergedRead });
  }

  // is_auto_replied — OR
  const mergedAuto = !!corrupt.is_auto_replied || !!canonical.is_auto_replied;
  if (mergedAuto !== !!canonical.is_auto_replied) {
    update.is_auto_replied = mergedAuto;
    decisions.push({ field: "is_auto_replied", from: "corrupt", value: mergedAuto });
  } else {
    decisions.push({ field: "is_auto_replied", from: "canonical", value: mergedAuto });
  }

  // skip_auto_reply — OR
  const mergedSkip = !!corrupt.skip_auto_reply || !!canonical.skip_auto_reply;
  if (mergedSkip !== !!canonical.skip_auto_reply) {
    update.skip_auto_reply = mergedSkip;
    decisions.push({ field: "skip_auto_reply", from: "corrupt", value: mergedSkip });
  } else {
    decisions.push({ field: "skip_auto_reply", from: "canonical", value: mergedSkip });
  }

  // last_seen_in_api_at — MAX
  const mergedSeen = maxIso(corrupt.last_seen_in_api_at, canonical.last_seen_in_api_at);
  if (mergedSeen !== canonical.last_seen_in_api_at) {
    update.last_seen_in_api_at = mergedSeen;
    decisions.push({ field: "last_seen_in_api_at", from: "corrupt", value: mergedSeen });
  } else {
    decisions.push({ field: "last_seen_in_api_at", from: "canonical", value: mergedSeen });
  }

  return { canonical_update: update, delete_corrupt: true, decisions };
}
