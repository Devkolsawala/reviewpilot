/**
 * One-click unsubscribe tokens for the lifecycle email engine.
 *
 * A token self-describes the email it stops, so the /api/email/unsubscribe
 * route needs no DB lookup to know who is unsubscribing — and the HMAC makes it
 * unforgeable. Format:
 *
 *     <base64url(email)>.<base64url(HMAC_SHA256(UNSUBSCRIBE_SECRET, email))>
 *
 * Emails are normalized (trim + lowercase) before signing so the token for an
 * address is stable regardless of how it was capitalized at capture time.
 *
 * UNSUBSCRIBE_SECRET must be set in the environment. If it is missing we fail
 * CLOSED: makeUnsubscribeToken throws (so we never send a stop link that can't
 * be honored) and verifyUnsubscribeToken returns null.
 */

import crypto from "crypto";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET is not configured");
  }
  return secret;
}

function sign(normalizedEmail: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(normalizedEmail)
    .digest("base64url");
}

/** Build the stop/unsubscribe token for an email address. */
export function makeUnsubscribeToken(email: string): string {
  const normalized = normalizeEmail(email);
  const payload = Buffer.from(normalized, "utf8").toString("base64url");
  const sig = sign(normalized, getSecret());
  return `${payload}.${sig}`;
}

/**
 * Verify a token and recover the email it unsubscribes.
 * Returns the normalized email, or null if the token is malformed, tampered,
 * or the secret is unavailable. Uses a constant-time comparison.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  if (!token || typeof token !== "string") return null;

  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) return null;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const payload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  let email: string;
  try {
    email = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email) return null;

  const expectedSig = sign(email, secret);

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  return email;
}
