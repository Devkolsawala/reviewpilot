import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns the effective plan for the current user.
 * Uses the admin client to bypass RLS so team members can read their owner's plan.
 *
 * Also auto-accepts any pending invite for this user's email. This is the
 * fallback for cases where the magic-link redirect_to was wrong and the user
 * landed on the homepage instead of /dashboard/accept-invite.
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

  // ── Already linked to an owner → return owner's plan ────
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

  // ── No owner_id yet — check for a pending invite by email ─
  // This auto-accepts the invite even when the magic-link redirect
  // failed to land on /dashboard/accept-invite (e.g. wrong redirectTo URL).
  if (user.email) {
    const { data: pendingInvite } = await adminClient
      .from("team_members")
      .select("id, owner_id")
      .eq("email", user.email)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingInvite) {
      const now = new Date().toISOString();

      // Activate the team_members row
      await adminClient
        .from("team_members")
        .update({ member_id: user.id, status: "active", accepted_at: now })
        .eq("id", pendingInvite.id);

      // Link the member's profile to the owner's workspace
      await adminClient
        .from("profiles")
        .update({ owner_id: pendingInvite.owner_id })
        .eq("id", user.id);

      // Return the owner's plan immediately
      const { data: ownerProfile } = await adminClient
        .from("profiles")
        .select("plan, trial_ends_at")
        .eq("id", pendingInvite.owner_id)
        .single();

      return NextResponse.json({
        plan: ownerProfile?.plan ?? "free",
        trial_ends_at: ownerProfile?.trial_ends_at ?? null,
      });
    }
  }

  // ── Own account, no team membership ─────────────────────
  return NextResponse.json({
    plan: profile.plan ?? "free",
    trial_ends_at: profile.trial_ends_at ?? null,
  });
}
