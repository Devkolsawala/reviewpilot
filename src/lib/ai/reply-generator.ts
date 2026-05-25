import { buildReplyPrompt, buildClassifierPrompt } from "./prompts";
import { waitForRateLimit, retryWithBackoff } from "./rate-limiter";
import { getXaiClient, getReplyModel } from "./xai-client";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

export interface GenerateReplyParams {
  appContext: AppContext | Record<string, unknown>;
  review: Review;
  source: "google_business" | "play_store" | "whatsapp";
  tone?: string;
}

export interface GenerateReplyResult {
  reply: string;
  recoverable: boolean;
  issue_label: string | null;
}

/**
 * Returns just the reply text. Kept for backward compatibility with callers
 * that don't need recovery classification. Internally delegates to
 * generateReplyWithRecovery() and discards the classification fields.
 */
export async function generateReply(params: GenerateReplyParams): Promise<string> {
  const result = await generateReplyWithRecovery(params);
  return result.reply;
}

/**
 * Generate a reply AND classify whether the review is recoverable (only for
 * reviews rated 1-3). For 4-5★ reviews, classification is trivial and skipped
 * (recoverable: false, issue_label: null) without an extra AI roundtrip.
 *
 * JSON parsing is best-effort — if the model returns malformed JSON, we fall
 * back to treating the whole response as the reply text. This guarantees the
 * reply flow never breaks because of recovery tracking.
 */
export async function generateReplyWithRecovery(
  params: GenerateReplyParams
): Promise<GenerateReplyResult> {
  const rating = params.review.rating ?? 0;
  const eligibleForRecovery =
    rating >= 1 && rating <= 3 && params.source !== "whatsapp";

  const client = getXaiClient();

  if (!client) {
    console.log("[AI] No XAI_API_KEY set — using mock reply");
    return {
      reply: generateMockReply(params.review),
      recoverable: false,
      issue_label: null,
    };
  }

  try {
    const prompt = buildReplyPrompt({
      appContext: params.appContext as AppContext,
      review: params.review,
      source: params.source,
      toneOverride: params.tone,
      withRecoveryClassification: eligibleForRecovery,
    });

    const model = getReplyModel();

    // Respect local RPM cap before calling the API
    await waitForRateLimit();

    const ratingLabel = params.review.rating != null ? `${params.review.rating}★` : params.source;
    console.log(
      `[AI] Calling xAI (${model}) for review by ${params.review.author_name} (${ratingLabel})`
    );

    // retryWithBackoff handles 429 responses (reads Retry-After header + exponential backoff).
    const completion = await retryWithBackoff(
      () =>
        client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          reasoning_effort: "low",
          max_completion_tokens: 300,
        }),
      `generateReply(${params.review.id})`
    );

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    if (!raw) {
      console.warn("[AI] xAI returned no usable text", {
        model,
        finish_reason: completion.choices[0]?.finish_reason,
      });
      console.log("[AI] Empty response from xAI — using mock reply");
      return {
        reply: generateMockReply(params.review),
        recoverable: false,
        issue_label: null,
      };
    }

    let reply = raw;
    let recoverable = false;
    let issueLabel: string | null = null;

    if (eligibleForRecovery) {
      const parsed = parseRecoveryJson(raw);
      if (parsed) {
        reply = parsed.reply;
        recoverable = parsed.recoverable;
        issueLabel = parsed.issue_label;
      } else {
        // Malformed JSON — log and fall back to treating the whole response as
        // the reply text. The recovery flow degrades gracefully.
        console.warn(
          "[AI] Recovery JSON parse failed — falling back to plain reply"
        );
        reply = raw;
      }
    }

    reply = cleanReplyOutput(reply);

    if (params.source === "play_store" && reply.length > 350) {
      reply = truncateAtSentenceBoundary(reply, 347) + "...";
    }

    console.log(
      `[AI] Generated reply via xAI (${reply.length} chars):`,
      reply.substring(0, 80) + (reply.length > 80 ? "..." : ""),
      eligibleForRecovery
        ? `[recoverable=${recoverable} label=${issueLabel ?? "—"}]`
        : ""
    );

    return { reply, recoverable, issue_label: issueLabel };
  } catch (error: unknown) {
    const e = error as { status?: number; message?: string; response?: { data?: unknown } };
    console.error("[AI] xAI API error:", e.message || error);
    if (e.status === 401) {
      console.error("[AI] Invalid XAI_API_KEY — check environment variables");
    } else if (e.status === 429) {
      console.error("[AI] xAI rate limit hit — consider adding delays between calls");
    } else if (e.status === 400) {
      console.error("[AI] xAI request error:", e.response?.data || e.message);
    }
    return {
      reply: generateMockReply(params.review),
      recoverable: false,
      issue_label: null,
    };
  }
}

/**
 * Parse the model's JSON response. Returns null if the response isn't valid
 * JSON or doesn't contain a string "reply" field. We try the raw string first,
 * then attempt to extract a JSON object from anywhere in the text (the model
 * occasionally wraps output in ```json fences or prose despite instructions).
 */
