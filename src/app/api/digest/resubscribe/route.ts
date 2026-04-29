import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  let body: { token?: string; list?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const token = body.token;
  const list =
    body.list === "campaigns" || body.list === "all" ? body.list : "digest";
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: prefs } = await admin
    .from("digest_preferences")
    .select("user_id")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!prefs) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  await admin
    .from("email_unsubscribes")
    .delete()
    .eq("user_id", prefs.user_id)
    .eq("list", list);

  return NextResponse.json({ ok: true });
}
