import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Token-hash email confirmation handler (Supabase recommended pattern).
 *
 * Why this exists alongside /auth/callback:
 *   /auth/callback uses PKCE (exchangeCodeForSession), which requires a
 *   code_verifier cookie set in the same browser that initiated signup.
 *   If the user opens the verification email on a different browser, device,
 *   or Chrome profile, PKCE fails with "invite_expired".
 *
 *   verifyOtp({ token_hash, type }) does NOT need the code_verifier — it
 *   validates the hash directly against Supabase and issues a session.
 *   This is the robust flow for email links.
 *
 * Email template link format:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/verified
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/verified";

  // Use x-forwarded-host if present (Vercel puts real domain there)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = forwardedHost ? `${proto}://${forwardedHost}` : origin;

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }

    console.error("[auth/confirm] verifyOtp failed:", error.message);
  }

  return NextResponse.redirect(
    `${baseUrl}/login?error=invite_expired`
  );
}
