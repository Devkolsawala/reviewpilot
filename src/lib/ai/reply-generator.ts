import OpenAI from "openai";
import { buildReplyPrompt } from "./prompts";
import { waitForRateLimit, retryWithBackoff } from "./rate-limiter";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

let xaiClient: OpenAI | null = null;

function getXaiClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  if (!xaiClient) {
    xaiClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
      // Disable built-in auto-retry (default is 2). We have our own
      // retryWithBackoff wrapper so we don't want SDK silently duplicating
      // requests — that was causing 2× billing on xAI console.
      maxRetries: 0,
    });
  }
  return xaiClient;
}

export interface GenerateReplyParams {
  appContext: AppContext | Record<string, unknown>;
  review: Review;
  source: "google_business" | "play_store" | "whatsapp";
  tone?: string;
}

export async function generateReply(params: GenerateReplyParams): Promise<string> {
  const client = getXaiClient();

  if (!client) {
    console.log("[AI] No XAI_API_KEY set — using mock reply");
    return generateMockReply(params.review);
  }

  try {
    const prompt = buildReplyPrompt({
      appContext: params.appContext as AppContext,
      review: params.review,
      source: params.source,
      toneOverride: params.tone,
    });

    const model = process.env.XAI_MODEL || "grok-4-1-fast-reasoning";

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
          temperature: 0.7,
          max_tokens: 500,
          top_p: 0.95,
          // Note: grok-4-1-fast-reasoning does NOT support
          // frequency_penalty or presence_penalty — do not add them here.
        }),
      `generateReply(${params.review.id})`
    );

    let reply = completion.choices[0]?.message?.content?.trim() || "";

    if (!reply) {
      console.warn("[AI] xAI returned no usable text", {
        model,
        finish_reason: completion.choices[0]?.finish_reason,
      });
      console.log("[AI] Empty response from xAI — using mock reply");
      return generateMockReply(params.review);
    }

    reply = cleanReplyOutput(reply);

    if (params.source === "play_store" && reply.length > 350) {
      reply = truncateAtSentenceBoundary(reply, 347) + "...";
    }

    console.log(
      `[AI] Generated reply via xAI (${reply.length} chars):`,
      reply.substring(0, 80) + (reply.length > 80 ? "..." : "")
    );
    return reply;
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
    return generateMockReply(params.review);
  }
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

export async function generateSentiment(
  _reviewText: string,
  rating: number
): Promise<"positive" | "negative" | "neutral" | "mixed"> {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}
