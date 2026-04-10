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

  const userEmail = user.email ?? "";

  const body = await request.json();
  const { email, role } = body as { email?: string; role?: string };

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }
  if (!["admin", "read_only"].includes(role)) {
    return NextResponse.json({ error: "role must be admin or read_only" }, { status: 400 });
  }

  // ── Fetch owner's profile (plan + name for email) ────────
  const { data: ownerProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("plan, owner_id, full_name")
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

  const inviterName = ownerProfile.full_name || userEmail || "Your teammate";
  const roleLabel = role === "admin" ? "Admin" : "Read-only";

  // Shared branded email builder
  function buildInviteEmail(acceptLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f766e,#0d9488);padding:32px 40px;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-block;text-align:center;line-height:36px;">
                <span style="color:#fff;font-weight:700;font-size:14px;">RP</span>
              </div>
              <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;margin-left:8px;">ReviewPilot</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
              You&apos;ve been invited to join ReviewPilot
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              <strong style="color:#111827;">${inviterName}</strong> has invited you to join their
              ReviewPilot workspace as <strong style="color:#0d9488;">${roleLabel}</strong>.
            </p>

            <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:14px;color:#0f766e;line-height:1.6;">
                <strong>What is ReviewPilot?</strong><br/>
                ReviewPilot helps businesses manage, respond to, and analyse customer reviews from Google Business Profile and the Play Store — powered by AI.
              </p>
            </div>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#0d9488;border-radius:8px;">
                  <a href="${acceptLink}"
                     style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.1px;">
                    Accept Invitation →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0;font-size:12px;color:#0d9488;word-break:break-all;">
              <a href="${acceptLink}" style="color:#0d9488;">${acceptLink}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              This invite was sent by ${inviterName} (${userEmail}) via ReviewPilot.<br/>
              If you were not expecting this, you can safely ignore this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ── Send invite email ─────────────────────────────────────
  const userExistsInDb = inviteePlan !== null && inviteePlan !== undefined;

  if (userExistsInDb) {
    // Existing user — generate a magic link and send via Resend
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

    const emailResult = await sendEmail({
      to: email,
      subject: `${inviterName} invited you to ReviewPilot`,
      html: buildInviteEmail(linkData.properties.action_link),
    });

    if (!emailResult.success) {
      console.error("[invite] Resend failed for existing user, attempting magic link via Supabase OTP");
      // Fallback: trigger Supabase's own magic-link email for existing users
      const { error: otpErr } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      if (otpErr) {
        return NextResponse.json(
          { error: "Failed to send invite email. Please try again.", message: "Failed to send invite email. Please try again." },
          { status: 500 }
        );
      }
    }
  } else {
    // New user — generate invite link and send branded email via Resend
    const { data: linkData, error: genErr } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });

    if (genErr || !linkData?.properties?.action_link) {
      return NextResponse.json(
        { error: genErr?.message ?? "Failed to generate invite link." },
        { status: 500 }
      );
    }

    const emailResult = await sendEmail({
      to: email,
      subject: `${inviterName} invited you to ReviewPilot`,
      html: buildInviteEmail(linkData.properties.action_link),
    });

    // Last-resort fallback: if Resend fails, fall back to Supabase's own invite email
    if (!emailResult.success) {
      console.error("[invite] Resend failed for new user, falling back to Supabase invite email");
      const { error: fbErr } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (fbErr) {
        return NextResponse.json(
          { error: "Failed to send invite email. Please try again.", message: "Failed to send invite email. Please try again." },
          { status: 500 }
        );
      }
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
