import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // RFC 8058 one-click unsubscribe: when Gmail/Apple Mail POST to /u/[token],
  // rewrite to the internal API endpoint that performs the unsubscribe and
  // returns 200 OK with no body. GET falls through to the page.tsx renderer.
  //
  // Note: Next.js rewrites preserve request.url as the *original* URL inside
  // route handlers, so we pass the parsed token/list via custom request
  // headers instead of relying on the rewritten URL's search params.
  if (request.method === "POST" && pathname.startsWith("/u/")) {
    const token = pathname.split("/")[2] || "";
    const list = request.nextUrl.searchParams.get("list") || "digest";
    const url = request.nextUrl.clone();
    url.pathname = "/api/digest/oneclick";

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-rp-unsub-token", token);
    requestHeaders.set("x-rp-unsub-list", list);
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return await updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/verified", "/u/:path*"],
};
