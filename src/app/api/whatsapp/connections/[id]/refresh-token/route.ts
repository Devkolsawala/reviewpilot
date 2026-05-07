import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/whatsapp/connections/[id]/refresh-token
 *
 * Marks the connection as 'revoked' on the server (preserving historical data),
 * then returns a redirect URL the frontend uses to relaunch the ESS popup.
 * The follow-up ESS callback will create a NEW connection row for the same
 * WABA + phone, and the old 'revoked' row remains for audit.
 *
 * Future: if a non-OAuth recovery path becomes available (e.g., regenerating
 * a System User token via Business Manager API), this endpoint can be
 * extended to perform that exchange server-side and return success without
 * requiring the user to re-authorize via popup.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connectionId = params.id;
  if (!connectionId) {
    return NextResponse.json(
      { error: "connection id is required" },
      { status: 400 }
    );
  }

  // Verify ownership.
  const { data: conn, error } = await supabase
    .from("connections")
    .select("id, type, connection_method")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  if (error || !conn) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }
  if (conn.type !== "whatsapp") {
    return NextResponse.json(
      { error: "Only WhatsApp connections support token refresh" },
      { status: 400 }
    );
  }

  // Mark the existing row as revoked so the historical record is preserved.
  // The follow-up ESS flow will insert a fresh row.
  await supabase
    .from("connections")
    .update({ token_status: "revoked", is_active: false })
    .eq("id", connectionId)
    .eq("user_id", user.id);

  return NextResponse.json({
    needs_reauthorization: true,
    ess_redirect_url: `/dashboard/settings/connections?reauth=true&connection_id=${connectionId}`,
  });
}
