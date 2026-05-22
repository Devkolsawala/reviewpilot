// Public Play Store scraper for the free "Review Analyzer" tool.
//
// IMPORTANT: Do NOT confuse with src/lib/google/playstore.ts. That module uses
// the authenticated Play Developer API (googleapis + service account) and only
// works on apps the customer has connected via Play Console. This module is
// for the public free tool — it scrapes the public Play Store HTML for ANY
// app id, including ones we don't own (e.g. com.swiggy.consumer). The two
// modules must remain separate.
//
// Scraping public pages is brittle (Google can change markup, Vercel IPs can
// get rate-limited). Every call here is wrapped with a hard timeout and a
// try/catch that returns null instead of throwing. Callers must treat null
// as a graceful "Try again in a few minutes" signal, never as a 500.

// Lazy-loaded because google-play-scraper@10+ ships as ESM-only (no CJS
// entry point). A top-level `import gplay from "google-play-scraper"` works
// fine for tsc and `next dev`, but Vercel bundles API routes as CommonJS and
// the resulting `require()` of an ESM-only module crashes at runtime with
// ERR_REQUIRE_ESM. Deferring to a dynamic import sidesteps the bundling
// issue entirely — Node loads the ESM module via its native loader at the
// first call, and we memoize the promise so subsequent calls are free.
let gplayModulePromise:
  | Promise<typeof import("google-play-scraper")>
  | null = null;
function loadGplay() {
  if (!gplayModulePromise) {
    gplayModulePromise = import("google-play-scraper");
  }
  return gplayModulePromise;
}

const SCRAPE_TIMEOUT_MS = 10_000;

export interface AppMetadata {
  packageId: string;
  appName: string;
  iconUrl: string;
  developer: string;
  score: number;          // 0..5
  ratingCount: number;    // total ratings
  reviewCount: number;    // total written reviews
  histogram: { "1": number; "2": number; "3": number; "4": number; "5": number };
  description: string;
  genre: string;
}

export interface PublicReview {
  id: string;
  author: string;
  rating: number;          // 1..5
  text: string;
  date: string;            // ISO 8601
  thumbsUp: number;
  replyText: string | null;
  replyDate: string | null;
  version: string | null;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`scrape_timeout:${label}:${ms}ms`)),
        ms
      )
    ),
  ]);
}

export async function getAppMetadata(
  packageId: string
): Promise<AppMetadata | null> {
  try {
    const gplay = (await loadGplay()).default;
    const data = await withTimeout(
      gplay.app({ appId: packageId, lang: "en", country: "in" }),
      SCRAPE_TIMEOUT_MS,
      "app"
    );
    const hist = data.histogram || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    return {
      packageId,
      appName: data.title || packageId,
      iconUrl: data.icon || "",
      developer: data.developer || "",
      score: typeof data.score === "number" ? data.score : 0,
      ratingCount: typeof data.ratings === "number" ? data.ratings : 0,
      reviewCount: typeof data.reviews === "number" ? data.reviews : 0,
      histogram: {
        "1": Number(hist["1"] || 0),
        "2": Number(hist["2"] || 0),
        "3": Number(hist["3"] || 0),
        "4": Number(hist["4"] || 0),
        "5": Number(hist["5"] || 0),
      },
      description: (data.description || "").slice(0, 2000),
      genre: data.genre || "",
    };
  } catch (err) {
    console.error(
      "[play-store-scraper] getAppMetadata failed",
      packageId,
      (err as Error).message
    );
    return null;
  }
}

export async function getRecentReviews(
  packageId: string,
  count = 150
): Promise<PublicReview[]> {
  try {
    const gplay = (await loadGplay()).default;
    // The package's d.ts `declare enum sort` is not exported, so
    // gplay.sort.NEWEST is invisible on the typed surface even though it
    // exists at runtime. Narrow at the callsite rather than at module level
    // (we no longer have a module-level gplay binding to attach SORT to).
    const SORT = gplay.sort as unknown as {
      NEWEST: number;
      RATING: number;
      HELPFULNESS: number;
    };
    const result = await withTimeout(
      gplay.reviews({
        appId: packageId,
        lang: "en",
        country: "in",
        sort: SORT.NEWEST,
        num: count,
      }),
      SCRAPE_TIMEOUT_MS,
      "reviews"
    );

    const items = result?.data ?? [];
    return items.map((r) => ({
      id: String(r.id ?? ""),
      author: r.userName || "Anonymous",
      rating: typeof r.score === "number" ? r.score : 0,
      text: r.text || "",
      date: r.date || new Date().toISOString(),
      thumbsUp: typeof r.thumbsUp === "number" ? r.thumbsUp : 0,
      replyText: r.replyText && r.replyText.trim().length > 0 ? r.replyText : null,
      replyDate: r.replyDate || null,
      version: r.version || null,
    }));
  } catch (err) {
    console.error(
      "[play-store-scraper] getRecentReviews failed",
      packageId,
      (err as Error).message
    );
    return [];
  }
}

// Parse a Play Store URL and return the package id, or null if the URL is not
// a recognizable Play Store app URL. Accepts:
//   https://play.google.com/store/apps/details?id=com.swiggy.consumer
//   https://play.google.com/store/apps/details?id=com.x&hl=en&gl=in
//   market://details?id=com.x
// Also accepts a bare package id (com.swiggy.consumer) for convenience.
export function parsePackageId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // Bare package id like "com.swiggy.consumer"
  if (/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(trimmed)) return trimmed;

  // URL forms — pull id= query param without constructing URL to tolerate
  // market:// scheme and tracker garbage.
  const match = trimmed.match(/[?&]id=([a-zA-Z0-9_.]+)/);
  if (match && match[1]) return match[1];

  return null;
}
