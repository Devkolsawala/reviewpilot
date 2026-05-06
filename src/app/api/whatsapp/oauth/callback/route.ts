import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/whatsapp/client";
import { getPlan, getWhatsAppConnectionLimit } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SessionInfo {
  data?: {
    phone_number_id?: string;
    waba_id?: string;
    business_id?: string;
  };
}

interface CallbackBody {
  code: string;
  session_info: SessionInfo | null;
}

function parseBody(raw: unknown): CallbackBody | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.code !== "string" || r.code.length === 0) return null;
  const session_info =
    r.session_info && typeof r.session_info === "object"
      ? (r.session_info as SessionInfo)
      : null;
  return { code: r.code, session_info };
}

const APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID;
const APP_SECRET = process.env.FB_APP_SECRET;
const GRAPH_VERSION = process.env.NEXT_PUBLIC_FB_GRAPH_VERSION || "v21.0";
const REDIRECT_URI = process.env.ESS_OAUTH_REDIRECT_URI;

// TODO v2: Exchange short-lived token for long-lived token
// GET https://graph.facebook.com/{version}/oauth/access_token?
//   grant_type=fb_exchange_token&
//   client_id={app_id}&client_secret={app_secret}&
//   fb_exchange_token={short_token}
// This extends the token from ~1 hour to ~60 days.
// For System User tokens (which the WABA actually uses), we should
// generate a non-expiring token via the Business Manager API.

export async function POST(req: NextRequest) {
  try {
    if (!APP_ID || !APP_SECRET || !REDIRECT_URI) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Embedded Signup is not configured on the server. Missing FB env vars.",
        },
        { status: 500 }
      );
    }

    const raw = await req.json().catch(() => null);
    const parsed = parseBody(raw);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { code, session_info } = parsed;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Plan-quota check (mirrors src/app/api/connections/whatsapp/connect/route.ts).
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    const planId = profile?.plan || "free";
    const plan = getPlan(planId);

    const { count: whatsappCount } = await supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "whatsapp")
      .eq("is_active", true);

    const whatsappLimit = getWhatsAppConnectionLimit(planId);
    if (whatsappLimit === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `WhatsApp connections are not available on the ${plan.name} plan. Upgrade to Growth or Agency.`,
        },
        { status: 403 }
      );
    }
    if (whatsappLimit > 0 && (whatsappCount ?? 0) >= whatsappLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `You've reached the WhatsApp connection limit for the ${plan.name} plan (${whatsappLimit}).`,
        },
        { status: 403 }
      );
    }

    // Step 1 — Exchange the OAuth code for a short-lived access token.
    const tokenResp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          client_id: APP_ID,
          client_secret: APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        }),
      { method: "GET" }
    );
    if (!tokenResp.ok) {
      const err = await tokenResp.text();
      return NextResponse.json(
        { success: false, error: `Token exchange failed: ${err}` },
        { status: 400 }
      );
    }
    const tokenData = await tokenResp.json();
    const shortToken: string | undefined = tokenData?.access_token;
    if (!shortToken) {
      return NextResponse.json(
        { success: false, error: "Token exchange returned no access_token" },
        { status: 400 }
      );
    }

    // Step 2 — Resolve WABA + phone number.
    let wabaId = session_info?.data?.waba_id;
    let phoneNumberId = session_info?.data?.phone_number_id;
    const businessId = session_info?.data?.business_id;

    if (!wabaId) {
      const businessesResp = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/me/businesses?access_token=${shortToken}`
      );
      const businesses = await businessesResp.json();
      const fallbackBusinessId = businesses?.data?.[0]?.id;
      if (!fallbackBusinessId) {
        return NextResponse.json(
          {
            success: false,
            error: "No business portfolio found for this user",
          },
          { status: 400 }
        );
      }
      const wabasResp = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${fallbackBusinessId}/owned_whatsapp_business_accounts?access_token=${shortToken}`
      );
      const wabas = await wabasResp.json();
      wabaId = wabas?.data?.[0]?.id;
      if (!wabaId) {
        return NextResponse.json(
          { success: false, error: "No WhatsApp Business Account found" },
          { status: 400 }
        );
      }
    }

    let displayPhoneNumber: string | null = null;
    let verifiedName: string | null = null;

    // Always query the phone numbers list so we can populate the display name
    // and pick a phone if session_info didn't include one.
    const phonesResp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/phone_numbers?access_token=${shortToken}`
    );
    const phones = await phonesResp.json();
    const phoneList: Array<{
      id: string;
      display_phone_number?: string;
      verified_name?: string;
    }> = phones?.data || [];

    if (!phoneNumberId) {
      phoneNumberId = phoneList[0]?.id;
    }
    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: "No phone number found in WABA" },
        { status: 400 }
      );
    }
    const matched = phoneList.find((p) => p.id === phoneNumberId);
    displayPhoneNumber = matched?.display_phone_number || null;
    verifiedName = matched?.verified_name || null;

    // Step 3 — Subscribe our app to webhooks for this WABA. Failures are
    // logged but do not block connection creation; surfaced via connection
    // status checks.
    const subscribeResp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/subscribed_apps`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${shortToken}` },
      }
    );
    if (!subscribeResp.ok) {
      const err = await subscribeResp.text();
      console.error("[ESS] Webhook subscription failed:", err);
    }

    // Step 4 — Register the phone number for Cloud API. May 200 or 400
    // (already registered); either is fine.
    const registerResp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${shortToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", pin: "000000" }),
      }
    );
    if (!registerResp.ok) {
      console.log(
        "[ESS] Phone register response (may already be registered):",
        await registerResp.text()
      );
    }

    // Step 5 — Persist.
    let encrypted: string;
    try {
      encrypted = encryptToken(shortToken);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Encryption failed";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }

    await supabase
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id" });

    const { error: insertError } = await supabase.from("connections").insert({
      user_id: user.id,
      type: "whatsapp",
      name: verifiedName || displayPhoneNumber || "WhatsApp",
      external_id: phoneNumberId,
      whatsapp_phone_number_id: phoneNumberId,
      whatsapp_business_account_id: wabaId,
      whatsapp_display_phone_number: displayPhoneNumber,
      whatsapp_access_token_encrypted: encrypted,
      is_active: true,
      review_count: 0,
      connection_method: "embedded_signup",
      ess_user_id: user.id,
      ess_business_id: businessId || null,
    });

    if (insertError) {
      console.error("[ESS] DB insert failed:", insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    console.error("[ESS] OAuth callback error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
