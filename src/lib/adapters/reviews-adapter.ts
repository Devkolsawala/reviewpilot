/**
 * Unified adapter for review data.
 *
 * Set NEXT_PUBLIC_USE_MOCK=true  → returns mock data with artificial delay
 * Set NEXT_PUBLIC_USE_MOCK=false → logs a stub and expects live Google API implementation
 *
 * Switching to live mode: change the single env var and implement the Google API
 * calls in the LIVE sections below.
 */

import type { Review, GBPReview } from "@/types/review";
import type { MockAnalytics } from "@/lib/mock/mock-analytics";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const MOCK_DELAY = Number(process.env.MOCK_DELAY_MS ?? 500);

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Play Store reviews ──────────────────────────────────────────────────────

export async function getPlayReviews(
  packageName: string,
  options: { maxResults?: number; pageToken?: string } = {}
): Promise<Review[]> {
  if (USE_MOCK) {
    await delay(MOCK_DELAY);
    const { mockPlayReviews } = await import("@/lib/mock/mock-reviews");
    const results = options.maxResults
      ? mockPlayReviews.slice(0, options.maxResults)
      : mockPlayReviews;
    console.log(`[MOCK] getPlayReviews(${packageName}) → ${results.length} reviews`);
    return results;
  }

  // LIVE: call Google Play Developer API v3
  console.log("[LIVE] Calling Google Play Developer API reviews.list...", { packageName, options });
  // TODO: implement with googleapis
  // const auth = new google.auth.GoogleAuth({ ... });
  // const androidPublisher = google.androidpublisher({ version: "v3", auth });
  // const res = await androidPublisher.reviews.list({ packageName, maxResults: options.maxResults ?? 100 });
  // return res.data.reviews?.map(adaptPlayReview) ?? [];
  return [];
}

// ─── Google Business Profile reviews ────────────────────────────────────────

export async function getGBPReviews(locationId: string): Promise<GBPReview[]> {
  if (USE_MOCK) {
    await delay(MOCK_DELAY);
    const { mockGBPReviews } = await import("@/lib/mock/mock-gbp-reviews");
    console.log(`[MOCK] getGBPReviews(${locationId}) → ${mockGBPReviews.length} reviews`);
    return mockGBPReviews;
  }

  // LIVE: call Google My Business API v4
  console.log("[LIVE] Calling Google My Business API reviews.list...", { locationId });
  // TODO: implement with Google OAuth2 credentials
  // const res = await fetch(`https://mybusiness.googleapis.com/v4/${locationId}/reviews`, { headers: { Authorization: `Bearer ${token}` } });
  // return await res.json();
  return [];
}

// ─── Post reply: Play Store ──────────────────────────────────────────────────

export async function postPlayReply(
  reviewId: string,
  packageName: string,
  replyText: string
): Promise<boolean> {
  if (USE_MOCK) {
    await delay(800);
    console.log(`[MOCK] Play Store reply would be posted to review ${reviewId} (${packageName}):`);
    console.log(`       "${replyText}"`);
    return true;
  }

  // LIVE: call Play Developer API reviews.reply
  console.log("[LIVE] Posting Play Store reply...", { reviewId, packageName });
  // TODO: await androidPublisher.reviews.reply({ packageName, reviewId, requestBody: { replyText } });
  return false;
}

// ─── Post reply: GBP ────────────────────────────────────────────────────────

export async function postGBPReply(
  reviewName: string,
  replyText: string
): Promise<boolean> {
  if (USE_MOCK) {
    await delay(800);
    console.log(`[MOCK] GBP reply would be posted to ${reviewName}:`);
    console.log(`       "${replyText}"`);
    return true;
  }

  // LIVE: call GBP API updateReply
  console.log("[LIVE] Posting GBP reply...", { reviewName });
  // TODO: await fetch(`https://mybusiness.googleapis.com/v4/${reviewName}/reply`, { method: "PUT", body: JSON.stringify({ comment: replyText }), headers: { Authorization: `Bearer ${token}` } });
  return false;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getAnalytics(): Promise<MockAnalytics> {
  if (USE_MOCK) {
    await delay(MOCK_DELAY);
    const { mockAnalytics } = await import("@/lib/mock/mock-analytics");
    console.log("[MOCK] getAnalytics() → mock analytics data");
    return mockAnalytics;
  }

  // LIVE: aggregate from Supabase reviews table
  console.log("[LIVE] Fetching analytics from Supabase...");
  // TODO: query supabase, compute aggregations, return real analytics object
  const { mockAnalytics } = await import("@/lib/mock/mock-analytics");
  return mockAnalytics;
}
