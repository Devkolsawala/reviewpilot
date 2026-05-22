// Daily per-IP rate limit for the public Play Store analyzer.
//
// Uses an atomic Postgres RPC (reserve_analyzer_quota) that collapses the
// previous check+increment pair into one locked transaction. The prior
// non-atomic pattern had a TOCTOU race where the 10-22s pipeline window
// between check and record let concurrent (or fast-fired sequential)
// requests both pass a stale fresh_count and run, letting a user exceed the
// 3-per-day cap by clicking faster than the pipeline finished. See
// migration 033_analyzer_quota_rpc.sql.
//
// Tiers per IP per day:
//   anonymous           → 3 fresh analyses
//   after email unlock  → +5 fresh analyses (8 total)
//   hard cap            → 20 unique package ids/day regardless of tier
//
// "Fresh" means a cache miss that triggers scrape + AI. Cache hits are free
// and never call into this module.
//
// IP hashing: SHA-256 of (ip + daily_salt). Daily salt derives from
// SUPABASE_SERVICE_ROLE_KEY + the date — no new env var. We never store
// raw IPs.

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const ANON_LIMIT = 3;
const EMAIL_BONUS = 5;

export interface UsageInfo {
  freshUsedToday: number;
  freshLimitToday: number;   // 3 anon, 8 after email unlock
  emailUnlocked: boolean;
  uniquePackageCount: number;
  /**
   * Whether the response the caller is about to send/render was served
   * from cache (and therefore did not increment freshUsedToday). Pure
   * client signal — the server doesn't read this back.
   */
  cached: boolean;
}

export type ReserveReason = "anon_quota" | "email_quota" | "unique_cap";

