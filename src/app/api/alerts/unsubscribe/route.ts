/**
 * Unsubscribe endpoint for instant-alert emails.
 *
 * GET  /api/alerts/unsubscribe?token=…  — link in the email footer; shows a
 *      tiny confirmation page.
 * POST /api/alerts/unsubscribe?token=…  — RFC 8058 one-click target (the
 *      List-Unsubscribe header points here); 200 with empty body.
 *
 * Uses the same stable per-user token as the digest sender
 * (digest_preferences.unsubscribe_token) but writes list='alerts', so digest
 * subscriptions are unaffected. Deliberately a separate route — the digest
 * oneclick endpoint stays untouched.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function unsubscribeAlerts(token: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: prefs } = await admin
    .from("digest_preferences")
    .select("user_id, recipient_email")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!prefs) return false;

  const { data: existing } = await admin
    .from("email_unsubscribes")
    .select("id")
    .eq("user_id", prefs.user_id)
    .eq("list", "alerts")
    .maybeSingle();
  if (existing) return true; // idempotent success

  const { data: authUser } = await admin.auth.admin.getUserById(prefs.user_id);
  const email = prefs.recipient_email || authUser?.user?.email || null;

  await admin.from("email_unsubscribes").insert({
    user_id: prefs.user_id,
    email,
    list: "alerts",
    token,
  });
  return true;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }
  const ok = await unsubscribeAlerts(token);
  const message = ok
    ? "You've been unsubscribed from instant review alerts. You can re-enable them anytime in Settings → Notifications."
    : "This unsubscribe link is invalid or has expired.";
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#FAFAF9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;">
      <div style="max-width:420px;background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:28px;text-align:center;">
        <p style="font-size:15px;color:#0F172A;margin:0;">${message}</p>
      </div>
    </body></html>`,
    { status: ok ? 200 : 404, headers: { "Content-Type": "text/html" } }
  );
}

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) {
    return new NextResponse(null, { status: 400 });
  }
  await unsubscribeAlerts(token);
  // Per RFC 8058: 200 OK, empty body, no account-state leakage.
  return new NextResponse(null, { status: 200 });
}
