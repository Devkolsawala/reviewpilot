import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  decryptToken,
  fetchTemplates,
  createTemplate,
} from "@/lib/whatsapp/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MOCK_TEMPLATES = [
  {
    id: "mock-tpl-1",
    name: "order_confirmation",
    category: "UTILITY" as const,
    status: "APPROVED" as const,
    language: "en",
    components: [{ type: "BODY", text: "Hi {{1}}, your order {{2}} has been confirmed." }],
  },
  {
    id: "mock-tpl-2",
    name: "welcome_message",
    category: "UTILITY" as const,
    status: "APPROVED" as const,
    language: "en",
    components: [{ type: "BODY", text: "Welcome to {{1}}! We're glad you're here." }],
  },
  {
    id: "mock-tpl-3",
    name: "monthly_newsletter",
    category: "MARKETING" as const,
    status: "PENDING" as const,
    language: "en",
    components: [{ type: "BODY", text: "Hi {{1}}, here's what's new this month." }],
  },
];

async function loadConnection(connectionId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("connections")
    .select(
      "id, user_id, type, whatsapp_business_account_id, whatsapp_phone_number_id, whatsapp_access_token_encrypted"
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
    whatsapp_business_account_id: string | null;
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
    return NextResponse.json({ templates: MOCK_TEMPLATES });
  }

  const conn = await loadConnection(connectionId, user.id);
  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  if (!conn.whatsapp_business_account_id || !conn.whatsapp_access_token_encrypted) {
    return NextResponse.json(
      { error: "WhatsApp connection missing credentials" },
      { status: 400 }
    );
  }

  try {
    const accessToken = decryptToken(conn.whatsapp_access_token_encrypted);
    const templates = await fetchTemplates({
      wabaId: conn.whatsapp_business_account_id,
      accessToken,
    });
    return NextResponse.json({ templates });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch templates";
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
    name?: string;
    category?: "UTILITY" | "MARKETING" | "AUTHENTICATION";
    language?: string;
    bodyText?: string;
  };

  const { connectionId, name, category, language, bodyText } = body;
  if (!connectionId || !name || !category || !language || !bodyText) {
    return NextResponse.json(
      { error: "connectionId, name, category, language, and bodyText are required" },
      { status: 400 }
    );
  }
  if (!/^[a-z0-9_]+$/.test(name)) {
    return NextResponse.json(
      { error: "Template name must be lowercase letters, digits, and underscores only" },
      { status: 400 }
    );
  }
  if (bodyText.length > 1024) {
    return NextResponse.json({ error: "bodyText exceeds 1024 characters" }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return NextResponse.json({
      id: `mock-${Date.now()}`,
      status: "PENDING",
      category,
    });
  }

  const conn = await loadConnection(connectionId, user.id);
  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  if (!conn.whatsapp_business_account_id || !conn.whatsapp_access_token_encrypted) {
    return NextResponse.json(
      { error: "WhatsApp connection missing credentials" },
      { status: 400 }
    );
  }

  try {
    const accessToken = decryptToken(conn.whatsapp_access_token_encrypted);
    const result = await createTemplate(
      { wabaId: conn.whatsapp_business_account_id, accessToken },
      { name, category, language, bodyText }
    );
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create template";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
