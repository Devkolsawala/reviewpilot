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
            })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Activated: ${planName}, error: ${error?.message || 'none'}`);
        }
        break;
      }

      case 'subscription.charged': {
        // Recurring payment successful
        const subscriptionId = payload.subscription?.entity?.id;
        if (subscriptionId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('razorpay_subscription_id', subscriptionId)
            .single();
          if (profile) {
            console.log(`[WEBHOOK] Charged: user ${profile.id}, usage resets via period_key system`);
          }
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const subscriptionId = payload.subscription?.entity?.id;
        if (subscriptionId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              plan: 'free',
              razorpay_subscription_id: null,
              trial_ends_at: null,
              subscription_cancel_at: null, // Period ended — clear the pending flag
            })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Cancelled/Completed: downgraded to free, error: ${error?.message || 'none'}`);
        }
        break;
      }

      case 'subscription.halted': {
        // Payment failed repeatedly — downgrade
        const subscriptionId = payload.subscription?.entity?.id;
        if (subscriptionId) {
          await supabase
            .from('profiles')
            .update({ plan: 'free', razorpay_subscription_id: null, subscription_cancel_at: null })
            .eq('razorpay_subscription_id', subscriptionId);
          console.log(`[WEBHOOK] Halted: downgraded to free`);
        }
        break;
      }

      case 'payment.failed': {
        const subscriptionId = payload.payment?.entity?.subscription_id;
        console.log(`[WEBHOOK] Payment failed for subscription: ${subscriptionId}`);
        // Don't downgrade immediately — Razorpay retries automatically
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
