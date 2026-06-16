/**
 * Sequence definitions — the STRUCTURE of each nurture flow: which steps exist,
 * when each is due, and (for the state-aware free flow) whether each still
 * applies given live account state.
 *
 * Phase 2 ships the structure + scheduling + conditions only. The `render`
 * functions return null here — Phase 3 fills in the actual templates. The
 * runner treats a null render as "no content yet": in DRY_RUN it still logs the
 * would-send decision; in live mode it refuses to send a contentless step.
 */

import { SEQUENCE, TRIAL_LENGTH_DAYS } from "./config";

export interface StepRender {
  subject: string;
  html: string;
  text?: string;
}

/** Context for analyzer-lead steps (not state-aware). */
export interface AnalyzerCtx {
  email: string;
  appName?: string | null;
  unlockContext?: string | null;
}

/** Live account state for the state-aware free-user flow. */
export interface FreeCtx {
  email: string;
  name?: string | null;
  plan: string;
  /** plan <> 'free' (active paid) — also true if the seat belongs to a paid workspace. */
  isPaid: boolean;
  trialEndsAt: Date | null;
  hasConnection: boolean;
  hasActivity: boolean;
  onboardingCompleted: boolean;
}

export interface StepDef<Ctx> {
  step: number;
  /** Stable human label for logs/audit (not the DB key). */
  key: string;
  /** Absolute time this step is due, or null if it is not schedulable for this ctx. */
  dueAt: (enrolledAt: Date, ctx: Ctx) => Date | null;
  /** Whether the step still applies given current state (skip when false). */
  applies: (ctx: Ctx) => boolean;
  /** Phase 3 fills this; returns null until then. */
  render: (ctx: Ctx) => StepRender | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

// ─────────────────────────────────────────────────────────────────────────────
// Analyzer-lead sequence (Day 0 / Day 2 / Day 5). Always applicable.
// ─────────────────────────────────────────────────────────────────────────────
export const ANALYZER_STEPS: StepDef<AnalyzerCtx>[] = [
  {
    step: 0,
    key: "recap",
    dueAt: (enrolledAt) => enrolledAt,
    applies: () => true,
    render: () => null, // Phase 3
  },
  {
    step: 1,
    key: "common_fixes",
    dueAt: (enrolledAt) => addDays(enrolledAt, 2),
    applies: () => true,
    render: () => null, // Phase 3
  },
  {
    step: 2,
    key: "trial_pitch",
    dueAt: (enrolledAt) => addDays(enrolledAt, 5),
    applies: () => true,
    render: () => null, // Phase 3
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Free-user sequence (STATE-AWARE). Countdown steps are anchored to the real
// trial_ends_at and only apply while still in trial / not yet paid.
// ─────────────────────────────────────────────────────────────────────────────
export const FREE_STEPS: StepDef<FreeCtx>[] = [
  {
    step: 0,
    key: "welcome_setup",
    // Send promptly on enrollment.
    dueAt: (enrolledAt) => enrolledAt,
    // Skip if they have already connected Play Console.
    applies: (ctx) => !ctx.hasConnection,
    render: () => null, // Phase 3
  },
  {
    step: 1,
    key: "value_nudge",
    dueAt: (enrolledAt) => addDays(enrolledAt, 2),
    // Always applies; Phase 3 branches content on hasActivity ("next win" variant).
    applies: () => true,
    render: () => null, // Phase 3
  },
  {
    step: 2,
    key: "trial_ending_2d",
    dueAt: (_enrolledAt, ctx) =>
      ctx.trialEndsAt ? addDays(ctx.trialEndsAt, -2) : null,
    // Only while genuinely still in trial and not paid.
    applies: (ctx) =>
      !ctx.isPaid && !!ctx.trialEndsAt && ctx.trialEndsAt.getTime() > Date.now(),
    render: () => null, // Phase 3
  },
  {
    step: 3,
    key: "trial_ending_1d",
    dueAt: (_enrolledAt, ctx) =>
      ctx.trialEndsAt ? addDays(ctx.trialEndsAt, -1) : null,
    applies: (ctx) =>
      !ctx.isPaid && !!ctx.trialEndsAt && ctx.trialEndsAt.getTime() > Date.now(),
    render: () => null, // Phase 3
  },
  {
    step: 4,
    key: "winback",
    dueAt: (_enrolledAt, ctx) =>
      ctx.trialEndsAt ? addDays(ctx.trialEndsAt, 3) : null,
    // Soft win-back after the trial ended, only if they never converted.
    applies: (ctx) => !ctx.isPaid && !!ctx.trialEndsAt,
    render: () => null, // Phase 3
  },
];

export function stepsForSequence(
  sequenceKey: string
): StepDef<AnalyzerCtx>[] | StepDef<FreeCtx>[] {
  switch (sequenceKey) {
    case SEQUENCE.ANALYZER_LEAD:
      return ANALYZER_STEPS;
    case SEQUENCE.FREE_USER:
      return FREE_STEPS;
    default:
      return [];
  }
}

// Re-export so callers can compute trial windows without re-deriving the length.
export { TRIAL_LENGTH_DAYS };
