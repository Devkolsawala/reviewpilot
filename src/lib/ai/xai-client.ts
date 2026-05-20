import OpenAI from "openai";

// Singleton xAI client. Other modules (reply-generator, classifyReviewInsights)
// must import from here rather than instantiating their own — keeps maxRetries:0
// and baseURL consistent, and avoids duplicate connection pools.

let xaiClient: OpenAI | null = null;

export function getXaiClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  if (!xaiClient) {
    xaiClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
      // Disable built-in auto-retry. We have our own retryWithBackoff wrapper
      // so we don't want the SDK silently duplicating requests (which was
      // causing 2× billing on the xAI console).
      maxRetries: 0,
    });
  }
  return xaiClient;
}

export function getReplyModel(): string {
  return process.env.XAI_MODEL || "grok-4.3";
}

export function getInsightsModel(): string {
  return process.env.XAI_INSIGHTS_MODEL || process.env.XAI_MODEL || "grok-4.3";
}
