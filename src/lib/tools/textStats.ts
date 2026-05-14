// Pure text statistics + compliance detection for the Play Store reply tool.
// All exports are SSR-safe and have no side effects.

// Built via RegExp constructor to avoid TS's "regex flag requires ES6+ target"
// diagnostic — the project's tsconfig has no explicit `target`, which defaults
// to ES3 for the literal-regex check even though `lib` includes esnext.
const EMOJI_RE = new RegExp("\\p{Extended_Pictographic}", "gu");
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<]+/i;
// E.164, Indian +91, and bare 10-digit phone patterns. Avoids matching app
// version strings like "4.1.2" by requiring a leading + or digit-run boundary.
const PHONE_RE =
  /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3}[\s-]?\d{4}/;
const GENERIC_PHRASES = [
  "thank you for your feedback",
  "we appreciate",
  "we value",
  "your feedback is important",
  "we apologize for the inconvenience",
  "means a lot to us",
  "we hope to see you again",
];

export function countChars(s: string): number {
  return s.length;
}

export function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countEmojis(s: string): number {
  const matches = s.match(EMOJI_RE);
  return matches ? matches.length : 0;
}

export function countSentences(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  // Split on . ! ? and the Devanagari danda ।, ignoring empty pieces.
  const parts = trimmed
    .split(/[.!?।]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return Math.max(1, parts.length);
}

export function detectUrls(s: string): boolean {
  return URL_RE.test(s);
}

export function detectPhones(s: string): boolean {
  // Strip obvious non-phone digit clusters first (app versions like 4.1.2).
  const cleaned = s.replace(/\b\d+\.\d+(?:\.\d+)?\b/g, " ");
  return PHONE_RE.test(cleaned);
}

export function detectGenericPhrases(s: string): {
  count: number;
  matches: string[];
} {
  const lower = s.toLowerCase();
  const matches = GENERIC_PHRASES.filter((p) => lower.includes(p));
  return { count: matches.length, matches };
}
