import Groq from "groq-sdk";
import { buildReplyPrompt } from "./prompts";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/** Groq assistant message: content may be string, text parts array, or empty when reasoning-only. */
type GroqAssistantMessage = {
  content?: string | Array<{ type?: string; text?: string }> | null;
  reasoning?: string | null;
};

function extractGroqAssistantText(message: GroqAssistantMessage | undefined): string {
  if (!message) return "";
  const { content, reasoning } = message;
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    text = content
      .map((p) =>
        p && typeof p === "object" && "text" in p ? String((p as { text?: string }).text ?? "") : ""
      )
      .join("");
  }
  text = text.trim();
  if (text) return text;
  if (typeof reasoning === "string" && reasoning.trim()) {
    return reasoning.trim();
  }
  return "";
}

function isGptOssModel(model: string): boolean {
  return /gpt-oss|gpt_oss/i.test(model);
}

function stripReasoningTags(text: string): string {
  // Models may wrap chain-of-thought in think tags (\u003c = "<" avoids editor mangling)
  return text
    .replace(/\u003cthink\u003e[\s\S]*?\u003c\/think\u003e/gi, "")
    .trim();
}

export interface GenerateReplyParams {
  appContext: AppContext | Record<string, unknown>;
  review: Review;
  source: "google_business" | "play_store";
  tone?: string;
}

export async function generateReply(params: GenerateReplyParams): Promise<string> {
  const client = getGroqClient();

  if (!client) {
    console.log("[AI] No GROQ_API_KEY set — using mock reply");
    return generateMockReply(params.review);
  }

  try {
    const prompt = buildReplyPrompt({
      appContext: params.appContext as AppContext,
      review: params.review,
      source: params.source,
      toneOverride: params.tone,
    });

    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const gptOss = isGptOssModel(model);

    // GPT-OSS is a reasoning model: without reasoning_format / enough output budget, `content` can be empty.
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.7,
      max_completion_tokens: gptOss ? 1536 : 600,
      top_p: 1,
      ...(gptOss
        ? {
            reasoning_format: "hidden" as const,
            reasoning_effort: "low" as const,
          }
        : {}),
    });

    const choice = completion.choices[0];
    const msg = choice?.message as GroqAssistantMessage | undefined;
    let reply = extractGroqAssistantText(msg);
    reply = stripReasoningTags(reply);

    if (!reply) {
      console.warn("[AI] Groq returned no usable text", {
        model,
        finish_reason: choice?.finish_reason,
        hasContent: msg?.content != null,
        hasReasoning: !!(msg?.reasoning && String(msg.reasoning).trim()),
      });
      console.log("[AI] Empty response from Groq — using mock reply");
      return generateMockReply(params.review);
    }

    if (params.source === "play_store" && reply.length > 350) {
      const truncated = reply.substring(0, 350);
      const lastEnd = Math.max(
        truncated.lastIndexOf(". "),
        truncated.lastIndexOf("! "),
        truncated.lastIndexOf("? ")
      );
      reply =
        lastEnd > 100
          ? truncated.substring(0, lastEnd + 1).trim()
          : truncated.substring(0, 347).trim() + "...";
    }

    console.log(
      "[AI] Generated reply via Groq:",
      reply.substring(0, 80) + (reply.length > 80 ? "..." : "")
    );
    return reply;
  } catch (error: unknown) {
    const e = error as { message?: string };
    console.error("[AI] Groq API error:", e.message);
    return generateMockReply(params.review);
  }
}

function generateMockReply(review: Review): string {
  const name = review.author_name?.split(" ")[0] || "there";

  if (review.rating >= 4) {
    return `Thank you so much for your wonderful ${review.rating}-star review, ${name}! We're thrilled you're enjoying the experience. Your support means the world to us and motivates us to keep improving!`;
  }
  if (review.rating === 3) {
    return `Thanks for your honest feedback, ${name}. We appreciate you sharing your thoughts. We're constantly working to improve — could you tell us a bit more about what we could do better? We'd love to earn that 5-star rating from you!`;
  }
  return `We're really sorry about your experience, ${name}. This isn't the standard we aim for and we want to make it right. Could you please reach out to our support team? We'd love to resolve this for you personally.`;
}
