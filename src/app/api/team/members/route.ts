import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Determine whose team to show.
  // If this user is a team member (has owner_id), show the owner's team.
  // If this user is the workspace owner, show their own team.
  const { data: profile } = await adminClient
    .from("profiles")
    .select("owner_id")
    .eq("id", user.id)
    .single();

  const ownerId = profile?.owner_id ?? user.id;

  const { data: members, error } = await adminClient
    .from("team_members")
    .select("id, email, role, status, invited_at, accepted_at, member_id")
    .eq("owner_id", ownerId)
    .order("invited_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch the owner's email for display
  const { data: ownerProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", ownerId)
    .single();

  // Get the owner's auth email
  const { data: ownerUser } = await adminClient.auth.admin.getUserById(ownerId);

  return NextResponse.json({
    members: members ?? [],
    ownerId,
    ownerEmail: ownerUser?.user?.email ?? ownerProfile?.id ?? "",
  });
}
