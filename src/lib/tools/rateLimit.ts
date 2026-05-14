// Shared in-memory per-IP rate limit for the public /tools/* API routes.
// 15 requests per IP per rolling 60-minute window across all tool endpoints.
//
// In-memory only — sufficient for a single Vercel function instance. If usage
// grows we can swap to Upstash Redis without changing the call signature.

const buckets = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 15;
const WINDOW_MS = 60 * 60 * 1000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: LIMIT - 1, resetAt: now + WINDOW_MS };
  }

  if (bucket.count >= LIMIT) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: LIMIT - bucket.count, resetAt: bucket.resetAt };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
