import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TeamRole } from "@/hooks/useTeamRole";

/**
 * Returns the effective plan AND role for the current user.
 * Uses the admin client to bypass RLS so team members can read their owner's plan.
 *
 * Also auto-accepts any pending invite for this user's email. This is the
 * fallback for cases where the magic-link redirect_to was wrong and the user
 * landed on the homepage instead of /dashboard/accept-invite.
 *
 * Response: { plan, trial_ends_at, role: 'owner' | 'admin' | 'read_only' }
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ plan: "free", trial_ends_at: null, usage_period_start: null, role: "owner" as TeamRole });
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("plan, trial_ends_at, owner_id, subscription_cancel_at, created_at, usage_period_start")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Profile row doesn't exist yet (trigger race / upsert not yet run).
    // Create it here with a proper trial so the banner shows immediately.
    const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const periodStart = new Date().toISOString();
    await adminClient
      .from("profiles")
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? user.email,
        plan: "free",
        trial_ends_at: trialEnds,
        usage_period_start: periodStart,
      });
    return NextResponse.json({
      plan: "free",
      trial_ends_at: trialEnds,
      usage_period_start: periodStart,
      subscription_cancel_at: null,
      role: "owner" as TeamRole,
    });
  }

  // ── Self-heal: backfill trial_ends_at if NULL for a free user ────────────
  // Protects against legacy rows created before migration 014 or via an upsert
  // path that only set {id}. We anchor the trial to max(created_at+7d, now+7d)
  // so older accounts still get a fair trial window from today.
  if (profile.plan === "free" && !profile.trial_ends_at) {
    const createdAt = profile.created_at ? new Date(profile.created_at).getTime() : Date.now();
    const nowMs = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const trialEnds = new Date(Math.max(createdAt + weekMs, nowMs + weekMs)).toISOString();
    await adminClient
      .from("profiles")
      .update({ trial_ends_at: trialEnds })
      .eq("id", user.id);
    profile.trial_ends_at = trialEnds;
    console.log(`[PLAN API] Self-healed trial_ends_at for user ${user.id} → ${trialEnds}`);
  }

  // ── Self-heal: backfill usage_period_start if NULL ───────────────────────
  // Anchors the rolling 7-day usage window to the account creation date so
  // usage resets on the user's own cycle, not on the calendar week.
  if (!profile.usage_period_start) {
    const periodStart = profile.created_at ?? new Date().toISOString();
    await adminClient
      .from("profiles")
      .update({ usage_period_start: periodStart })
      .eq("id", user.id);
    profile.usage_period_start = periodStart;
    console.log(`[PLAN API] Self-healed usage_period_start for user ${user.id} → ${periodStart}`);
  }

  // ── Auto-downgrade if subscription_cancel_at has passed ──────────────────
  if (
    profile.subscription_cancel_at &&
    new Date(profile.subscription_cancel_at) < new Date() &&
    profile.plan !== "free"
  ) {
    await adminClient
      .from("profiles")
      .update({ plan: "free", razorpay_subscription_id: null, subscription_cancel_at: null })
      .eq("id", user.id);
    profile.plan = "free";
    profile.subscription_cancel_at = null;
    console.log(`[PLAN API] Auto-downgraded user ${user.id} — subscription_cancel_at passed`);
  }

  // ── Already linked to an owner → return owner's plan + role ─
  if (profile.owner_id) {
    const [{ data: ownerProfile }, { data: membership }] = await Promise.all([
      adminClient
        .from("profiles")
        .select("plan, trial_ends_at, subscription_cancel_at, usage_period_start")
        .eq("id", profile.owner_id)
        .single(),
      adminClient
        .from("team_members")
        .select("role")
        .eq("member_id", user.id)
        .eq("owner_id", profile.owner_id)
        .eq("status", "active")
        .single(),
    ]);

    // Auto-downgrade owner if their cancel date passed
    let ownerPlan = ownerProfile?.plan ?? "free";
    let ownerCancelAt = ownerProfile?.subscription_cancel_at ?? null;
    if (ownerCancelAt && new Date(ownerCancelAt) < new Date() && ownerPlan !== "free") {
      await adminClient
        .from("profiles")
        .update({ plan: "free", razorpay_subscription_id: null, subscription_cancel_at: null })
        .eq("id", profile.owner_id);
      ownerPlan = "free";
      ownerCancelAt = null;
    }

    const role: TeamRole = (membership?.role as TeamRole) ?? "read_only";

    return NextResponse.json({
      plan: ownerPlan,
      trial_ends_at: ownerProfile?.trial_ends_at ?? null,
      usage_period_start: ownerProfile?.usage_period_start ?? null,
      subscription_cancel_at: ownerCancelAt,
      role,
    });
  }

  // ── No owner_id yet — check for a pending invite by email ─
  // Auto-accepts the invite even when the magic-link redirect failed to land
  // on /dashboard/accept-invite (e.g. wrong redirectTo URL in Vercel env).
  if (user.email) {
    const { data: pendingInvite } = await adminClient
      .from("team_members")
      .select("id, owner_id, role")
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

      // Return the owner's plan + the role from the invite
      const { data: ownerProfile } = await adminClient
        .from("profiles")
        .select("plan, trial_ends_at, subscription_cancel_at, usage_period_start")
        .eq("id", pendingInvite.owner_id)
        .single();

      const role: TeamRole = (pendingInvite.role as TeamRole) ?? "read_only";

      return NextResponse.json({
        plan: ownerProfile?.plan ?? "free",
        trial_ends_at: ownerProfile?.trial_ends_at ?? null,
        usage_period_start: ownerProfile?.usage_period_start ?? null,
        subscription_cancel_at: ownerProfile?.subscription_cancel_at ?? null,
        role,
      });
    }
  }

  // ── Own account, no team membership ─────────────────────
  return NextResponse.json({
    plan: profile.plan ?? "free",
    trial_ends_at: profile.trial_ends_at ?? null,
    usage_period_start: profile.usage_period_start ?? null,
    subscription_cancel_at: profile.subscription_cancel_at ?? null,
    role: "owner" as TeamRole,
  });
}
