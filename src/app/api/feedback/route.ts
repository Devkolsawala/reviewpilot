import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { type, message, rating } = body;

    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Feedback must be at least 10 characters' }, { status: 400 });
    }

    const userEmail = user?.email || 'anonymous';
    const userName = user?.user_metadata?.full_name || userEmail;

    // Get user's plan for context
    let planName = 'unknown';
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();
      planName = profile?.plan || 'free';
    }

    // Send email via Resend if configured, otherwise log
    const emailSent = await sendFeedbackEmail({
      from: userEmail,
      userName,
      plan: planName,
      type: type || 'general',
      rating: rating || null,
      message: message.trim(),
    });

    // Also save to Supabase for record keeping
    if (user) {
      const { error: dbError } = await supabase.from('feedback').insert({
        user_id: user.id,
        type: type || 'general',
        message: message.trim(),
        rating: rating || null,
      });
      if (dbError) {
        // Table might not exist yet — that's ok, email is the primary delivery
        console.log('[FEEDBACK] DB save failed (table may not exist):', dbError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? 'Thank you! Your feedback has been sent.' : 'Thank you! Your feedback has been recorded.',
    });
  } catch (error: unknown) {
    const e = error as { message?: string };
    console.error('[FEEDBACK] Error:', e);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

async function sendFeedbackEmail(params: {
  from: string;
  userName: string;
  plan: string;
  type: string;
  rating: number | null;
  message: string;
}): Promise<boolean> {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'ReviewPilot Feedback <onboarding@resend.dev>',
          to: ['dev.kolsawala45@gmail.com'],
          subject: `[ReviewPilot Feedback] ${params.type} from ${params.userName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px;">
              <h2 style="color: #0F172A;">New Feedback from ReviewPilot</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; color: #666; width: 120px;">From:</td><td style="padding: 8px;"><strong>${params.userName}</strong> (${params.from})</td></tr>
                <tr><td style="padding: 8px; color: #666;">Plan:</td><td style="padding: 8px;">${params.plan}</td></tr>
                <tr><td style="padding: 8px; color: #666;">Type:</td><td style="padding: 8px;">${params.type}</td></tr>
                ${params.rating ? `<tr><td style="padding: 8px; color: #666;">Rating:</td><td style="padding: 8px;">${'&#9733;'.repeat(params.rating)}${'&#9734;'.repeat(5 - params.rating)}</td></tr>` : ''}
              </table>
              <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${params.message}</p>
              </div>
              <p style="color: #999; font-size: 12px;">Sent from ReviewPilot Dashboard</p>
            </div>
          `,
        }),
      });

      if (response.ok) {
        console.log('[FEEDBACK] Email sent via Resend');
        return true;
      }
      console.error('[FEEDBACK] Resend failed:', await response.text());
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error('[FEEDBACK] Resend error:', err.message);
    }
  }

  // Fallback: log to console
  console.log('=== FEEDBACK RECEIVED ===');
  console.log(`From: ${params.userName} (${params.from})`);
  console.log(`Plan: ${params.plan}`);
  console.log(`Type: ${params.type}`);
  console.log(`Message: ${params.message}`);
  console.log('========================');
  return false;
}
