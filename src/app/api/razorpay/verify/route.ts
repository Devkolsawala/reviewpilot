import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, planKey } = body;

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const isValid = verifyPaymentSignature({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const validPlans = ["starter", "growth", "agency"];
  const selectedPlan = validPlans.includes(planKey) ? planKey : null;

  // Update profile: set subscription, upgrade plan, clear trial
  await supabase
    .from("profiles")
    .update({
      razorpay_subscription_id,
      ...(selectedPlan ? { plan: selectedPlan, trial_ends_at: null } : {}),
    })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
