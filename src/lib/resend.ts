export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; id?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[STUB] Email would be sent to ${params.to}`);
    console.log(`[STUB] Subject: ${params.subject}`);
    console.log(`[STUB] Body: ${params.html.substring(0, 200)}...`);
    console.log("[STUB] Set RESEND_API_KEY to enable real email sending");
    return { success: true, id: `stub-${Date.now()}` };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: params.from || "ReviewPilot <noreply@reviewpilot.com>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("[Resend Error]", data);
    return { success: false };
  }
  return { success: true, id: data.id };
}
