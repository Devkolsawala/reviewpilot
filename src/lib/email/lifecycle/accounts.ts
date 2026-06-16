/**
 * Account index for the lifecycle engine.
 *
 * profiles has no email column — emails live in auth.users. We build one
 * per-run index by paginating auth.admin.listUsers and joining to profiles by
 * id. From it we derive:
 *   - free-user candidates (plan='free', not a team-member seat);
 *   - the set of registered emails (for cross-audience dedup of leads);
 *   - per-email account lookup (for the live paid re-check).
 *
 * Plus bulk state fetchers (connections / activity) for the state-aware free
 * flow, fetched in two queries rather than per-user.
 *
 * NOTE (scale): listUsers pagination is fine at the current user count. If the
 * base grows large, replace with an indexed email lookup (e.g. a profiles.email
 * mirror or an RPC) — this module is the single place to change.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "./unsubscribe-token";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface Account {
  id: string;
  email: string; // normalized
  plan: string;
  ownerId: string | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  onboardingCompleted: boolean;
}

export interface AccountIndex {
  accounts: Account[];
  byEmail: Map<string, Account>;
  registeredEmails: Set<string>;
  /** True if plan resolves to active-paid (own plan paid, or seat of a paid owner). */
  isPaidEmail: (email: string) => boolean;
}

const PER_PAGE = 1000;

async function listAllAuthEmails(
  admin: AdminClient
): Promise<Map<string, string>> {
  const idToEmail = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) {
      console.error("[lifecycle] listUsers failed", error.message);
      break;
    }
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email) idToEmail.set(u.id, normalizeEmail(u.email));
    }
    if (users.length < PER_PAGE) break;
  }
  return idToEmail;
}

export async function buildAccountIndex(
  admin: AdminClient
): Promise<AccountIndex> {
  const [{ data: profiles }, idToEmail] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, plan, owner_id, trial_ends_at, created_at, onboarding_completed"
      ),
    listAllAuthEmails(admin),
  ]);

  const accounts: Account[] = [];
  const byId = new Map<string, Account>();
  const byEmail = new Map<string, Account>();

  for (const p of profiles ?? []) {
    const email = idToEmail.get(p.id as string);
    if (!email) continue; // no auth email → can't mail; skip
    const acct: Account = {
      id: p.id as string,
      email,
      plan: (p.plan as string) ?? "free",
      ownerId: (p.owner_id as string | null) ?? null,
      trialEndsAt: p.trial_ends_at ? new Date(p.trial_ends_at as string) : null,
      createdAt: p.created_at ? new Date(p.created_at as string) : new Date(0),
      onboardingCompleted: !!p.onboarding_completed,
    };
    accounts.push(acct);
    byId.set(acct.id, acct);
    // First write wins; duplicate emails across profiles shouldn't happen.
    if (!byEmail.has(email)) byEmail.set(email, acct);
  }

  const registeredEmails = new Set(byEmail.keys());

  const isPaidEmail = (rawEmail: string): boolean => {
    const acct = byEmail.get(normalizeEmail(rawEmail));
    if (!acct) return false;
    if (acct.plan !== "free") return true;
    // Team-member seat: resolve to the owner's plan.
    if (acct.ownerId) {
      const owner = byId.get(acct.ownerId);
      if (owner && owner.plan !== "free") return true;
    }
    return false;
  };

  return { accounts, byEmail, registeredEmails, isPaidEmail };
}

/**
 * Bulk-fetch the two activation signals for a set of free user_ids:
 *   - hasConnection: an active Play Store connection exists;
 *   - hasActivity:   at least one AI reply has been used.
 * Returns two sets of user_ids.
 */
export async function fetchFreeUserState(
  admin: AdminClient,
  userIds: string[]
): Promise<{ connected: Set<string>; active: Set<string> }> {
  const connected = new Set<string>();
  const active = new Set<string>();
  if (userIds.length === 0) return { connected, active };

  const [{ data: conns }, { data: usageRows }] = await Promise.all([
    admin
      .from("connections")
      .select("user_id")
      .eq("type", "play_store")
      .eq("is_active", true)
      .in("user_id", userIds),
    admin
      .from("usage")
      .select("user_id, ai_replies_used")
      .in("user_id", userIds)
      .gt("ai_replies_used", 0),
  ]);

  for (const c of conns ?? []) connected.add(c.user_id as string);
  for (const u of usageRows ?? []) active.add(u.user_id as string);
  return { connected, active };
}
