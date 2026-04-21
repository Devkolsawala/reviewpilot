import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/whatsapp/client";
import { getPlan, getWhatsAppConnectionLimit } from "@/lib/plans";

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
  const { wabaId, systemUserToken, phoneNumberId, displayPhoneNumber, verifiedName } =
    body as {
      wabaId?: string;
      systemUserToken?: string;
      phoneNumberId?: string;
      displayPhoneNumber?: string;
      verifiedName?: string;
    };

  if (!wabaId || !systemUserToken || !phoneNumberId) {
    return NextResponse.json(
      { error: "wabaId, systemUserToken, and phoneNumberId are required" },
      { status: 400 }
    );
  }

  // Plan quota check — mirrors how Play Store / GBP work through total `connections` limit
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const planId = profile?.plan || "free";
  const plan = getPlan(planId);

  const { count: whatsappCount } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "whatsapp")
    .eq("is_active", true);

  const whatsappLimit = getWhatsAppConnectionLimit(planId);
  if (whatsappLimit === 0) {
    return NextResponse.json(
      {
        error: "upgrade_required",
        message: `WhatsApp connections are not available on the ${plan.name} plan. Upgrade to Growth or Agency.`,
      },
      { status: 403 }
    );
  }
  if (whatsappLimit > 0 && (whatsappCount ?? 0) >= whatsappLimit) {
    return NextResponse.json(
      {
        error: "limit_exceeded",
        message: `You've reached the WhatsApp connection limit for the ${plan.name} plan (${whatsappLimit}).`,
      },
      { status: 403 }
    );
  }

  let encrypted: string;
  try {
    encrypted = encryptToken(systemUserToken);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Encryption failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  const { data: conn, error } = await supabase
    .from("connections")
    .insert({
      user_id: user.id,
      type: "whatsapp",
      name: verifiedName || displayPhoneNumber || "WhatsApp",
      external_id: phoneNumberId,
      whatsapp_phone_number_id: phoneNumberId,
      whatsapp_business_account_id: wabaId,
      whatsapp_display_phone_number: displayPhoneNumber || null,
      whatsapp_access_token_encrypted: encrypted,
      is_active: true,
      review_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("[WA connect] Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, connection: conn });
}
