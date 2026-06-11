import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, checkUsageLimit, incrementUsage } from "@/lib/usage";
import { canUseFeature, getPlan } from "@/lib/plans";
import {
  getListingMetadata,
  parsePackageId,
} from "@/lib/analyzer/play-store-scraper";
import { getReviewData } from "@/lib/aso/review-data";
import { auditListing } from "@/lib/aso/audit";
import { generateAsoRecommendations, type AsoGrokInput } from "@/lib/aso/grok";
import type { AsoListingSnapshot } from "@/types/database";

// Scrape (≤10s) + deterministic audit + one Grok call (+ one retry) can exceed
// the 10s default. Mirror the AI reply route's budget.
export const maxDuration = 60;

const CACHE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function quotaPayload(check: Awaited<ReturnType<typeof checkUsageLimit>>, usedDelta = 0) {
  const limit = check.limit === Infinity ? -1 : check.limit;
  const remaining =
    check.remaining === Infinity ? -1 : Math.max(0, check.remaining - usedDelta);
  return {
    used: check.current + usedDelta,
    limit,
    remaining,
    planName: check.planName,
    periodLabel: check.periodLabel,
    resetDate: check.resetDate.toISOString(),
  };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // (a) Authenticate
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // (b) Plan-gate — Growth + Agency only.
  const plan = await getUserPlan(user.id, supabase);
  if (!canUseFeature(plan, "aso_analysis")) {
    return NextResponse.json(
      {
        error: "upgrade_required",
        message:
          "ASO Analysis is available on the Growth and Agency plans. Upgrade to audit and optimize your Play Store listing.",
        requiredPlan: "growth",
        planName: getPlan(plan).name,
      },
      { status: 403 }
    );
  }

  // (c) Per-user rolling usage limit (same pattern as AI replies).
  const usageCheck = await checkUsageLimit(user.id, "aso_analyses", supabase);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      {
        error: "limit_exceeded",
        message: `You've used all ${usageCheck.limit} ASO analyses for this ${usageCheck.periodLabel}. Resets on ${usageCheck.resetDate.toLocaleDateString()}.`,
        upgradeNeeded: true,
        quota: quotaPayload(usageCheck),
      },
      { status: 429 }
    );
  }

  // ── Resolve target package + (optional) connected app ─────────────────────
  const body = await request.json().catch(() => ({}));
  const force = body?.force === true;
  const competitorsRaw: unknown = body?.competitors;
  const competitors = Array.isArray(competitorsRaw)
    ? competitorsRaw
        .map((c) => parsePackageId(String(c)))
        .filter((c): c is string => !!c)
        .slice(0, 2)
    : [];

  let connectionId: string | null = null;
  let packageName: string | null = null;

  if (body?.connectionId) {
    const { data: conn } = await supabase
      .from("connections")
      .select("id, user_id, type, external_id")
      .eq("id", body.connectionId)
      .maybeSingle();
    if (!conn || conn.user_id !== user.id || conn.type !== "play_store" || !conn.external_id) {
      return NextResponse.json(
        { error: "invalid_app", message: "Select a connected Play Store app to analyze." },
        { status: 400 }
      );
    }
    connectionId = conn.id as string;
    packageName = conn.external_id as string;
  } else if (body?.packageName) {
    packageName = parsePackageId(String(body.packageName));
    if (!packageName) {
      return NextResponse.json(
        { error: "invalid_package", message: "Enter a valid Play Store package name or URL." },
        { status: 400 }
      );
    }
    // If this package is also a connected app for this user, link it so we can
    // pull its review-derived data.
    const { data: conn } = await supabase
      .from("connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "play_store")
      .eq("external_id", packageName)
      .maybeSingle();
    if (conn?.id) connectionId = conn.id as string;
  } else {
    return NextResponse.json(
      { error: "missing_app", message: "No app specified for analysis." },
      { status: 400 }
    );
  }

  // (d) 7-day cache — return the latest analysis for this user+package unless forced.
  if (!force) {
    const { data: cached } = await supabase
      .from("aso_analyses")
      .select("id, package_name, listing_snapshot, aso_score, score_breakdown, recommendations, created_at")
      .eq("user_id", user.id)
      .eq("package_name", packageName)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached && Date.now() - Date.parse(cached.created_at) < CACHE_WINDOW_MS) {
      return NextResponse.json({
        cached: true,
        analysis: cached,
        quota: quotaPayload(usageCheck),
      });
    }
  }

  // (e) Fetch live listing metadata via the existing Play Store scraper.
  const listing = await getListingMetadata(packageName);
  if (!listing.ok) {
    if (listing.reason === "not_found") {
      return NextResponse.json(
        { error: "app_not_found", message: `We couldn't find "${packageName}" on the Play Store. Double-check the package name.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "scrape_failed", message: "Couldn't reach the Play Store right now. Please try again in a moment." },
      { status: 503 }
    );
  }
  const meta = listing.data;

  // (f) Read the user's stored review-derived data (READ ONLY).
  const reviewData = await getReviewData(supabase, user.id, connectionId);

  // (g) Deterministic listing audit (no AI).
  const snapshot: AsoListingSnapshot = {
    title: meta.title,
    short_description: meta.shortDescription,
    long_description: meta.longDescription,
    rating: meta.rating,
    installs: meta.installs,
    category: meta.category,
    screenshot_count: meta.screenshotCount,
  };
  const topKeywords = reviewData.review_keywords.map((k) => k.term);
  const { breakdown, score } = auditListing(snapshot, topKeywords);

  // (h) AI recommendations via the existing Grok client (defensive parse inside).
  const grokInput: AsoGrokInput = {
    current_listing: {
      title: meta.title,
      short_description: meta.shortDescription,
      long_description: meta.longDescription,
      category: meta.category,
      rating: meta.rating,
      installs_bucket: meta.installs,
      screenshot_count: meta.screenshotCount,
    },
    review_keywords: reviewData.review_keywords,
    aspect_sentiment: reviewData.aspect_sentiment,
    issue_clusters: reviewData.issue_clusters,
    competitor_keywords: competitors,
  };

  const recommendations = await generateAsoRecommendations(grokInput);
  if (!recommendations) {
    return NextResponse.json(
      { error: "ai_failed", message: "We couldn't generate suggestions just now. Please try again." },
      { status: 502 }
    );
  }

  // (k) Persist + meter usage, then return the full result.
  const { data: inserted, error: insertErr } = await supabase
    .from("aso_analyses")
    .insert({
      user_id: user.id,
      app_id: connectionId,
      package_name: packageName,
      listing_snapshot: snapshot,
      aso_score: score,
      score_breakdown: breakdown,
      recommendations,
    })
    .select("id, package_name, listing_snapshot, aso_score, score_breakdown, recommendations, created_at")
    .single();

  if (insertErr || !inserted) {
    console.error("[aso/analyze] insert failed:", insertErr?.message);
    return NextResponse.json(
      { error: "save_failed", message: "Analysis ran but couldn't be saved. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(user.id, "aso_analyses_used", 1, supabase);

  return NextResponse.json({
    cached: false,
    analysis: inserted,
    quota: quotaPayload(usageCheck, 1),
  });
}
