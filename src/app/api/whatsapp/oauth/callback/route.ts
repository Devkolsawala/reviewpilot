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
  pin: string | null;
}

function parseBody(raw: unknown): CallbackBody | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.code !== "string" || r.code.length === 0) return null;
  const session_info =
    r.session_info && typeof r.session_info === "object"
      ? (r.session_info as SessionInfo)
      : null;
  const pin =
    typeof r.pin === "string" && /^\d{6}$/.test(r.pin) ? r.pin : null;
  return { code: r.code, session_info, pin };
}

const APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID;
const APP_SECRET = process.env.FB_APP_SECRET;
const GRAPH_VERSION = process.env.NEXT_PUBLIC_FB_GRAPH_VERSION || "v21.0";
const REDIRECT_URI = process.env.ESS_OAUTH_REDIRECT_URI;

// Token expiry depends on FB Login config "Token Expiration" setting.
// "Never"               → fb_exchange_token returns a non-expiring token.
// "60 days (Recommended)" → fb_exchange_token returns a 60-day token.
// Verify in Meta dashboard → Use Cases → WhatsApp Business Management → Customizations.
// As of last check, ReviewPilot config is set to "Never".
const REQUIRED_SCOPES = [
  "whatsapp_business_management",
  "whatsapp_business_messaging",
];

