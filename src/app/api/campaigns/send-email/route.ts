import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, message, recipients } = await request.json();

  if (!recipients || recipients.length === 0) {
    return NextResponse.json({ error: "No recipients" }, { status: 400 });
  }

  const results = [];
  for (const recipient of recipients) {
    const personalizedMessage = message
      .replace(/\{\{name\}\}/g, recipient.name || "Customer")
      .replace(/\{\{link\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL}/review-page/demo`);

    const result = await sendEmail({
      to: recipient.contact,
      subject: `${name || "We'd love your feedback!"}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <p>${personalizedMessage.replace(/\n/g, "<br/>")}</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"/>
        <p style="font-size:12px;color:#9ca3af;">Sent via ReviewPilot</p>
      </div>`,
    });
    results.push({ recipient: recipient.contact, ...result });
  }

  return NextResponse.json({
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}
