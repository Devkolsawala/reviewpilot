import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_CATEGORIES = ['billing', 'technical', 'account', 'feature', 'other'] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { category, subject, message } = body;

    const safeCategory: Category = ALLOWED_CATEGORIES.includes(category)
      ? category
      : 'other';

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 120) {
      return NextResponse.json({ error: 'Subject must be between 3 and 120 characters' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 20 || message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message must be between 20 and 2000 characters' }, { status: 400 });
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

    const emailSent = await sendSupportEmail({
      from: userEmail,
      userName,
      userId: user?.id || null,
      plan: planName,
      category: safeCategory,
      subject: subject.trim(),
      message: message.trim(),
    });

    // Also save to Supabase for record keeping
    if (user) {
      const { error: dbError } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        category: safeCategory,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (dbError) {
        // Table might not exist yet — that's ok, email is the primary delivery
        console.log('[SUPPORT] DB save failed (table may not exist):', dbError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? 'Thank you! Your message has been sent.' : 'Thank you! Your message has been recorded.',
    });
  } catch (error: unknown) {
    const e = error as { message?: string };
    console.error('[SUPPORT] Error:', e);
    return NextResponse.json({ error: 'Failed to submit support request' }, { status: 500 });
  }
}

async function sendSupportEmail(params: {
  from: string;
  userName: string;
  userId: string | null;
  plan: string;
  category: string;
  subject: string;
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
          from: 'ReviewPilot Support <onboarding@resend.dev>',
          to: ['dev.kolsawala45@gmail.com'],
          subject: `[ReviewPilot Support] ${params.category} — ${params.subject} (from ${params.userName})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px;">
              <h2 style="color: #0F172A;">New Support Request from ReviewPilot</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; color: #666; width: 120px;">From:</td><td style="padding: 8px;"><strong>${params.userName}</strong> (${params.from})</td></tr>
                <tr><td style="padding: 8px; color: #666;">User ID:</td><td style="padding: 8px;">${params.userId || 'anonymous'}</td></tr>
                <tr><td style="padding: 8px; color: #666;">Plan:</td><td style="padding: 8px;">${params.plan}</td></tr>
                <tr><td style="padding: 8px; color: #666;">Category:</td><td style="padding: 8px;">${params.category}</td></tr>
                <tr><td style="padding: 8px; color: #666;">Subject:</td><td style="padding: 8px;"><strong>${params.subject}</strong></td></tr>
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
        console.log('[SUPPORT] Email sent via Resend');
        return true;
      }
      console.error('[SUPPORT] Resend failed:', await response.text());
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error('[SUPPORT] Resend error:', err.message);
    }
  }

  // Fallback: log to console
  console.log('=== SUPPORT REQUEST RECEIVED ===');
  console.log(`To: dev.kolsawala45@gmail.com`);
  console.log(`From: ${params.userName} (${params.from})`);
  console.log(`User ID: ${params.userId || 'anonymous'}`);
  console.log(`Plan: ${params.plan}`);
  console.log(`Category: ${params.category}`);
  console.log(`Subject: ${params.subject}`);
  console.log(`Message: ${params.message}`);
  console.log('================================');
  return false;
}
