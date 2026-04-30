export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string[];
  replyTo?: string;
  /**
   * Custom email headers (e.g. List-Unsubscribe / List-Unsubscribe-Post for
   * RFC 8058 one-click unsubscribe). Resend forwards these to the recipient.
   */
  headers?: Record<string, string>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[STUB] Email would be sent to ${params.to}`);
    if (params.cc?.length) console.log(`[STUB] CC: ${params.cc.join(", ")}`);
    console.log(`[STUB] Subject: ${params.subject}`);
    console.log(`[STUB] Body: ${params.html.substring(0, 200)}...`);
    if (params.headers) {
      console.log(`[STUB] Headers: ${JSON.stringify(params.headers)}`);
    }
    console.log("[STUB] Set RESEND_API_KEY to enable real email sending");
    return { success: true, id: `stub-${Date.now()}` };
  }

  const body: Record<string, unknown> = {
    from: params.from || process.env.RESEND_FROM_EMAIL || "ReviewPilot <onboarding@resend.dev>",
    to: params.to,
    subject: params.subject,
    html: params.html,
  };
  if (params.text) body.text = params.text;
  if (params.cc && params.cc.length > 0) body.cc = params.cc;
  if (params.replyTo) body.reply_to = params.replyTo;
  if (params.headers && Object.keys(params.headers).length > 0) {
    body.headers = params.headers;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("[Resend Error] status:", response.status, "body:", JSON.stringify(data));
    return { success: false, error: data?.message || `HTTP ${response.status}` };
  }
  console.log("[Resend] Email sent successfully, id:", data.id);
  return { success: true, id: data.id };
}
