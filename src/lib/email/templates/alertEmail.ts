/**
 * Instant negative-review alert email template.
 * Mirrors the daily digest template's visual language: inline CSS, system
 * font stack, no external resources, max width 600px, single column, with a
 * plain-text alternative.
 */

const NAVY = "#0F172A";
const TEAL = "#14B8A6";
const WARM_WHITE = "#FAFAF9";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const RED = "#DC2626";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";

export interface AlertEmailInput {
  appName: string;
  rating: number | null;
  stars: string;
  authorName: string | null;
  excerpt: string;
  aiSentiment: string;
  aiUrgency: string | null;
  matchedKeyword: string | null;
  reviewUrl: string;
  settingsUrl: string;
  unsubscribeUrl: string;
  /** Appended when this is the last email allowed by the daily cap. */
  capNote: string | null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderAlertEmail(input: AlertEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const ratingLabel = typeof input.rating === "number" ? `${input.rating}★` : "negative";
  const subject = `⚠ New ${ratingLabel} review on ${input.appName} needs attention`;

  const aiLine = input.aiUrgency
    ? `AI verdict: ${input.aiSentiment} sentiment · ${input.aiUrgency} urgency`
    : `AI verdict: ${input.aiSentiment} sentiment`;
  const kwLine = input.matchedKeyword
    ? `Matched your keyword: “${input.matchedKeyword}”`
    : null;
  const author = input.authorName || "A customer";

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${WARM_WHITE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WARM_WHITE};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:${NAVY};padding:18px 24px;">
            <span style="font:600 15px ${FONT_STACK};color:#FFFFFF;">ReviewPilot</span>
            <span style="font:12px ${FONT_STACK};color:#94A3B8;float:right;padding-top:2px;">Instant alert</span>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 4px;font:600 16px ${FONT_STACK};color:${NAVY};">
              New ${escapeHtml(ratingLabel)} review on ${escapeHtml(input.appName)}
            </p>
            <p style="margin:0 0 16px;font:14px ${FONT_STACK};color:${RED};letter-spacing:2px;">${escapeHtml(input.stars)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WARM_WHITE};border:1px solid ${BORDER};border-radius:8px;">
              <tr><td style="padding:14px 16px;">
                <p style="margin:0 0 6px;font:600 13px ${FONT_STACK};color:${NAVY};">${escapeHtml(author)}</p>
                <p style="margin:0;font:14px/1.5 ${FONT_STACK};color:${NAVY};">&ldquo;${escapeHtml(input.excerpt) || "(no review text)"}&rdquo;</p>
              </td></tr>
            </table>
            <p style="margin:14px 0 0;font:13px ${FONT_STACK};color:${MUTED};">${escapeHtml(aiLine)}</p>
            ${kwLine ? `<p style="margin:4px 0 0;font:13px ${FONT_STACK};color:${MUTED};">${escapeHtml(kwLine)}</p>` : ""}
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">
              <tr><td style="background:${TEAL};border-radius:8px;">
                <a href="${input.reviewUrl}" style="display:inline-block;padding:11px 22px;font:600 14px ${FONT_STACK};color:#FFFFFF;text-decoration:none;">Reply now</a>
              </td></tr>
            </table>
            ${input.capNote ? `<p style="margin:18px 0 0;font:12px ${FONT_STACK};color:${MUTED};">${escapeHtml(input.capNote)}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-top:1px solid ${BORDER};">
            <p style="margin:0;font:11px/1.6 ${FONT_STACK};color:${MUTED};">
              You're receiving this because instant alerts are enabled for your workspace.
              <a href="${input.settingsUrl}" style="color:${MUTED};">Manage alert settings</a> ·
              <a href="${input.unsubscribeUrl}" style="color:${MUTED};">Unsubscribe from alerts</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textLines = [
    `New ${ratingLabel} review on ${input.appName}`,
    input.stars,
    "",
    `${author}: "${input.excerpt || "(no review text)"}"`,
    "",
    aiLine,
    ...(kwLine ? [kwLine] : []),
    "",
    `Reply now: ${input.reviewUrl}`,
    ...(input.capNote ? ["", input.capNote] : []),
    "",
    "———",
    `Manage alert settings: ${input.settingsUrl}`,
    `Unsubscribe from alerts: ${input.unsubscribeUrl}`,
  ];

  return { subject, html, text: textLines.join("\n") };
}
