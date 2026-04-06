import { NextResponse } from "next/server";
import { createSubscription, RAZORPAY_PLANS } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planKey, email } = await request.json();
  const plan = RAZORPAY_PLANS[planKey as keyof typeof RAZORPAY_PLANS];

  if (!plan || !plan.id) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const subscription = await createSubscription(plan.id, email || user.email || "");
    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (error) {
    console.error("[Razorpay] Create subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
