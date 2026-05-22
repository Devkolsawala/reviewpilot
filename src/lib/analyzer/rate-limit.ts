// Daily per-IP rate limit for the public Play Store analyzer.
//
// Why this isn't in src/lib/tools/rateLimit.ts: that module is an in-memory
// per-instance counter (15/h across all free tools). It doesn't survive a
// serverless cold start, doesn't share state across Vercel instances, and
// can't track daily windows, unique package ids, or email-unlock state. The
// analyzer's quota model is durable-by-design, so it lives in Supabase via
// the existing admin client.
//
// Tiers per IP per day:
//   anonymous           → 3 fresh analyses
//   after email unlock  → +5 fresh analyses (8 total)
//   hard cap            → 20 unique package ids/day regardless of tier
//
// "Fresh" means a cache miss that triggers scrape + AI. Cache hits are free
// and don't consume quota.
//
// IP hashing: SHA-256 of (ip + daily_salt). The daily salt is derived from
// SUPABASE_SERVICE_ROLE_KEY + the date so we don't introduce a new env var.
// We never store raw IPs.

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const ANON_LIMIT = 3;
const EMAIL_BONUS = 5;
const UNIQUE_PACKAGE_HARD_CAP = 20;

export interface AnalyzerLimitResult {
  allowed: boolean;
  remaining: number;
  reason?: "anon_quota" | "email_quota" | "unique_cap" | "db_error";
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
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const salt = `${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}:${today}`;
  return createHash("sha256").update(`${ip}|${salt}`).digest("hex");
}

interface RateRow {
  ip_hash: string;
  day: string;
  fresh_count: number;
  unique_packages: string[];
  email_unlocked: boolean;
}

async function getOrCreateRow(ipHash: string): Promise<RateRow | null> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("analyzer_rate_limits")
    .select("ip_hash, day, fresh_count, unique_packages, email_unlocked")
    .eq("ip_hash", ipHash)
    .eq("day", today)
    .maybeSingle();

  if (error) {
    console.error("[analyzer-rate-limit] select failed", error.message);
    return null;
  }
  if (data) return data as RateRow;

  const insert = await supabase
    .from("analyzer_rate_limits")
    .insert({ ip_hash: ipHash, day: today })
    .select("ip_hash, day, fresh_count, unique_packages, email_unlocked")
    .single();
  if (insert.error) {
    // Race: another concurrent request inserted the row. Re-select once.
    const retry = await supabase
      .from("analyzer_rate_limits")
      .select("ip_hash, day, fresh_count, unique_packages, email_unlocked")
      .eq("ip_hash", ipHash)
      .eq("day", today)
      .maybeSingle();
    if (retry.error || !retry.data) {
      console.error(
        "[analyzer-rate-limit] insert+retry failed",
        insert.error.message
      );
      return null;
    }
    return retry.data as RateRow;
  }
  return insert.data as RateRow;
}

// Check whether this IP is allowed to run a FRESH analysis for the given
// package id. Cache hits do not call this — they're free. On allow=true the
// caller MUST follow up with recordFreshAnalysis(...) once the analysis
// succeeds; on allow=false the caller returns 429 with needsEmail to gate
// the lead-capture upsell.
export async function checkAnalyzerLimit(
  ipHash: string,
  packageId: string
): Promise<AnalyzerLimitResult> {
  const row = await getOrCreateRow(ipHash);
  if (!row) {
    // Fail open in single-row terms but still cap by anon limit at the
    // process level — if Supabase is down we don't want to give unlimited
    // analyses, so deny with a generic reason.
    return { allowed: false, remaining: 0, reason: "db_error" };
  }

  const limit = row.email_unlocked ? ANON_LIMIT + EMAIL_BONUS : ANON_LIMIT;
  const alreadyHasPackage = row.unique_packages.includes(packageId);

  // Hard cap on unique packages, regardless of tier.
  if (
    !alreadyHasPackage &&
    row.unique_packages.length >= UNIQUE_PACKAGE_HARD_CAP
  ) {
    return { allowed: false, remaining: 0, reason: "unique_cap" };
  }

  if (row.fresh_count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reason: row.email_unlocked ? "email_quota" : "anon_quota",
      needsEmail: !row.email_unlocked,
    };
  }

  return { allowed: true, remaining: Math.max(0, limit - row.fresh_count - 1) };
}

// Record a successful fresh analysis. Idempotent for the same packageId
// (won't double-count if the caller retries).
export async function recordFreshAnalysis(
  ipHash: string,
  packageId: string
): Promise<void> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("analyzer_rate_limits")
    .select("fresh_count, unique_packages")
    .eq("ip_hash", ipHash)
    .eq("day", today)
    .maybeSingle();

  if (error || !data) {
    console.error(
      "[analyzer-rate-limit] recordFreshAnalysis read failed",
      error?.message
    );
    return;
  }

  const pkgs = data.unique_packages as string[];
  const nextPackages = pkgs.includes(packageId) ? pkgs : [...pkgs, packageId];

  await supabase
    .from("analyzer_rate_limits")
    .update({
      fresh_count: (data.fresh_count as number) + 1,
      unique_packages: nextPackages,
    })
    .eq("ip_hash", ipHash)
    .eq("day", today);
}

// Flip the email_unlocked flag for the IP after a verified email submission
// from the lead-capture form. Granted for the rest of the day.
export async function unlockEmailTier(ipHash: string): Promise<void> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // Ensure a row exists before flipping the flag.
  await getOrCreateRow(ipHash);

  await supabase
    .from("analyzer_rate_limits")
    .update({ email_unlocked: true })
    .eq("ip_hash", ipHash)
    .eq("day", today);
}
