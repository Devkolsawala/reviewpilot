import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

export interface ReplyPromptParams {
  appContext: AppContext;
  review: Review;
  source: "google_business" | "play_store";
  toneOverride?: string;
}

export function buildReplyPrompt(params: ReplyPromptParams): {
  system: string;
  user: string;
} {
  const { appContext, review, source, toneOverride } = params;
  const charLimit = source === "play_store" ? 350 : 2000;
  const tone = toneOverride || appContext?.tone || "friendly";
  const platformName =
    source === "play_store" ? "Play Store" : "Google Business Profile";
  const entityType = source === "play_store" ? "app" : "business";

  const businessName = appContext?.description
    ? extractBusinessName(appContext.description)
    : source === "play_store"
      ? "our app"
      : "our business";

  const toneInstructions: Record<string, string> = {
    friendly:
      "Warm and approachable. Write like a friendly human who genuinely cares. Use contractions (we're, you'll, it's).",
    professional:
      "Polished and respectful. Well-structured sentences. Avoid slang but still sound human, not robotic.",
    casual:
      'Relaxed and conversational. Light contractions are great. Can use phrases like "Hey!" or "Totally get it."',
    apologetic:
      "Empathetic and accountable. Lead with understanding. Acknowledge the issue clearly without being defensive.",
    custom: appContext?.custom_tone_example
      ? `Match this example tone: "${appContext.custom_tone_example}"`
      : "Warm and human.",
  };

  const toneGuide = toneInstructions[tone] || toneInstructions.friendly;
  const contextSection = buildContextSection(appContext, entityType);

  const system = `You are responding to a customer review on the ${platformName} on behalf of ${businessName}.

${contextSection}

TONE: ${tone}
${toneGuide}

HARD RULES — you MUST follow all of these:
1. Output ONLY the reply text. No preamble, no quotes around the reply, no meta-commentary, no markdown formatting.
2. Keep reply UNDER ${charLimit} characters. This is a hard platform limit — going over will fail.
3. Address the reviewer's SPECIFIC concerns. Never write generic "thank you for your feedback" replies.
4. Write like a real human who cares, not a corporate bot. No phrases like "We value your feedback" or "Thank you for bringing this to our attention" — these are robotic.
5. Do not include brackets, placeholders, or template variables like [Name] or {business}. Write the final reply ready to publish.
6. LANGUAGE MATCHING — CRITICAL: Detect the language the reviewer used and reply in the EXACT SAME language, including the same script and the same code-mix. Examples:
   - If the review is in Hindi (Devanagari script) → reply in Hindi (Devanagari script).
   - If the review is in Hinglish (Hindi words written in Roman/English script, or a mix of Hindi + English words) → reply in Hinglish using the same mix and style.
   - If the review is in Spanish → reply in Spanish.
   - If the review is in English → reply in English.
   - If the review is in Tamil / Telugu / Marathi / Bengali / Gujarati / any other language → reply in that same language and script.
   - If the review mixes two languages (e.g. Spanglish, Tanglish, Tamil + English), match that same code-mix.
   Do NOT translate the review into English and reply in English — match the reviewer's own language and style exactly. This makes the reply feel personal, not automated.

RESPONSE STRATEGY BY RATING:
- 5 stars: Thank them for the SPECIFIC thing they praised. Be warm. Keep it brief (2-3 sentences max).
- 4 stars: Thank them, then briefly address what might have kept it from 5 stars if mentioned.
- 3 stars: Acknowledge both the good and the concern. Ask what you could do better. Be genuine.
- 2 stars: Empathize first. Address the specific complaint. Offer a concrete next step (support URL, reach out, etc).
- 1 star: Lead with a sincere apology for their experience. Acknowledge the specific issue. Offer direct help — do not be defensive.

${
  appContext?.known_issues?.length
    ? `KNOWN ISSUES — if the review mentions one of these, acknowledge it and mention we're working on a fix:\n${appContext.known_issues.map((i) => `- ${i}`).join("\n")}\n`
    : ""
}${
    appContext?.common_questions?.length
      ? `COMMON QUESTIONS — if the review asks about any of these, answer directly:\n${appContext.common_questions.map((q) => `- ${q}`).join("\n")}\n`
      : ""
  }${appContext?.support_url ? `SUPPORT URL (include when relevant): ${appContext.support_url}\n` : ""}${appContext?.additional_instructions ? `ADDITIONAL INSTRUCTIONS: ${appContext.additional_instructions}\n` : ""}
Remember: Output ONLY the reply text itself. No "Here's my reply:" prefix. No quotation marks. Just the clean reply ready to publish.`;

  const ratingDisplay =
    "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

  const user = `Review from ${review.author_name}:
${ratingDisplay} (${review.rating} of 5 stars)
"${review.review_text}"

Write the reply now:`;

  return { system, user };
}

function buildContextSection(
  appContext: AppContext | undefined,
  entityType: string
): string {
  const parts: string[] = [];

  if (appContext?.description) {
    parts.push(
      `ABOUT THIS ${entityType.toUpperCase()}:\n${appContext.description}`
    );
  }

  if (appContext?.key_features?.length) {
    parts.push(
      `KEY FEATURES:\n${appContext.key_features.map((f) => `- ${f}`).join("\n")}`
    );
  }

  return parts.join("\n\n");
}

function extractBusinessName(description: string): string {
  const firstSentence = description.split(/[.!?]/)[0];
  const words = firstSentence.split(" ").slice(0, 4).join(" ");
  return words || "our business";
}
