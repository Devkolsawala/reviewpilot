import { getXaiClient, getInsightsModel } from "./xai-client";
import { waitForRateLimit, retryWithBackoff } from "./rate-limiter";

// Insights classifier — runs on ALL reviews (not just ≤3★ like recoverability).
// Returns the AI fields cached on the reviews table:
//   ai_theme · ai_emotion · ai_urgency · ai_sentiment · ai_aspects
// Designed for Indian SaaS reviews, including Hinglish + regional languages.

export type ReviewEmotion =
  | "frustrated"
  | "angry"
  | "disappointed"
  | "satisfied"
  | "delighted"
  | "confused"
  | "hopeful"
  | "neutral";

export type ReviewUrgency = "low" | "medium" | "high" | "critical";
export type ReviewSentimentLabel = "positive" | "neutral" | "negative";
export type ReviewAspectSentiment = "positive" | "neutral" | "negative";

export interface ReviewInsights {
  theme: string;
  emotion: ReviewEmotion;
  urgency: ReviewUrgency;
  sentiment: ReviewSentimentLabel;
  aspects: Record<string, ReviewAspectSentiment>;
}

const ALLOWED_EMOTIONS: ReadonlySet<ReviewEmotion> = new Set<ReviewEmotion>([
  "frustrated",
  "angry",
  "disappointed",
  "satisfied",
  "delighted",
  "confused",
  "hopeful",
  "neutral",
]);

const ALLOWED_URGENCY: ReadonlySet<ReviewUrgency> = new Set<ReviewUrgency>([
  "low",
  "medium",
  "high",
  "critical",
]);

const ALLOWED_SENTIMENT: ReadonlySet<ReviewSentimentLabel> =
  new Set<ReviewSentimentLabel>(["positive", "neutral", "negative"]);

const ALLOWED_ASPECT_SENTIMENT: ReadonlySet<ReviewAspectSentiment> =
  new Set<ReviewAspectSentiment>(["positive", "neutral", "negative"]);

const SAFE_DEFAULTS: ReviewInsights = {
  theme: "general feedback",
  emotion: "neutral",
  urgency: "low",
  sentiment: "neutral",
  aspects: {},
};

// xAI hard timeout per call. Each call must not hang — the auto-classify
// kickoff in /api/reviews/fetch fires up to 15 concurrent classifications and
// can't risk a single stuck call holding the whole batch open past Vercel's
// 60s function budget. 15s × at most one transient-error retry = 30s worst
// case per row, well under budget at any realistic concurrency.
const CALL_TIMEOUT_MS = 15_000;

// ── Aspect dictionary by source ───────────────────────────────────────────────
// The model is asked to identify only aspects from the source's dictionary so
// it can't hallucinate unrelated entities. Unknown sources fall back to a
// generic product/service vocabulary.
export function aspectDictionaryFor(source: string): readonly string[] {
  if (source === "gbp" || source === "google_business" || source === "google_business_profile") {
    return [
      "food",
      "service",
      "ambience",
      "pricing",
      "wait_time",
      "staff",
      "cleanliness",
      "location",
    ] as const;
  }
  if (source === "play_store" || source === "app_store") {
    return [
      "performance",
      "ui_ux",
      "features",
      "bugs",
      "pricing",
      "onboarding",
      "ads",
      "customer_support",
    ] as const;
  }
  return ["product", "service", "pricing", "support", "speed"] as const;
}

