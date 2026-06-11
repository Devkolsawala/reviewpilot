// Extract meaningful search keywords from competitor LISTING text.
// Competitor reviews aren't accessible (not the user's app), so the only
// signal we have is the public listing copy: title + short + long description.
// We tokenize, lowercase, drop stopwords, and keep frequency-ranked uni/bi-grams.
//
// Deterministic + dependency-free — same spirit as the rest of src/lib/aso.

// Common English stopwords + ultra-generic store words that carry no search
// intent ("app", "download", "google", "play"…). Kept deliberately small so we
// don't strip real product terms like "offline", "ads", "lightweight".
const STOPWORDS: ReadonlySet<string> = new Set([
  "the", "and", "for", "you", "your", "with", "this", "that", "are", "our",
  "all", "can", "has", "have", "from", "will", "use", "using", "used", "get",
  "now", "new", "more", "most", "any", "but", "not", "out", "via", "per",
  "its", "their", "them", "they", "his", "her", "she", "him", "was", "were",
  "been", "being", "into", "onto", "than", "then", "too", "also", "just",
  "such", "very", "much", "many", "some", "each", "every", "other", "over",
  "when", "what", "who", "how", "why", "where", "which", "while", "about",
  "app", "apps", "application", "google", "play", "store", "download",
  "downloads", "install", "installs", "free", "version", "android",
  "feature", "features", "best", "top", "number", "one", "make", "makes",
  "made", "want", "need", "like", "help", "helps", "let", "lets", "let's",
  "available", "easy", "easily", "simple", "simply", "today", "everything",
]);

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !/^\d+$/.test(t));
}

/**
 * Build a deduped, frequency-ranked keyword list from listing text fragments.
 * Returns up to `max` terms — meaningful single words plus two-word phrases
 * (where neither word is a stopword), ordered by how often they appear.
 */
export function extractListingKeywords(fragments: string[], max = 40): string[] {
  const freq = new Map<string, number>();

  for (const fragment of fragments) {
    const tokens = tokenize(fragment);
    let prevMeaningful: string | null = null;
    for (const tok of tokens) {
      const isStop = STOPWORDS.has(tok);
      if (!isStop) {
        freq.set(tok, (freq.get(tok) ?? 0) + 1);
        // Bigram only when both adjacent tokens are meaningful (non-stop).
        if (prevMeaningful) {
          const bigram = `${prevMeaningful} ${tok}`;
          freq.set(bigram, (freq.get(bigram) ?? 0) + 1);
        }
        prevMeaningful = tok;
      } else {
        prevMeaningful = null; // break the bigram window on a stopword
      }
    }
  }

  return Array.from(freq.entries())
    // Drop hapax single words (appear once) to cut noise, but always keep
    // bigrams (they're rarer yet more distinctive).
    .filter(([term, count]) => term.includes(" ") || count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
    .slice(0, max);
}
