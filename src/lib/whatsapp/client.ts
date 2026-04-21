import crypto from "crypto";

const GRAPH = `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_API_VERSION || "v21.0"}`;

export interface WhatsAppConnectionCredentials {
  phoneNumberId: string;
  accessToken: string; // decrypted at call time
}

// ── Token encryption (AES-256-GCM, key from ENCRYPTION_KEY env var) ─────────
function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY || "";
  if (!hex) {
    throw new Error(
      "ENCRYPTION_KEY env var is missing — required to encrypt WhatsApp tokens at rest"
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes hex-encoded (64 hex chars); got ${key.length} bytes`
    );
  }
  return key;
}

export function encryptToken(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(blob: string): string {
  const raw = Buffer.from(blob, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const key = getKey();
  const dec = crypto.createDecipheriv("aes-256-gcm", key, iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(enc), dec.final()]).toString("utf8");
}

// ── Send a text reply (free-form; only valid inside the 24-hour service window)
export async function sendWhatsAppText(
  creds: WhatsAppConnectionCredentials,
  toPhoneE164: string,
  body: string
): Promise<{ wamid: string }> {
  // Mock path — matches the Twilio/Resend fallback pattern: when mock flag is on
  // or no system token is configured, log-only and return a synthetic wamid.
  const mockMode =
    process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
    (!creds.accessToken && !process.env.WHATSAPP_SYSTEM_USER_TOKEN);

  if (mockMode) {
    console.log(
      `[MOCK WHATSAPP SEND] to=${toPhoneE164} phoneNumberId=${creds.phoneNumberId} body=${JSON.stringify(body).slice(0, 200)}`
    );
    return { wamid: `mock-wamid-${Date.now()}` };
  }

  const res = await fetch(`${GRAPH}/${creds.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhoneE164.replace(/^\+/, ""),
      type: "text",
      text: { preview_url: false, body },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${err}`);
  }
  const data = (await res.json()) as { messages?: Array<{ id: string }> };
  const wamid = data?.messages?.[0]?.id;
  if (!wamid) {
    throw new Error("WhatsApp send returned no message id");
  }
  return { wamid };
}

// ── Verify credentials by listing phone numbers on the WABA
export async function verifyWhatsAppCredentials(creds: {
  accessToken: string;
  wabaId: string;
}): Promise<
  | {
      ok: true;
      phones: Array<{
        id: string;
        display_phone_number: string;
        verified_name: string;
      }>;
    }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${GRAPH}/${creds.wabaId}/phone_numbers`, {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    });
    if (!res.ok) return { ok: false, error: await res.text() };
    const data = (await res.json()) as {
      data?: Array<{
        id: string;
        display_phone_number: string;
        verified_name: string;
      }>;
    };
    return { ok: true, phones: data?.data || [] };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

// ── Validate Meta webhook signature (X-Hub-Signature-256) ───────────────────
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
