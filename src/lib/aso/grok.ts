// ASO recommendation generation via the existing xAI/Grok client.
// Reuses getXaiClient() + the shared rate limiter / backoff (same client,
// model default grok-4.3, reasoning_effort:'low' as everywhere else). Output
// is parsed defensively: fence-strip → first{..last} slice → JSON.parse in a
// try/catch → ONE retry with a stricter suffix → null on total failure (the
// route turns null into a graceful 502). After parsing, the result is
// validated/coerced in code (char limits, gap count, safe defaults) so a
// malformed-but-parseable model response can never reach the database.

import { getXaiClient, getReplyModel } from "@/lib/ai/xai-client";
import { waitForRateLimit, retryWithBackoff } from "@/lib/ai/rate-limiter";
import type {
  AsoRecommendations,
  AsoKeywordGap,
  AsoKeywordSource,
  AsoKeywordPriority,
  AsoLongDescriptionSection,
} from "@/types/database";

const CALL_TIMEOUT_MS = 30_000;
const MAX_TOKENS = 1800;
const TITLE_MAX = 30;
const SHORT_MAX = 80;
const MAX_GAPS = 12;

// === GROK SYSTEM PROMPT (verbatim — do not edit) ===
const SYSTEM_PROMPT = `You are an ASO (App Store Optimization) specialist for Google Play Store
listings, with deep knowledge of Play Store ranking signals and Play
Store metadata policies. You optimize listings for Indian and global app
developers.

You receive a JSON object with:
  - current_listing: { title, short_description, long_description,
    category, rating, installs_bucket, screenshot_count }
  - review_keywords: [{ term, frequency, sentiment }]  // real words the
    app's reviewers actually use
  - aspect_sentiment: [{ aspect, sentiment_score }]    // ABSA from reviews
  - issue_clusters: { active: [...], resolved: [...] }  // resolved = fixes
    that have actually shipped
  - competitor_keywords: [string]  // may be empty

Your job: produce optimized listing copy AND a prioritized keyword-gap
list, grounded in the REAL language reviewers use — not generic filler.

HARD RULES:
1. title: MAX 30 characters including spaces. Must include the single
   highest-value keyword. Count characters precisely; never exceed 30.
2. short_description: MAX 80 characters including spaces. One clear value
   prop + primary keyword. Do not pad with filler to reach the limit.
3. long_description: return as an array of { heading, body } sections.
   Front-load the primary keyword within the first 167 characters (the
   Play Store preview cutoff). Keyword usage must read naturally — never
   stuff or repeat unnaturally.
4. whats_new: ONE short paragraph (MAX 480 chars) written ONLY from the
   resolved issue_clusters (real shipped fixes). If resolved is empty,
   return an empty string. NEVER invent fixes that did not happen.
5. keyword_gaps: array of { keyword, source, priority, rationale }.
   Include keywords from review_keywords / competitor_keywords that are
   MISSING from the current listing. source ∈ "reviews"|"competitor"|
   "both". priority ∈ "high"|"medium"|"low". rationale ≤ 120 chars.
   Max 12 items, sorted highest priority first.
6. PLAY STORE POLICY — these get listings rejected, so NEVER use them in
   title/short/long description: superlative or ranking claims ("best",
   "#1", "top", "number one", "fastest"), competitor brand names, emoji
   in the title, ALL-CAPS words, or testimonial/quote text.
7. Use the reviewers' actual vocabulary verbatim where it fits. If
   reviewers say "lightweight" or "no ads", use those exact phrasings
   rather than synonyms — those are the real search terms.
8. India context: if the app is India-targeted and reviewers search in
   Hinglish/regional terms, reflect that ONLY in keyword_gaps. Keep
   title/short/long description in clean English unless the existing
   listing is already in another language.

OUTPUT FORMAT — CRITICAL:
Return STRICT, VALID JSON ONLY. No markdown, no code fences, no text
before or after. Exact shape:
{
  "title": "string (<=30 chars)",
  "short_description": "string (<=80 chars)",
  "long_description": [ { "heading": "string", "body": "string" } ],
  "whats_new": "string (may be empty)",
  "keyword_gaps": [ { "keyword": "string", "source": "reviews|competitor|both", "priority": "high|medium|low", "rationale": "string" } ]
}
If an input is missing, still return the full shape with best-effort
values and empty arrays/strings where you have nothing. Never return null
at the top level. Never exceed any character limit — truncate cleanly if
needed.`;
// === END GROK SYSTEM PROMPT ===

const STRICT_RETRY_SUFFIX = `\n\nYour previous response was not valid JSON. Return ONLY the JSON object in the exact shape specified. No prose, no markdown fences. Begin with { and end with }.`;

