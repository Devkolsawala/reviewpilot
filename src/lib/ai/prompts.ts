import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

export function buildReplyPrompt(params: {
  appContext: AppContext;
  review: Review;
  source: "google_business" | "play_store";
  toneOverride?: string;
}): { system: string; user: string } {
  const { appContext, review, source, toneOverride } = params;
  const charLimit = source === "play_store" ? 350 : 2000;
  const tone =
    toneOverride ||
    appContext.tone ||
    "friendly";

  const toneLabel =
    tone === "friendly"
      ? "warm and approachable"
      : tone === "professional"
        ? "polished and formal"
        : tone === "casual"
          ? "relaxed and personable"
          : tone === "apologetic"
            ? "empathetic; lead with a sincere apology when appropriate"
            : tone === "custom" && appContext.custom_tone_example
              ? `match this example style: "${appContext.custom_tone_example}"`
              : "warm and professional";

  const system = `You are a customer support representative replying to public store reviews.

${appContext.description ? `ABOUT THIS ${source === "play_store" ? "APP" : "BUSINESS"}:\n${appContext.description}\n` : ""}${appContext.key_features?.length ? `KEY FEATURES:\n${appContext.key_features.map((f) => `- ${f}`).join("\n")}\n` : ""}${appContext.common_questions?.length ? `COMMON CUSTOMER QUESTIONS:\n${appContext.common_questions.map((q) => `- ${q}`).join("\n")}\n` : ""}${appContext.known_issues?.length ? `KNOWN ISSUES (acknowledge if relevant):\n${appContext.known_issues.map((i) => `- ${i}`).join("\n")}\n` : ""}
REPLY TONE: ${tone} (${toneLabel})
${appContext.support_url ? `SUPPORT URL: ${appContext.support_url}\n` : ""}

RULES:
- Keep the reply UNDER ${charLimit} characters (strict platform limit).
- Be specific to this review — never generic "thank you for your feedback" fluff.
- If the review mentions a known issue, acknowledge it briefly; do not invent fix dates unless provided in context.
- If they ask a question, answer directly using the context above when possible.
- Negative (1–2★): empathize → address the specific concern → offer a clear next step.
- Positive (4–5★): thank them for something concrete they said; keep it warm and brief.
- Mixed (3★): acknowledge what worked, address concerns, invite improvement ideas.
- Do not be defensive or argumentative.
- Avoid corporate buzzphrases like "We value your feedback" or "Thank you for bringing this to our attention."
- Write like a caring human, not a template.
- No markdown; plain text only.
${appContext.additional_instructions ? `ADDITIONAL INSTRUCTIONS: ${appContext.additional_instructions}` : ""}`;

  const user = `Review from ${review.author_name}:
Rating: ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)} (${review.rating}/5)
"${review.review_text}"

Write a reply:`;

  return { system, user };
}
