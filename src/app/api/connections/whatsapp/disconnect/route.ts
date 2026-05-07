import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/whatsapp/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GRAPH_VERSION = process.env.NEXT_PUBLIC_FB_GRAPH_VERSION || "v21.0";

// Phase 6 v2 — TASK 7: full disconnect flow.
//
// 1. Best-effort: unsubscribe our app from the WABA's webhooks.
// 2. Best-effort: revoke the access token via /me/permissions (ESS only).
// 3. Required: delete cached reviews for that connection (90-day retention).
// 4. Required: delete the connection row.
// 5. Return success even if 1 or 2 failed — user-facing operation must
//    succeed even when Meta is briefly unreachable.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { connectionId } = (await request.json().catch(() => ({}))) as {
    connectionId?: string;
  };
  if (!connectionId) {
    return NextResponse.json(
      { error: "connectionId is required" },
      { status: 400 }
    );
  }

  // Fetch the row so we can hit Meta with the decrypted token first.
  const { data: conn, error: selectError } = await supabase
    .from("connections")
    .select(
      "id, type, whatsapp_business_account_id, whatsapp_access_token_encrypted, connection_method"
    )
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .eq("type", "whatsapp")
    .single();

  if (selectError || !conn) {
    // Row doesn't exist or doesn't belong to this user — nothing to clean up.
    return NextResponse.json({ success: true });
  }

  const wabaId = conn.whatsapp_business_account_id as string | null;
  const encryptedToken = conn.whatsapp_access_token_encrypted as string | null;

  if (encryptedToken) {
    let token: string | null = null;
    try {
      token = decryptToken(encryptedToken);
    } catch (e) {
      console.warn("[WA disconnect] Token decrypt failed:", e);
    }

    if (token) {
      // Step 1: unsubscribe app from webhooks for this WABA.
      if (wabaId) {
        try {
          const unsubResp = await fetch(
            `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/subscribed_apps`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!unsubResp.ok) {
            console.warn(
              "[WA disconnect] Webhook unsubscribe failed:",
              await unsubResp.text()
            );
          }
        } catch (e) {
          console.warn("[WA disconnect] Webhook unsubscribe error:", e);
        }
      }

      // Step 2: revoke the access token (ESS only — manual System User
      // tokens are not on /me/permissions).
      if (conn.connection_method === "embedded_signup") {
        try {
          const revokeResp = await fetch(
            `https://graph.facebook.com/${GRAPH_VERSION}/me/permissions`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!revokeResp.ok) {
            console.warn(
              "[WA disconnect] Token revoke failed:",
              await revokeResp.text()
            );
          }
        } catch (e) {
          console.warn("[WA disconnect] Token revoke error:", e);
        }
      }
    }
  }

  // Step 3: delete cached reviews for this connection.
  const { error: reviewsError } = await supabase
    .from("reviews")
    .delete()
    .eq("connection_id", connectionId);
  if (reviewsError) {
    console.error("[WA disconnect] Reviews delete failed:", reviewsError);
    return NextResponse.json(
      { error: reviewsError.message },
      { status: 500 }
    );
  }

  // Step 4: delete the connection row.
  const { error: deleteError } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .eq("type", "whatsapp");

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  // TODO v3 — Token health check background job.
  // A periodic cron should call /debug_token for every WhatsApp connection
  // with token_status='active' and:
  //   - update token_last_validated_at on success
  //   - flip token_status to 'expired' or 'revoked' if Meta says so
  // Not implemented in v2; status updates currently happen reactively
  // (on send/sync failures and on user-initiated reconnect).

  return NextResponse.json({ success: true });
}
