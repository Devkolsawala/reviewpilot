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
