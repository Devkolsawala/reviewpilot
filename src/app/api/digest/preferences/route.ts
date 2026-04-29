import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDigestCcLimit } from "@/lib/plans";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  let { data: prefs } = await admin
    .from("digest_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prefs) {
    const { data: inserted } = await admin
      .from("digest_preferences")
      .insert({ user_id: user.id })
      .select("*")
      .single();
    prefs = inserted;
  }

  return NextResponse.json({ preferences: prefs });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.daily_enabled === "boolean") update.daily_enabled = body.daily_enabled;
  if (typeof body.weekly_enabled === "boolean") update.weekly_enabled = body.weekly_enabled;
  if (typeof body.skip_if_no_activity === "boolean")
    update.skip_if_no_activity = body.skip_if_no_activity;
  if (typeof body.include_lowest_rated === "boolean")
    update.include_lowest_rated = body.include_lowest_rated;
  if (typeof body.include_top_keywords === "boolean")
    update.include_top_keywords = body.include_top_keywords;
  if (typeof body.include_quota_usage === "boolean")
    update.include_quota_usage = body.include_quota_usage;

  if (typeof body.daily_send_hour === "number") {
    if (body.daily_send_hour < 0 || body.daily_send_hour > 23) {
      return NextResponse.json({ error: "daily_send_hour must be 0-23" }, { status: 400 });
    }
    update.daily_send_hour = body.daily_send_hour;
  }
  if (typeof body.weekly_send_hour === "number") {
    if (body.weekly_send_hour < 0 || body.weekly_send_hour > 23) {
      return NextResponse.json({ error: "weekly_send_hour must be 0-23" }, { status: 400 });
    }
    update.weekly_send_hour = body.weekly_send_hour;
  }
  if (typeof body.weekly_send_dow === "number") {
    if (body.weekly_send_dow < 0 || body.weekly_send_dow > 6) {
      return NextResponse.json({ error: "weekly_send_dow must be 0-6" }, { status: 400 });
    }
    update.weekly_send_dow = body.weekly_send_dow;
  }
  if (typeof body.timezone === "string") {
    if (!isValidTimezone(body.timezone)) {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }
    update.timezone = body.timezone;
  }
  if (body.recipient_email != null) {
    if (typeof body.recipient_email !== "string" || !EMAIL_RE.test(body.recipient_email)) {
      return NextResponse.json({ error: "Invalid recipient_email" }, { status: 400 });
    }
    update.recipient_email = body.recipient_email;
  }
  if (Array.isArray(body.cc_emails)) {
    const ccs = body.cc_emails as unknown[];
    if (!ccs.every((e) => typeof e === "string" && EMAIL_RE.test(e))) {
      return NextResponse.json({ error: "Invalid cc_emails" }, { status: 400 });
    }
    const admin0 = createAdminClient();
    const { data: prof } = await admin0
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    const limit = getDigestCcLimit(prof?.plan || "free");
    if (ccs.length > limit) {
      return NextResponse.json(
        {
          error: `Your plan allows up to ${limit} CC recipients`,
          limit,
        },
        { status: 403 }
      );
    }
    update.cc_emails = ccs;
  }

  const admin = createAdminClient();
  // Upsert: ensure a row exists for first-time users
  const { error: upErr } = await admin
    .from("digest_preferences")
    .upsert({ user_id: user.id, ...update }, { onConflict: "user_id" });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: prefs } = await admin
    .from("digest_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();
  return NextResponse.json({ preferences: prefs });
}
