// TODO: Enable when GBP API access is approved
// Google Business Profile API wrapper — currently returns mock data

import type { Review } from "@/types/review";

export async function fetchGBPReviews(
  _credentials: Record<string, unknown>, // eslint-disable-line @typescript-eslint/no-unused-vars
  _accountId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _locationId: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<Review[]> {
  // TODO: Enable when GBP API access is approved
  console.log("[STUB] GBP review fetch — using mock data. Enable when GBP API access is approved.");
  return [];
}

export async function publishGBPReply(
  _credentials: Record<string, unknown>, // eslint-disable-line @typescript-eslint/no-unused-vars
  _accountId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _locationId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _reviewId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _replyText: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<boolean> {
  // TODO: Enable when GBP API access is approved
  console.log("[STUB] GBP reply publish — logged only. Enable when GBP API access is approved.");
  return true;
}

export function getGBPOAuthUrl(): string {
  // TODO: Enable when GBP API access is approved
  const clientId = process.env.GOOGLE_GBP_CLIENT_ID || "pending";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`;
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/business.manage&access_type=offline&prompt=consent`;
}
