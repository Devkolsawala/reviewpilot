"use client";
import { useState, useEffect, useCallback } from "react";
import type { Review } from "@/types/review";
import type { GBPReview } from "@/types/review";
import { MOCK_REVIEWS } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

const STAR_MAP = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const;

// ── Mock state persistence via localStorage ──────────────────────────────────
// Keeps reply_status, reply_text, etc. across refetches and page refreshes
// when NEXT_PUBLIC_USE_MOCK=true. Real mode persists via Supabase instead.
const MOCK_OVERRIDES_KEY = "reviewpilot_mock_overrides";

function loadMockOverrides(): Record<string, Partial<Review>> {
  if (typeof window === "undefined") return {};
  try {
    const s = window.localStorage.getItem(MOCK_OVERRIDES_KEY);
    return s ? (JSON.parse(s) as Record<string, Partial<Review>>) : {};
  } catch {
    return {};
  }
}

function saveMockOverride(reviewId: string, updates: Partial<Review>): void {
  if (typeof window === "undefined") return;
  try {
    const overrides = loadMockOverrides();
    overrides[reviewId] = { ...overrides[reviewId], ...updates };
    window.localStorage.setItem(MOCK_OVERRIDES_KEY, JSON.stringify(overrides));
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
    sentiment:
      rating >= 4 ? "positive" : rating <= 2 ? "negative" : "mixed",
    keywords: [],
    is_read: gbp.reviewReply !== null,
    review_created_at: gbp.createTime,
  };
}

async function buildMockReviews(): Promise<Review[]> {
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
  // Apply persisted overrides (reply_status, reply_text, etc.) so that
  // user actions (publish, draft) survive refetches and full page refreshes.
  const overrides = loadMockOverrides();
  const hasOverrides = Object.keys(overrides).length > 0;
  if (!hasOverrides) return combined;
  return combined.map((r) => (overrides[r.id] ? { ...r, ...overrides[r.id] } : r));
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(
    null
  );

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Fast-path: env var forces mock mode (no Supabase round-trip)
      if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
        const mock = await buildMockReviews();
        setReviews(mock);
        setIsMock(true);
        setActiveConnectionId(null);
        console.log(
          "[HOOK] Fetched reviews from Supabase:",
          mock.length,
          "isMock:",
          true
        );
        return;
      }

      const supabase = createClient();

      const { data: connections } = await supabase
        .from("connections")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (!connections || connections.length === 0) {
        // No connections — fall back to original 20-review mock
        setReviews(MOCK_REVIEWS);
        setIsMock(true);
        setActiveConnectionId(null);
        console.log(
          "[HOOK] Fetched reviews from Supabase:",
          MOCK_REVIEWS.length,
          "isMock:",
          true
        );
        return;
      }

      const connId = connections[0].id;
      setActiveConnectionId(connId);

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("review_created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      if (!data || data.length === 0) {
        setReviews([]);
        setIsMock(false);
        console.log("[HOOK] Fetched reviews from Supabase: 0 isMock:", false);
      } else {
        setReviews(data as Review[]);
        setIsMock(false);
        console.log(
          "[HOOK] Fetched reviews from Supabase:",
          data.length,
          "isMock:",
          false
        );
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
      // Mock mode: persist to localStorage so status survives refetches and page refreshes
      saveMockOverride(reviewId, updates);
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
