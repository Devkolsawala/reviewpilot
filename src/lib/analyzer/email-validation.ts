// Email validation for the analyzer's email-gate / PDF report flow.
//
// Layered defense against spam, typos, and fake domains:
//   1. Format check — stricter regex requiring a 2+ char TLD
//   2. Disposable-domain blocklist (~120k domains from a maintained list)
//   3. Common-typo detector — catches gm.com → gmail.com etc.
//   4. MX-record lookup — rejects domains that don't accept mail
// The per-IP submission cap (Layer 5) lives in the route handler since it
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

// Stricter than the previous `^[^\s@]+@[^\s@]+\.[^\s@]+$` — requires a TLD
// of at least 2 letters. Still doesn't catch typo'd-but-format-valid
// domains like "gm.com"; that's what detectDomainTypo is for.
export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
  // Belt-and-braces: reject double-dots or leading/trailing dots in either
  // part — the regex alone permits these.
  if (
    email.includes("..") ||
    email.startsWith(".") ||
    email.endsWith(".") ||
    email.includes(".@") ||
    email.includes("@.")
  ) {
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

// Common typo'd domains, mapped to their likely intended counterpart.
// Catches what regex + blocklist miss: syntactically-valid domains that
// are almost certainly a fat-finger of a popular provider (e.g.
// "gm.com" → "gmail.com").
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  "gm.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.con": "gmail.com",
  "gamil.com": "gmail.com",
  "gmal.com": "gmail.com",
  // Yahoo typos
  "yaho.com": "yahoo.com",
  "yahho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahooo.com": "yahoo.com",
  // Hotmail / Outlook typos
  "hotmai.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outloook.com": "outlook.com",
};

export function detectDomainTypo(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return COMMON_DOMAIN_TYPOS[domain] ?? null;
}

// Returns the corrected email (with the suggested domain) if a typo was
// found, else null.
export function suggestEmailCorrection(email: string): string | null {
  const correctDomain = detectDomainTypo(email);
  if (!correctDomain) return null;
  const at = email.lastIndexOf("@");
  return email.slice(0, at + 1) + correctDomain;
}

// Server-only. Confirms the domain has at least one MX record — catches
// fake-but-format-valid domains like "asdfqwer.com" that no regex can
// recognize. 3-second timeout protects Vercel function budgets; fails
// closed on any error (false rejects acceptable, false accepts not).
//
// `node:dns` is loaded via a dynamic import with `webpackIgnore: true` so
// that this file remains safe to import from client components (which also
// need detectDomainTypo / suggestEmailCorrection). A window-check guards
// the call entirely on the off chance it ever executes in a browser.
export async function hasValidMxRecord(email: string): Promise<boolean> {
  if (typeof window !== "undefined") return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain) return false;

  try {
    const mod = (await import(/* webpackIgnore: true */ "node:dns")) as {
      promises: { resolveMx: (h: string) => Promise<unknown[]> };
    };
    const dns = mod.promises;
    const records = await Promise.race<unknown[]>([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("dns_timeout")), 3000)
      ),
    ]);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}
