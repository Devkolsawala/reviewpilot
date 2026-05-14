// Free-form xAI completion helper used by the public /api/tools/* routes.
//
// Why this exists separately from src/lib/ai/reply-generator.ts:
//   reply-generator.ts is tightly coupled to a Review + AppContext object
//   (it's the dashboard's review-reply pipeline). The public tools need a
//   simple "system prompt + user text → string" surface without faking
//   Review records. Same env vars, same OpenAI client shape, same rate-limit
//   wrappers — just a lighter API.

import OpenAI from "openai";
import { waitForRateLimit, retryWithBackoff } from "@/lib/ai/rate-limiter";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
      maxRetries: 0,
    });
  }
  return client;
}

export interface ToolCompletionParams {
  system: string;
  user: string;
  maxTokens?: number;
  context?: string;
}

export async function toolCompletion(
  params: ToolCompletionParams
): Promise<string> {
  const c = getClient();
  if (!c) throw new Error("ai_unavailable");

  const model = process.env.XAI_MODEL || "grok-4.3";

  await waitForRateLimit();

  const completion = await retryWithBackoff(
    () =>
      c.chat.completions.create({
        model,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
        reasoning_effort: "low",
        max_completion_tokens: params.maxTokens ?? 250,
      }),
    params.context || "toolCompletion"
  );

  const raw = completion.choices[0]?.message?.content?.trim() || "";
  return cleanOutput(raw);
}

function cleanOutput(raw: string): string {
  let cleaned = raw;
  cleaned = cleaned.replace(/^["']|["']$/g, "");
  cleaned = cleaned.replace(
    /^(Reply|Response|Here(?:'s| is) (?:a |the )?(?:reply|response|shortened version|translation))[:\s-]+/i,
    ""
  );
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}

const DIVIDER = "---DIVIDER---";

export interface Variation {
  text: string;
  charCount: number;
}

/**
 * Ask the model for 3 distinct rewrites in a single call, divider-separated.
 * Parses, trims, validates ≤ maxChars (truncating overlong ones at sentence
 * boundary), and returns up to 3 variations. Retries once if zero usable
 * variations were produced. UI must handle 1, 2, or 3 results gracefully.
 */
export async function toolVariations(params: {
  baseSystem: string;
  user: string;
  maxChars: number;
  maxTokens?: number;
  context?: string;
}): Promise<Variation[]> {
  const wrapSystem = (extra = "") =>
    `${params.baseSystem}\n\nReturn exactly 3 distinct rewrites separated by the literal token ${DIVIDER} on its own line. Each rewrite must be under ${params.maxChars} characters. No numbering, no quotes, no markdown, no preamble. Just three versions separated by the divider.${extra ? `\n\n${extra}` : ""}`;

  const first = await toolCompletion({
    system: wrapSystem(),
    user: params.user,
    maxTokens: params.maxTokens ?? 600,
    context: params.context || "toolVariations",
  });

  let parsed = parseVariations(first, params.maxChars);

  if (parsed.length === 0) {
    const retry = await toolCompletion({
      system: wrapSystem(
        `CRITICAL: Your previous output did not contain valid ${DIVIDER} separators. Re-output exactly three replies, each under ${params.maxChars} chars, separated by lines containing only ${DIVIDER}.`
      ),
      user: params.user,
      maxTokens: params.maxTokens ?? 600,
      context: (params.context || "toolVariations") + "-retry",
    });
    parsed = parseVariations(retry, params.maxChars);
  }

  if (parsed.length === 0) {
    // Last resort: treat the whole output as one variation (possibly truncated).
    const truncated = truncateAtBoundary(first, params.maxChars);
    if (truncated.length >= 5) {
      parsed = [{ text: truncated, charCount: truncated.length }];
    }
  }

  return parsed.slice(0, 3);
}

function parseVariations(raw: string, maxChars: number): Variation[] {
  const pieces = raw
    .split(DIVIDER)
    .map((p) => p.trim())
    // strip any leading numbering like "1.", "Option 1:", etc.
    .map((p) => p.replace(/^(?:option\s+)?\d+[\.\):\s-]+/i, "").trim())
    .filter((p) => p.length >= 5);

  return pieces.map((p) => {
    const t = p.length > maxChars ? truncateAtBoundary(p, maxChars) : p;
    return { text: t, charCount: t.length };
  });
}

// Truncate at the nearest sentence boundary ≤ maxLength, falling back to the
// last word boundary. Used when the model overshoots 350 chars twice.
export function truncateAtBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const slice = text.substring(0, maxLength);
  const lastSentence = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?")
  );
  if (lastSentence > maxLength * 0.55) {
    return slice.substring(0, lastSentence + 1);
  }
  const lastSpace = slice.lastIndexOf(" ");
  return slice.substring(0, lastSpace > 0 ? lastSpace : maxLength);
}
