import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscription, cancelSubscription } from '@/lib/razorpay';
import { isUpgrade, isDowngrade } from '@/lib/plans';

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
      .select('razorpay_subscription_id, plan, subscription_cancel_at')
      .eq('id', user.id)
      .single();

    const currentPlan = profile?.plan ?? 'free';
    const isCurrentlyPaid = currentPlan !== 'free';
    const hasCancellationPending = !!profile?.subscription_cancel_at;
    const hasActiveSubId = !!profile?.razorpay_subscription_id;

    // Block downgrade while subscription is fully active (no cancellation pending)
    if (isCurrentlyPaid && !hasCancellationPending && isDowngrade(currentPlan, planName)) {
      return NextResponse.json({
        error: `Downgrade not available while your ${currentPlan} plan is active. Cancel your current plan first — it will remain active until the billing period ends, then you can subscribe to the ${planName} plan.`,
        code: 'downgrade_blocked',
      }, { status: 400 });
    }

    // Upgrade from active paid plan: cancel old subscription immediately, then create new one
    if (isCurrentlyPaid && !hasCancellationPending && isUpgrade(currentPlan, planName) && hasActiveSubId) {
      try {
        await cancelSubscription(profile!.razorpay_subscription_id!, false); // false = cancel immediately
        console.log(`[UPGRADE] Immediately cancelled ${currentPlan} sub for upgrade to ${planName}`);
      } catch (err) {
        console.error('[UPGRADE] Failed to cancel old subscription:', err);
        // Continue — old sub may already be cancelled or in a terminal state
      }
    }

    // Re-subscribe: user cancelled and wants to come back (same or different plan)
    if (hasCancellationPending && hasActiveSubId) {
      try {
        await cancelSubscription(profile!.razorpay_subscription_id!, false); // cancel immediately
        console.log(`[RESUBSCRIBE] Cancelled pending-cancel sub, creating new ${planName} sub`);
      } catch (err) {
        console.error('[RESUBSCRIBE] Cancel failed:', err);
      }
      // Clear the cancel flag before creating new subscription
      await supabase
        .from('profiles')
        .update({ subscription_cancel_at: null, razorpay_subscription_id: null })
        .eq('id', user.id);
    }

    const result = await createSubscription(
      planName,
      user.email!,
      user.user_metadata?.full_name
    );

    // Save the new pending subscription ID
    await supabase
      .from('profiles')
      .update({ razorpay_subscription_id: result.subscriptionId })
      .eq('id', user.id);

    console.log(`[RAZORPAY] Subscription created: ${result.subscriptionId} for plan ${planName}`);

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
