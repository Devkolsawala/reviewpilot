import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/issues
 * Query params:
 *   - connection_id (optional): filter to one connection. When omitted,
 *     returns issues across all the user's active connections.
 *   - status (optional): 'active' | 'fixed' | 'dismissed'. Default 'active'.
 *
 * Active issues are ordered by review_count DESC (most impactful first);
 * fixed/dismissed are ordered by fixed_at DESC.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connection_id");
  const status = (searchParams.get("status") || "active").toLowerCase();

  if (!["active", "fixed", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  let query = supabase
    .from("issues")
    .select("id, label, description, status, review_count, avg_rating, first_seen_at, fixed_at, created_at, updated_at, connection_id")
    .eq("user_id", user.id)
    .eq("status", status);

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }

  if (status === "active") {
    query = query.order("review_count", { ascending: false }).order("first_seen_at", { ascending: false });
  } else {
    query = query.order("fixed_at", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ issues: data ?? [] });
}
