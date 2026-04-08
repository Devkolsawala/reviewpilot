"use client";
import { useState, useEffect, useCallback } from "react";
import type { Review } from "@/types/review";
import type { GBPReview } from "@/types/review";
import { MOCK_REVIEWS } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

const STAR_MAP = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const;

// ── Mock state persistence via localStorage ──────────────────────────────────
// Keyed by user ID so different accounts don't share published state.
const MOCK_OVERRIDES_PREFIX = "reviewpilot_mock_overrides";

function getMockKey(userId: string): string {
  return `${MOCK_OVERRIDES_PREFIX}_${userId}`;
}

function loadMockOverrides(key: string): Record<string, Partial<Review>> {
  if (typeof window === "undefined") return {};
  try {
    const s = window.localStorage.getItem(key);
    return s ? (JSON.parse(s) as Record<string, Partial<Review>>) : {};
  } catch {
    return {};
  }
}

function saveMockOverride(key: string, reviewId: string, updates: Partial<Review>): void {
  if (typeof window === "undefined") return;
  try {
    const overrides = loadMockOverrides(key);
    overrides[reviewId] = { ...overrides[reviewId], ...updates };
    window.localStorage.setItem(key, JSON.stringify(overrides));
  } catch {
    // ignore (e.g. private-browsing quota exceeded)
  }
}

function gbpToReview(gbp: GBPReview, idx: number): Review {
  const rating = STAR_MAP[gbp.starRating];
  return {
    id: `gbp-mock-${idx}`,
    source: "google_business",
    external_review_id: gbp.reviewId,
    author_name: gbp.reviewer.displayName,
    rating,
    review_text: gbp.comment,
    review_language: "en",
    reply_status: gbp.reviewReply ? "published" : "pending",
    reply_text: gbp.reviewReply?.comment ?? undefined,
    sentiment: rating >= 4 ? "positive" : rating <= 2 ? "negative" : "mixed",
    keywords: [],
    is_read: gbp.reviewReply !== null,
    review_created_at: gbp.createTime,
  };
}

async function buildMockReviews(overridesKey: string): Promise<Review[]> {
  const [{ mockPlayReviews }, { mockGBPReviews }] = await Promise.all([
    import("@/lib/mock/mock-reviews"),
    import("@/lib/mock/mock-gbp-reviews"),
  ]);
  const gbpAsReviews = mockGBPReviews.map(gbpToReview);
  const combined = [...mockPlayReviews, ...gbpAsReviews];
  combined.sort(
    (a, b) =>
      new Date(b.review_created_at).getTime() -
      new Date(a.review_created_at).getTime()
  );
  // Apply per-user persisted overrides so actions survive refetches and page refreshes.
  const overrides = loadMockOverrides(overridesKey);
  const hasOverrides = Object.keys(overrides).length > 0;
  if (!hasOverrides) return combined;
  return combined.map((r) => (overrides[r.id] ? { ...r, ...overrides[r.id] } : r));
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [mockKey, setMockKey] = useState<string>(getMockKey("anon"));

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Fast-path: env var forces mock mode (no Supabase round-trip)
      if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
        // Get user ID to namespace localStorage so accounts don't share state
        let userId = "anon";
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id ?? "anon";
        } catch { /* stay anonymous */ }
        const key = getMockKey(userId);
        setMockKey(key);

        const mock = await buildMockReviews(key);
        setReviews(mock);
        setIsMock(true);
        setActiveConnectionId(null);
        console.log("[HOOK] Fetched reviews from Supabase:", mock.length, "isMock:", true);
        return;
      }

      const supabase = createClient();

      // Check auth first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log("[useReviews] No authenticated user — showing mock data");
        setReviews(MOCK_REVIEWS);
        setIsMock(true);
        setActiveConnectionId(null);
        return;
      }
      console.log("[useReviews] User:", user.id);

      const { data: connections, error: connError } = await supabase
        .from("connections")
        .select("id")
        .eq("is_active", true);

      console.log("[useReviews] Active connections found:", connections?.length ?? 0, connError ? `(error: ${connError.message})` : "");

      if (connError || !connections || connections.length === 0) {
        setReviews(MOCK_REVIEWS);
        setIsMock(true);
        setActiveConnectionId(null);
        console.log("[useReviews] No connections — showing mock data");
        return;
      }

      const connId = connections[0].id;
      setActiveConnectionId(connId);

      const connectionIds = connections.map((c) => c.id);
      console.log("[useReviews] Fetching reviews for connection IDs:", connectionIds);

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .in("connection_id", connectionIds)
        .order("review_created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[useReviews] Reviews query error:", error.message);
        throw error;
      }

      console.log("[useReviews] Reviews from Supabase:", data?.length ?? 0);

      if (!data || data.length === 0) {
        setReviews([]);
        setIsMock(false);
        console.log("[useReviews] Connections exist but 0 reviews — showing empty state (isMock: false)");
      } else {
        setReviews(data as Review[]);
        setIsMock(false);
        console.log("[useReviews] Showing REAL data:", data.length, "reviews (isMock: false)");
      }
    } catch (error) {
      console.error("[useReviews] Error:", error);
      setReviews([]);
      setIsMock(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function updateReview(reviewId: string, updates: Partial<Review>) {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, ...updates } : r))
    );

    if (!isMock) {
      const payload: Record<string, unknown> = {};
      if (updates.reply_text !== undefined) payload.reply_text = updates.reply_text;
      if (updates.reply_status !== undefined) payload.reply_status = updates.reply_status;
      if (updates.is_read !== undefined) payload.is_read = updates.is_read;
      if (updates.reply_published_at !== undefined)
        payload.reply_published_at = updates.reply_published_at;
      if (Object.keys(payload).length === 0) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", reviewId)
        .select("id")
        .single();
      if (error) {
        console.error("[HOOK] Supabase review update failed:", error.message, payload);
      } else {
        console.log("[HOOK] Supabase review updated:", data?.id, payload);
      }
    } else {
      // Mock mode: persist to per-user localStorage key
      saveMockOverride(mockKey, reviewId, updates);
      console.log("[HOOK] Mock review override saved to localStorage:", reviewId, updates);
    }
  }

  return {
    reviews,
    loading,
    isMock,
    activeConnectionId,
    refetch: fetchReviews,
    updateReview,
  };
}