export interface AsoGrokInput {
  current_listing: {
    title: string;
    short_description: string;
    long_description: string;
    category: string | null;
    rating: number | null;
    installs_bucket: string | null;
    screenshot_count: number;
  };
  review_keywords: Array<{ term: string; frequency: number; sentiment: string }>;
  aspect_sentiment: Array<{ aspect: string; sentiment_score: number }>;
  issue_clusters: { active: string[]; resolved: string[] };
  competitor_keywords: string[];
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  // Prefer a clean word boundary if it isn't lopping off more than ~25%.
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
}

function tryParse(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    return obj && typeof obj === "object" ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const SOURCES: ReadonlySet<string> = new Set<string>(["reviews", "competitor", "both"]);
const PRIORITIES: ReadonlySet<string> = new Set<string>(["high", "medium", "low"]);
const PRIORITY_RANK: Record<AsoKeywordPriority, number> = { high: 0, medium: 1, low: 2 };

function coerceLongDesc(raw: unknown): AsoLongDescriptionSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const sec = (s ?? {}) as Record<string, unknown>;
      return {
        heading: typeof sec.heading === "string" ? sec.heading.trim() : "",
        body: typeof sec.body === "string" ? sec.body.trim() : "",
      };
    })
    .filter((s) => s.heading.length > 0 || s.body.length > 0)
    .slice(0, 8);
}

function coerceGaps(raw: unknown): AsoKeywordGap[] {
  if (!Array.isArray(raw)) return [];
  const gaps: AsoKeywordGap[] = [];
  for (const item of raw) {
    const g = (item ?? {}) as Record<string, unknown>;
    const keyword = typeof g.keyword === "string" ? g.keyword.trim() : "";
    if (!keyword) continue;
    const source = (typeof g.source === "string" ? g.source.trim().toLowerCase() : "") as AsoKeywordSource;
    const priority = (typeof g.priority === "string" ? g.priority.trim().toLowerCase() : "") as AsoKeywordPriority;
    gaps.push({
      keyword: keyword.slice(0, 60),
      source: SOURCES.has(source) ? source : "reviews",
      priority: PRIORITIES.has(priority) ? priority : "medium",
      rationale: typeof g.rationale === "string" ? g.rationale.trim().slice(0, 120) : "",
    });
  }
  // Stable sort: highest priority first (model is asked to do this, but enforce it).
  gaps.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  return gaps.slice(0, MAX_GAPS);
}

/**
 * Validate + coerce a parsed model object into a safe AsoRecommendations.
 * Enforces every hard limit in code so the model can never persist an
 * over-length title/short-desc or > 12 keyword gaps.
 */
export function validateRecommendations(parsed: Record<string, unknown>): AsoRecommendations {
  const title = truncate(typeof parsed.title === "string" ? parsed.title.trim() : "", TITLE_MAX);
  const short_description = truncate(
    typeof parsed.short_description === "string" ? parsed.short_description.trim() : "",
    SHORT_MAX
  );
  const whats_new =
    typeof parsed.whats_new === "string" ? parsed.whats_new.trim().slice(0, 480) : "";
  return {
    title,
    short_description,
    long_description: coerceLongDesc(parsed.long_description),
    whats_new,
    keyword_gaps: coerceGaps(parsed.keyword_gaps),
  };
}

async function callOnce(system: string, user: string): Promise<string> {
  const client = getXaiClient();
  if (!client) throw new Error("ai_unavailable");
  await waitForRateLimit();
  const completion = await retryWithBackoff(
    () =>
      client.chat.completions.create(
        {
          model: getReplyModel(),
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          reasoning_effort: "low",
          max_completion_tokens: MAX_TOKENS,
        },
        { timeout: CALL_TIMEOUT_MS }
      ),
    "aso-recommendations"
  );
  return completion.choices[0]?.message?.content?.trim() || "";
}

/**
 * Returns validated recommendations, or null if the model is unavailable or
 * produced unparseable JSON on both the first and the one retry attempt.
 * The route maps null → 502 "couldn't generate suggestions, try again".
 */
export async function generateAsoRecommendations(
  input: AsoGrokInput
): Promise<AsoRecommendations | null> {
  const client = getXaiClient();
  if (!client) {
    console.warn("[aso-grok] No XAI_API_KEY — cannot generate recommendations");
    return null;
  }

  const userMessage = JSON.stringify(input);

  try {
    const first = await callOnce(SYSTEM_PROMPT, userMessage);
    const parsed = tryParse(first);
    if (parsed) return validateRecommendations(parsed);

    console.warn("[aso-grok] First parse failed — retrying once with stricter prompt");
    const second = await callOnce(SYSTEM_PROMPT + STRICT_RETRY_SUFFIX, userMessage);
    const parsedRetry = tryParse(second);
    if (parsedRetry) return validateRecommendations(parsedRetry);

    console.error(
      "[aso-grok] Both attempts failed to parse JSON. Last raw:",
      (second || first || "").slice(0, 200)
    );
    return null;
  } catch (err: unknown) {
    const e = err as { status?: number; name?: string; message?: string };
    console.error("[aso-grok] xAI error:", e.status, e.name, e.message);
    return null;
  }
}
