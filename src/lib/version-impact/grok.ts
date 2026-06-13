/**
 * Version Impact AI verdict generation via the existing xAI/Grok client.
 *
 * Mirrors lib/aso/grok.ts: same singleton client + shared rate limiter /
 * backoff, model default grok-4.3, reasoning_effort:'low'. Output is parsed
 * defensively (fence-strip → first{..last} slice → JSON.parse → ONE strict
 * retry → null) and then validated/coerced in code so a malformed-but-parseable
 * response can never reach the database.
 *
 * COST DISCIPLINE: the model receives ONLY the already-computed deterministic
 * deltas (buildVerdictInput) — never raw review text. The payload is a handful
 * of numbers + theme labels, so token usage is tiny and bounded.
 *
 * If the model is unavailable or fails, generateVersionVerdict returns null and
 * the route falls back to buildFallbackVerdict() — a templated, deterministic
 * verdict built from the same deltas, so the feature degrades gracefully
 * instead of erroring.
 */

import { getXaiClient, getReplyModel } from "@/lib/ai/xai-client";
import { waitForRateLimit, retryWithBackoff } from "@/lib/ai/rate-limiter";
import type { VersionComparison } from "@/lib/version-impact/analyze";
import type { VersionVerdict } from "@/types/database";

const CALL_TIMEOUT_MS = 25_000;
const MAX_TOKENS = 700;
const VERDICT_MAX = 140;
const DIAGNOSIS_MAX = 600;
const ACTION_MAX = 280;
const MAX_THEMES_IN_PAYLOAD = 8;

// === GROK SYSTEM PROMPT (verbatim — do not edit) ===
const SYSTEM_PROMPT = `You are a mobile app release analyst. You read a compact, PRE-COMPUTED diff
between two consecutive releases of an app (no raw reviews — only aggregates)
and explain, in plain English, what the newer release did to user sentiment.

You receive a JSON object:
  - app: string
  - version_a: { label, reviews, avg_rating, sentiment_pct }   // OLDER release
  - version_b: { label, reviews, avg_rating, sentiment_pct }   // NEWER release
  - rating_delta: number | null   // avg_rating(B) - avg_rating(A)
  - count_delta: number           // reviews(B) - reviews(A)
  - sentiment_delta: { positive, neutral, negative }  // percentage POINTS, B-A
  - theme_deltas: [{ theme, count_a, count_b, change_pct }]  // what rose/fell

Your job: a crisp, evidence-grounded read of the release impact.

HARD RULES:
1. Ground EVERY claim in the supplied numbers. Never invent a cause, a bug, or
   a feature that is not implied by the theme labels and deltas. If a theme rose,
   say it rose; do not speculate WHY beyond what the theme name states.
2. If the data is thin (very few reviews on either side), say so plainly and
   keep the verdict cautious — do not overstate a trend built on a handful of
   reviews.
3. "verdict": ONE short line (<=140 chars) — the headline read, e.g.
   "v2.4.1 dropped your rating 0.4 stars and tripled crash complaints."
4. "diagnosis": 2-4 sentences (<=600 chars) explaining what changed, leaning on
   the largest theme deltas and the rating/sentiment shift.
5. "action": ONE recommended next step (<=280 chars), or null if nothing
   actionable stands out. Tie it to the data (e.g. the worst-rising theme).
6. Neutral, factual tone. No emoji. No marketing language. No superlatives.

OUTPUT FORMAT — CRITICAL:
Return STRICT, VALID JSON ONLY. No markdown, no code fences, no text before or
after. Exact shape:
{ "verdict": "string", "diagnosis": "string", "action": "string or null" }
Never return null at the top level.`;
// === END GROK SYSTEM PROMPT ===

const STRICT_RETRY_SUFFIX = `\n\nYour previous response was not valid JSON. Return ONLY the JSON object in the exact shape specified. No prose, no markdown fences. Begin with { and end with }.`;

/** The token-bounded payload sent to grok — deltas only, no raw reviews. */
export interface VersionVerdictInput {
  app: string;
  version_a: { label: string; reviews: number; avg_rating: number | null; sentiment_pct: { positive: number; neutral: number; negative: number } };
  version_b: { label: string; reviews: number; avg_rating: number | null; sentiment_pct: { positive: number; neutral: number; negative: number } };
  rating_delta: number | null;
  count_delta: number;
  sentiment_delta: { positive: number; neutral: number; negative: number };
  theme_deltas: Array<{ theme: string; count_a: number; count_b: number; change_pct: number | null }>;
}

/** Shape a deterministic comparison into the minimal model input. */
export function buildVerdictInput(appName: string, cmp: VersionComparison): VersionVerdictInput {
  return {
    app: appName,
    version_a: {
      label: cmp.versionA.versionName,
      reviews: cmp.versionA.count,
      avg_rating: cmp.versionA.avgRating,
      sentiment_pct: {
        positive: cmp.versionA.sentiment.positivePct,
        neutral: cmp.versionA.sentiment.neutralPct,
        negative: cmp.versionA.sentiment.negativePct,
      },
    },
    version_b: {
      label: cmp.versionB.versionName,
      reviews: cmp.versionB.count,
      avg_rating: cmp.versionB.avgRating,
      sentiment_pct: {
        positive: cmp.versionB.sentiment.positivePct,
        neutral: cmp.versionB.sentiment.neutralPct,
        negative: cmp.versionB.sentiment.negativePct,
      },
    },
    rating_delta: cmp.ratingDelta,
    count_delta: cmp.countDelta,
    sentiment_delta: {
      positive: cmp.sentimentDelta.positivePct,
      neutral: cmp.sentimentDelta.neutralPct,
      negative: cmp.sentimentDelta.negativePct,
    },
    theme_deltas: cmp.themeDeltas.slice(0, MAX_THEMES_IN_PAYLOAD).map((t) => ({
      theme: t.theme,
      count_a: t.countA,
      count_b: t.countB,
      change_pct: t.changePct,
    })),
  };
}

