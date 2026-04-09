import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { role } = body as { role?: string };

  if (!role || !["admin", "read_only"].includes(role)) {
    return NextResponse.json({ error: "role must be admin or read_only" }, { status: 400 });
  }

  const { error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("id", params.id)
    .eq("owner_id", user.id); // only owner can change roles

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
