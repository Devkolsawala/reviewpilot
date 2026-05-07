import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature, getSubscription } from '@/lib/razorpay';
import crypto from 'crypto';

// Webhook uses admin client — no user session
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Phantom guard: only mutate a profile if this sub_id is its CURRENT active sub.
// Stops abandoned-checkout sub_ids (from Razorpay's `created` state) from
// silently downgrading paying users when their cancelled/halted webhook arrives.
async function findCurrentProfileForSub(
  supabase: ReturnType<typeof getAdminClient>,
  subscriptionId: string
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, plan, razorpay_subscription_id')
    .eq('razorpay_subscription_id', subscriptionId)
    .maybeSingle();
  if (error) {
    console.error('[WEBHOOK] profile lookup error', error);
    return null;
  }
  return data;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const eventIdHeader = request.headers.get('x-razorpay-event-id') || '';

  // 1. Verify signature FIRST (before any DB work)
  if (process.env.RAZORPAY_WEBHOOK_SECRET) {
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType: string = event.event;
  const payload = event.payload as Record<string, { entity?: Record<string, unknown> }>;
  const supabase = getAdminClient();

  // Stable event_id for idempotency: prefer header, fallback to hash of body
  const eventId = eventIdHeader || crypto.createHash('sha256').update(rawBody).digest('hex');

  const subEntity = (payload?.subscription?.entity ?? {}) as Record<string, unknown>;
  const payEntity = (payload?.payment?.entity ?? {}) as Record<string, unknown>;
  const subId = (subEntity.id as string | undefined) || (payEntity.subscription_id as string | undefined);
  const payId = payEntity.id as string | undefined;
  const subNotes = (subEntity.notes as Record<string, string> | undefined) ?? {};
  const payNotes = (payEntity.notes as Record<string, string> | undefined) ?? {};
  const notesUserId: string | undefined = subNotes.user_id || payNotes.user_id;

  // 2. Idempotency: try to insert event log row. If duplicate, short-circuit.
  const { error: insertError } = await supabase.from('webhook_events').insert({
    provider: 'razorpay',
    event_id: eventId,
    event_type: eventType,
    razorpay_subscription_id: subId || null,
    razorpay_payment_id: payId || null,
    user_id: notesUserId || null,
    payload: event,
    status: 'received',
  });

  if (insertError) {
    if (insertError.code === '23505') {
      // Duplicate — already processed. Return 200 so Razorpay stops retrying.
      console.log(`[WEBHOOK] Duplicate event ${eventId} (${eventType}) — ignoring`);
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error('[WEBHOOK] Failed to log event', insertError);
    // Continue processing anyway — better to process twice than lose an event.
  }

  console.log(`[WEBHOOK] Received: ${eventType}, sub: ${subId}, user: ${notesUserId}`);

  let processedStatus: 'processed' | 'ignored' | 'error' = 'processed';
  let processedError: string | null = null;

  try {
    switch (eventType) {
      // ─────────────────────────────────────────────────────────────
      // ACTIVATION: the ONLY place that writes razorpay_subscription_id.
      // Resolves the user via notes.user_id (set at create time).
      // ─────────────────────────────────────────────────────────────
      case 'subscription.activated': {
        const subId = subEntity.id as string | undefined;
        const userId = subNotes.user_id;
        const planName = subNotes.plan;

        if (!subId || !userId || !planName) {
          console.error(`[WEBHOOK] subscription.activated missing required fields — sub:${subId}, user:${userId}, plan:${planName}`);
          processedStatus = 'error';
          processedError = 'Missing notes.user_id, notes.plan, or subscription id';
          break;
        }
        if (!['starter', 'growth', 'agency'].includes(planName)) {
          console.error(`[WEBHOOK] Invalid plan in notes: ${planName}`);
          processedStatus = 'error';
          processedError = `Invalid plan in notes: ${planName}`;
          break;
        }

        // Fetch full subscription to get the real customer_id (cust_xxx)
        let customerId: string | null = (subEntity.customer_id as string | undefined) ?? null;
        if (!customerId) {
          try {
            const fullSub = await getSubscription(subId) as unknown as { customer_id?: string };
            customerId = fullSub.customer_id ?? null;
          } catch (e) {
            console.warn(`[WEBHOOK] Could not fetch full sub for customer_id: ${subId}`, e);
          }
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            plan: planName,
            razorpay_subscription_id: subId,
            razorpay_customer_id: customerId,  // cust_xxx, not pay_xxx
            trial_ends_at: null,
            subscription_cancel_at: null,
          })
          .eq('id', userId);

        if (error) {
          console.error('[WEBHOOK] Failed to activate plan', error);
          processedStatus = 'error';
          processedError = error.message;
        } else {
          console.log(`[WEBHOOK] Activated ${planName} for user ${userId} (sub ${subId})`);
        }
        break;
      }

      // ─────────────────────────────────────────────────────────────
      // CHARGED: recurring payment succeeded; reset usage period anchor.
      // ─────────────────────────────────────────────────────────────
      case 'subscription.charged': {
        const sid = subEntity.id as string | undefined;
        if (!sid) break;
        const profile = await findCurrentProfileForSub(supabase, sid);
        if (!profile) {
          console.log(`[WEBHOOK] subscription.charged for ${sid} — not the current sub for any user, ignoring`);
          processedStatus = 'ignored';
          break;
        }
        const { error } = await supabase
          .from('profiles')
          .update({ usage_period_start: new Date().toISOString() })
          .eq('id', profile.id);
        if (error) {
          processedStatus = 'error';
          processedError = error.message;
        } else {
          console.log(`[WEBHOOK] Charged: usage period anchor refreshed for user ${profile.id}`);
        }
        break;
      }

      // ─────────────────────────────────────────────────────────────
      // CANCELLED: scheduled or immediate cancel. Mark scheduled end,
      // KEEP plan. The plan only flips to free on subscription.completed
      // (period actually ended). Phantom IDs are filtered by the guard.
      // ─────────────────────────────────────────────────────────────
      case 'subscription.cancelled': {
        const sid = subEntity.id as string | undefined;
        if (!sid) break;
        const profile = await findCurrentProfileForSub(supabase, sid);
        if (!profile) {
          console.log(`[WEBHOOK] subscription.cancelled for ${sid} — not the current sub for any user (likely abandoned checkout), ignoring`);
          processedStatus = 'ignored';
          break;
        }
        const currentEndUnix = subEntity.current_end as number | undefined;
        const endsAt = currentEndUnix ? new Date(currentEndUnix * 1000).toISOString() : null;
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_cancel_at: endsAt })
          .eq('id', profile.id);
        if (error) {
          processedStatus = 'error';
          processedError = error.message;
        } else {
          console.log(`[WEBHOOK] Cancellation scheduled for user ${profile.id} at ${endsAt}`);
        }
        break;
      }

      // ─────────────────────────────────────────────────────────────
      // COMPLETED: billing period ended after cancellation. NOW downgrade.
      // ─────────────────────────────────────────────────────────────
      case 'subscription.completed': {
        const sid = subEntity.id as string | undefined;
        if (!sid) break;
        const profile = await findCurrentProfileForSub(supabase, sid);
        if (!profile) {
          console.log(`[WEBHOOK] subscription.completed for ${sid} — not the current sub for any user, ignoring`);
          processedStatus = 'ignored';
          break;
        }
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            razorpay_subscription_id: null,
            razorpay_customer_id: null,
            subscription_cancel_at: null,
          })
          .eq('id', profile.id);
        if (error) {
          processedStatus = 'error';
          processedError = error.message;
        } else {
          console.log(`[WEBHOOK] User ${profile.id} downgraded to free (sub ${sid} completed)`);
        }
        break;
      }

      // ─────────────────────────────────────────────────────────────
      // HALTED: payment failed multiple times. Log, KEEP plan for now
      // (don't downgrade on transient failures). Phantom guard prevents
      // an abandoned `created` sub from triggering a downgrade here.
      // ─────────────────────────────────────────────────────────────
      case 'subscription.halted': {
        const sid = subEntity.id as string | undefined;
        if (!sid) break;
        const profile = await findCurrentProfileForSub(supabase, sid);
        if (!profile) {
          console.log(`[WEBHOOK] subscription.halted for ${sid} — not the current sub for any user, ignoring`);
          processedStatus = 'ignored';
          break;
        }
        // TODO: send email to user about payment failure (existing Resend integration)
        console.log(`[WEBHOOK] Subscription halted for user ${profile.id} — manual intervention may be needed`);
        break;
      }

      // ─────────────────────────────────────────────────────────────
      // PAYMENT events: log only for now (future: email user on failure)
      // ─────────────────────────────────────────────────────────────
      case 'payment.authorized':
      case 'payment.failed':
      case 'payment.captured': {
        console.log(`[WEBHOOK] Payment event ${eventType} for sub ${subId}`);
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${eventType}`);
        processedStatus = 'ignored';
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[WEBHOOK] Handler crashed for ${eventType}`, e);
    processedStatus = 'error';
    processedError = message;
  }

  // Update the event log row with final status
  await supabase
    .from('webhook_events')
    .update({
      status: processedStatus,
      processed_at: new Date().toISOString(),
      error_message: processedError,
    })
    .eq('event_id', eventId)
    .eq('provider', 'razorpay');

  // Always return 200 so Razorpay doesn't retry events that errored on our side.
  // We have the event logged and can replay manually. Only signature failures return 4xx.
  return NextResponse.json({ ok: true, status: processedStatus });
}
