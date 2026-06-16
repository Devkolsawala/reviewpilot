/**
 * Pure sequence decision engine — no I/O.
 *
 * Given an enrollment's anchor time, the live context, the step definitions,
 * and the set of steps already handled (sent/pending/skipped), decide what to
 * do on this run:
 *
 *   - any leading steps whose condition is no longer met are returned as `skips`
 *     (recorded as 'skipped' so they're never reconsidered);
 *   - then exactly one terminal action:
 *       send     — the next due, applicable, unsent step is ready now;
 *       wait      — the next applicable step is in the future (its dueAt);
 *       complete  — no steps remain.
 *
 * Recomputed from scratch every run, so live state changes (e.g. the user just
 * connected Play Console) are reflected immediately and idempotently.
 */

import type { StepDef } from "./sequences";

export interface StepRef {
  step: number;
  key: string;
}

export type Terminal =
  | { type: "send"; step: number; key: string }
  | { type: "wait"; at: Date; step: number; key: string }
  | { type: "complete" };

export interface Decision {
  /** Steps to record as 'skipped' (condition already met / not schedulable). */
  skips: StepRef[];
  terminal: Terminal;
}

export function decideNextStep<Ctx>(
  enrolledAt: Date,
  ctx: Ctx,
  steps: StepDef<Ctx>[],
  handledSteps: ReadonlySet<number>,
  now: Date
): Decision {
  const skips: StepRef[] = [];

  for (const def of steps) {
    if (handledSteps.has(def.step)) continue;

    if (!def.applies(ctx)) {
      skips.push({ step: def.step, key: def.key });
      continue;
    }

    const due = def.dueAt(enrolledAt, ctx);
    if (due === null) {
      // Not schedulable for this ctx (e.g. no trial date) — skip it.
      skips.push({ step: def.step, key: def.key });
      continue;
    }

    if (due.getTime() > now.getTime()) {
      return {
        skips,
        terminal: { type: "wait", at: due, step: def.step, key: def.key },
      };
    }

    return {
      skips,
      terminal: { type: "send", step: def.step, key: def.key },
    };
  }

  return { skips, terminal: { type: "complete" } };
}
