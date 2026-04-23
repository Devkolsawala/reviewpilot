const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

// Best-effort opportunistic cleanup so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  buckets.forEach((bucket, ip) => {
    if (bucket.resetAt < now) buckets.delete(ip);
  });
}, WINDOW_MS).unref?.();
