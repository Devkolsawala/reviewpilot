/**
 * One-click unsubscribe endpoint for RFC 8058 (List-Unsubscribe-Post).
 *
 * Email clients (Gmail, Apple Mail) POST here when the user clicks the native
 * "Unsubscribe" affordance. Must return 200 quickly with no body.
 *
 * Reached either directly (List-Unsubscribe header points here) or via a
 * middleware rewrite when POST hits `/u/[token]`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function unsubscribe(token: string, listRaw: string) {
  const list = listRaw === "campaigns" || listRaw === "all" ? listRaw : "digest";
  const admin = createAdminClient();
  const { data: prefs } = await admin
    .from("digest_preferences")
    .select("user_id, recipient_email")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!prefs) return false;

  const { data: existing } = await admin
    .from("email_unsubscribes")
    .select("id")
    .eq("user_id", prefs.user_id)
    .eq("list", list)
    .maybeSingle();
  if (existing) return true; // already unsubscribed; idempotent success

  const { data: authUser } = await admin.auth.admin.getUserById(prefs.user_id);
  const email = prefs.recipient_email || authUser?.user?.email || null;

  await admin.from("email_unsubscribes").insert({
    user_id: prefs.user_id,
    email,
    list,
    token,
  });
  return true;
}

export async function POST(request: NextRequest) {
  // Token + list arrive via headers when the request was rewritten by middleware
  // from `POST /u/[token]?list=...`. Direct callers can also pass them via
  // query string (?token=...&list=...).
  const url = new URL(request.url);
  const token =
    request.headers.get("x-rp-unsub-token") ||
    url.searchParams.get("token") ||
    "";
  const list =
    request.headers.get("x-rp-unsub-list") ||
    url.searchParams.get("list") ||
    "digest";
  if (!token) {
    return new NextResponse(null, { status: 400 });
  }
  await unsubscribe(token, list);
  // Per RFC 8058: 200 OK with empty body, regardless of whether the row was
  // newly created or already existed. Don't leak account state to receivers.
  return new NextResponse(null, { status: 200 });
}
