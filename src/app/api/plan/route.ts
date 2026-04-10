import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns the effective plan for the current user.
 * Uses the admin client to bypass RLS so team members can read their owner's plan.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ plan: "free", trial_ends_at: null });
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("plan, trial_ends_at, owner_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ plan: "free", trial_ends_at: null });
  }

  // Team member — resolve from owner's profile
  if (profile.owner_id) {
    const { data: ownerProfile } = await adminClient
      .from("profiles")
      .select("plan, trial_ends_at")
      .eq("id", profile.owner_id)
      .single();

    return NextResponse.json({
      plan: ownerProfile?.plan ?? "free",
      trial_ends_at: ownerProfile?.trial_ends_at ?? null,
    });
  }

  return NextResponse.json({
    plan: profile.plan ?? "free",
    trial_ends_at: profile.trial_ends_at ?? null,
  });
}
