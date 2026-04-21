import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Match the existing Play Store / GBP "remove connection" pattern
// (ConnectionsPage uses a hard delete). Mirror that so a disconnected number
// can be re-added with a fresh token without stale rows.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { connectionId } = (await request.json().catch(() => ({}))) as {
    connectionId?: string;
  };
  if (!connectionId) {
    return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .eq("type", "whatsapp");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
