// GET /api/tools/analyze-app/usage
//
// Read-only usage lookup for the analyzer page. Called on mount so the
// "X analyses left today" copy is accurate before the user runs anything.
// Never reserves, never increments, never mutates. Touches Supabase only
// for a single read of the IP's row.

import { NextResponse } from "next/server";
import { getClientIp, getUsage, hashIp } from "@/lib/analyzer/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ipHash = hashIp(getClientIp(req));
  const usage = await getUsage(ipHash);
  // Mark as "not cached" — this endpoint isn't tied to any analysis
  // response, the cached signal only makes sense in the POST flow.
  return NextResponse.json({ usage: { ...usage, cached: false } });
}
