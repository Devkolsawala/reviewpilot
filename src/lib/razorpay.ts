import Razorpay from "razorpay";
import crypto from "crypto";

// Lazy instantiation — avoids build-time crash when env vars are absent
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  });
}

export const RAZORPAY_PLANS = {
  starter: {
    id: process.env.RAZORPAY_PLAN_STARTER || "",
    name: "Starter",
    priceINR: 1500,
    priceUSD: 19,
  },
  growth: {
    id: process.env.RAZORPAY_PLAN_GROWTH || "",
    name: "Growth",
    priceINR: 3000,
    priceUSD: 39,
  },
  agency: {
    id: process.env.RAZORPAY_PLAN_AGENCY || "",
    name: "Agency",
    priceINR: 8000,
    priceUSD: 99,
  },
} as const;

export async function createSubscription(planId: string, customerEmail: string) {
  const razorpay = getRazorpay();
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 12,
    quantity: 1,
    customer_notify: 1,
    notes: { email: customerEmail },
  });
  return subscription;
}

export function verifyPaymentSignature(params: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}) {
  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(params.razorpay_payment_id + "|" + params.razorpay_subscription_id)
    .digest("hex");
  return generated === params.razorpay_signature;
}

export function verifyWebhookSignature(body: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
    .update(body)
    .digest("hex");
  return expected === signature;
}
