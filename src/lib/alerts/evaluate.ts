/**
 * Pure alert-evaluation logic for AI-verified instant negative-review alerts.
 *
 * No I/O and no Supabase imports on purpose — everything here is unit-testable
 * with plain Node. The orchestration (DB gates, notification inserts, email
 * sends) lives in src/lib/alerts/run.ts.
 *
 * The core contract: a review alerts only when the AI insight classifier
 * (classifyReviewInsights → reviews.ai_sentiment) confirmed NEGATIVE sentiment.
 * A 1★ review whose text the AI read as positive/neutral must NOT alert —
 * that is the false-alarm case this feature explicitly prevents.
 */

export interface AlertPrefs {
  enabled: boolean;
  min_rating: number;
  keywords: string[];
  daily_cap: number;
}

export const DEFAULT_ALERT_PREFS: AlertPrefs = {
  enabled: false,
  min_rating: 2,
  keywords: [],
  daily_cap: 5,
};

export interface AlertableReview {
  id: string;
  rating: number | null;
  review_text: string | null;
  ai_sentiment: string | null;
  ai_urgency: string | null;
  alerted_at: string | null;
}

export type AlertReason = "rating" | "urgency" | "keyword";

export interface AlertVerdict {
  alert: boolean;
  reason: AlertReason | null;
  matchedKeyword: string | null;
}

const NO_ALERT: AlertVerdict = { alert: false, reason: null, matchedKeyword: null };

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Case-insensitive word-boundary match. Returns the first matching keyword
 * (in the order configured by the user) or null.
 */
export function matchKeyword(
  text: string | null | undefined,
  keywords: string[]
): string | null {
  if (!text) return null;
  for (const kw of keywords) {
    const trimmed = (kw || "").trim();
    if (!trimmed) continue;
    // \b only works against word characters — for keywords that start/end
    // with symbols (e.g. "$50") anchor only the word-character edge.
    const lead = /^\w/.test(trimmed) ? "\\b" : "";
    const tail = /\w$/.test(trimmed) ? "\\b" : "";
    const re = new RegExp(`${lead}${escapeRegex(trimmed)}${tail}`, "i");
    if (re.test(text)) return trimmed;
  }
  return null;
}

/**
 * Decides whether a single freshly-classified review should alert.
 *
 * Must satisfy ALL of:
 *   - not already alerted (alerted_at IS NULL — re-checked atomically in run.ts)
 *   - AI sentiment is 'negative' (the AI-verification gate)
 *   - AND at least one trigger:
 *       rating <= prefs.min_rating
 *       OR ai_urgency is high/critical
 *       OR review text matches a user keyword (word boundary, case-insensitive)
 */
export function shouldAlert(
  review: AlertableReview,
  prefs: AlertPrefs
): AlertVerdict {
  if (review.alerted_at) return NO_ALERT;
  // The AI-verification gate: low star rating alone is NOT enough.
  if (review.ai_sentiment !== "negative") return NO_ALERT;

  if (typeof review.rating === "number" && review.rating <= prefs.min_rating) {
    return { alert: true, reason: "rating", matchedKeyword: null };
  }
  if (review.ai_urgency === "high" || review.ai_urgency === "critical") {
    return { alert: true, reason: "urgency", matchedKeyword: null };
  }
  const kw = matchKeyword(review.review_text, prefs.keywords);
  if (kw) return { alert: true, reason: "keyword", matchedKeyword: kw };

  return NO_ALERT;
}

/** Truncates review text for email/notification bodies. */
export function truncateExcerpt(
  text: string | null | undefined,
  max = 300
): string {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/** "★★☆☆☆"-style rating string for titles and email bodies. */
export function starString(rating: number | null): string {
  const r = typeof rating === "number" ? Math.min(5, Math.max(0, Math.round(rating))) : 0;
  return "★".repeat(r) + "☆".repeat(5 - r);
}

/** Normalizes a user-supplied keyword list: lowercase, trimmed, deduped, capped. */
export function normalizeKeywords(
  raw: unknown,
  { maxCount = 10, maxLen = 30 }: { maxCount?: number; maxLen?: number } = {}
): string[] | null {
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const kw = item.trim().toLowerCase();
    if (!kw) continue;
    if (kw.length > maxLen) return null;
    if (!out.includes(kw)) out.push(kw);
  }
  if (out.length > maxCount) return null;
  return out;
}
