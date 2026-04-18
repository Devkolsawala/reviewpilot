// Google Business Profile integration is frozen until Google grants API access.
// Flip GBP_ENABLED to true to re-enable the entire GBP flow (UI + API + cron).
// Hardcoded (not env-driven) to prevent accidental enablement in production.
export const GBP_ENABLED = false;
export const GBP_STATUS_LABEL = "Coming Soon";
export const GBP_COMING_SOON_MESSAGE =
  "Google Business Profile review automation is launching soon. Google Play Store is live today.";
