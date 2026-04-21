import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyWhatsAppCredentials } from "@/lib/whatsapp/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { wabaId, systemUserToken } = body as {
    wabaId?: string;
    systemUserToken?: string;
  };
  if (!wabaId || !systemUserToken) {
    return NextResponse.json(
      { success: false, error: "wabaId and systemUserToken are required" },
      { status: 400 }
    );
  }

  const result = await verifyWhatsAppCredentials({
    wabaId,
    accessToken: systemUserToken,
  });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error });
  }
  return NextResponse.json({ success: true, phones: result.phones });
}
