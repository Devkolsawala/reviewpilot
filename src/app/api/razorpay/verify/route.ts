import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, planName } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    });

    if (!isValid) {
      console.error('[RAZORPAY] Invalid payment signature');
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const validPlans = ['starter', 'growth', 'agency'];
    const selectedPlan = validPlans.includes(planName) ? planName : null;

    // Payment verified — update the user's plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: selectedPlan ?? 'starter',
        razorpay_subscription_id: razorpay_subscription_id,
        razorpay_customer_id: razorpay_payment_id,
        trial_ends_at: null, // Clear trial — they're a paying customer
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[RAZORPAY] Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    console.log(`[RAZORPAY] Plan upgraded to ${selectedPlan} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      plan: selectedPlan,
      message: `Successfully upgraded to ${selectedPlan} plan!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RAZORPAY] Verify error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
