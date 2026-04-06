export function analyzeSentiment(text: string, rating: number): "positive" | "negative" | "neutral" | "mixed" {
  if (!text) {
    if (rating >= 4) return "positive";
    if (rating <= 2) return "negative";
    return "neutral";
  }

  const positiveWords = ["great", "amazing", "love", "excellent", "best", "awesome", "fantastic", "wonderful", "perfect", "recommend", "easy", "helpful", "friendly", "clean", "fast"];
  const negativeWords = ["terrible", "worst", "hate", "awful", "horrible", "bad", "slow", "crash", "bug", "broken", "expensive", "rude", "dirty", "scam", "waste"];

  const lowerText = text.toLowerCase();
  const posCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (posCount > 0 && negCount > 0) return "mixed";
  if (rating >= 4 && posCount > 0) return "positive";
  if (rating <= 2 && negCount > 0) return "negative";
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  if (rating === 3) return "mixed";
  return "neutral";
}

export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set(["the", "a", "an", "is", "it", "to", "in", "for", "of", "and", "but", "or", "this", "that", "with", "was", "are", "have", "has", "had", "not", "been", "very", "much", "just", "also", "so", "my", "i", "me", "we", "they", "you", "your"]);

  const words = text.toLowerCase()
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}
