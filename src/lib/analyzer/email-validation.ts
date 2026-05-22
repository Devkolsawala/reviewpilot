// Email validation for the analyzer's email-gate / PDF report flow.
//
// Layered defense against spam and lead pollution:
//   1. Format check (basic regex, not RFC-perfect — rejects obvious garbage)
//   2. Disposable-domain blocklist (~120k domains from a maintained list)
// The per-IP submission cap (Layer 3) lives in the route handler since it
// requires DB state.
//
// Domain comparison is case-insensitive (RFC 5321: local-part is technically
// case-sensitive, domain part is not). We lowercase before matching.

// Module shape is declared in src/types/disposable-email-domains.d.ts —
// the upstream package ships a JSON array with no types of its own.
import disposableDomains from "disposable-email-domains";

const DISPOSABLE_SET: ReadonlySet<string> = new Set(
  disposableDomains.map((d) => d.toLowerCase())
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const MAX_LEN = 254;

export type EmailValidationReason = "invalid_format" | "disposable";

export type EmailValidationResult =
  | { ok: true; email: string }
  | { ok: false; reason: EmailValidationReason };

// Returns the normalized (trimmed + lowercased) email on success, or a
// structured reason on failure. Never throws.
export function validateEmail(input: unknown): EmailValidationResult {
  if (typeof input !== "string") return { ok: false, reason: "invalid_format" };
  const email = input.trim().toLowerCase();
  if (!email || email.length > MAX_LEN || !EMAIL_RE.test(email)) {
    return { ok: false, reason: "invalid_format" };
  }

  const atIndex = email.lastIndexOf("@");
  const domain = email.slice(atIndex + 1);
  if (!domain) return { ok: false, reason: "invalid_format" };

  if (DISPOSABLE_SET.has(domain)) {
    return { ok: false, reason: "disposable" };
  }

  return { ok: true, email };
}
