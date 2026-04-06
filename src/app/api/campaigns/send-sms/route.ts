import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/twilio";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, recipients } = await request.json();

  if (!recipients || recipients.length === 0) {
    return NextResponse.json({ error: "No recipients" }, { status: 400 });
  }

  const results = [];
  for (const recipient of recipients) {
    const personalizedMessage = message
      .replace(/\{\{name\}\}/g, recipient.name || "Customer")
      .replace(/\{\{link\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL}/review-page/demo`);

    const result = await sendSMS(recipient.contact, personalizedMessage);
    results.push({ recipient: recipient.contact, ...result });
  }

  // Track usage
  const month = new Date().toISOString().slice(0, 7);
  await supabase.rpc("increment_usage", {
    p_user_id: user.id,
    p_month: month,
    p_field: "sms_sent",
    p_amount: results.filter((r) => r.success).length,
  });

  return NextResponse.json({
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}
