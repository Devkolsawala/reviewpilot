import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/razorpay';

// Webhook uses admin client — no user session
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('[WEBHOOK] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[WEBHOOK] Received: ${eventType}`);

    const supabase = getAdminClient();

    switch (eventType) {
      case 'subscription.activated': {
        const subscriptionId = payload.subscription?.entity?.id;
        const planName = payload.subscription?.entity?.notes?.plan;
        if (subscriptionId && planName) {
          const { error } = await supabase
            .from('profiles')
            .update({
              plan: planName,
              trial_ends_at: null,
              subscription_cancel_at: null, // Fresh activation — no pending cancel
            })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Activated: ${planName}, error: ${error?.message || 'none'}`);
        }
        break;
      }

      case 'subscription.charged': {
        // Recurring payment successful — subscription renewed
        const subscriptionId = payload.subscription?.entity?.id;
        if (subscriptionId) {
          // Clear any stale cancel flag on renewal
          await supabase
            .from('profiles')
            .update({ subscription_cancel_at: null })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Charged: usage resets via period_key system`);
        }
        break;
      }

      case 'subscription.cancelled': {
        // Razorpay fires this IMMEDIATELY when a cancel is scheduled (cancel_at_cycle_end=1).
        // The subscription is still ACTIVE until current_end — DO NOT downgrade yet.
        // We only downgrade when subscription.completed fires (period actually ends).
        //
        // Exception: if current_end is in the past (or absent), the cancel was immediate — downgrade now.
        const sub = payload.subscription?.entity;
        const subscriptionId = sub?.id;
        if (!subscriptionId) break;

        const currentEndUnix = sub?.current_end as number | undefined;
        const currentEnd = currentEndUnix ? new Date(currentEndUnix * 1000) : null;
        const isGraceful = currentEnd && currentEnd > new Date();

        if (isGraceful) {
          // Graceful cancel-at-cycle-end: keep plan active, record end date
          const { error } = await supabase
            .from('profiles')
            .update({ subscription_cancel_at: currentEnd.toISOString() })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Graceful cancel — plan stays active until ${currentEnd.toISOString()}, error: ${error?.message || 'none'}`);
        } else {
          // Immediate cancel (cancelAtEnd=false) or unknown — downgrade now
          const { error } = await supabase
            .from('profiles')
            .update({
              plan: 'free',
              razorpay_subscription_id: null,
              subscription_cancel_at: null,
              trial_ends_at: null,
            })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Immediate cancel — downgraded to free, error: ${error?.message || 'none'}`);
        }
        break;
      }

      case 'subscription.completed': {
        // Billing period is OVER — the subscription has fully ended. Downgrade now.
        const subscriptionId = payload.subscription?.entity?.id;
        if (subscriptionId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              plan: 'free',
              razorpay_subscription_id: null,
              subscription_cancel_at: null,
              trial_ends_at: null,
            })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Completed — downgraded to free, error: ${error?.message || 'none'}`);
        }
        break;
      }

      case 'subscription.halted': {
        // Payment failed repeatedly — downgrade immediately
        const subscriptionId = payload.subscription?.entity?.id;
        if (subscriptionId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              plan: 'free',
              razorpay_subscription_id: null,
              subscription_cancel_at: null,
            })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Halted — downgraded to free, error: ${error?.message || 'none'}`);
        }
        break;
      }

      case 'payment.failed': {
        const subscriptionId = payload.payment?.entity?.subscription_id;
        console.log(`[WEBHOOK] Payment failed for subscription: ${subscriptionId}`);
        // Don't downgrade — Razorpay retries automatically. Only halt does the downgrade.
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WEBHOOK] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
