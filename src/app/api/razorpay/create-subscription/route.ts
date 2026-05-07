import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscription, cancelSubscription } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName } = await request.json();
    if (!['starter', 'growth', 'agency'].includes(planName)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, razorpay_subscription_id, subscription_cancel_at')
      .eq('id', user.id)
      .single();

    const currentPlan = profile?.plan ?? 'free';
    const isCurrentlyPaid = currentPlan !== 'free';
    const hasCancellationPending = !!profile?.subscription_cancel_at;
    const hasActiveSubId = !!profile?.razorpay_subscription_id;

    // Block: user already has an active paid subscription with no cancel pending.
    // Re-subscribe (cancel pending) is allowed and handled below.
    if (isCurrentlyPaid && hasActiveSubId && !hasCancellationPending) {
      return NextResponse.json({
        error: 'You already have an active subscription. Cancel it first to switch plans.',
      }, { status: 400 });
    }

    // Re-subscribe: user cancelled and wants to come back (same or different plan).
    // Cancel the old sub at Razorpay immediately and clear the DB pointer so its
    // eventual cancelled webhook won't match this profile and trip the phantom guard.
    if (hasCancellationPending && hasActiveSubId) {
      try {
        await cancelSubscription(profile!.razorpay_subscription_id!, false);
        console.log(`[RESUBSCRIBE] Immediately cancelled old sub for user ${user.id}`);
      } catch (err) {
        console.error('[RESUBSCRIBE] Cancel old sub failed (continuing):', err);
      }
      await supabase
        .from('profiles')
        .update({ razorpay_subscription_id: null, subscription_cancel_at: null })
        .eq('id', user.id);
    }

    const result = await createSubscription({
      planName,
      userId: user.id,
      customerEmail: user.email!,
      customerName: user.user_metadata?.full_name,
    });

    console.log(`[RAZORPAY] Subscription created: ${result.subscriptionId} for plan ${planName}, user ${user.id} (NOT yet written to DB — awaiting activation webhook)`);

    // DO NOT WRITE razorpay_subscription_id TO profiles HERE.
    // The subscription.activated webhook is the source of truth.
    return NextResponse.json({
      subscriptionId: result.subscriptionId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RAZORPAY] Create subscription error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
