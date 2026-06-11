// Deterministic, code-only listing audit for ASO Analysis. NO AI is involved
// here — these are the objective checks (lengths, keyword presence, rating
// threshold, asset count) that must be reproducible and explainable. The AI
// (src/lib/aso/grok.ts) only produces the suggested rewrites + keyword gaps.
//
// Each factor contributes to a 0..100 total; the five `max` values sum to 100
// so the final aso_score is just the sum of the factor scores.

import type {
  AsoFactorScore,
  AsoListingSnapshot,
  AsoScoreBreakdown,
} from "@/types/database";

// Play Store metadata limits / ranking thresholds.
export const PLAY_TITLE_MAX = 30;
export const PLAY_SHORT_MAX = 80;
// Below ~4.0 Play visibly suppresses impressions/conversion for an app.
export const RATING_SUPPRESSION_THRESHOLD = 4.0;

const FACTOR_MAX = 20; // each of the 5 factors is worth 20 → 100 total

function statusFor(score: number, max: number): AsoFactorScore["status"] {
  const ratio = max === 0 ? 0 : score / max;
  if (ratio >= 0.75) return "good";
  if (ratio >= 0.45) return "warning";
  return "critical";
}

function factor(score: number, detail: string): AsoFactorScore {
  const clamped = Math.max(0, Math.min(FACTOR_MAX, Math.round(score)));
  return { score: clamped, max: FACTOR_MAX, status: statusFor(clamped, FACTOR_MAX), detail };
}

function containsKeyword(text: string, keywords: string[]): string | null {
  const t = text.toLowerCase();
  for (const k of keywords) {
    const kw = k.trim().toLowerCase();
    if (kw && t.includes(kw)) return k;
  }
  return null;
}

function auditTitle(title: string, keywords: string[]): AsoFactorScore {
  const len = title.trim().length;
  if (len === 0) return factor(0, "Title is empty — add a keyword-rich app name.");
  const lengthPts =
    len > PLAY_TITLE_MAX ? 3 : len >= 15 ? 10 : len >= 8 ? 7 : 4;
  const hit = containsKeyword(title, keywords);
  const keywordPts = hit ? 10 : 0;
  const parts: string[] = [];
  if (len > PLAY_TITLE_MAX) parts.push(`Title is ${len} chars — over Play's ${PLAY_TITLE_MAX}-char limit.`);
  else parts.push(`Title is ${len}/${PLAY_TITLE_MAX} chars.`);
  parts.push(hit ? `Includes a top review keyword ("${hit}").` : "No top review keyword in the title.");
  return factor(lengthPts + keywordPts, parts.join(" "));
}

function auditShortDesc(short: string, keywords: string[]): AsoFactorScore {
  const len = short.trim().length;
  if (len === 0) return factor(0, "Short description is empty.");
  const lengthPts =
    len > PLAY_SHORT_MAX ? 4 : len >= 50 ? 10 : len >= 25 ? 7 : 4;
  const hit = containsKeyword(short, keywords);
  const keywordPts = hit ? 10 : 0;
  const parts: string[] = [];
  if (len > PLAY_SHORT_MAX) parts.push(`${len} chars — over Play's ${PLAY_SHORT_MAX}-char limit.`);
  else parts.push(`${len}/${PLAY_SHORT_MAX} chars.`);
  parts.push(hit ? `Uses a reviewer keyword ("${hit}").` : "Missing a primary keyword.");
  return factor(lengthPts + keywordPts, parts.join(" "));
}

function auditLongDesc(long: string, keywords: string[]): AsoFactorScore {
  const len = long.trim().length;
  if (len === 0) return factor(0, "Long description is empty.");
  const lengthPts =
    len >= 1500 ? 10 : len >= 600 ? 7 : len >= 200 ? 4 : 2;
  const lower = long.toLowerCase();
  const coverage = keywords.filter((k) => {
    const kw = k.trim().toLowerCase();
    return kw && lower.includes(kw);
  }).length;
  const coveragePts = Math.round((Math.min(coverage, 5) / 5) * 10);
  return factor(
    lengthPts + coveragePts,
    `${len} chars; covers ${coverage} of your top review keywords.`
  );
}

function auditRating(rating: number | null): AsoFactorScore {
  if (rating === null) return factor(10, "Rating unavailable from the live listing.");
  let score: number;
  if (rating >= 4.5) score = 20;
  else if (rating >= RATING_SUPPRESSION_THRESHOLD) score = 17;
  else if (rating >= 3.5) score = 11;
  else if (rating >= 3.0) score = 6;
  else score = 3;
  const note =
    rating >= RATING_SUPPRESSION_THRESHOLD
      ? `${rating.toFixed(1)}★ — above the 4.0 impression-suppression threshold.`
      : `${rating.toFixed(1)}★ — below the 4.0 threshold where Play suppresses impressions.`;
  return factor(score, note);
}

function auditAssets(screenshotCount: number): AsoFactorScore {
  let score: number;
  if (screenshotCount >= 8) score = 20;
  else if (screenshotCount >= 5) score = 16;
  else if (screenshotCount >= 3) score = 11;
  else if (screenshotCount >= 1) score = 6;
  else score = 0;
  return factor(
    score,
    `${screenshotCount} screenshot${screenshotCount === 1 ? "" : "s"} — Play recommends at least 8.`
  );
}

export interface AuditResult {
  breakdown: AsoScoreBreakdown;
  score: number; // 0..100
}

/**
 * Run the deterministic audit. `topKeywords` are the highest-frequency terms
 * from the user's own review data (already lowercased/ordered upstream) — they
 * ground the keyword-presence checks in the words real users actually use.
 */
export function auditListing(
  snapshot: AsoListingSnapshot,
  topKeywords: string[]
): AuditResult {
  // Use the strongest few keywords for title/short checks, a wider set for the
  // long description coverage check.
  const primary = topKeywords.slice(0, 5);
  const breakdown: AsoScoreBreakdown = {
    title: auditTitle(snapshot.title || "", primary),
    short_desc: auditShortDesc(snapshot.short_description || "", primary),
    long_desc: auditLongDesc(snapshot.long_description || "", topKeywords.slice(0, 12)),
    rating: auditRating(snapshot.rating),
    assets: auditAssets(snapshot.screenshot_count || 0),
  };
  const score =
    breakdown.title.score +
    breakdown.short_desc.score +
    breakdown.long_desc.score +
    breakdown.rating.score +
    breakdown.assets.score;
  return { breakdown, score: Math.max(0, Math.min(100, score)) };
}
