import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/plans";
import { sendEmail } from "@/lib/resend";

const PAID_PLANS = ["starter", "growth", "agency"];

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, role } = body as { email?: string; role?: string };

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }
  if (!["admin", "read_only"].includes(role)) {
    return NextResponse.json({ error: "role must be admin or read_only" }, { status: 400 });
  }

  // ── Fetch owner's profile (plan) ─────────────────────────
  const { data: ownerProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("plan, owner_id")
    .eq("id", user.id)
    .single();

  if (profileErr || !ownerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Members cannot invite — only the workspace owner can
  if (ownerProfile.owner_id !== null) {
    return NextResponse.json(
      { error: "Only the workspace owner can invite team members" },
      { status: 403 }
    );
  }

  const plan = getPlan(ownerProfile.plan);
  const maxSeats = plan.limits.team_members; // total seats including owner
  const maxMembers = maxSeats - 1;           // seats available for members

  // ── Check seat count ─────────────────────────────────────
  const { count: memberCount, error: countErr } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .in("status", ["pending", "active"]);

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  if ((memberCount ?? 0) >= maxMembers) {
    return NextResponse.json(
      {
        error: "seats_full",
        message: `Your ${plan.name} plan allows ${maxSeats} seats (${maxMembers} members). Upgrade to invite more.`,
      },
      { status: 403 }
    );
  }

  // ── Check if invitee already exists in our database ─────
  const adminClient = createAdminClient();
  const { data: inviteePlan } = await adminClient.rpc("get_profile_plan_by_email", {
    email_arg: email,
  });

  // Block if they already have a paid plan
  if (inviteePlan && PAID_PLANS.includes(inviteePlan)) {
    return NextResponse.json(
      {
        error: "invitee_paid_plan",
        message: `${email} already has an active paid plan and cannot be added as a team member.`,
      },
      { status: 409 }
    );
  }

  // ── Block duplicate pending invite ───────────────────────
  const { data: existingInvite } = await supabase
    .from("team_members")
    .select("id, status")
    .eq("owner_id", user.id)
    .eq("email", email)
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json(
      {
        error: "already_invited",
        message:
          existingInvite.status === "active"
            ? `${email} is already a member of your workspace.`
            : `An invite is already pending for ${email}.`,
      },
      { status: 409 }
    );
  }

  // ── Build redirect URL ────────────────────────────────────
  const inviteToken = crypto.randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const next = encodeURIComponent(`/dashboard/accept-invite?token=${inviteToken}`);
  const redirectTo = `${appUrl}/auth/callback?next=${next}`;

  // ── Send invite email ─────────────────────────────────────
  // If the email is already in our profiles table (inviteePlan is non-null → existing user),
  // use a magic link so we bypass the "already registered" Supabase error.
  // Otherwise use inviteUserByEmail which creates the auth account and sends the email.
  const userExistsInDb = inviteePlan !== null && inviteePlan !== undefined;

  if (userExistsInDb) {
    // Existing user — generate a magic link and send it ourselves
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      return NextResponse.json(
        { error: linkErr?.message ?? "Failed to generate invite link." },
        { status: 500 }
      );
    }

    await sendEmail({
      to: email,
      subject: "You've been invited to join ReviewPilot",
      html: `
        <p>You have been invited to join a ReviewPilot workspace.</p>
        <p>
          <a href="${linkData.properties.action_link}" style="display:inline-block;padding:12px 24px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Accept Invite
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${linkData.properties.action_link}">${linkData.properties.action_link}</a>
        </p>
      `,
    });
  } else {
    // New user — Supabase creates the account and sends the invite email automatically
    const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    if (inviteErr) {
      // Last-resort fallback: auth user exists without a profile row (orphaned invite, etc.)
      const isAlreadyRegistered =
        inviteErr.status === 422 ||
        inviteErr.message.toLowerCase().includes("already been registered") ||
        inviteErr.message.toLowerCase().includes("already registered");

      if (!isAlreadyRegistered) {
        return NextResponse.json({ error: inviteErr.message }, { status: 500 });
      }

      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

      if (linkErr || !linkData?.properties?.action_link) {
        return NextResponse.json(
          { error: linkErr?.message ?? "Failed to generate invite link." },
          { status: 500 }
        );
      }

      await sendEmail({
        to: email,
        subject: "You've been invited to join ReviewPilot",
        html: `
          <p>You have been invited to join a ReviewPilot workspace.</p>
          <p>
            <a href="${linkData.properties.action_link}" style="display:inline-block;padding:12px 24px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
              Accept Invite
            </a>
          </p>
          <p style="color:#666;font-size:13px;">
            If the button doesn't work, copy and paste this link:<br/>
            <a href="${linkData.properties.action_link}">${linkData.properties.action_link}</a>
          </p>
        `,
      });
    }
  }

  // ── Insert pending row ────────────────────────────────────
  const { error: insertErr } = await supabase.from("team_members").insert({
    owner_id: user.id,
    email,
    role,
    invite_token: inviteToken,
    status: "pending",
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Invite sent to ${email}` });
}
