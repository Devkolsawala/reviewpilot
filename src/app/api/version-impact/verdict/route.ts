import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserPlan } from "@/lib/usage";
import { canUseFeature, getPlan } from "@/lib/plans";
import {
  compareVersions,
  type VersionedReview,
  type VersionComparison,
} from "@/lib/version-impact/analyze";
import {
  buildVerdictInput,
  buildFallbackVerdict,
  generateVersionVerdict,
} from "@/lib/version-impact/grok";

// One Grok call (+ one retry) on a tiny deltas-only payload. Mirror ASO's
// headroom even though this is far cheaper.
export const maxDuration = 45;

const CACHE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash the deterministic deltas a verdict is generated from. When new reviews
 * land and the deltas shift, the hash changes and the cached row stops
 * matching — so the verdict auto-invalidates.
 */
function hashDeltas(cmp: VersionComparison): string {
  const canonical = {
    a: cmp.versionA.versionName,
    b: cmp.versionB.versionName,
    ra: cmp.versionA.avgRating,
    rb: cmp.versionB.avgRating,
    ca: cmp.versionA.count,
    cb: cmp.versionB.count,
    rd: cmp.ratingDelta,
    cd: cmp.countDelta,
    sd: cmp.sentimentDelta,
    td: cmp.themeDeltas.map((t) => [t.theme, t.countA, t.countB]),
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

/**
 * POST /api/version-impact/verdict
 * Body: { connectionId, versionA, versionB, force? }
 *
 * GROWTH/AGENCY ONLY (server-enforced — never trust the client). Free/Starter
 * get 403 with the upgrade signal the frontend expects.
 *
 * The AI call happens ONLY on a cache miss for an explicit user request. The
 * deterministic deltas are recomputed server-side and a data_hash keyed cache
 * (7-day TTL) is checked first; a hit returns the stored verdict and never
 * calls the model. On a model failure we return a deterministic fallback and
 * do NOT cache it (so a later attempt can still get a real verdict).
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // (a) Authenticate
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // (b) Plan-gate — Growth + Agency only. Server-side; identical pattern to ASO.
  const plan = await getUserPlan(user.id, supabase);
  if (!canUseFeature(plan, "version_impact_ai")) {
    return NextResponse.json(
      {
        error: "upgrade_required",
        message:
          "AI verdicts are available on the Growth and Agency plans. The version comparison and theme deltas are free — upgrade to add the plain-English diagnosis.",
        requiredPlan: "growth",
        planName: getPlan(plan).name,
      },
      { status: 403 }
    );
  }

  // (c) Resolve target connection + version pair.
  const body = await request.json().catch(() => ({}));
  const connectionId: unknown = body?.connectionId;
  const versionA: unknown = body?.versionA;
  const versionB: unknown = body?.versionB;
  const force = body?.force === true;
  // cacheOnly lets the page auto-show a previously-generated verdict on load
  // WITHOUT ever triggering a model call on a miss (honours "no AI on page
  // load"). A miss returns { verdict: null }.
  const cacheOnly = body?.cacheOnly === true;

  if (typeof connectionId !== "string" || typeof versionA !== "string" || typeof versionB !== "string") {
    return NextResponse.json(
      { error: "invalid_request", message: "connectionId, versionA and versionB are required." },
      { status: 400 }
    );
  }

  // Ownership via RLS (team-scoped). connections.user_id is always the workspace
  // owner — we store that as the verdict's user_id so the cache is pooled across
  // the team.
  const { data: conn } = await supabase
    .from("connections")
    .select("id, name, user_id")
    .eq("id", connectionId)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json(
      { error: "not_found", message: "Connection not found." },
      { status: 404 }
    );
  }
  const ownerId = conn.user_id as string;

  // (d) Recompute the deterministic comparison from review data (READ ONLY).
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

  const comparison = compareVersions(
    (rows ?? []) as VersionedReview[],
    versionA,
    versionB
  );
  if (!comparison) {
    return NextResponse.json(
      {
        error: "insufficient_data",
        message: "Need at least two releases with reviews to compare.",
      },
      { status: 400 }
    );
  }

  const dataHash = hashDeltas(comparison);

  // (e) 7-day cache — keyed on connection + version pair + data hash. A hit
  // skips the AI call entirely.
  if (!force) {
    const { data: cached } = await supabase
      .from("version_impact_verdicts")
      .select("verdict, model, created_at, data_hash")
      .eq("connection_id", connectionId)
      .eq("version_a", versionA)
      .eq("version_b", versionB)
      .eq("data_hash", dataHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached && Date.now() - Date.parse(cached.created_at) < CACHE_WINDOW_MS) {
      return NextResponse.json({
        cached: true,
        fallback: false,
        verdict: cached.verdict,
        model: cached.model,
        createdAt: cached.created_at,
      });
    }
  }

  // Cache-only request (page auto-load): a miss must NOT call the model.
  if (cacheOnly) {
    return NextResponse.json({ cached: false, fallback: false, verdict: null });
  }

  // (f) Cache miss → call the model with ONLY the deltas (token-bounded).
  const input = buildVerdictInput(conn.name as string, comparison);
  const aiVerdict = await generateVersionVerdict(input);

  // (g) Model failed/unavailable → deterministic fallback, NOT cached so a
  // later request can still get a real verdict.
  if (!aiVerdict) {
    return NextResponse.json({
      cached: false,
      fallback: true,
      verdict: buildFallbackVerdict(input),
      model: null,
      createdAt: new Date().toISOString(),
    });
  }

  // (h) Persist via the service role (table is write-locked to service role).
  const admin = createAdminClient();
  const { data: inserted } = await admin
    .from("version_impact_verdicts")
    .insert({
      user_id: ownerId,
      connection_id: connectionId,
      version_a: versionA,
      version_b: versionB,
      data_hash: dataHash,
      verdict: aiVerdict,
      model: process.env.XAI_MODEL || "grok-4.3",
    })
    .select("verdict, model, created_at")
    .single();

  return NextResponse.json({
    cached: false,
    fallback: false,
    verdict: inserted?.verdict ?? aiVerdict,
    model: inserted?.model ?? (process.env.XAI_MODEL || "grok-4.3"),
    createdAt: inserted?.created_at ?? new Date().toISOString(),
  });
}
