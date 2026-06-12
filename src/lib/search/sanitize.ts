/**
 * Input sanitization for global search.
 *
 * ILIKE treats % and _ as wildcards, and backslash as the escape character —
 * user input must have all three escaped so "%_%" searches for the literal
 * string rather than matching everything.
 *
 * PostgREST's .or() filter syntax additionally treats commas and parentheses
 * as structural tokens, so the pattern builder strips characters that could
 * break out of the filter expression. We never interpolate raw user input
 * into a query string.
 */

/** Escape ILIKE wildcards (% _) and the escape char (\) in user input. */
export function escapeIlike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Build the ILIKE pattern for a search query: trim, strip PostgREST filter
 * delimiters, escape wildcards, wrap in %…%. Returns null when the remaining
 * query is shorter than the 2-char minimum.
 */
export function buildIlikePattern(raw: string): string | null {
  const cleaned = raw.trim().replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length < 2) return null;
  return `%${escapeIlike(cleaned)}%`;
}
