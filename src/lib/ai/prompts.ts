import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

export interface ReplyPromptParams {
  appContext: AppContext;
  review: Review;
  source: "google_business" | "play_store" | "whatsapp";
  toneOverride?: string;
}

export function buildReplyPrompt(params: ReplyPromptParams): {
  system: string;
  user: string;
} {
  const { appContext, review, source, toneOverride } = params;
  const charLimit =
    source === "play_store" ? 350 : source === "whatsapp" ? 1024 : 2000;
  const tone = toneOverride || appContext?.tone || "friendly";
  const platformName =
    source === "play_store"
      ? "Play Store"
      : source === "whatsapp"
        ? "WhatsApp"
        : "Google Business";
  const surface =
    source === "whatsapp" ? "WhatsApp message" : `${platformName} review`;

  const toneInstructions: Record<string, string> = {
    friendly: "Warm, human, uses contractions.",
    professional: "Polished, respectful, well-structured. Not robotic.",
    casual: "Relaxed, conversational, light contractions.",
    apologetic: "Empathetic, accountable, leads with understanding.",
    custom: appContext?.custom_tone_example
      ? `Match this example: "${appContext.custom_tone_example}"`
      : "Warm and human.",
  };
  const toneGuide = toneInstructions[tone] || toneInstructions.friendly;

  const hasAdditionalInstructions = !!appContext?.additional_instructions?.trim();

  let system = `Reply to a ${surface}. Max ${charLimit} chars. Tone: ${tone} — ${toneGuide}`;

  if (hasAdditionalInstructions) {
    system += `\n\nIMPORTANT USER INSTRUCTION (overrides everything else): ${appContext!.additional_instructions}`;
  }

  if (appContext?.description) {
    system += `\n\nAbout: ${appContext.description}`;
  }
  if (appContext?.key_features?.length) {
    system += `\nFeatures: ${appContext.key_features.join(", ")}`;
  }
  if (appContext?.known_issues?.length) {
    system += `\nKnown issues (acknowledge if mentioned): ${appContext.known_issues.join("; ")}`;
  }
  if (appContext?.common_questions?.length) {
    system += `\nFAQ (answer if asked): ${appContext.common_questions.join("; ")}`;
  }
  if (appContext?.support_url) {
    system += `\nSupport URL (include when relevant): ${appContext.support_url}`;
  }

  // Language rule: default is English-only. User's additional_instructions can override.
  const languageRule = hasAdditionalInstructions
    ? `Follow the IMPORTANT USER INSTRUCTION above for language choice. If it does not specify a language, write the reply entirely in English regardless of the language of the review.`
    : `Write the reply entirely in English, regardless of the language or script the reviewer used (Hindi, Hinglish, Gujarati, Tamil, Spanish, etc). Understand their meaning, but reply only in English.`;

  system += `\n\nRULES:
1. Output ONLY the reply text. No preamble, no quotes, no markdown, no [placeholders].
2. Stay UNDER ${charLimit} characters.
3. ${languageRule}
4. Do NOT quote, repeat, or echo non-English / slang / colloquial words from the review (e.g. "mast", "bahut accha", "mast che", "bohot", "kya baat", etc). Paraphrase the sentiment in clean English instead. Quoting these terms reads as unprofessional.
5. Address what the reviewer actually said — never generic "thanks for your feedback".
6. Sound like a real person, not a corporate bot.`;

  if (source === "whatsapp") {
    system += `
7. This is a chat message, not a review. Infer intent: question→answer, complaint→apologize+next step, positive→brief thanks.`;
  } else {
    system += `
7. By rating: 5★ thank for specifics (brief). 4★ thank + address gap. 3★ acknowledge both sides, ask what to improve. 2★ empathize + concrete next step. 1★ sincere apology + direct help, never defensive.`;
  }

  const rating = review.rating ?? 0;
  const user =
    source === "whatsapp"
      ? `WhatsApp from ${review.author_name}: "${review.review_text}"\n\nReply:`
      : `${rating}★ review from ${review.author_name}: "${review.review_text}"\n\nReply:`;

  return { system, user };
}
