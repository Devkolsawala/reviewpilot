import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cap the dropdown payload size. Real apps rarely accumulate this many
// distinct versions, but bounding the response keeps the inbox UI fast and
// prevents pathological cases (e.g., dev/staging builds) from bloating it.
const MAX_VERSIONS_RETURNED = 50;

/**
 * GET /api/reviews/app-versions
 *
 * Returns the distinct app versions present across the user's Play Store
 * reviews, with per-version counts, sorted by version code DESC (newest
 * build first — lexicographic sort of name breaks for double-digit segments,
 * e.g. "1.10.0" < "1.9.0" alphabetically).
 *
 * Query params (all optional):
 *   connectionId — scope to a single connection (must be owned by the user)
 *   source       — currently informational; only play_store reviews carry
 *                  version data, so any other value yields empty results.
 *
 * Auth mirrors /api/reviews/verify-connection: getUser() + 401 if missing.
 * Ownership is enforced by selecting connections .eq('user_id', user.id),
 * and the reviews query is additionally protected by the RLS policy from
 * migration 001 ("Users can manage own reviews").
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const connectionId = url.searchParams.get("connectionId");

  // Resolve the set of connection IDs we'll aggregate over. Explicit
  // ownership check when a single id is provided (don't trust the client);
  // otherwise scope to all of the user's active connections.
  let connectionIds: string[];
  if (connectionId) {
    const { data: conn } = await supabase
      .from("connections")
      .select("id")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!conn) {
      return NextResponse.json(
        { error: "Connection not found or not owned by user" },
        { status: 404 }
      );
    }
    connectionIds = [conn.id];
  } else {
    const { data: conns } = await supabase
      .from("connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true);
    connectionIds = (conns ?? []).map((c) => c.id);
    if (connectionIds.length === 0) {
      return NextResponse.json({ versions: [], unknownCount: 0, totalCount: 0 });
    }
  }

  // Pull just the two version columns for all play_store reviews on the
  // resolved connections. RLS scopes this to the user's rows. Aggregation
  // happens in JS — cheaper than RPC for the small payload sizes involved.
  const { data: rows, error } = await supabase
    .from("reviews")
    .select("app_version_name, app_version_code")
    .in("connection_id", connectionIds)
    .eq("source", "play_store");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalCount = rows?.length ?? 0;
  let unknownCount = 0;
  // Aggregate by name. When the same name appears with different codes
  // (rare — happens when a build number bumps without the human version
  // string changing), keep the highest code seen and sum counts.
  const byName = new Map<string, { code: number | null; count: number }>();
  for (const row of rows ?? []) {
    const name = row.app_version_name;
    const code = typeof row.app_version_code === "number" ? row.app_version_code : null;
    if (name === null || name === undefined) {
      unknownCount++;
      continue;
    }
    const existing = byName.get(name);
    if (!existing) {
      byName.set(name, { code, count: 1 });
    } else {
      existing.count++;
      if (code !== null && (existing.code === null || code > existing.code)) {
        existing.code = code;
      }
    }
  }

  // Sort: code DESC, NULL codes last; tiebreaker count DESC.
  const versions = Array.from(byName.entries())
    .map(([name, { code, count }]) => ({ name, code, count }))
    .sort((a, b) => {
      const ca = a.code;
      const cb = b.code;
      if (ca === null && cb === null) return b.count - a.count;
      if (ca === null) return 1;
      if (cb === null) return -1;
      if (ca !== cb) return cb - ca;
      return b.count - a.count;
    })
    .slice(0, MAX_VERSIONS_RETURNED);

  return NextResponse.json({ versions, unknownCount, totalCount });
}