function buildSystemPrompt(aspectList: readonly string[]): string {
  const aspectsLine = aspectList.join(", ");
  return `You analyze Play Store, Google Business Profile, and other product reviews for an Indian SaaS called ReviewPilot. The reviewer may write in English, Hindi, Hinglish (Roman-script Hindi mixed with English), Tamil, Gujarati, Marathi, or other Indian languages. Reviews are often short, casual, and emotional.

Return STRICT JSON only — no preamble, no markdown, no explanation. Fields:
- "theme": 2–4 lowercase English words that name the SPECIFIC issue, feature, or praise. Examples: "camera crashes", "slow checkout", "great delivery", "polite staff", "dark mode missing", "payment failed", "long wait time". Never generic like "good app" or "bad service" — be specific. If the review is too vague to theme, return "general feedback".
- "emotion": exactly one of: frustrated, angry, disappointed, satisfied, delighted, confused, hopeful, neutral.
- "urgency": exactly one of: low, medium, high, critical. CRITICAL means urgent harm signals: payment lost/stolen, data loss, account hacked, food poisoning, harassment, safety incidents, legal threats, regulatory complaints. HIGH means strong negative impact: app unusable, refund pending, major bug blocking core use. MEDIUM means moderate issues: slow performance, missing feature, mild complaint. LOW means minor or positive reviews.
- "sentiment": exactly one of: positive, neutral, negative. Base this on overall tone — a 5★ review is almost always positive; a 1★ almost always negative; a 3★ may be neutral or mixed.
- "aspects": object mapping aspect names the review EXPLICITLY mentions to their sentiment. Allowed aspect keys: ${aspectsLine}. Each value must be exactly one of: positive, neutral, negative. Omit aspects the review does NOT mention. A 5★ review saying "great food and ambience but slow service" returns {"food":"positive","ambience":"positive","service":"negative"}. A 3★ review with no specific aspect mentions returns {}. Never invent aspects outside the allowed list.

Match the user's language nuance — code-mixed phrases like "bahut bekaar app hai" are negative+frustrated, "kya baat hai" is positive+delighted. Do not assume tone from rating alone if the text contradicts it.

Return only: {"theme":"...","emotion":"...","urgency":"...","sentiment":"...","aspects":{...}}`;
}

const STRICT_RETRY_SUFFIX = `\n\nYour previous response was not valid JSON. Return ONLY the JSON object with the five fields. No prose, no markdown fences, no explanation. Begin your response with { and end with }.`;

// ── Simple concurrency semaphore (max 20 concurrent xAI calls) ────────────────
// Used to bound xAI quota during backfill. waitForRateLimit() in rate-limiter.ts
// caps RPM; this caps simultaneous in-flight requests. Belt-and-braces.
const MAX_CONCURRENT = 20;
let active = 0;
const queue: Array<() => void> = [];

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    queue.push(() => {
      active++;
      resolve();
    });
  });
}

function release(): void {
  active--;
  const next = queue.shift();
  if (next) next();
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ClassifyReviewInsightsInput {
  text: string;
  rating: number;
  /**
   * Review source — drives the aspect dictionary. Accepts the canonical
   * source values stored on `reviews.source` ("play_store", "google_business")
   * as well as friendlier aliases. Unknown values fall back to a generic
   * aspect dictionary.
   */
  source: string;
  appContext?: string;
}

export async function classifyReviewInsights(
  input: ClassifyReviewInsightsInput
): Promise<ReviewInsights | null> {
  const client = getXaiClient();
  if (!client) {
    console.warn("[classifyReviewInsights] No XAI_API_KEY — returning null");
    return null;
  }

  const aspectList = aspectDictionaryFor(input.source);
  const allowedAspects = new Set(aspectList);
  const systemPrompt = buildSystemPrompt(aspectList);
  const userMessage = buildUserMessage(input);
  const model = getInsightsModel();

  await acquire();
  try {
    // First attempt
    const first = await callOnce(client, model, systemPrompt, userMessage);
    const parsed = tryParse(first);
    if (parsed) return coerce(parsed, allowedAspects);

    // Second (stricter) attempt
    console.warn(
      "[classifyReviewInsights] First parse failed, retrying with stricter prompt"
    );
    const second = await callOnce(
      client,
      model,
      systemPrompt + STRICT_RETRY_SUFFIX,
      userMessage
    );
    const parsedRetry = tryParse(second);
    if (parsedRetry) return coerce(parsedRetry, allowedAspects);

    console.error(
      "[classifyReviewInsights] Both attempts failed to parse JSON. Last raw:",
      (second || first || "").slice(0, 200)
    );
    return null;
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; name?: string };
    console.error("[classifyReviewInsights] xAI error:", e.status, e.name, e.message);
    return null;
  } finally {
    release();
  }
}

