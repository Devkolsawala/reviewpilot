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
 * Max NEW free-user enrollments written per run. New signups (recent) are
 * always enrolled; the remaining capacity backfills the oldest un-enrolled
 * free users. Kept conservative for the Resend Free tier (100/day).
 */
export const FREE_ENROLL_CAP_PER_RUN = Number(
  process.env.LIFECYCLE_FREE_ENROLL_CAP ?? 40
);

/** A free signup newer than this is treated as "new" (always enrolled). */
export const NEW_SIGNUP_WINDOW_DAYS = 2;

/** Stable sequence keys (must match lifecycle_enrollments.sequence_key). */
export const SEQUENCE = {
  ANALYZER_LEAD: "analyzer_lead_v1",
  FREE_USER: "free_user_v1",
} as const;
