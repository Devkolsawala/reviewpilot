// POST /api/tools/analyze-app
//
// Public endpoint for the Play Store Review Analyzer free tool. Accepts a
// Play Store URL (or bare package id), atomically reserves a quota slot via
// reserve_analyzer_quota, and returns the cached analysis if available or a
// freshly scraped+analyzed result otherwise. Quota is REFUNDED when the
// pipeline fails downstream (scrape crash, app-not-found, timeout) so users
// don't lose a slot to errors.
//
// Every quota-aware response (cache hit, fresh success, quota rejection,
// scraper failure) includes a `usage` block the frontend uses to render
// dynamic "X analyses left today" copy. Validation rejections (bad JSON,
// invalid URL) omit it — usage hasn't changed, the frontend keeps its
// prior state.
//
// Error codes are UPPERCASE (INVALID_URL, APP_NOT_FOUND, SCRAPER_FAILED,
// ANON_QUOTA, EMAIL_QUOTA, UNIQUE_CAP, DB_ERROR, TIMEOUT, UNKNOWN). The
// frontend maps each to a user-friendly string in PlayStoreAnalyzer.tsx.

import { NextResponse } from "next/server";
import { parsePackageId } from "@/lib/analyzer/play-store-scraper";
import {
  readCachedAnalysis,
  runFreshAnalysis,
} from "@/lib/analyzer/pipeline";
import {
  getClientIp,
  getUsage,
  hashIp,
  releaseQuota,
  reserveQuota,
  type UsageInfo,
} from "@/lib/analyzer/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOTAL_BUDGET_MS = 28_000;

interface AnalyzeBody {
  url?: unknown;
}

function jsonError(
  message: string,
  code: string,
  status: number,
  extras: Record<string, unknown> = {}
) {
  return NextResponse.json({ error: message, code, ...extras }, { status });
}

export async function POST(req: Request) {
  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return jsonError("Invalid JSON body.", "BAD_JSON", 400);
  }

  const url = typeof body.url === "string" ? body.url : "";
  const packageId = parsePackageId(url);
  if (!packageId) {
    return jsonError(
      "That does not look like a Play Store URL.",
      "INVALID_URL",
      400
    );
  }

  // Cache hit: free, no quota consumed. Include usage so the frontend can
  // still update its "X left today" copy (which won't have changed, but the
  // cached:true flag drives a distinct copy variant).
  try {
    const cached = await readCachedAnalysis(packageId);
    if (cached) {
      const ipHashCached = hashIp(getClientIp(req));
      const usage = await getUsage(ipHashCached);
      return NextResponse.json(
        { ...cached, usage: { ...usage, cached: true } },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error(
      "[analyze-app] cache read failed (continuing fresh)",
      (err as Error).message
    );
  }

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);

  // Atomic reserve — locks the row, evaluates limits, and increments
  // fresh_count in one transaction. On accepted=false no increment happens.
  const reservation = await reserveQuota(ipHash, packageId);

  if (!reservation.accepted) {
    const reason = reservation.reason ?? "anon_quota";
    if (reason === "unique_cap") {
      return jsonError(
        "You have hit today's hard cap of 20 different apps. Please come back tomorrow.",
        "UNIQUE_CAP",
        429,
        { usage: reservation.usage }
      );
    }
    return jsonError(
      reason === "anon_quota"
        ? "You have used all 3 free analyses today."
        : "You have used all 8 analyses today.",
      reason === "anon_quota" ? "ANON_QUOTA" : "EMAIL_QUOTA",
      429,
      { usage: reservation.usage, needsEmail: !!reservation.needsEmail }
    );
  }

  // Reservation held — any early return from here onward MUST refund unless
  // the pipeline genuinely succeeded.
  let outcome: Awaited<ReturnType<typeof runFreshAnalysis>>;
  try {
    outcome = await Promise.race([
      runFreshAnalysis(packageId),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("pipeline_timeout")),
          TOTAL_BUDGET_MS
        )
      ),
    ]);
  } catch (err) {
    await releaseQuota(ipHash);
    const refreshedUsage = await getUsage(ipHash);
    const msg = (err as Error).message || "";
    if (msg === "pipeline_timeout") {
      return jsonError(
        "Analysis took too long. Please try again in a minute.",
        "TIMEOUT",
        504,
        { usage: refreshedUsage }
      );
    }
    console.error("[analyze-app] pipeline crashed", msg);
    return jsonError(
      "Something unexpected happened. Please try again in a moment.",
      "UNKNOWN",
      500,
      { usage: refreshedUsage }
    );
  }

  if (!outcome.ok) {
    await releaseQuota(ipHash);
    const refreshedUsage = await getUsage(ipHash);
    if (outcome.code === "app_not_found") {
      return jsonError(
        "We could not find that app on Play Store. Double-check the package ID — for example, the correct ID for Swiggy is in.swiggy.android, not com.swiggy.consumer.",
        "APP_NOT_FOUND",
        404,
        { usage: refreshedUsage }
      );
    }
    if (outcome.code === "scrape_failed") {
      return jsonError(
        "Play Store is temporarily unreachable. Please try again in a minute.",
        "SCRAPER_FAILED",
        502,
        { usage: refreshedUsage }
      );
    }
    return jsonError(
      "Something unexpected happened. Please try again in a moment.",
      "UNKNOWN",
      500,
      { usage: refreshedUsage }
    );
  }

  // Success — reservation stands. Re-read usage so the response reflects
  // the post-increment counts the reservation already applied.
  const finalUsage: UsageInfo = {
    ...reservation.usage,
    cached: false,
  };

  return NextResponse.json(
    { ...outcome.result, usage: finalUsage },
    { status: 200 }
  );
}
