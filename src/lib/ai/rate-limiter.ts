/**
 * Groq rate limiter for openai/gpt-oss-120b
 *
 * Hard limits (Groq):  30 RPM · 1K RPD · 8K TPM · 200K TPD
 * Our conservative cap: 8 RPM  (each request ~800–1200 tokens → stays well under 8K TPM)
 *
 * Strategy:
 *  1. waitForRateLimit()  — called before every API request; enforces RPM cap locally
 *  2. retryWithBackoff()  — wraps the actual API call; handles real 429s from Groq
 *     by reading the Retry-After header and retrying up to MAX_RETRIES times
 */

// ── Local RPM guard ────────────────────────────────────────────────────────────

const MAX_RPM = 8;          // conservative cap (hard limit is 30, but TPM is tighter)
const WINDOW_MS = 60_000;   // 1 minute sliding window

let requestTimestamps: number[] = [];

export async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  // Drop timestamps outside the sliding window
  requestTimestamps = requestTimestamps.filter((ts) => now - ts < WINDOW_MS);

  if (requestTimestamps.length >= MAX_RPM) {
    // Wait until the oldest request falls out of the window
    const oldestInWindow = requestTimestamps[0];
    const waitMs = WINDOW_MS - (now - oldestInWindow) + 150; // +150ms safety buffer
    console.log(`[rate-limiter] RPM cap reached (${requestTimestamps.length}/${MAX_RPM}). Waiting ${waitMs}ms…`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    // Re-prune after waiting
    requestTimestamps = requestTimestamps.filter((ts) => Date.now() - ts < WINDOW_MS);
  }

  requestTimestamps.push(Date.now());
}

// ── 429 retry wrapper ──────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 5_000; // 5 s base; doubles each retry

interface RateLimitError {
  status?: number;
  error?: { message?: string };
  headers?: { get?: (name: string) => string | null };
  message?: string;
}

function getRetryAfterMs(error: RateLimitError): number {
  // Groq sets Retry-After in seconds on 429 responses
  const retryAfter = error.headers?.get?.("retry-after");
  if (retryAfter) {
    const seconds = parseFloat(retryAfter);
    if (!isNaN(seconds)) return Math.ceil(seconds * 1000) + 500; // +500ms buffer
  }
  return 0;
}

function is429(error: unknown): boolean {
  const e = error as RateLimitError;
  return (
    e?.status === 429 ||
    String(e?.message ?? "").toLowerCase().includes("rate limit") ||
    String(e?.message ?? "").toLowerCase().includes("too many requests")
  );
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context = "AI"
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      if (!is429(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      // Prefer Groq's Retry-After header; fall back to exponential backoff
      const retryAfterMs = getRetryAfterMs(error as RateLimitError);
      const backoffMs = retryAfterMs || BASE_BACKOFF_MS * Math.pow(2, attempt);

      console.warn(
        `[rate-limiter] ${context} 429 on attempt ${attempt + 1}/${MAX_RETRIES + 1}. ` +
        `Retrying in ${Math.round(backoffMs / 1000)}s…`
      );

      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}