export interface ReserveResult {
  accepted: boolean;
  usage: UsageInfo;
  reason?: ReserveReason;
  needsEmail?: boolean;
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function hashIp(ip: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const salt = `${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}:${today}`;
  return createHash("sha256").update(`${ip}|${salt}`).digest("hex");
}

// ── TEMPORARY DIAGNOSTIC — remove once IP-hash inconsistency is diagnosed ───
// Behaviorally identical to `hashIp(getClientIp(req))`. The only difference is
// a one-line [rate-limit-debug] log emission with the full request-routing
// context (every IP-bearing header Vercel/CF can expose, plus salt-shape and
// hash prefix) so we can correlate why two requests from the same browser
// produce different ipHash values. NO secrets are logged — salt is reported
// as a length only, and only the first 8 chars of the hash are emitted.
export function debugHashIp(req: Request): string {
  const ip = getClientIp(req);
  const dayString = new Date().toISOString().slice(0, 10);
  const saltSourceLength =
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length + 1 + dayString.length;
  const hash = hashIp(ip);
  console.log("[rate-limit-debug]", {
    rawIpUsed: ip,
    xForwardedFor: req.headers.get("x-forwarded-for"),
    xRealIp: req.headers.get("x-real-ip"),
    cfConnectingIp: req.headers.get("cf-connecting-ip"),
    vercelForwardedFor: req.headers.get("x-vercel-forwarded-for"),
    saltSourceShape: saltSourceLength,
    dayUsed: dayString,
    finalHashPrefix: hash.slice(0, 8),
  });
  return hash;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ReserveRpcRow {
  accepted: boolean;
  fresh_count: number;
  email_unlocked: boolean;
  unique_pkg_count: number;
  reason: string | null;
}

function emptyUsage(emailUnlocked = false, cached = false): UsageInfo {
  return {
    freshUsedToday: 0,
    freshLimitToday: emailUnlocked ? ANON_LIMIT + EMAIL_BONUS : ANON_LIMIT,
    emailUnlocked,
    uniquePackageCount: 0,
    cached,
  };
}

// Atomic reserve. On accepted=true the caller MUST either complete the
// pipeline successfully OR call releaseQuota() to refund the slot. On
// accepted=false the caller returns the relevant 429 with the usage block
// (still consumes a DB call, but no quota).
export async function reserveQuota(
  ipHash: string,
  packageId: string
): Promise<ReserveResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("reserve_analyzer_quota", {
    p_ip_hash: ipHash,
    p_day: today(),
    p_package_id: packageId,
  });

  if (error) {
    console.error("[rate-limit] reserve RPC failed", error.message);
    // Fail closed on DB errors — refuse to run a pipeline when we can't
    // account for it. Anon limit pretended to be exhausted so the UI
    // shows the email gate rather than a generic error.
    return {
      accepted: false,
      usage: emptyUsage(),
      reason: "anon_quota",
      needsEmail: true,
    };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | ReserveRpcRow
    | undefined;
  if (!row) {
    console.error("[rate-limit] reserve RPC returned no row");
    return {
      accepted: false,
      usage: emptyUsage(),
      reason: "anon_quota",
      needsEmail: true,
    };
  }

  const limit =
    ANON_LIMIT + (row.email_unlocked ? EMAIL_BONUS : 0);

  const usage: UsageInfo = {
    freshUsedToday: row.fresh_count,
    freshLimitToday: limit,
    emailUnlocked: row.email_unlocked,
    uniquePackageCount: row.unique_pkg_count,
    cached: false,
  };

  console.log("[rate-limit] reserve", {
    ipHash: ipHash.slice(0, 8),
    accepted: row.accepted,
    freshCount: row.fresh_count,
    limit,
    reason: row.reason,
  });

  if (row.accepted) {
    return { accepted: true, usage };
  }

  const reason = (row.reason ?? "anon_quota") as ReserveReason;
  return {
    accepted: false,
    usage,
    reason,
    needsEmail: reason === "anon_quota",
  };
}

// Refund a reservation. Called when reserveQuota returned accepted=true but
// the downstream pipeline failed — preserves the "failed runs don't burn
// quota" semantic.
export async function releaseQuota(ipHash: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("release_analyzer_quota", {
    p_ip_hash: ipHash,
    p_day: today(),
  });
  if (error) {
    console.error("[rate-limit] release RPC failed", error.message);
  }
}

// Read-only usage lookup for the GET /api/tools/analyze-app/usage endpoint
// and for page-mount initialization. Never reserves anything.
export async function getUsage(ipHash: string): Promise<UsageInfo> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("analyzer_rate_limits")
    .select("fresh_count, email_unlocked, unique_packages")
    .eq("ip_hash", ipHash)
    .eq("day", today())
    .maybeSingle();

  if (error) {
    console.error("[rate-limit] getUsage select failed", error.message);
    return emptyUsage();
  }
  if (!data) return emptyUsage();

  const emailUnlocked = Boolean(data.email_unlocked);
  return {
    freshUsedToday: Number(data.fresh_count) || 0,
    freshLimitToday: ANON_LIMIT + (emailUnlocked ? EMAIL_BONUS : 0),
    emailUnlocked,
    uniquePackageCount: Array.isArray(data.unique_packages)
      ? (data.unique_packages as string[]).length
      : 0,
    cached: false,
  };
}

// Flip the email_unlocked flag for the IP after a verified email submission
// from the lead-capture form. Granted for the rest of the day. Idempotent —
// the daily limit is recomputed at evaluation time, so re-flipping a flag
// that's already true grants no additional analyses.
export async function unlockEmailTier(ipHash: string): Promise<void> {
  const supabase = createAdminClient();
  const day = today();

  // Ensure a row exists before flipping the flag — same UPSERT pattern as
  // reserve_analyzer_quota uses, kept inline to avoid pulling in the RPC
  // for a trivial state-only call.
  await supabase
    .from("analyzer_rate_limits")
    .upsert({ ip_hash: ipHash, day }, { onConflict: "ip_hash,day" });

  const { error } = await supabase
    .from("analyzer_rate_limits")
    .update({ email_unlocked: true })
    .eq("ip_hash", ipHash)
    .eq("day", day);
  if (error) {
    console.error("[rate-limit] unlockEmailTier failed", error.message);
  }
}

// ── Backwards-compat shims ──────────────────────────────────────────────────
// Older callers (the email-report route) imported checkAnalyzerLimit /
// recordFreshAnalysis under the old API. They no longer need those — but if
// any future caller hits the old names, fail loud rather than silently.
// (Both routes that used them have been migrated in the same commit.)
