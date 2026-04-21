import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyWebhookSignature,
  decryptToken,
  sendWhatsAppText,
} from "@/lib/whatsapp/client";
import { generateReply } from "@/lib/ai/reply-generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── GET: webhook verification handshake from Meta ───────────────────────────
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

// ── POST: incoming message payload ──────────────────────────────────────────
interface WAMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}
interface WAContact {
  wa_id: string;
  profile?: { name?: string };
}
interface WAChange {
  field: string;
  value: {
    metadata?: { phone_number_id: string; display_phone_number?: string };
    contacts?: WAContact[];
    messages?: WAMessage[];
  };
}
interface WAEntry {
  id: string;
  changes: WAChange[];
}
interface WAPayload {
  object: string;
  entry: WAEntry[];
}

export async function POST(request: Request) {
  // Must read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[WA webhook] Invalid signature — rejecting");
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WAPayload;
  try {
    payload = JSON.parse(rawBody) as WAPayload;
  } catch {
    return new Response("Bad JSON", { status: 200 }); // 200 so Meta doesn't retry
  }

  const supabase = createAdminClient();

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      // Locate the connection for this phone number
      const { data: conn } = await supabase
        .from("connections")
        .select("*")
        .eq("type", "whatsapp")
        .eq("whatsapp_phone_number_id", phoneNumberId)
        .eq("is_active", true)
        .maybeSingle();

      if (!conn) {
        console.warn(
          `[WA webhook] No active connection for phone_number_id=${phoneNumberId}`
        );
        continue;
      }

      const contact = value.contacts?.[0];
      const displayName = contact?.profile?.name || "Unknown";

      // Fetch the app context once for this connection (used for AI)
      const { data: appContext } = await supabase
        .from("app_contexts")
        .select("*")
        .eq("connection_id", conn.id)
        .maybeSingle();

      for (const msg of value.messages || []) {
        const isText = msg.type === "text" && !!msg.text?.body;
        const tsMs = Number(msg.timestamp) * 1000;
        const createdAt = new Date(
          isFinite(tsMs) && tsMs > 0 ? tsMs : Date.now()
        ).toISOString();

        const reviewText = isText
          ? (msg.text!.body as string)
          : `[non-text message: ${msg.type}]`;

        const row = {
          connection_id: conn.id,
          source: "whatsapp" as const,
          external_review_id: msg.id,
          author_name: displayName,
          author_id: msg.from.startsWith("+") ? msg.from : `+${msg.from}`,
          rating: null as number | null,
          review_text: reviewText,
          review_language: "en",
          reply_status: "pending" as const,
          sentiment: "neutral" as const,
          keywords: [] as string[],
          is_read: false,
          skip_auto_reply: !isText,
          review_created_at: createdAt,
        };

        const { data: inserted, error: insertErr } = await supabase
          .from("reviews")
          .insert(row)
          .select("id")
          .single();

        if (insertErr) {
          // Unique violation = duplicate wamid → OK, Meta retried
          if (insertErr.code !== "23505") {
            console.error(
              "[WA webhook] Insert error:",
              insertErr.message,
              insertErr.code
            );
          }
          continue;
        }

        // Auto-reply path (text only, respects app_context.auto_reply_enabled)
        if (!isText) continue;
        if (!appContext?.auto_reply_enabled) continue;
        if (appContext?.auto_reply_mode === "manual") continue;

        try {
          const replyText = await generateReply({
            appContext,
            review: {
              id: inserted.id,
              source: "whatsapp",
              external_review_id: msg.id,
              author_name: displayName,
              rating: null,
              review_text: reviewText,
              review_language: "en",
              reply_status: "pending",
              sentiment: "neutral",
              keywords: [],
              is_read: false,
              review_created_at: createdAt,
            },
            source: "whatsapp",
            tone: appContext?.tone,
          });

          const shouldPublish =
            appContext?.auto_reply_mode === "auto_publish";

          if (shouldPublish) {
            try {
              const accessToken = conn.whatsapp_access_token_encrypted
                ? decryptToken(conn.whatsapp_access_token_encrypted)
                : process.env.WHATSAPP_SYSTEM_USER_TOKEN || "";
              await sendWhatsAppText(
                { phoneNumberId, accessToken },
                row.author_id,
                replyText
              );
              await supabase
                .from("reviews")
                .update({
                  reply_text: replyText,
                  reply_status: "published",
                  reply_published_at: new Date().toISOString(),
                  is_auto_replied: true,
                  is_read: true,
                })
                .eq("id", inserted.id);
            } catch (sendErr) {
              console.error("[WA webhook] Send failed:", sendErr);
              await supabase
                .from("reviews")
                .update({
                  reply_text: replyText,
                  reply_status: "failed",
                })
                .eq("id", inserted.id);
            }
          } else {
            // Draft for review
            await supabase
              .from("reviews")
              .update({
                reply_text: replyText,
                reply_status: "drafted",
              })
              .eq("id", inserted.id);
          }
        } catch (aiErr) {
          console.error("[WA webhook] AI reply error:", aiErr);
          // Leave the row as 'pending' so the user can reply manually
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
