/**
 * GET/PUT /api/alerts/preferences
 *
 * Instant-alert preferences for the workspace. Owner + admin only (same
 * audience as the Settings → Notifications page, which already redirects
 * other roles). Preferences are keyed on the WORKSPACE OWNER's user id so a
 * team admin edits the shared workspace settings, mirroring how usage and
 * connections are pooled.
 *
 * Reads/writes go through the service-role client after the explicit role
 * check — alert_preferences has read-only RLS by design.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeKeywords } from "@/lib/alerts/evaluate";

const ALLOWED_MIN_RATINGS = [1, 2, 3];
const ALLOWED_DAILY_CAPS = [3, 5, 10];

/**
 * Resolves the workspace owner id for the caller and whether the caller may
 * manage alert settings (owner, or team member with role 'admin').
 */
async function resolveOwnerAndAccess(
  userId: string
): Promise<{ ownerId: string; canManage: boolean }> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("owner_id")
    .eq("id", userId)
    .single();

  const ownerId = (profile?.owner_id as string | null) ?? userId;
  if (ownerId === userId) return { ownerId, canManage: true };

  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("member_id", userId)
    .eq("owner_id", ownerId)
    .eq("status", "active")
    .maybeSingle();
  return { ownerId, canManage: membership?.role === "admin" };
}

async function loadOrCreatePrefs(ownerId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("alert_preferences")
    .select("user_id, enabled, min_rating, keywords, daily_cap")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (existing) return existing;

  const { data: inserted } = await admin
    .from("alert_preferences")
    .insert({ user_id: ownerId })
    .select("user_id, enabled, min_rating, keywords, daily_cap")
    .single();
  return inserted;
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ownerId, canManage } = await resolveOwnerAndAccess(user.id);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prefs = await loadOrCreatePrefs(ownerId);
  return NextResponse.json({ preferences: prefs });
}

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ownerId, canManage } = await resolveOwnerAndAccess(user.id);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.enabled === "boolean") update.enabled = body.enabled;

  if (body.min_rating !== undefined) {
    if (
      typeof body.min_rating !== "number" ||
      !ALLOWED_MIN_RATINGS.includes(body.min_rating)
    ) {
      return NextResponse.json(
        { error: "min_rating must be 1, 2, or 3" },
        { status: 400 }
      );
    }
    update.min_rating = body.min_rating;
  }

  if (body.daily_cap !== undefined) {
    if (
      typeof body.daily_cap !== "number" ||
      !ALLOWED_DAILY_CAPS.includes(body.daily_cap)
    ) {
      return NextResponse.json(
        { error: "daily_cap must be 3, 5, or 10" },
        { status: 400 }
      );
    }
    update.daily_cap = body.daily_cap;
  }

  if (body.keywords !== undefined) {
    const keywords = normalizeKeywords(body.keywords);
    if (keywords === null) {
      return NextResponse.json(
        { error: "keywords must be up to 10 strings of 30 characters or less" },
        { status: 400 }
      );
    }
    update.keywords = keywords;
  }

  const admin = createAdminClient();
  const { error: upErr } = await admin
    .from("alert_preferences")
    .upsert({ user_id: ownerId, ...update }, { onConflict: "user_id" });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: prefs } = await admin
    .from("alert_preferences")
    .select("user_id, enabled, min_rating, keywords, daily_cap")
    .eq("user_id", ownerId)
    .single();
  return NextResponse.json({ preferences: prefs });
}