function tryParse(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
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

/** Validate + coerce a parsed model object into a safe VersionVerdict. */
export function validateVerdict(parsed: Record<string, unknown>): VersionVerdict {
  const verdict = typeof parsed.verdict === "string" ? parsed.verdict.trim().slice(0, VERDICT_MAX) : "";
  const diagnosis = typeof parsed.diagnosis === "string" ? parsed.diagnosis.trim().slice(0, DIAGNOSIS_MAX) : "";
  const actionRaw = parsed.action;
  const action =
    typeof actionRaw === "string" && actionRaw.trim().length > 0
      ? actionRaw.trim().slice(0, ACTION_MAX)
      : null;
  return { verdict, diagnosis, action };
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
    "version-impact-verdict"
  );
  return completion.choices[0]?.message?.content?.trim() || "";
}

/**
 * Returns a validated verdict, or null if the model is unavailable or produced
 * unparseable JSON on both attempts. The route turns null into the deterministic
 * fallback (buildFallbackVerdict).
 */
export async function generateVersionVerdict(
  input: VersionVerdictInput
): Promise<VersionVerdict | null> {
  const client = getXaiClient();
  if (!client) {
    console.warn("[version-impact-grok] No XAI_API_KEY — using deterministic fallback");
    return null;
  }

  const userMessage = JSON.stringify(input);
  try {
    const first = await callOnce(SYSTEM_PROMPT, userMessage);
    const parsed = tryParse(first);
    if (parsed) {
      const v = validateVerdict(parsed);
      if (v.verdict || v.diagnosis) return v;
    }

    console.warn("[version-impact-grok] First parse failed — retrying once with stricter prompt");
    const second = await callOnce(SYSTEM_PROMPT + STRICT_RETRY_SUFFIX, userMessage);
    const parsedRetry = tryParse(second);
    if (parsedRetry) {
      const v = validateVerdict(parsedRetry);
      if (v.verdict || v.diagnosis) return v;
    }

    console.error(
      "[version-impact-grok] Both attempts failed. Last raw:",
      (second || first || "").slice(0, 200)
    );
    return null;
  } catch (err: unknown) {
    const e = err as { status?: number; name?: string; message?: string };
    console.error("[version-impact-grok] xAI error:", e.status, e.name, e.message);
    return null;
  }
}

/**
 * Deterministic, templated verdict from the same deltas — used when the AI call
 * is unavailable or fails. Plain English, grounded only in the numbers.
 */
export function buildFallbackVerdict(input: VersionVerdictInput): VersionVerdict {
  const { version_a: a, version_b: b, rating_delta, count_delta, sentiment_delta, theme_deltas } = input;
  const thin = a.reviews < 5 || b.reviews < 5;

  const ratingPhrase =
    rating_delta === null
      ? "rating change couldn't be measured"
      : rating_delta > 0
      ? `lifted your rating ${rating_delta.toFixed(1)}★`
      : rating_delta < 0
      ? `dropped your rating ${Math.abs(rating_delta).toFixed(1)}★`
      : "left your rating unchanged";

  const risers = theme_deltas.filter((t) => t.count_b > t.count_a).slice(0, 3);
  const fallers = theme_deltas.filter((t) => t.count_b < t.count_a).slice(0, 3);

  const verdict =
    `v${b.label} ${ratingPhrase} vs v${a.label}` +
    (risers.length ? `; ${risers[0].theme} complaints rose` : "") +
    ".";

  const parts: string[] = [];
  parts.push(
    `v${b.label} has ${b.reviews} review${b.reviews === 1 ? "" : "s"} ` +
      `(${count_delta >= 0 ? "+" : ""}${count_delta} vs v${a.label}), ` +
      `average ${b.avg_rating ?? "—"}★ vs ${a.avg_rating ?? "—"}★.`
  );
  if (sentiment_delta.negative !== 0) {
    parts.push(
      `Negative sentiment ${sentiment_delta.negative > 0 ? "rose" : "fell"} ` +
        `${Math.abs(sentiment_delta.negative)} points.`
    );
  }
  if (risers.length) {
    parts.push(`Rising themes: ${risers.map((t) => t.theme).join(", ")}.`);
  }
  if (fallers.length) {
    parts.push(`Improving themes: ${fallers.map((t) => t.theme).join(", ")}.`);
  }
  if (thin) {
    parts.push("Sample is small, so treat this as a weak signal.");
  }
  const diagnosis = parts.join(" ").slice(0, DIAGNOSIS_MAX);

  const action =
    risers.length && !thin
      ? `Investigate the rise in "${risers[0].theme}" introduced in v${b.label}.`
      : null;

  return { verdict: verdict.slice(0, VERDICT_MAX), diagnosis, action };
}
