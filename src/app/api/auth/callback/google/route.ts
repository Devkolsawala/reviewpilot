import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Determine the correct base URL.
  // On Vercel, request.url may use an internal hostname — use x-forwarded-host for the real domain.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = forwardedHost ? `${proto}://${forwardedHost}` : origin;

  if (code) {
    const cookieStore = cookies();
    // Build the redirect response first so we can attach cookies directly to it.
    // cookieStore from next/headers is read-only in route handlers — setting cookies there
    // silently fails and the session never reaches the browser on the redirect.
    const redirectResponse = NextResponse.redirect(`${baseUrl}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options) {
            redirectResponse.cookies.set({ name, value, ...options });
          },
          remove(name: string, options) {
            redirectResponse.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectResponse;
    }
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
}
