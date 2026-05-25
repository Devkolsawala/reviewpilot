import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/dashboard/recovery-rate?connection_id=...&days=30
 *
 * Recovery Rate = recovered / total_negative * 100, where:
 *   - total_negative = reviews with original_rating <= 3 AND
 *                       recovery_status IN ('monitoring','recovered','unrecovered')
 *     within the date window.
 *   - recovered = total_negative AND recovery_status = 'recovered'.
 *
 * Returns previous-period rate for the trend comparison. If there are fewer
 * than 3 monitored negative reviews in the current window, the client should
 * display "Not enough data yet".
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
  const days = Math.max(1, Math.min(365, parseInt(searchParams.get("days") || "30", 10) || 30));

  // Resolve which connections belong to this user. RLS already restricts the
  // reviews table to user-owned connection_ids but we still need the list to
  // scope when connection_id isn't passed.
  let connectionIds: string[];
  if (connectionId) {
    const { data: conn } = await supabase
      .from("connections")
      .select("id")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single();
    if (!conn) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }
    connectionIds = [conn.id];
  } else {
    const { data: conns } = await supabase
      .from("connections")
      .select("id")
      .eq("user_id", user.id);
    connectionIds = (conns ?? []).map((c) => c.id);
  }

  if (connectionIds.length === 0) {
    return NextResponse.json({
      rate: null,
      recovered: 0,
      total_negative: 0,
      previous_rate: null,
      window_days: days,
    });
  }

  const now = Date.now();
  const currentStart = new Date(now - days * 86400000).toISOString();
  const previousStart = new Date(now - 2 * days * 86400000).toISOString();
  const previousEnd = currentStart;

  async function countNegativeAndRecovered(fromIso: string, toIso?: string) {
    let baseQuery = supabase
      .from("reviews")
      .select("recovery_status", { count: "exact" })
      .in("connection_id", connectionIds)
      .lte("original_rating", 3)
      .neq("recovery_status", "none")
      .gte("created_at", fromIso);
    if (toIso) baseQuery = baseQuery.lt("created_at", toIso);
    const { data, error } = await baseQuery;
    if (error) {
      console.error("[recovery-rate] query error:", error.message);
      return { total: 0, recovered: 0 };
    }
    const total = data?.length ?? 0;
    const recovered = (data ?? []).filter((r) => r.recovery_status === "recovered").length;
    return { total, recovered };
  }

  const current = await countNegativeAndRecovered(currentStart);
  const previous = await countNegativeAndRecovered(previousStart, previousEnd);

  const rate =
    current.total > 0
      ? Math.round((current.recovered / current.total) * 100)
      : null;
  const previousRate =
    previous.total > 0
      ? Math.round((previous.recovered / previous.total) * 100)
      : null;

  return NextResponse.json({
    rate,
    recovered: current.recovered,
    total_negative: current.total,
    previous_rate: previousRate,
    window_days: days,
  });
}
