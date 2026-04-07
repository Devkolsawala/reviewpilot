// Simple in-memory rate limiter for Groq API calls.
// Prevents bursting too many requests at once (conservative limit).

let requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 25;
const WINDOW_MS = 60 * 1000;

export async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter((ts) => now - ts < WINDOW_MS);

  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestInWindow = requestTimestamps[0];
    const waitTime = WINDOW_MS - (now - oldestInWindow) + 100;
    console.log(`[RATE LIMIT] Groq rate limit reached. Waiting ${waitTime}ms…`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  requestTimestamps.push(Date.now());
}
