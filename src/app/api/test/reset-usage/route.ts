import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  // Only available in test/dev environments
  if (process.env.NODE_ENV === "production" && !process.env.USAGE_PERIOD_MINUTES) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("usage").delete().eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "Usage reset. You have fresh limits now." });
}
