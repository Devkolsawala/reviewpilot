/**
 * Pre-flight wizard summary email.
 *
 * Sent only if the user opted-in to the "(Optional) Email me a summary"
 * checkbox in Step 4 of the WhatsApp pre-flight wizard. The email is a
 * record of the warnings they acknowledged before kicking off the
 * Embedded Signup / manual connection flow — handy if they have second
 * thoughts later or want to share the implications with a colleague.
 *
 * Inline CSS, max-width 600px, system font stack. Matches the existing
 * dailyDigest template so the brand voice stays consistent across all
 * transactional mail.
 */

export type PreflightScenario = "A" | "B" | "C" | "D";

const SCENARIO_HUMAN: Record<PreflightScenario, string> = {
  A: "WhatsApp Business app user — same phone number, switching message routing to ReviewPilot",
  B: "Personal WhatsApp user — converting this number to a Business number",
  C: "Fresh business number — not currently on any WhatsApp app",
  D: "Unsure / something else — proceeded with personal-WhatsApp treatment",
};

const SCENARIO_WARNINGS: Record<PreflightScenario, string[]> = {
  A: [
    "WhatsApp Business app on this number will stop receiving NEW messages — incoming messages route to ReviewPilot instead.",
    "All previously linked devices (WhatsApp Web, linked phones) will be unlinked.",
    "Broadcast lists become read-only.",
    "Group chats won't sync to ReviewPilot.",
    "WhatsApp Status updates won't sync.",
    "Message editing / revoke gets disabled.",
  ],
  B: [
    "Personal WhatsApp on this number will stop working.",
    "Chat history in the WhatsApp app is no longer accessible from the phone (data stays on Meta's servers).",
    "Reversing this requires a 7-day cooldown period.",
    "Family and friends messaging this number will reach the business inbox in ReviewPilot.",
  ],
  C: [
    "No data migration required — the number isn't on any WhatsApp app yet.",
    "Verify the number via SMS or voice call during the connection step.",
    "All future customer messages flow into ReviewPilot from connection moment onward.",
  ],
  D: [
    "Treated as a personal-WhatsApp connection — same risks as Scenario B apply.",
    "Personal WhatsApp on this number will stop working.",
    "Chat history in the WhatsApp app is no longer accessible from the phone.",
    "Reversing this requires a 7-day cooldown period.",
  ],
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";

const NAVY = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const ACCENT = "#6366F1"; // brand indigo
const SUPPORT_EMAIL = "dev@reviewpilot.co.in";

export interface PreflightSummaryInput {
  recipientName: string;
  recipientEmail: string;
  scenario: PreflightScenario;
}

export interface PreflightSummaryEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildPreflightSummaryEmail(
  input: PreflightSummaryInput
): PreflightSummaryEmail {
  const { recipientName, scenario } = input;
  const scenarioLabel = SCENARIO_HUMAN[scenario];
  const warnings = SCENARIO_WARNINGS[scenario];

  const subject = "Your ReviewPilot WhatsApp connection summary";

  const warningsHtml = warnings
    .map(
      (w) =>
        `<li style="margin:0 0 8px 0;padding:0 0 0 4px;font:14px ${FONT_STACK};color:${NAVY};line-height:1.55;">${escapeHtml(
          w
        )}</li>`
    )
    .join("");

  const warningsText = warnings.map((w) => `  • ${w}`).join("\n");

  const greeting = recipientName
    ? `Hi ${escapeHtml(recipientName.split(/[\s@]/)[0] || recipientName)},`
    : "Hi,";

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F8FAFC;font:14px ${FONT_STACK};color:${NAVY};">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#F8FAFC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid ${BORDER};">
                <div style="font:600 18px ${FONT_STACK};color:${NAVY};letter-spacing:-0.01em;">
                  ReviewPilot
                </div>
                <div style="font:500 13px ${FONT_STACK};color:${MUTED};margin-top:2px;">
                  WhatsApp connection summary
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px 0;font:14px ${FONT_STACK};color:${NAVY};line-height:1.6;">
                  ${greeting}
                </p>
                <p style="margin:0 0 20px 0;font:14px ${FONT_STACK};color:${NAVY};line-height:1.6;">
                  You completed the ReviewPilot pre-flight wizard for connecting
                  your WhatsApp number. Here's a record of what you agreed to,
                  for your reference before you finish the connection.
                </p>

                <div style="margin:0 0 22px 0;padding:14px 16px;background:#F1F5F9;border-left:3px solid ${ACCENT};border-radius:6px;">
                  <div style="font:600 12px ${FONT_STACK};color:${MUTED};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">
                    Your selected scenario
                  </div>
                  <div style="font:500 14px ${FONT_STACK};color:${NAVY};line-height:1.55;">
                    ${escapeHtml(scenarioLabel)}
                  </div>
                </div>

                <h2 style="margin:0 0 12px 0;font:600 15px ${FONT_STACK};color:${NAVY};">
                  What you agreed to
                </h2>
                <ul style="margin:0 0 24px 0;padding-left:18px;">
                  ${warningsHtml}
                </ul>

                <h2 style="margin:0 0 12px 0;font:600 15px ${FONT_STACK};color:${NAVY};">
                  What to expect after connecting
                </h2>
                <p style="margin:0 0 16px 0;font:14px ${FONT_STACK};color:${NAVY};line-height:1.6;">
                  ReviewPilot will only see messages from the moment you
                  finish the connection. Conversations and customer messages
                  from before that point are not retrievable through
                  ReviewPilot — they remain on Meta's servers and your
                  phone, but won't appear in your dashboard inbox.
                </p>
                <p style="margin:0 0 24px 0;font:14px ${FONT_STACK};color:${NAVY};line-height:1.6;">
                  From the moment you connect, every incoming message is
                  saved to ReviewPilot permanently — we'll generate AI draft
                  replies in your tone and you can review or auto-publish
                  them from the inbox.
                </p>

                <div style="margin:24px 0 0 0;padding-top:20px;border-top:1px solid ${BORDER};">
                  <p style="margin:0 0 8px 0;font:13px ${FONT_STACK};color:${MUTED};line-height:1.55;">
                    <strong style="color:${NAVY};">Need help?</strong> Reply to
                    this email if you have questions before connecting — it
                    goes straight to ${SUPPORT_EMAIL}.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#FAFAF9;border-top:1px solid ${BORDER};">
                <p style="margin:0;font:12px ${FONT_STACK};color:${MUTED};line-height:1.5;">
                  Sent by ReviewPilot · You received this because you ticked
                  "Email me a summary" in the WhatsApp connection wizard.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    `ReviewPilot — WhatsApp connection summary`,
    ``,
    greeting.replace(/<[^>]+>/g, ""),
    ``,
    `You completed the ReviewPilot pre-flight wizard for connecting your`,
    `WhatsApp number. Here's a record of what you agreed to.`,
    ``,
    `YOUR SELECTED SCENARIO`,
    `  ${scenarioLabel}`,
    ``,
    `WHAT YOU AGREED TO`,
    warningsText,
    ``,
    `WHAT TO EXPECT AFTER CONNECTING`,
    `  ReviewPilot only sees messages from the moment you finish the`,
    `  connection. Older conversations remain on Meta's servers and your`,
    `  phone but will not appear in your ReviewPilot inbox.`,
    ``,
    `Need help? Reply to this email — it reaches ${SUPPORT_EMAIL}.`,
  ].join("\n");

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
