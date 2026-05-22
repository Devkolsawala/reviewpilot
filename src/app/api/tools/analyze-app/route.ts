// POST /api/tools/analyze-app
//
// Public endpoint for the Play Store Review Analyzer free tool. Accepts a
// Play Store URL (or bare package id), enforces a daily per-IP quota, and
// returns the cached analysis if available or a freshly scraped+analyzed
// result otherwise. Never throws — all failures are mapped to a structured
// { error, code } JSON body with the appropriate status code.

import { NextResponse } from "next/server";
import { parsePackageId } from "@/lib/analyzer/play-store-scraper";
import {
  readCachedAnalysis,
  runFreshAnalysis,
} from "@/lib/analyzer/pipeline";
import {
  checkAnalyzerLimit,
  getClientIp,
  hashIp,
  recordFreshAnalysis,
} from "@/lib/analyzer/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Soft cap on the whole pipeline. The pipeline's internal timeouts are 10s
// scrape × 2 (parallel) + 20s xAI × 2 (parallel) ≈ 22s worst case, well
// under Vercel's 60s function budget. This wall clock is the final guard.
const TOTAL_BUDGET_MS = 28_000;

interface AnalyzeBody {
  url?: unknown;
}

function badRequest(message: string, code: string, status = 400) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: Request) {
  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return badRequest("Invalid JSON body.", "bad_json");
  }

  const url = typeof body.url === "string" ? body.url : "";
  const packageId = parsePackageId(url);
  if (!packageId) {
    return badRequest(
      "Please paste a valid Play Store app URL (e.g. https://play.google.com/store/apps/details?id=com.example.app).",
      "bad_url"
    );
  }

  // Cache hit: free, no quota consumed.
  try {
    const cached = await readCachedAnalysis(packageId);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }
  } catch (err) {
    console.error(
      "[analyze-app] cache read failed (continuing fresh)",
      (err as Error).message
    );
  }

  // Quota check before any scrape/AI work.
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);

  const limit = await checkAnalyzerLimit(ipHash, packageId);
  if (!limit.allowed) {
    if (limit.reason === "unique_cap") {
      return NextResponse.json(
        {
          error:
            "You've hit today's hard cap of 20 different apps. Please come back tomorrow.",
          code: "unique_cap",
        },
        { status: 429 }
      );
    }
    if (limit.reason === "db_error") {
      return NextResponse.json(
        {
          error: "Service is temporarily unavailable. Please try again shortly.",
          code: "db_error",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error: limit.needsEmail
          ? "You've used your free analyses for today. Drop your email to unlock 5 more."
          : "Daily limit reached. Please come back tomorrow.",
        code: limit.needsEmail ? "anon_quota" : "email_quota",
        needsEmail: !!limit.needsEmail,
      },
      { status: 429 }
    );
  }

  // Run the pipeline under a wall-clock budget so a single stuck step can't
  // hold the whole function past Vercel's 60s timeout.
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
    const msg = (err as Error).message || "";
    if (msg === "pipeline_timeout") {
      return NextResponse.json(
        {
          error:
            "Analysis took too long. Please try again in a minute — Play Store may be throttling our scraper.",
          code: "timeout",
        },
        { status: 504 }
      );
    }
    console.error("[analyze-app] pipeline crashed", msg);
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", code: "internal" },
      { status: 500 }
    );
  }

  if (!outcome.ok) {
    if (outcome.code === "scrape_failed") {
      return NextResponse.json(
        {
          error:
            "Couldn't fetch this app from Play Store. Check the package id, or try again in a few minutes.",
          code: "scrape_failed",
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", code: "internal" },
      { status: 500 }
    );
  }

  // Record AFTER the fresh analysis succeeded so failed runs don't burn quota.
  try {
    await recordFreshAnalysis(ipHash, packageId);
  } catch (err) {
    console.error(
      "[analyze-app] recordFreshAnalysis failed (non-fatal)",
      (err as Error).message
    );
  }

  return NextResponse.json(outcome.result, { status: 200 });
}
