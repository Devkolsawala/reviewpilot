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
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

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

  // Update user profile with subscription
  await supabase
    .from("profiles")
    .update({ razorpay_subscription_id })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
