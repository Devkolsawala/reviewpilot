/**
 * POST /api/notifications/mark-read
 *
 * Body: { ids: string[] } or { all: true }
 *
 * notifications has read-only RLS (writes via service role only), so this
 * route verifies the caller, resolves their workspace owner id, and updates
 * via the admin client strictly scoped to that workspace's rows.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_IDS = 100;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ids?: unknown; all?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const markAll = body.all === true;
  let ids: string[] = [];
  if (!markAll) {
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "Provide ids: string[] or all: true" },
        { status: 400 }
      );
    }
    if (body.ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `At most ${MAX_IDS} ids per request` },
        { status: 400 }
      );
    }
    if (!body.ids.every((id) => typeof id === "string" && UUID_RE.test(id))) {
      return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
    }
    ids = body.ids as string[];
  }

  const admin = createAdminClient();

  // Resolve the workspace owner — notifications are keyed on the owner's id,
  // and team members share the feed.
  const { data: profile } = await admin
    .from("profiles")
    .select("owner_id")
    .eq("id", user.id)
    .single();
  const ownerId = (profile?.owner_id as string | null) ?? user.id;

  let update = admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", ownerId)
    .is("read_at", null);
  if (!markAll) {
    update = update.in("id", ids);
  }

  const { error } = await update;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
