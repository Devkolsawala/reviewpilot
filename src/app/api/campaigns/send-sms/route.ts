import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/twilio";
import { createClient } from "@/lib/supabase/server";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";

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

  const recipientCount: number = recipients.length;

  // Check SMS usage limit before sending
  const usageCheck = await checkUsageLimit(user.id, "sms", supabase);
  if (usageCheck.remaining < recipientCount) {
    return NextResponse.json(
      {
        error: "limit_exceeded",
        message: `Cannot send ${recipientCount} SMS. You have ${usageCheck.remaining} SMS remaining this ${usageCheck.periodLabel} (${usageCheck.current}/${usageCheck.limit} used).`,
        upgradeNeeded: usageCheck.remaining === 0,
        remaining: usageCheck.remaining,
        limit: usageCheck.limit,
      },
      { status: 429 }
    );
  }

  const results = [];
  for (const recipient of recipients) {
    const personalizedMessage = message
      .replace(/\{\{name\}\}/g, recipient.name || "Customer")
      .replace(/\{\{link\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL}/review-page/demo`);

    const result = await sendSMS(recipient.contact, personalizedMessage);
    results.push({ recipient: recipient.contact, ...result });
  }

  const successCount = results.filter((r) => r.success).length;
  if (successCount > 0) {
    await incrementUsage(user.id, "sms_sent", successCount, supabase);
  }

  return NextResponse.json({
    sent: successCount,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}
