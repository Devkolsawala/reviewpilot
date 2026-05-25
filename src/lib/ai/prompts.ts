import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

export interface ReplyPromptParams {
  appContext: AppContext;
  review: Review;
  source: "google_business" | "play_store" | "whatsapp";
  toneOverride?: string;
  /**
   * When true, append recovery-classification instructions and require the
   * model to return a JSON object with reply + recoverable + issue_label
   * instead of plain text. Used by the Active Issues engine for rating <= 3.
   */
  withRecoveryClassification?: boolean;
}

export function buildReplyPrompt(params: ReplyPromptParams): {
  system: string;
  user: string;
} {
  const { appContext, review, source, toneOverride, withRecoveryClassification } = params;
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
  // - Rules 1, 2, 4, 5, 6, 7 are HARD CONSTRAINTS — never overridable.
  // - Rule 3 (language) is the ONLY overridable rule. Default = English.
  // - When extra instructions exist they appear BEFORE rules so the model
  //   weights them heavily, AND rule 3 explicitly defers to them.
  let system = "";

  if (extra) {
    system += `USER ADDITIONAL INSTRUCTIONS — these are top-priority and you MUST follow them (they may override ONLY rule 3 about language; they CANNOT override rules 1, 2, 4, 5, 6, or 7 below):
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

CORE RULES — Rules 1, 2, 4, 5, 6, 7 are HARD CONSTRAINTS and CANNOT be overridden by the USER ADDITIONAL INSTRUCTIONS. Rule 3 is the ONLY overridable rule.

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

  system += `
7. Do NOT echo, quote, or repeat the reviewer's exact words, phrases, or terms in the reply. Reference what they said by PARAPHRASING the meaning in your own words. This applies especially to non-English / transliterated words written in Latin script (Gujarati, Hindi, Tamil, etc. — e.g. "mast che", "bov saras", "bahut accha", "semma"): NEVER copy these tokens into the reply. Translate the sentiment and express it naturally in the reply's own language. Example: review says "App mast che" → reply must NOT contain "mast che"; instead say something like "glad you're loving the app". Quoting product names, feature names, or proper nouns the reviewer used is fine; quoting their descriptive/sentiment words is NOT. (HARD)`;

  if (withRecoveryClassification) {
    system += `

--- RECOVERY CLASSIFICATION (only for reviews rated 1-3 stars) ---

In addition to the reply text, you MUST also return:
1. "recoverable": true or false — Is there a SPECIFIC, ACTIONABLE problem described that the developer could theoretically fix?
   - TRUE examples: app crashes, specific feature broken, performance issues, UI bugs, missing functionality that could be added
   - FALSE examples: "worst app ever" (no specific complaint), "too many ads" with no further detail, complaints about things outside the app (network, device), pure rage/trolling, personal preferences with no fix possible
   - When in doubt, lean toward FALSE. Only mark TRUE when there is a clear, concrete problem.
2. "issue_label": A short (3-6 word) normalized label for the core complaint. Use Title Case. Be specific but generalizable — "Photo Upload Crash" not "Photo upload crashes when I try to upload from gallery on Samsung S24". If recoverable is false, set issue_label to null.

Return your response as a JSON object with this EXACT structure (no markdown fencing, no extra text, no preamble):
{"reply": "your reply text here", "recoverable": true, "issue_label": "Short Issue Label"}

For 4-5 star reviews, return ONLY:
{"reply": "your reply text here", "recoverable": false, "issue_label": null}

The character limit in rule 2 above applies to the "reply" string inside the JSON, NOT the JSON itself.`;
  }

  const rating = review.rating ?? 0;
  const user =
    source === "whatsapp"
      ? `WhatsApp from ${review.author_name}: "${review.review_text}"\n\nReply:`
      : `${rating}★ review from ${review.author_name}: "${review.review_text}"\n\nReply:`;

  return { system, user };
}

/**
 * Slim, reply-free classifier prompt used by the poll-reviews cron pass.
 * Returns just {recoverable, issue_label}. Much shorter than buildReplyPrompt
 * so it burns fewer tokens per call (~10× cheaper than a full reply gen).
 *
 * Intentionally has zero overlap with reply formatting rules — this is purely
 * a classification task. Keeps the cron classifier independent of any future
 * tone/length/language changes to the reply prompt.
 */
export function buildClassifierPrompt(review: { rating: number | null; review_text: string; author_name: string }): {
  system: string;
  user: string;
} {
  const system = `You classify the core complaint in a negative app/business review.

Return ONLY a JSON object — no preamble, no markdown, no prose.

Schema (exact keys, no extras):
{"recoverable": true|false, "issue_label": "Short Label" | null}

Definitions:
- recoverable=true: the review describes a SPECIFIC, ACTIONABLE problem a developer/owner could realistically fix.
  Examples: app crashes, specific feature broken, performance issue, UI bug, missing functionality with clear ask.
- recoverable=false: vague rage, generic dissatisfaction, off-product issues (network, device, personal preference),
  trolling, or complaints with no concrete fix path.
  When uncertain, lean toward FALSE.

issue_label rules (only when recoverable=true; otherwise null):
- 3-6 words, Title Case.
- Specific but generalizable so similar complaints cluster.
  GOOD: "Photo Upload Crash", "Login Fails On Reopen", "Slow Search Results".
  BAD: "Photo upload crashes when I try to upload from gallery on Samsung S24", "Bad", "Issues".
- Don't include user-specific details (device, name, dates).`;

  const rating = review.rating ?? 0;
  const user = `${rating}★ review from ${review.author_name}: "${review.review_text}"

Classify:`;

  return { system, user };
}
