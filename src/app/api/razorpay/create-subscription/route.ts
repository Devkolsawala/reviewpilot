import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscription } from '@/lib/razorpay';

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

    // Check if user already has an active subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('razorpay_subscription_id, plan')
      .eq('id', user.id)
      .single();

    if (profile?.plan !== 'free' && profile?.razorpay_subscription_id) {
      return NextResponse.json({
        error: 'You already have an active subscription. Cancel it first to switch plans.',
      }, { status: 400 });
    }

    const result = await createSubscription(
      planName,
      user.email!,
      user.user_metadata?.full_name
    );

    // Save the pending subscription ID to profile
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
