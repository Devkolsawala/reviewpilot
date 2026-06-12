/**
 * GET /api/notifications
 *
 * The in-app notification feed (TopBar bell).
 *
 *   ?countOnly=true        → { unreadCount } only — the cheap 60s poll
 *   ?cursor=<ISO>&limit=20 → { notifications, nextCursor, unreadCount }
 *
 * Newest first, cursor = created_at of the last item of the previous page.
 * Uses the caller's session client so RLS does the scoping: the policy
 * (user_id = get_effective_owner_id(auth.uid())) gives owner and team
 * members the same shared workspace feed.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (url.searchParams.get("countOnly") === "true") {
    return NextResponse.json({ unreadCount: unreadCount ?? 0 });
  }

  const limitRaw = parseInt(url.searchParams.get("limit") || "", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const cursor = url.searchParams.get("cursor");
  if (cursor && Number.isNaN(Date.parse(cursor))) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  let query = supabase
    .from("notifications")
    .select("id, type, title, body, href, review_id, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to know if there's a next page
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;

  return NextResponse.json({
    notifications: page,
    nextCursor,
    unreadCount: unreadCount ?? 0,
  });
}
