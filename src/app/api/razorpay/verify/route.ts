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
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const isValid = verifyPaymentSignature({
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    });

    if (!isValid) {
      console.error('[RAZORPAY] Invalid payment signature', { user: user.id, sub: razorpay_subscription_id });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    console.log(`[RAZORPAY] Payment signature verified for user ${user.id}, subscription ${razorpay_subscription_id}. Awaiting activation webhook for DB update.`);

    // DO NOT update profiles.plan, razorpay_subscription_id, or razorpay_customer_id here.
    // The subscription.activated webhook is the source of truth — it uses notes.user_id
    // to find the user, notes.plan to set the plan, and the Razorpay API to fetch the
    // real customer_id (cust_xxx, not pay_xxx).
    return NextResponse.json({
      success: true,
      message: 'Payment verified. Your plan will activate shortly.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RAZORPAY] Verify error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
