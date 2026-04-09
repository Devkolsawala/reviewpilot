import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the member row — owner_id must match current user (enforced by RLS too)
  const { data: member, error: fetchErr } = await supabase
    .from("team_members")
    .select("id, member_id, owner_id")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (fetchErr || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Clear owner_id on the member's profile so they become an independent user again
  if (member.member_id) {
    const adminClient = createAdminClient();
    await adminClient
      .from("profiles")
      .update({ owner_id: null })
      .eq("id", member.member_id);
  }

  // Delete the team_members row
  const { error: deleteErr } = await supabase
    .from("team_members")
    .delete()
    .eq("id", params.id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
