import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelSubscription } from '@/lib/razorpay';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('razorpay_subscription_id, plan')
      .eq('id', user.id)
      .single();

    if (!profile?.razorpay_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Cancel at end of billing period (cancelAtEnd = true)
    await cancelSubscription(profile.razorpay_subscription_id, true);

    console.log(`[RAZORPAY] Subscription cancellation scheduled: ${profile.razorpay_subscription_id} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RAZORPAY] Cancel subscription error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
