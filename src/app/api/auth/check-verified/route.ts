import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns { verified: boolean } for a given email.
 *
 * Used by the signup "Check your email" screen to poll for verification when
 * the user clicked the confirmation link in a different browser / device from
 * the one they signed up on — in that case Supabase's client-side
 * onAuthStateChange never fires in the original tab, so we fall back to
 * polling this endpoint every few seconds.
 *
 * Backed by the public.is_email_verified SQL function (migration 017).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json({ verified: false });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("is_email_verified", {
      email_arg: email,
    });

    if (error) {
      console.error("[check-verified] rpc error:", error.message);
      return NextResponse.json({ verified: false });
    }

    return NextResponse.json({ verified: !!data });
  } catch (err) {
    console.error("[check-verified] unexpected error:", err);
    return NextResponse.json({ verified: false });
  }
}