function buildUserMessage(input: ClassifyReviewInsightsInput): string {
  const ctx = input.appContext?.trim();
  const ctxLine = ctx ? `Business context: ${ctx}\n\n` : "";
  // Bound review text to avoid blowing token budget on rare long rants.
  const text = (input.text || "").slice(0, 1500);
  return `${ctxLine}Rating: ${input.rating}/5\nReview: ${text}`;
}

function isTransientXaiError(err: unknown): boolean {
  const e = err as { name?: string; status?: number; message?: string };
  if (e?.name === "APITimeoutError") return true;
  if (e?.name === "APIConnectionTimeoutError") return true;
  if (e?.name === "APIConnectionError") return true;
  if (typeof e?.status === "number" && e.status >= 500) return true;
  if (/timed?\s*out/i.test(e?.message ?? "")) return true;
  return false;
}

async function callOnce(
  client: ReturnType<typeof getXaiClient>,
  model: string,
  system: string,
  user: string
): Promise<string> {
  if (!client) return "";

  // One retry on transient xAI errors (timeout / connection drop / 5xx).
  // 429s are still handled by retryWithBackoff with its own backoff schedule.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    await waitForRateLimit();
    try {
      const completion = await retryWithBackoff(
        () =>
          client.chat.completions.create(
            {
              model,
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              reasoning_effort: "low",
              max_completion_tokens: 180,
            },
            { timeout: CALL_TIMEOUT_MS }
          ),
        "classifyReviewInsights"
      );
      return completion.choices[0]?.message?.content?.trim() || "";
    } catch (err: unknown) {
      lastErr = err;
      if (!isTransientXaiError(err) || attempt === 1) throw err;
      const e = err as { name?: string; status?: number };
      console.warn(
        `[classifyReviewInsights] transient xAI error (${e?.name ?? e?.status}) — retrying once`
      );
    }
  }
  throw lastErr;
}

interface RawInsights {
  theme?: unknown;
  emotion?: unknown;
  urgency?: unknown;
  sentiment?: unknown;
  aspects?: unknown;
}

function tryParse(raw: string): RawInsights | null {
  if (!raw) return null;
  // Strip code fences if the model leaked them despite the system prompt
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  // Find the first { and last } in case there's leading/trailing noise
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  const slice = cleaned.slice(start, end + 1);
  try {
    const obj = JSON.parse(slice);
    if (obj && typeof obj === "object") return obj as RawInsights;
    return null;
  } catch {
    return null;
  }
}

function coerceAspects(
  raw: unknown,
  allowed: Set<string>
): Record<string, ReviewAspectSentiment> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, ReviewAspectSentiment> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const k = String(key).trim().toLowerCase();
    if (!allowed.has(k)) continue; // drop hallucinated keys
    const v = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (!ALLOWED_ASPECT_SENTIMENT.has(v as ReviewAspectSentiment)) continue;
    out[k] = v as ReviewAspectSentiment;
  }
  return out;
}

function coerce(p: RawInsights, allowedAspects: Set<string>): ReviewInsights {
  // Theme: trim, lowercase, max ~40 chars; fall back to default if missing
  let theme = (p.theme ? String(p.theme) : "").trim().toLowerCase();
  if (!theme) theme = SAFE_DEFAULTS.theme;
  if (theme.length > 40) theme = theme.slice(0, 40).trim();

  const emotion = ALLOWED_EMOTIONS.has(p.emotion as ReviewEmotion)
    ? (p.emotion as ReviewEmotion)
    : SAFE_DEFAULTS.emotion;
  const urgency = ALLOWED_URGENCY.has(p.urgency as ReviewUrgency)
    ? (p.urgency as ReviewUrgency)
    : SAFE_DEFAULTS.urgency;
  const sentiment = ALLOWED_SENTIMENT.has(p.sentiment as ReviewSentimentLabel)
    ? (p.sentiment as ReviewSentimentLabel)
    : SAFE_DEFAULTS.sentiment;
  const aspects = coerceAspects(p.aspects, allowedAspects);

  return { theme, emotion, urgency, sentiment, aspects };
}

// Exported only for tests / introspection.
export const __INTERNAL = {
  SAFE_DEFAULTS,
  ALLOWED_EMOTIONS,
  ALLOWED_URGENCY,
  ALLOWED_SENTIMENT,
  ALLOWED_ASPECT_SENTIMENT,
};
