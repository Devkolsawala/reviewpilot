import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectionDetailClient } from "@/components/dashboard/ConnectionDetailClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ConnectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conn, error } = await supabase
    .from("connections")
    .select(
      "id, user_id, type, name, external_id, created_at, whatsapp_business_account_id, whatsapp_phone_number_id, whatsapp_display_phone_number, connection_method, token_status, token_last_validated_at, token_exchange_error, onboarding_completed_at"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !conn) notFound();

  // Only WhatsApp gets the detail page today — other types redirect back to list
  if (conn.type !== "whatsapp") {
    redirect("/dashboard/settings/connections");
  }

  // Format the connection timestamp on the server with a fixed locale so the
  // client doesn't re-format it with a different locale and trigger a React
  // hydration mismatch.
  const createdAtFormatted = new Date(conn.created_at as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  );

  return (
    <ConnectionDetailClient
      connection={{
        id: conn.id as string,
        type: conn.type as string,
        name: (conn.name as string) || "WhatsApp",
        createdAtFormatted,
        wabaId: (conn.whatsapp_business_account_id as string) || null,
        phoneNumberId: (conn.whatsapp_phone_number_id as string) || null,
        displayPhoneNumber:
          (conn.whatsapp_display_phone_number as string) ||
          (conn.external_id as string) ||
          null,
        connectionMethod:
          (conn.connection_method as
            | "manual"
            | "embedded_signup"
            | null) || null,
        tokenStatus:
          (conn.token_status as
            | "active"
            | "expired"
            | "revoked"
            | "pending_exchange"
            | "exchange_failed"
            | null) || null,
        tokenLastValidatedAt:
          (conn.token_last_validated_at as string | null) || null,
        tokenExchangeError:
          (conn.token_exchange_error as string | null) || null,
      }}
    />
  );
}
