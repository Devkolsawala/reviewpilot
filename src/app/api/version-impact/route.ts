import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  analyzeVersionImpact,
  type VersionedReview,
} from "@/lib/version-impact/analyze";

/**
 * GET /api/version-impact?connectionId=…[&versionA=…&versionB=…]
 *
 * DETERMINISTIC, FREE, ALL PLANS, ZERO AI. Returns the per-version metrics
 * table + a version comparison (default: latest vs the previous version with
 * enough data, or the explicit pair when versionA/versionB are supplied).
 *
 * Data path is pure: authenticate → RLS-scoped read of this connection's
 * Play Store reviews → src/lib/version-impact/analyze.ts. No model is ever
 * called here.
 *
 * Auth + ownership mirror /api/reviews/app-versions: getUser() + 401, and the
 * connection is resolved through the user-session client so team RLS
 * (get_effective_owner_id) scopes it — a connection the caller can't see
 * returns 404.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const connectionId = url.searchParams.get("connectionId");
  const versionA = url.searchParams.get("versionA");
  const versionB = url.searchParams.get("versionB");

  if (!connectionId) {
    return NextResponse.json(
      { error: "missing_connection", message: "Select a connected app." },
      { status: 400 }
    );
  }

  // Ownership via RLS: the team-scoped connections policy only returns rows the
  // caller's workspace can see. Anything else → 404.
  const { data: conn } = await supabase
    .from("connections")
    .select("id, name, type, external_id")
    .eq("id", connectionId)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json(
      { error: "not_found", message: "Connection not found." },
      { status: 404 }
    );
  }

  // Only Play Store reviews carry version data — filter at the query so other
  // sources (WhatsApp, Google Business) never enter the aggregation.
  const { data: rows, error } = await supabase
    .from("reviews")
    .select(
      "rating, ai_theme, ai_sentiment, sentiment, review_created_at, source, app_version_name, app_version_code"
    )
    .eq("connection_id", connectionId)
    .eq("source", "play_store");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reviews = (rows ?? []) as VersionedReview[];

  const requested =
    versionA && versionB ? { versionAName: versionA, versionBName: versionB } : undefined;
  const result = analyzeVersionImpact(reviews, requested);

  return NextResponse.json({
    connection: { id: conn.id, name: conn.name, type: conn.type },
    ...result,
    // Total Play Store rows scanned vs. those that actually carried a version —
    // lets the UI explain the "version not reported" exclusion.
    totalPlayStoreReviews: reviews.length,
    versionedReviews: reviews.filter(
      (r) =>
        typeof r.app_version_name === "string" && r.app_version_name.trim().length > 0
    ).length,
  });
}
