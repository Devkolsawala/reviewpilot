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
  debugHashIp,
  getUsage,
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
      "That doesn't look like a Play Store URL. It should look like https://play.google.com/store/apps/details?id=YOUR_APP_ID",
      "INVALID_URL",
      400
    );
  }

  // Cache hit: free, no quota consumed. Include usage so the frontend can
  // still update its "X left today" copy (which won't have changed, but the
  // cached:true flag drives a distinct copy variant).
  try {
    const cached = await readCachedAnalysis(packageId);
    // Soft-miss a flagged row (clustering previously failed): fall through to a
    // fresh run so themes can populate, instead of serving the broken cache.
    // The fresh run overwrites the row — on success the flag clears and future
    // hits serve normally; the reserveQuota gate below bounds repeat attempts.
    if (cached && !cached.analysis.clusteringFailed) {
      const ipHashCached = debugHashIp(req);
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

  const ipHash = debugHashIp(req);

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
        ? "You've used all 3 free analyses today. Drop your email below for 5 more and a PDF of this report."
        : "You've used all 8 free analyses today. Start a free trial to keep going.",
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
        "Our AI took a bit longer than expected. Refresh the page and try once more — your analysis won't count against today's limit if it failed.",
        "TIMEOUT",
        504,
        { usage: refreshedUsage }
      );
    }
    console.error("[analyze-app] pipeline crashed", msg);
    return jsonError(
      "Something unexpected happened. Refresh and try again.",
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
        "We couldn't find that app on Play Store. Double-check the package ID in the URL — it should look like com.example.app and match the id parameter in the original Play Store link.",
        "APP_NOT_FOUND",
        404,
        { usage: refreshedUsage }
      );
    }
    if (outcome.code === "scrape_failed") {
      return jsonError(
        "Play Store is being a bit slow right now. Give it a minute and try again.",
        "SCRAPER_FAILED",
        502,
        { usage: refreshedUsage }
      );
    }
    return jsonError(
      "Something unexpected happened. Refresh and try again.",
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
