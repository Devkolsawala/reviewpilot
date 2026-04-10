import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_SECRET not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayInstance;
}

// Map plan names to Razorpay plan IDs from env
export function getRazorpayPlanId(planName: string): string {
  const planMap: Record<string, string | undefined> = {
    starter: process.env.RAZORPAY_PLAN_STARTER,
    growth: process.env.RAZORPAY_PLAN_GROWTH,
    agency: process.env.RAZORPAY_PLAN_AGENCY,
  };
  const planId = planMap[planName];
  if (!planId) throw new Error(`No Razorpay plan ID configured for "${planName}"`);
  return planId;
}

// Create a subscription for a user
export async function createSubscription(
  planName: string,
  customerEmail: string,
  customerName?: string
) {
  const razorpay = getRazorpay();
  const razorpayPlanId = getRazorpayPlanId(planName);

  const subscription = await razorpay.subscriptions.create({
    plan_id: razorpayPlanId,
    total_count: 120, // Max billing cycles (10 years monthly)
    quantity: 1,
    customer_notify: 1,
    notes: {
      email: customerEmail,
      name: customerName || '',
      plan: planName,
    },
  });

  return {
    subscriptionId: subscription.id,
    shortUrl: (subscription as unknown as Record<string, unknown>).short_url as string | undefined,
    status: subscription.status,
  };
}

// Verify payment signature from Razorpay checkout
export function verifyPaymentSignature(params: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): boolean {
  const body = params.razorpay_payment_id + '|' + params.razorpay_subscription_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  return expectedSignature === params.razorpay_signature;
}

// Verify webhook signature
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

// Fetch subscription details
export async function getSubscription(subscriptionId: string) {
  const razorpay = getRazorpay();
  return await razorpay.subscriptions.fetch(subscriptionId);
}

// Cancel a subscription — returns the end date (Unix seconds) if cancel_at_cycle_end
export async function cancelSubscription(subscriptionId: string, cancelAtEnd: boolean = true) {
  const razorpay = getRazorpay();
  const result = await razorpay.subscriptions.cancel(subscriptionId, cancelAtEnd);
  const raw = result as unknown as Record<string, unknown>;
  // current_end is a Unix timestamp (seconds) — the date the billing period ends
  const currentEndUnix = raw.current_end as number | undefined;
  const cancelAt = currentEndUnix ? new Date(currentEndUnix * 1000).toISOString() : null;
  return { subscriptionId: result.id, status: result.status, cancelAt };
}
