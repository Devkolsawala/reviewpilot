/**
 * Daily/weekly digest email template.
 * Inline CSS, system font stack, no external resources. Max width 600px,
 * single column. Plain-text alternative is also produced for accessibility
 * and deliverability.
 */

import type { DigestPayload, DigestPeriod } from "@/lib/digest/aggregate";

const NAVY = "#0F172A";
const TEAL = "#14B8A6";
const WARM_WHITE = "#FAFAF9";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";

function fmtDate(d: Date, period: DigestPeriod): string {
  if (period === "weekly") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function periodLabel(payload: DigestPayload): string {
  if (payload.period === "daily") {
    return `Daily Digest · ${fmtDate(payload.periodEnd, "daily")}`;
  }
  return `Weekly Digest · ${fmtDate(payload.periodStart, "weekly")} – ${fmtDate(payload.periodEnd, "weekly")}`;
}

function ratingBar(star: number, count: number, max: number): string {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return `
    <tr>
      <td style="padding:3px 0;font:13px ${FONT_STACK};color:${NAVY};width:24px;">${star}★</td>
      <td style="padding:3px 8px;">
        <div style="background:#F1F5F9;border-radius:4px;height:8px;width:100%;overflow:hidden;">
          <div style="background:${TEAL};height:8px;width:${pct}%;border-radius:4px;"></div>
        </div>
      </td>
      <td style="padding:3px 0;font:13px ${FONT_STACK};color:${MUTED};width:30px;text-align:right;">${count}</td>
    </tr>`;
}

function deltaBadge(delta: number | null): string {
  if (delta == null) return "";
  const positive = delta >= 0;
  const arrow = positive ? "↑" : "↓";
  const color = positive ? "#16A34A" : "#DC2626";
  return `<span style="color:${color};font-weight:600;">${arrow} ${Math.abs(delta).toFixed(1)}</span>`;
}

function buildSubject(payload: DigestPayload): string {
  if (!payload.hasActivity) {
    return payload.period === "daily"
      ? "Quiet day on ReviewPilot — no new reviews"
      : "Quiet week on ReviewPilot — no new reviews";
  }
  if (payload.period === "weekly") {
    const range = `${fmtDate(payload.periodStart, "weekly")} – ${fmtDate(payload.periodEnd, "weekly")}`;
    return `Your weekly ReviewPilot summary — ${range}`;
  }
  return `Your ReviewPilot digest — ${payload.totals.newReviews} new reviews, ${payload.totals.repliesSent} replied`;
}

function buildText(
  payload: DigestPayload,
  opts: { userName: string; appUrl: string; unsubscribeToken: string }
): string {
  const lines: string[] = [];
  lines.push(`Hi ${opts.userName},`);
  lines.push("");
  lines.push(periodLabel(payload));
  lines.push("");
  if (!payload.hasActivity) {
    lines.push("No new reviews in this period — nothing to action right now.");
  } else {
    lines.push(`New reviews: ${payload.totals.newReviews}`);
    lines.push(`Replies sent: ${payload.totals.repliesSent} (auto: ${payload.totals.repliesAuto}, manual: ${payload.totals.repliesManual})`);
    lines.push(`Pending: ${payload.totals.pendingReplies}`);
    if (payload.totals.avgRating != null) {
      const delta =
        payload.totals.avgRatingDelta != null
          ? ` (${payload.totals.avgRatingDelta >= 0 ? "+" : ""}${payload.totals.avgRatingDelta} vs prior)`
          : "";
      lines.push(`Avg rating: ${payload.totals.avgRating.toFixed(1)}★${delta}`);
    }
    if (payload.lowestRatedReview) {
      lines.push("");
      lines.push("Needs your attention:");
      lines.push(
        `  ${payload.lowestRatedReview.author} (${payload.lowestRatedReview.rating}★): "${payload.lowestRatedReview.excerpt}"`
      );
    }
    if (payload.topKeywords.length > 0) {
      lines.push("");
      lines.push(`Top keywords: ${payload.topKeywords.map((k) => k.word).join(", ")}`);
    }
    lines.push("");
    lines.push(
      `Open dashboard: ${opts.appUrl}/dashboard/analytics?range=${payload.period === "daily" ? "1d" : "7d"}`
    );
  }
  lines.push("");
  lines.push("———");
  lines.push(
    "You're receiving this because daily digest is enabled. To stop, go to Settings → Notifications in your ReviewPilot dashboard."
  );
  lines.push(`Manage notification settings: ${opts.appUrl}/dashboard/settings/notifications`);
  return lines.join("\n");
}

export function renderDailyDigest(
  payload: DigestPayload,
  opts: {
    userName: string;
    appUrl: string;
    unsubscribeToken: string;
    includeLowestRated?: boolean;
    includeTopKeywords?: boolean;
    includeQuotaUsage?: boolean;
  }
): { subject: string; html: string; text: string } {
  const subject = buildSubject(payload);
  const text = buildText(payload, opts);
  const showLowest = opts.includeLowestRated !== false && payload.lowestRatedReview;
  const showKeywords = opts.includeTopKeywords !== false && payload.topKeywords.length > 0;
  const showQuota = opts.includeQuotaUsage !== false;
  const ctaRange = payload.period === "daily" ? "1d" : "7d";
  const ctaUrl = `${opts.appUrl}/dashboard/analytics?range=${ctaRange}`;
  const maxBar = Math.max(...payload.ratingBreakdown.map((r) => r.count), 1);

  // Hero stats
  const heroStats = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 8px 0;">
      <tr>
        <td style="text-align:center;padding:12px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;width:33%;">
          <div style="font:600 24px ${FONT_STACK};color:${NAVY};">${payload.totals.newReviews}</div>
          <div style="font:11px ${FONT_STACK};color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">New Reviews</div>
        </td>
        <td style="width:8px;"></td>
        <td style="text-align:center;padding:12px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;width:33%;">
          <div style="font:600 24px ${FONT_STACK};color:${NAVY};">${payload.totals.repliesSent}</div>
          <div style="font:11px ${FONT_STACK};color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Replies Sent</div>
        </td>
        <td style="width:8px;"></td>
        <td style="text-align:center;padding:12px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;width:33%;">
          <div style="font:600 24px ${FONT_STACK};color:${NAVY};">${payload.totals.pendingReplies}</div>
          <div style="font:11px ${FONT_STACK};color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Pending</div>
        </td>
      </tr>
    </table>`;

  const avgRatingBlock =
    payload.totals.avgRating != null
      ? `
    <div style="padding:14px 16px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;margin-bottom:16px;">
      <div style="font:11px ${FONT_STACK};color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;">Average Rating</div>
      <div style="font:600 22px ${FONT_STACK};color:${NAVY};margin-top:4px;">
        ${payload.totals.avgRating.toFixed(1)} ★
        ${deltaBadge(payload.totals.avgRatingDelta) ? `<span style="font:13px ${FONT_STACK};margin-left:8px;">${deltaBadge(payload.totals.avgRatingDelta)}</span>` : ""}
      </div>
    </div>`
      : "";

  const ratingBars = `
    <div style="padding:14px 16px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;margin-bottom:16px;">
      <div style="font:11px ${FONT_STACK};color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Rating Breakdown</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${payload.ratingBreakdown
          .slice()
          .reverse()
          .map((r) => ratingBar(r.star, r.count, maxBar))
          .join("")}
      </table>
    </div>`;

  const sentTotal =
    payload.sentiment.positive + payload.sentiment.neutral + payload.sentiment.negative;
  const sentChip = (
    label: string,
    count: number,
    bg: string,
    color: string
  ): string => {
    const pct = sentTotal > 0 ? Math.round((count / sentTotal) * 100) : 0;
    return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${bg};color:${color};font:12px ${FONT_STACK};font-weight:500;margin-right:6px;">${label} ${pct}%</span>`;
  };
  const sentimentBlock =
    sentTotal > 0
      ? `
    <div style="padding:14px 16px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;margin-bottom:16px;">
      <div style="font:11px ${FONT_STACK};color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Sentiment</div>
      ${sentChip("Positive", payload.sentiment.positive, "#DCFCE7", "#166534")}
      ${sentChip("Neutral", payload.sentiment.neutral, "#F1F5F9", "#475569")}
      ${sentChip("Negative", payload.sentiment.negative, "#FEE2E2", "#991B1B")}
    </div>`
      : "";

  const lowestBlock = showLowest
    ? `
    <div style="padding:16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;margin-bottom:16px;">
      <div style="font:11px ${FONT_STACK};color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;">⚠ Needs Your Attention</div>
      <div style="font:600 14px ${FONT_STACK};color:${NAVY};">${payload.lowestRatedReview!.author} · ${payload.lowestRatedReview!.rating}★</div>
      <div style="font:14px ${FONT_STACK};color:#475569;margin:6px 0 12px 0;line-height:1.5;">${escapeHtml(payload.lowestRatedReview!.excerpt)}</div>
      <a href="${opts.appUrl}${payload.lowestRatedReview!.deepLink}" style="display:inline-block;background:${TEAL};color:#fff;font:600 13px ${FONT_STACK};padding:8px 14px;border-radius:6px;text-decoration:none;">Reply Now →</a>
    </div>`
    : "";

  const keywordsBlock = showKeywords
    ? `
    <div style="padding:14px 16px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;margin-bottom:16px;">
      <div style="font:11px ${FONT_STACK};color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Top Keywords</div>
      ${payload.topKeywords
        .map(
          (k) =>
            `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#E0F2FE;color:#075985;font:12px ${FONT_STACK};font-weight:500;margin-right:6px;margin-bottom:4px;">${escapeHtml(k.word)} · ${k.count}</span>`
        )
        .join("")}
    </div>`
    : "";

  const quotaPct =
    payload.quota.aiRepliesLimit > 0
      ? Math.min(100, Math.round((payload.quota.aiRepliesUsed / payload.quota.aiRepliesLimit) * 100))
      : 0;
  const quotaBlock = showQuota
    ? `
    <div style="padding:14px 16px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;font:12px ${FONT_STACK};color:${MUTED};margin-bottom:6px;">
        <span style="text-transform:uppercase;letter-spacing:0.5px;">AI Replies — ${payload.quota.plan}</span>
        <span>${payload.quota.aiRepliesLimit < 0 ? "Unlimited" : `${payload.quota.aiRepliesUsed}/${payload.quota.aiRepliesLimit}`}</span>
      </div>
      ${payload.quota.aiRepliesLimit > 0 ? `<div style="background:#F1F5F9;border-radius:4px;height:6px;overflow:hidden;"><div style="background:${TEAL};height:6px;width:${quotaPct}%;"></div></div>` : ""}
    </div>`
    : "";

  const quietState = !payload.hasActivity
    ? `
    <div style="padding:24px;background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;text-align:center;margin-bottom:16px;">
      <div style="font:600 16px ${FONT_STACK};color:${NAVY};">A quiet ${payload.period === "daily" ? "day" : "week"}.</div>
      <div style="font:14px ${FONT_STACK};color:${MUTED};margin-top:6px;">No new reviews to action — we'll be back when there is.</div>
    </div>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:${FONT_STACK};color:${NAVY};">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:24px 24px 8px 24px;">
              <div style="font:600 18px ${FONT_STACK};color:${NAVY};">ReviewPilot</div>
              <div style="font:13px ${FONT_STACK};color:${MUTED};margin-top:4px;">${escapeHtml(periodLabel(payload))}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px 24px;">
              <div style="font:14px ${FONT_STACK};color:${NAVY};line-height:1.5;">Hi ${escapeHtml(opts.userName)},</div>
              ${quietState}
              ${payload.hasActivity ? heroStats : ""}
              ${payload.hasActivity ? avgRatingBlock : ""}
              ${payload.hasActivity ? ratingBars : ""}
              ${payload.hasActivity ? sentimentBlock : ""}
              ${lowestBlock}
              ${keywordsBlock}
              ${quotaBlock}
              <div style="text-align:center;padding:8px 0 4px 0;">
                <a href="${ctaUrl}" style="display:inline-block;background:${NAVY};color:#fff;font:600 14px ${FONT_STACK};padding:12px 24px;border-radius:8px;text-decoration:none;">Open dashboard →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px 24px;border-top:1px solid ${BORDER};background:${WARM_WHITE};">
              <div style="font:12px ${FONT_STACK};color:${MUTED};text-align:center;line-height:1.6;">
                You&apos;re receiving this because daily digest is enabled. To stop, go to
                Settings &rarr; Notifications in your ReviewPilot dashboard.
                <div style="margin-top:8px;">
                  <a href="${opts.appUrl}/dashboard/settings/notifications" style="color:${NAVY};text-decoration:underline;font-weight:600;">Manage notification settings &rarr;</a>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
