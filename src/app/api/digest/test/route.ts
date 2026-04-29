import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendDigestForUser } from "@/lib/digest/send";

// In-memory rate limit: max 5 test sends per user per hour.
// In a multi-instance deployment this is per-instance; acceptable for a
// safety guard (worst-case 5×N sends across instances per hour).
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const tickets: Map<string, number[]> = new Map();

function takeTicket(userId: string): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const arr = (tickets.get(userId) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    const earliest = arr[0];
    return { ok: false, retryAfterMs: WINDOW_MS - (now - earliest) };
  }
  arr.push(now);
  tickets.set(userId, arr);
  return { ok: true };
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { period?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const period = body.period;
  if (period !== "daily" && period !== "weekly") {
    return NextResponse.json({ error: "period must be 'daily' or 'weekly'" }, { status: 400 });
  }

  const ticket = takeTicket(user.id);
  if (!ticket.ok) {
    const minutes = Math.ceil((ticket.retryAfterMs || 0) / 60000);
    return NextResponse.json(
      {
        error: `Test send rate limit reached (${RATE_LIMIT}/hour). Try again in ~${minutes} min.`,
      },
      { status: 429 }
    );
  }

  const result = await sendDigestForUser({
    userId: user.id,
    period,
    now: new Date(),
    isTest: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || result.status, status: result.status },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, status: result.status, messageId: result.messageId });
}