function parseRecoveryJson(
  raw: string
): { reply: string; recoverable: boolean; issue_label: string | null } | null {
  const candidates: string[] = [raw];

  // Strip ```json fences if present
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) candidates.push(fenced[1]);

  // Grab the first {...} block in case the model added preamble
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) candidates.push(braceMatch[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed.reply === "string") {
        const recoverable =
          typeof parsed.recoverable === "boolean" ? parsed.recoverable : false;
        const labelRaw = parsed.issue_label;
        const issue_label =
          recoverable && typeof labelRaw === "string" && labelRaw.trim()
            ? labelRaw.trim()
            : null;
        return { reply: parsed.reply, recoverable, issue_label };
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

function cleanReplyOutput(reply: string): string {
  let cleaned = reply;
  // Strip wrapping quotes
  cleaned = cleaned.replace(/^["']|["']$/g, "");
  // Strip common preambles
  cleaned = cleaned.replace(
    /^(Reply|Response|Here's a reply|Here is a reply|My reply)[:\s-]+/i,
    ""
  );
  // Strip reasoning / thinking tags if the model leaks them
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  // Remove markdown bold (keep the text inside)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  // Collapse 3+ newlines to 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}

function truncateAtSentenceBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?")
  );
  if (lastSentenceEnd > maxLength * 0.6) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength);
}

function generateMockReply(review: Review): string {
  const name = review.author_name?.split(" ")[0] || "there";
  const rating = review.rating ?? 0;

  if (review.source === "whatsapp" || review.rating == null) {
    return `Hi ${name}, thanks for reaching out! We've got your message and a teammate will follow up shortly. In the meantime, is there anything specific we can help you with?`;
  }
  if (rating >= 4) {
    return `Thank you so much for your wonderful ${rating}-star review, ${name}! We're thrilled you're enjoying the experience. Your support means the world to us and motivates us to keep improving!`;
  }
  if (rating === 3) {
    return `Thanks for your honest feedback, ${name}. We appreciate you sharing your thoughts. We're constantly working to improve — could you tell us a bit more about what we could do better? We'd love to earn that 5-star rating from you!`;
  }
  return `We're really sorry about your experience, ${name}. This isn't the standard we aim for and we want to make it right. Could you please reach out to our support team? We'd love to resolve this for you personally.`;
}

export interface ClassifyOnlyParams {
  reviewId: string;
  rating: number | null;
  review_text: string;
  author_name: string;
}

export interface ClassifyOnlyResult {
  recoverable: boolean;
  issue_label: string | null;
  /** True when the AI call succeeded (regardless of verdict). False on hard failures — caller should NOT mark classification_at. */
  ok: boolean;
}

/**
 * Lightweight classifier — no reply text, just {recoverable, issue_label}.
 *
 * Designed for the poll-reviews cron pass so every negative review gets
 * classified independently of the reply flow (works for users in manual mode
 * who never trigger reply generation).
 *
 * Behavior:
 * - rating outside 1-3: returns {recoverable:false, label:null, ok:true} with no AI call (cheap fast-path).
 * - no XAI client: returns ok:false so cron does NOT stamp classification_at and will retry next run.
 * - any API/parse failure: returns ok:false (same retry-next-run semantics).
 *
 * Token budget: ~150 input tokens + ~30 output tokens — roughly 10× cheaper
 * than a full reply generation call.
 */
export async function classifyReviewOnly(
  params: ClassifyOnlyParams
): Promise<ClassifyOnlyResult> {
  const rating = params.rating ?? 0;

  // Fast-path: only 1-3★ reviews are candidates for issue clustering.
  if (rating < 1 || rating > 3) {
    return { recoverable: false, issue_label: null, ok: true };
  }

  // Empty review text — nothing to classify against.
  if (!params.review_text || !params.review_text.trim()) {
    return { recoverable: false, issue_label: null, ok: true };
  }

  const client = getXaiClient();
  if (!client) {
    // No key — caller should not mark classified, so it'll retry once configured.
    return { recoverable: false, issue_label: null, ok: false };
  }

  try {
    const prompt = buildClassifierPrompt({
      rating: params.rating,
      review_text: params.review_text,
      author_name: params.author_name,
    });
    const model = getReplyModel();

    await waitForRateLimit();

    const completion = await retryWithBackoff(
      () =>
        client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          reasoning_effort: "low",
          // Just JSON — small budget is plenty.
          max_completion_tokens: 80,
        }),
      `classifyReviewOnly(${params.reviewId})`
    );

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    if (!raw) {
      console.warn("[AI-classify] empty response", { reviewId: params.reviewId });
      return { recoverable: false, issue_label: null, ok: false };
    }

    const parsed = parseClassifierJson(raw);
    if (!parsed) {
      console.warn("[AI-classify] JSON parse failed — treating as non-recoverable", {
        reviewId: params.reviewId,
      });
      // Parse failure is "ok" enough to mark classified — otherwise we'd loop
      // forever on a review the model can't produce clean JSON for. Treat as
      // non-recoverable. The review can still be reclassified later via reply gen.
      return { recoverable: false, issue_label: null, ok: true };
    }

    return { ...parsed, ok: true };
  } catch (error: unknown) {
    const e = error as { status?: number; message?: string };
    console.error("[AI-classify] error:", e.message || error);
    // Hard failure (network, 5xx, 401, 429 after retries) — leave classification_at
    // null so the next cron pass retries.
    return { recoverable: false, issue_label: null, ok: false };
  }
}

/**
 * Parse the classifier's JSON. Similar to parseRecoveryJson but for the slim
 * {recoverable, issue_label} schema (no "reply" field).
 */
function parseClassifierJson(
  raw: string
): { recoverable: boolean; issue_label: string | null } | null {
  const candidates: string[] = [raw];

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) candidates.push(fenced[1]);

  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) candidates.push(braceMatch[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        const recoverable =
          typeof parsed.recoverable === "boolean" ? parsed.recoverable : false;
        const labelRaw = parsed.issue_label;
        const issue_label =
          recoverable && typeof labelRaw === "string" && labelRaw.trim()
            ? labelRaw.trim()
            : null;
        return { recoverable, issue_label };
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

export async function generateSentiment(
  _reviewText: string,
  rating: number
): Promise<"positive" | "negative" | "neutral" | "mixed"> {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}
