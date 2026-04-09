import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { token } = body as { token?: string };

  if (!token) {
    return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // ── Look up the pending invite by token ──────────────────
  const { data: invite, error: inviteErr } = await adminClient
    .from("team_members")
    .select("id, owner_id, status, email")
    .eq("invite_token", token)
    .single();

  if (inviteErr || !invite) {
    return NextResponse.json(
      { error: "Invalid or expired invite link." },
      { status: 404 }
    );
  }

  if (invite.status === "active") {
    return NextResponse.json(
      { error: "This invite has already been accepted." },
      { status: 409 }
    );
  }

  // ── Activate the invite ──────────────────────────────────
  const now = new Date().toISOString();

  const { error: updateMemberErr } = await adminClient
    .from("team_members")
    .update({ member_id: user.id, status: "active", accepted_at: now })
    .eq("id", invite.id);

  if (updateMemberErr) {
    return NextResponse.json({ error: updateMemberErr.message }, { status: 500 });
  }

  // ── Link the member's profile to the owner's workspace ──
  const { error: updateProfileErr } = await adminClient
    .from("profiles")
    .update({ owner_id: invite.owner_id })
    .eq("id", user.id);

  if (updateProfileErr) {
    return NextResponse.json({ error: updateProfileErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
