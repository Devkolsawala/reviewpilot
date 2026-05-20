// Pure helper that summarizes the current account's connection set so empty
// states across the dashboard can phrase copy that matches what the user has
// actually wired up. Single source of truth — pages call useConnections()
// themselves and pipe the result through this helper.

export type ConnectionPrimary = "app" | "business" | "mixed" | "none";

export interface ConnectionState {
  hasAnyConnection: boolean;
  hasPlayStore: boolean;
  hasGbp: boolean;
  hasWhatsapp: boolean;
  connectionCount: number;
  oldestConnectionDaysAgo: number | null;
  primarySourceLabel: ConnectionPrimary;
}

// Defensive matching: the canonical stored values today are "play_store",
// "google_business", "whatsapp" — but the codebase also passes "gbp" /
// "google_business_profile" / "app_store" / "whatsapp_business" in some
// helpers (e.g. aspectDictionaryFor). Accept all forms so a schema rename
// here doesn't quietly break empty-state branching.
const PLAY_STORE_TYPES = new Set(["play_store", "app_store"]);
const GBP_TYPES = new Set([
  "google_business",
  "gbp",
  "google_business_profile",
]);
const WHATSAPP_TYPES = new Set(["whatsapp", "whatsapp_business"]);

type ConnectionLike = {
  type?: string | null;
  created_at?: string | null;
};

const EMPTY_STATE: ConnectionState = {
  hasAnyConnection: false,
  hasPlayStore: false,
  hasGbp: false,
  hasWhatsapp: false,
  connectionCount: 0,
  oldestConnectionDaysAgo: null,
  primarySourceLabel: "none",
};

export function deriveConnectionState(
  connections: ReadonlyArray<ConnectionLike> | null | undefined
): ConnectionState {
  if (!connections || connections.length === 0) {
    return { ...EMPTY_STATE };
  }

  let hasPlayStore = false;
  let hasGbp = false;
  let hasWhatsapp = false;
  let oldestMs: number | null = null;

  for (const c of connections) {
    const t = (c.type ?? "").toLowerCase();
    if (PLAY_STORE_TYPES.has(t)) hasPlayStore = true;
    if (GBP_TYPES.has(t)) hasGbp = true;
    if (WHATSAPP_TYPES.has(t)) hasWhatsapp = true;

    if (c.created_at) {
      const t0 = new Date(c.created_at).getTime();
      if (!isNaN(t0)) {
        oldestMs = oldestMs === null ? t0 : Math.min(oldestMs, t0);
      }
    }
  }

  const oldestConnectionDaysAgo =
    oldestMs === null
      ? null
      : Math.floor((Date.now() - oldestMs) / (1000 * 60 * 60 * 24));

  // primarySourceLabel rules from the spec:
  //   only Play Store           → 'app'
  //   only GBP                  → 'business'
  //   both / +WhatsApp / mix    → 'mixed'
  //   nothing                   → 'none' (handled by the EMPTY_STATE branch)
  let primarySourceLabel: ConnectionPrimary;
  const channelCount =
    (hasPlayStore ? 1 : 0) + (hasGbp ? 1 : 0) + (hasWhatsapp ? 1 : 0);
  if (channelCount === 0) {
    primarySourceLabel = "none";
  } else if (hasWhatsapp && (hasPlayStore || hasGbp)) {
    primarySourceLabel = "mixed";
  } else if (hasPlayStore && hasGbp) {
    primarySourceLabel = "mixed";
  } else if (hasPlayStore) {
    primarySourceLabel = "app";
  } else if (hasGbp) {
    primarySourceLabel = "business";
  } else {
    // WhatsApp only — treat as mixed, since copy like "your app" or
    // "your business" doesn't fit a chat-only setup. "mixed" is the most
    // neutral copy bucket.
    primarySourceLabel = "mixed";
  }

  return {
    hasAnyConnection: true,
    hasPlayStore,
    hasGbp,
    hasWhatsapp,
    connectionCount: connections.length,
    oldestConnectionDaysAgo,
    primarySourceLabel,
  };
}

// Example aspect strings for the ABSA empty state. Mirrors the dictionaries
// in src/lib/ai/classifyReviewInsights.ts (`aspectDictionaryFor`) so the
// example list a user sees matches what the classifier could surface.
export function exampleAspectsFor(state: ConnectionState): string {
  if (state.primarySourceLabel === "app") {
    return "performance, UI, features, bugs, pricing";
  }
  if (state.primarySourceLabel === "business") {
    return "food, service, ambience, staff, wait time";
  }
  if (state.primarySourceLabel === "mixed") {
    return "service, pricing, performance, staff";
  }
  return "product, service, pricing, support";
}