export async function POST(req: NextRequest) {
  let connectionId: string | null = null;
  const supabase = createClient();

  // Helper: write the failure state back to the row that was created early.
  async function markExchangeFailed(reason: string) {
    if (!connectionId) return;
    await supabase
      .from("connections")
      .update({
        token_status: "exchange_failed",
        token_exchange_error: reason.slice(0, 1000),
      })
      .eq("id", connectionId);
  }

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
    const { code, session_info, pin } = parsed;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // TASK 5 — STRICT session_info enforcement. The Embedded Signup popup is
    // required to return the WABA + phone the customer selected; without it
    // we cannot pick the right one and silent "first WABA" fallbacks have
    // caused production wrong-WABA bugs. Fail fast instead.
    const wabaId = session_info?.data?.waba_id;
    const phoneNumberId = session_info?.data?.phone_number_id;
    if (!wabaId || !phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selection not received from Meta — please retry the connection and choose a WhatsApp Business Account inside the popup.",
        },
        { status: 400 }
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

    // ── Step 1: Exchange OAuth code → short-lived USER access token. ────────
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

    // ── Step 2: Look up the customer's display number + verified name. ──────
    const phonesResp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/phone_numbers?access_token=${shortToken}`
    );
    const phones = await phonesResp.json();
    const phoneList: Array<{
      id: string;
      display_phone_number?: string;
      verified_name?: string;
    }> = phones?.data || [];
    const matched = phoneList.find((p) => p.id === phoneNumberId);
    const displayPhoneNumber = matched?.display_phone_number || null;
    const verifiedName = matched?.verified_name || null;

    // ── Step 3: Insert the connection EARLY in 'pending_exchange' state, ────
    //           encrypting the short-lived token as a placeholder so the
    //           webhook handler still has *something* to authenticate with
    //           if a message arrives during the brief exchange window.
    let encryptedShort: string;
    try {
      encryptedShort = encryptToken(shortToken);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Encryption failed";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }

    let encryptedPin: string | null = null;
    if (pin) {
      try {
        encryptedPin = encryptToken(pin);
      } catch {
        // Non-fatal — we'll proceed without a stored PIN.
        encryptedPin = null;
      }
    }

    await supabase
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id" });

    const { data: insertedRow, error: insertError } = await supabase
      .from("connections")
      .insert({
        user_id: user.id,
        type: "whatsapp",
        name: verifiedName || displayPhoneNumber || "WhatsApp",
        external_id: phoneNumberId,
        whatsapp_phone_number_id: phoneNumberId,
        whatsapp_business_account_id: wabaId,
        whatsapp_display_phone_number: displayPhoneNumber,
        whatsapp_access_token_encrypted: encryptedShort,
        is_active: true,
        review_count: 0,
        connection_method: "embedded_signup",
        ess_user_id: user.id,
        ess_business_id: session_info?.data?.business_id || null,
        token_status: "pending_exchange",
        phone_pin_encrypted: encryptedPin,
      })
      .select("id")
      .single();

    if (insertError || !insertedRow) {
      console.error("[ESS] DB insert failed:", insertError);
      return NextResponse.json(
        { success: false, error: insertError?.message || "Insert failed" },
        { status: 500 }
      );
    }
    connectionId = insertedRow.id as string;

    // ── Step 4: Verify token has the required scopes via debug_token. ───────
    const debugResp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/debug_token?input_token=${shortToken}&access_token=${APP_ID}|${APP_SECRET}`
    );
    const debugData = await debugResp.json();
    const scopes: string[] = debugData?.data?.scopes || [];
    const missing = REQUIRED_SCOPES.filter((s) => !scopes.includes(s));
    if (missing.length > 0) {
      await markExchangeFailed(
        `Missing required scopes: ${missing.join(", ")}. Granted: ${scopes.join(", ") || "(none)"}.`
      );
      return NextResponse.json({
        success: true,
        connection_id: connectionId,
        warning: `Connection saved but token is missing scopes: ${missing.join(", ")}. Customer must reconnect.`,
      });
    }

    // ── Step 5: Subscribe our app to webhooks for the WABA. Idempotent. ─────
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
      // Not fatal for the long-lived exchange — surface via token_exchange_error
      // only if the long-lived exchange itself also fails below.
    }

    // ── Step 6: Resolve customer business portfolio ID. ─────────────────────
    let customerBusinessId: string | null =
      session_info?.data?.business_id || null;
    try {
      const wabaInfoResp = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}?fields=on_behalf_of_business_info,owner_business_info&access_token=${shortToken}`
      );
      const wabaInfo = await wabaInfoResp.json();
      customerBusinessId =
        wabaInfo?.on_behalf_of_business_info?.id ||
        wabaInfo?.owner_business_info?.id ||
        customerBusinessId;
    } catch (e) {
      console.warn("[ESS] WABA info lookup failed:", e);
    }

    // ── Step 7: Register the phone number for Cloud API with the customer's
    //           PIN (or the legacy 000000 only if the customer didn't supply
    //           one — which the frontend now blocks, so this should be rare).
    const registerPin = pin || "000000";
    const registerResp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${shortToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", pin: registerPin }),
      }
    );
    if (!registerResp.ok) {
      console.log(
        "[ESS] Phone register response (may already be registered):",
        await registerResp.text()
      );
    }

    // ── Step 8: Exchange short-lived → long-lived (Option A). ───────────────
    //   With FB Login config "Token Expiration: Never", this returns a
    //   non-expiring token; with "60 days", it returns a 60-day token.
    const exchangeResp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: APP_ID,
          client_secret: APP_SECRET,
          fb_exchange_token: shortToken,
        })
    );
    if (!exchangeResp.ok) {
      const err = await exchangeResp.text();
      await markExchangeFailed(`Long-lived exchange HTTP ${exchangeResp.status}: ${err}`);
      return NextResponse.json({
        success: true,
        connection_id: connectionId,
        warning: "Connection saved but long-lived token exchange failed. Customer can retry from the connection detail page.",
      });
    }
    const exchangeData = await exchangeResp.json();
    const longLivedToken: string | undefined = exchangeData?.access_token;
    if (!longLivedToken) {
      await markExchangeFailed(
        `Long-lived exchange returned no access_token: ${JSON.stringify(exchangeData).slice(0, 500)}`
      );
      return NextResponse.json({
        success: true,
        connection_id: connectionId,
        warning: "Long-lived token exchange returned no access_token. Customer can retry.",
      });
    }

    // ── Step 9: Replace placeholder token with the long-lived one + mark active.
    let encryptedLong: string;
    try {
      encryptedLong = encryptToken(longLivedToken);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Encryption failed";
      await markExchangeFailed(`Encryption failed: ${msg}`);
      return NextResponse.json({
        success: true,
        connection_id: connectionId,
        warning: "Long-lived token received but encryption failed.",
      });
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("connections")
      .update({
        whatsapp_access_token_encrypted: encryptedLong,
        token_status: "active",
        token_last_validated_at: nowIso,
        onboarding_completed_at: nowIso,
        token_exchange_error: null,
        ess_business_id: customerBusinessId,
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("[ESS] Final update failed:", updateError);
      return NextResponse.json({
        success: true,
        connection_id: connectionId,
        warning: `Token stored but row update failed: ${updateError.message}`,
      });
    }

    return NextResponse.json({ success: true, connection_id: connectionId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    console.error("[ESS] OAuth callback error:", err);
    if (connectionId) await markExchangeFailed(msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
