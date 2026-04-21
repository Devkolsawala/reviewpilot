import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  decryptToken,
  fetchBusinessProfile,
  updateBusinessProfile,
} from "@/lib/whatsapp/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MOCK_PROFILE = {
  description: "AI-powered review management for Indian app makers and local businesses.",
  about: "ReviewPilot — replies that sound like you.",
  email: "hello@reviewpilot.co.in",
  address: "Bengaluru, India",
  vertical: "PROF_SERVICES",
};

async function loadConnection(connectionId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("connections")
    .select(
      "id, user_id, type, whatsapp_phone_number_id, whatsapp_access_token_encrypted"
    )
    .eq("id", connectionId)
    .eq("user_id", userId)
    .eq("type", "whatsapp")
    .single();
  if (error || !data) return null;
  return data as {
    id: string;
    user_id: string;
    type: string;
    whatsapp_phone_number_id: string | null;
    whatsapp_access_token_encrypted: string | null;
  };
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");
  if (!connectionId)
    return NextResponse.json({ error: "connectionId is required" }, { status: 400 });

  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return NextResponse.json({ profile: MOCK_PROFILE });
  }

  const conn = await loadConnection(connectionId, user.id);
  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  if (!conn.whatsapp_phone_number_id || !conn.whatsapp_access_token_encrypted) {
    return NextResponse.json(
      { error: "WhatsApp connection missing credentials" },
      { status: 400 }
    );
  }

  try {
    const accessToken = decryptToken(conn.whatsapp_access_token_encrypted);
    const profile = await fetchBusinessProfile({
      phoneNumberId: conn.whatsapp_phone_number_id,
      accessToken,
    });
    return NextResponse.json({ profile });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch profile";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    connectionId?: string;
    description?: string;
    about?: string;
    email?: string;
    address?: string;
  };
  const { connectionId, description, about, email, address } = body;
  if (!connectionId)
    return NextResponse.json({ error: "connectionId is required" }, { status: 400 });

  // Meta field limits
  if (description && description.length > 512)
    return NextResponse.json({ error: "description exceeds 512 characters" }, { status: 400 });
  if (about && about.length > 139)
    return NextResponse.json({ error: "about exceeds 139 characters" }, { status: 400 });

  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return NextResponse.json({ success: true });
  }

  const conn = await loadConnection(connectionId, user.id);
  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  if (!conn.whatsapp_phone_number_id || !conn.whatsapp_access_token_encrypted) {
    return NextResponse.json(
      { error: "WhatsApp connection missing credentials" },
      { status: 400 }
    );
  }

  try {
    const accessToken = decryptToken(conn.whatsapp_access_token_encrypted);
    const payload: { description?: string; about?: string; email?: string; address?: string } = {};
    if (description !== undefined) payload.description = description;
    if (about !== undefined) payload.about = about;
    if (email !== undefined) payload.email = email;
    if (address !== undefined) payload.address = address;

    const result = await updateBusinessProfile(
      { phoneNumberId: conn.whatsapp_phone_number_id, accessToken },
      payload
    );
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update profile";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
