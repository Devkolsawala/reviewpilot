import { getXaiClient, getInsightsModel } from "./xai-client";
import { waitForRateLimit, retryWithBackoff } from "./rate-limiter";

// Insights classifier — runs on ALL reviews (not just ≤3★ like recoverability).
// Returns the 4 AI fields cached on the reviews table:
//   ai_theme · ai_emotion · ai_urgency · ai_sentiment
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

export interface ReviewInsights {
  theme: string;
  emotion: ReviewEmotion;
  urgency: ReviewUrgency;
  sentiment: ReviewSentimentLabel;
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

const SAFE_DEFAULTS: ReviewInsights = {
  theme: "general feedback",
  emotion: "neutral",
  urgency: "low",
  sentiment: "neutral",
};

const SYSTEM_PROMPT = `You analyze Play Store, Google Business Profile, and other product reviews for an Indian SaaS called ReviewPilot. The reviewer may write in English, Hindi, Hinglish (Roman-script Hindi mixed with English), Tamil, Gujarati, Marathi, or other Indian languages. Reviews are often short, casual, and emotional.

Return STRICT JSON only — no preamble, no markdown, no explanation. Fields:
- "theme": 2–4 lowercase English words that name the SPECIFIC issue, feature, or praise. Examples: "camera crashes", "slow checkout", "great delivery", "polite staff", "dark mode missing", "payment failed", "long wait time". Never generic like "good app" or "bad service" — be specific. If the review is too vague to theme, return "general feedback".
- "emotion": exactly one of: frustrated, angry, disappointed, satisfied, delighted, confused, hopeful, neutral.
- "urgency": exactly one of: low, medium, high, critical. CRITICAL means urgent harm signals: payment lost/stolen, data loss, account hacked, food poisoning, harassment, safety incidents, legal threats, regulatory complaints. HIGH means strong negative impact: app unusable, refund pending, major bug blocking core use. MEDIUM means moderate issues: slow performance, missing feature, mild complaint. LOW means minor or positive reviews.
- "sentiment": exactly one of: positive, neutral, negative. Base this on overall tone — a 5★ review is almost always positive; a 1★ almost always negative; a 3★ may be neutral or mixed.

Match the user's language nuance — code-mixed phrases like "bahut bekaar app hai" are negative+frustrated, "kya baat hai" is positive+delighted. Do not assume tone from rating alone if the text contradicts it.

Return only: {"theme":"...","emotion":"...","urgency":"...","sentiment":"..."}`;

const STRICT_RETRY_SUFFIX = `\n\nYour previous response was not valid JSON. Return ONLY the JSON object with the four fields. No prose, no markdown fences, no explanation. Begin your response with { and end with }.`;

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

  const userMessage = buildUserMessage(input);
  const model = getInsightsModel();

  await acquire();
  try {
    // First attempt
    const first = await callOnce(client, model, SYSTEM_PROMPT, userMessage);
    const parsed = tryParse(first);
    if (parsed) return coerce(parsed);

    // Second (stricter) attempt
    console.warn(
      "[classifyReviewInsights] First parse failed, retrying with stricter prompt"
    );
    const second = await callOnce(
      client,
      model,
      SYSTEM_PROMPT + STRICT_RETRY_SUFFIX,
      userMessage
    );
    const parsedRetry = tryParse(second);
    if (parsedRetry) return coerce(parsedRetry);

    console.error(
      "[classifyReviewInsights] Both attempts failed to parse JSON. Last raw:",
      (second || first || "").slice(0, 200)
    );
    return null;
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error("[classifyReviewInsights] xAI error:", e.status, e.message);
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

async function callOnce(
  client: ReturnType<typeof getXaiClient>,
  model: string,
  system: string,
  user: string
): Promise<string> {
  if (!client) return "";
  await waitForRateLimit();
  const completion = await retryWithBackoff(
    () =>
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        reasoning_effort: "low",
        max_completion_tokens: 120,
      }),
    "classifyReviewInsights"
  );
  return completion.choices[0]?.message?.content?.trim() || "";
}

function tryParse(raw: string): Partial<ReviewInsights> | null {
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
    if (obj && typeof obj === "object") return obj as Partial<ReviewInsights>;
    return null;
  } catch {
    return null;
  }
}

function coerce(p: Partial<ReviewInsights>): ReviewInsights {
  // Theme: trim, lowercase, max ~40 chars; fall back to default if missing
  let theme = (p.theme || "").toString().trim().toLowerCase();
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

  return { theme, emotion, urgency, sentiment };
}

// Exported only for tests / introspection.
export const __INTERNAL = {
  SAFE_DEFAULTS,
  ALLOWED_EMOTIONS,
  ALLOWED_URGENCY,
  ALLOWED_SENTIMENT,
};
