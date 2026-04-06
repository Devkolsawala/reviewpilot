import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const eventType = event.event;
  const payload = event.payload;

  switch (eventType) {
    case "subscription.activated": {
      const subscriptionId = payload.subscription?.entity?.id;
      const email = payload.subscription?.entity?.notes?.email;
      if (email && subscriptionId) {
        // Find user by email and update plan
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === email);
        if (user) {
          const planId = payload.subscription?.entity?.plan_id;
          const plan = getPlanFromRazorpayId(planId);
          await supabaseAdmin
            .from("profiles")
            .update({
              plan,
              razorpay_subscription_id: subscriptionId,
            })
            .eq("id", user.id);
        }
      }
      break;
    }
    case "subscription.charged": {
      // Payment successful — reset monthly usage
      const email = payload.subscription?.entity?.notes?.email;
      if (email) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === email);
        if (user) {
          const month = new Date().toISOString().slice(0, 7);
          await supabaseAdmin.from("usage").upsert(
            { user_id: user.id, month, ai_replies_used: 0, sms_sent: 0, reviews_processed: 0 },
            { onConflict: "user_id,month" }
          );
        }
      }
      break;
    }
    case "subscription.cancelled":
    case "subscription.halted": {
      const email = payload.subscription?.entity?.notes?.email;
      if (email) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === email);
        if (user) {
          await supabaseAdmin
            .from("profiles")
            .update({ plan: "free", razorpay_subscription_id: null })
            .eq("id", user.id);
        }
      }
      break;
    }
    case "payment.failed": {
      // Could send notification email to user
      console.log("[Razorpay] Payment failed:", payload.payment?.entity?.id);
      break;
    }
  }

  return NextResponse.json({ status: "ok" });
}

function getPlanFromRazorpayId(planId: string): string {
  if (planId === process.env.RAZORPAY_PLAN_STARTER) return "starter";
  if (planId === process.env.RAZORPAY_PLAN_GROWTH) return "growth";
  if (planId === process.env.RAZORPAY_PLAN_AGENCY) return "agency";
  return "starter";
}
