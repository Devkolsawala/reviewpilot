/**
 * Phase 2 — AI executive summary for the weekly digest.
 *
 * Generates a 2–3 sentence "Chief of Staff" briefing + one recommended action
 * from a structured metrics payload. Used at the top of the weekly digest
 * email. Daily digest is NOT touched.
 *
 * Behavior:
 *  - Feature-flagged off by default (DIGEST_EXECUTIVE_SUMMARY_ENABLED=true).
 *  - Mock mode (NEXT_PUBLIC_USE_MOCK=true) returns canned content so the
 *    test-send button works without xAI credits.
 *  - On any error or parse failure returns null — the digest must still
 *    send without the section.
 *  - 15-second hard timeout via the OpenAI SDK's per-request `timeout` option.
 */

import { getXaiClient, getInsightsModel } from "./xai-client";
import { retryWithBackoff } from "./rate-limiter";

export interface ExecutiveSummaryMetrics {
  totalReviews: number;
  totalReviewsPrev: number;
  avgRating: number;
  avgRatingPrev: number;
  responseRate: number;
  responseRatePrev: number;
  topThemes: { theme: string; count: number; sentiment: string; trend: number }[];
  criticalCount: number;
  topNegativeAspect: { aspect: string; net: number } | null;
  topPositiveAspect: { aspect: string; net: number } | null;
}

export interface ExecutiveSummaryInput {
  userId: string;
  period: "daily" | "weekly";
  metrics: ExecutiveSummaryMetrics;
}

export interface ExecutiveSummary {
  summary: string;
  topAction: string;
}

const CALL_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are an executive analyst for ReviewPilot, an AI review-management product for Indian businesses. Given a customer's review metrics for the past period, produce a concise executive summary and one recommended action.

The summary must be 2–3 sentences, plain English, no markdown, no jargon, no bullet points. State what happened (review volume, rating direction), what drove it (the dominant theme or aspect), and what's notable (critical issues, surges, wins). Lead with the most important fact for the business owner. Match the tone of a smart Chief of Staff briefing a founder over morning coffee — direct, specific, no fluff.

The topAction must be one sentence describing the single most impactful thing the owner could do in the next 7 days. Be specific. Examples: "Ship a hotfix for the camera crash bug — 12 negative reviews mention it.", "Reply to the 3 critical reviews flagged in red — refund disputes are escalating.", "Pin the dark-mode-coming reply across the 8 feature-request reviews to set expectations."

Return STRICT JSON: {"summary":"...","topAction":"..."} — no preamble, no markdown.`;

const MOCK_RESULT: ExecutiveSummary = {
  summary:
    "You received 47 reviews this week, up 8% from last week. Average rating held at 4.1★ with camera-crash complaints continuing to drag the score down. Three critical issues were flagged and need attention.",
  topAction:
    "Reply to the 3 critical-urgency reviews flagged in red before the end of the day.",
};

function buildUserMessage(input: ExecutiveSummaryInput): string {
  const m = input.metrics;
  const lines: string[] = [];
  lines.push(`Period: ${input.period}`);
  lines.push(
    `New reviews: ${m.totalReviews} (previous period: ${m.totalReviewsPrev})`
  );
  lines.push(
    `Average rating: ${m.avgRating.toFixed(1)}★ (previous: ${m.avgRatingPrev.toFixed(1)}★)`
  );
  lines.push(
    `Response rate: ${m.responseRate}% (previous: ${m.responseRatePrev}%)`
  );
  lines.push(`Critical issues flagged: ${m.criticalCount}`);
  if (m.topThemes.length > 0) {
    lines.push("Top themes:");
    for (const t of m.topThemes.slice(0, 5)) {
      const trendStr =
        t.trend > 0 ? `+${t.trend}%` : t.trend < 0 ? `${t.trend}%` : "flat";
      lines.push(`  - "${t.theme}" × ${t.count} (${t.sentiment}, ${trendStr})`);
    }
  }
  if (m.topNegativeAspect) {
    lines.push(
      `Worst aspect: ${m.topNegativeAspect.aspect} (net ${m.topNegativeAspect.net})`
    );
  }
  if (m.topPositiveAspect) {
    lines.push(
      `Best aspect: ${m.topPositiveAspect.aspect} (net +${m.topPositiveAspect.net})`
    );
  }
  return lines.join("\n");
}

function tryParse(raw: string): ExecutiveSummary | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (!obj || typeof obj !== "object") return null;
    const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
    const topAction =
      typeof obj.topAction === "string" ? obj.topAction.trim() : "";
    if (!summary || !topAction) return null;
    return { summary, topAction };
  } catch {
    return null;
  }
}

export async function generateExecutiveSummary(
  input: ExecutiveSummaryInput
): Promise<ExecutiveSummary | null> {
  // Flag default OFF — code ships dark.
  const enabled = process.env.DIGEST_EXECUTIVE_SUMMARY_ENABLED === "true";
  if (!enabled) return null;

  // Mock mode short-circuit — canned content so test sends work without xAI.
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return MOCK_RESULT;
  }

  const client = getXaiClient();
  if (!client) {
    console.warn(
      "[generateExecutiveSummary] No XAI_API_KEY — returning null"
    );
    return null;
  }

  const userMessage = buildUserMessage(input);
  const model = getInsightsModel();

  try {
    const completion = await retryWithBackoff(
      () =>
        client.chat.completions.create(
          {
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userMessage },
            ],
            reasoning_effort: "low",
            max_completion_tokens: 280,
          },
          { timeout: CALL_TIMEOUT_MS }
        ),
      "generateExecutiveSummary"
    );
    const raw = completion.choices[0]?.message?.content?.trim() || "";
    return tryParse(raw);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; name?: string };
    console.error(
      "[generateExecutiveSummary] xAI error:",
      e.status,
      e.name,
      e.message
    );
    return null;
  }
}
