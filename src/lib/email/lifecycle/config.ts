/**
 * Lifecycle engine configuration knobs.
 *
 * DRY_RUN defaults ON and is only disabled by an explicit LIFECYCLE_DRY_RUN
 * env value of "false" — so flipping to live sending is a deliberate manual
 * step. In DRY_RUN the cron makes NO writes and sends NO mail; it only logs the
 * full plan (who would be enrolled / emailed, with sequence + step + reason).
 */
export const DRY_RUN = process.env.LIFECYCLE_DRY_RUN !== "false";

/** Trial length (days). Confirmed in Phase 0 — handle_new_user sets now()+7d. */
export const TRIAL_LENGTH_DAYS = 7;

/**
 * Max EXISTING free users (backfill) enrolled per run. New signups within
 * NEW_SIGNUP_WINDOW_DAYS are always enrolled and do NOT count against this — so
 * recent users start their flow promptly while the historical backlog drips in
 * a few per day. Lower this to drip the backlog more slowly.
 */
export const FREE_BACKFILL_CAP_PER_RUN = Number(
  process.env.LIFECYCLE_FREE_BACKFILL_CAP ?? 10
);

/**
 * Hard ceiling on emails actually SENT per run, across all sequences. This is
 * the deliverability throttle (separate from the enrollment cap): even if many
 * steps are due, only this many send; the rest defer to the next run. Send
 * intents are ordered most-overdue-first so time-critical trial-countdown
 * emails are never starved behind welcome/value nudges. Kept well under the
 * Resend Free tier's 100/day, which is shared with digest/alerts/analyzer mail.
 */
export const SEND_CAP_PER_RUN = Number(
  process.env.LIFECYCLE_SEND_CAP ?? 25
);

/** A free signup newer than this is treated as "new" (always enrolled). */
export const NEW_SIGNUP_WINDOW_DAYS = 2;

/** Stable sequence keys (must match lifecycle_enrollments.sequence_key). */
export const SEQUENCE = {
  ANALYZER_LEAD: "analyzer_lead_v1",
  FREE_USER: "free_user_v1",
} as const;
