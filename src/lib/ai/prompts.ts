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
    custom: appContext?.custom_tone_example?.trim()
      ? `Match this example: "${appContext.custom_tone_example.trim()}"`
      : "Warm and human.",
  };
  const toneGuide = toneInstructions[tone] || toneInstructions.friendly;

  const extra = appContext?.additional_instructions?.trim();

  // Override semantics:
  // - Rules 1, 2, 4, 5, 6 are HARD CONSTRAINTS — never overridable.
  // - Rule 3 (language) is the ONLY overridable rule. Default = English.
  // - When extra instructions exist they appear BEFORE rules so the model
  //   weights them heavily, AND rule 3 explicitly defers to them.
  let system = "";

  if (extra) {
    system += `USER ADDITIONAL INSTRUCTIONS — these are top-priority and you MUST follow them (they may override ONLY rule 3 about language; they CANNOT override rules 1, 2, 4, 5, or 6 below):
${extra}

`;
  }

  system += `You are writing a reply to a ${surface}. Max ${charLimit} chars. Tone: ${tone} — ${toneGuide}`;

  if (appContext?.description?.trim()) {
    system += `\n\nAbout: ${appContext.description.trim()}`;
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
  if (appContext?.support_url?.trim()) {
    system += `\nSupport URL (include when relevant): ${appContext.support_url.trim()}`;
  }

  // Rule 3: language. When user has additional instructions, defer entirely
  // to them for language. When there are none, default to English.
  const rule3 = extra
    ? `3. Language: follow the USER ADDITIONAL INSTRUCTIONS above for which language to reply in. If the user said "reply in the same language as the review", detect the review's language (Gujarati / Hindi / Tamil / Spanish / etc.) and write the ENTIRE reply in that language and script — do NOT mix English. If the user said "always reply in <language>", reply in that language. ONLY this rule (rule 3) is overridable. (OVERRIDABLE)`
    : `3. Language: write the reply entirely in English, regardless of the language or script the reviewer used. (OVERRIDABLE — but no override is set, so reply in English.)`;

  system += `

CORE RULES — Rules 1, 2, 4, 5, 6 are HARD CONSTRAINTS and CANNOT be overridden by the USER ADDITIONAL INSTRUCTIONS. Rule 3 is the ONLY overridable rule.

1. Output ONLY the reply text. No preamble, no quotes, no markdown, no [placeholders], no labels like "Reply:". (HARD)
2. Stay strictly UNDER ${charLimit} characters. (HARD)
${rule3}
4. Be specific to what the reviewer actually said — never generic templates like "thanks for your feedback". (HARD)
5. Sound like a real person, not a corporate bot — warm and human, never robotic. (HARD)`;

  if (source === "whatsapp") {
    system += `
6. This is a chat message, not a review. Infer intent: question→answer, complaint→apologize+next step, positive→brief thanks. (HARD)`;
  } else {
    system += `
6. Rating-aware behavior (HARD):
   - 5★: thank for specifics, brief.
   - 4★: thank + address gap.
   - 3★: acknowledge both sides, ask what to improve.
   - 2★: empathize + concrete next step.
   - 1★: sincere apology + direct help, never defensive.`;
  }

  const rating = review.rating ?? 0;
  const user =
    source === "whatsapp"
      ? `WhatsApp from ${review.author_name}: "${review.review_text}"\n\nReply:`
      : `${rating}★ review from ${review.author_name}: "${review.review_text}"\n\nReply:`;

  return { system, user };
}
