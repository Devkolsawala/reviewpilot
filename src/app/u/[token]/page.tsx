import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { ResubscribeButton } from "./ResubscribeButton";

const LIST_LABEL: Record<string, string> = {
  digest: "daily digest emails",
  campaigns: "campaign emails",
  all: "all marketing emails",
};

type Props = {
  params: { token: string };
  searchParams: { list?: string };
};

async function applyUnsubscribe(
  token: string,
  list: string
): Promise<{ ok: boolean; email?: string | null; alreadyUnsubscribed?: boolean }> {
  const validList = list === "campaigns" || list === "all" ? list : "digest";
  const admin = createAdminClient();
  const { data: prefs } = await admin
    .from("digest_preferences")
    .select("user_id, recipient_email")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!prefs) return { ok: false };

  // Try to fetch the user's email for the confirmation message
  const { data: authUser } = await admin.auth.admin.getUserById(prefs.user_id);
  const email = prefs.recipient_email || authUser?.user?.email || null;

  const { data: existing } = await admin
    .from("email_unsubscribes")
    .select("id")
    .eq("user_id", prefs.user_id)
    .eq("list", validList)
    .maybeSingle();
  if (existing) {
    return { ok: true, email, alreadyUnsubscribed: true };
  }

  const { error } = await admin.from("email_unsubscribes").insert({
    user_id: prefs.user_id,
    email,
    list: validList,
    token,
  });
  if (error) return { ok: false };
  return { ok: true, email };
}

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const list =
    searchParams.list === "campaigns" || searchParams.list === "all"
      ? searchParams.list
      : "digest";
  const result = await applyUnsubscribe(params.token, list);
  // LIST_LABEL is referenced for non-digest lists in the future; the daily-digest
  // copy is now hard-coded since it's the only list this page is reached for today.
  void LIST_LABEL;

  if (!result.ok) {
    return (
      <main style={{ maxWidth: 480, margin: "80px auto", padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
          Unsubscribe link not recognised
        </h1>
        <p style={{ color: "#64748B", lineHeight: 1.6 }}>
          This link may have expired or already been used. If you keep receiving emails you
          don&apos;t want, please reach out to support and we&apos;ll sort it out manually.
        </p>
        <p style={{ marginTop: 20 }}>
          <Link href="/" style={{ color: "#0F172A", textDecoration: "underline" }}>
            ← Back to ReviewPilot
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "80px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
        You&apos;ve been unsubscribed from daily digest emails
      </h1>
      <p style={{ color: "#475569", lineHeight: 1.6 }}>
        To re-enable, go to Settings &rarr; Notifications in your dashboard, or click
        the button below.
      </p>
      <p style={{ color: "#64748B", lineHeight: 1.6, marginTop: 12, fontSize: 14 }}>
        Transactional emails (password resets, billing receipts, review-reply notifications)
        will still be sent — they&apos;re separate from this list.
      </p>
      <div style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center" }}>
        <ResubscribeButton token={params.token} list={list} />
        <Link
          href="/dashboard/settings/notifications"
          style={{ color: "#64748B", fontSize: 14, textDecoration: "underline" }}
        >
          Manage email preferences
        </Link>
      </div>
    </main>
  );
}
