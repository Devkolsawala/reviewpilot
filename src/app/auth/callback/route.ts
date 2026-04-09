import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * General-purpose Supabase auth callback.
 * Handles PKCE code exchange for magic links, email invites, and OAuth flows.
 *
 * Usage: set redirectTo = `${appUrl}/auth/callback?next=<encoded-path>`
 * Supabase appends `&code=xxx` — this route exchanges it and redirects to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("[auth/callback] code exchange failed:", error.message);
  }

  // Something went wrong — send to login with error hint
  return NextResponse.redirect(new URL("/login?error=invite_expired", origin));
}
