/**
 * Lifecycle engine orchestrator: enroll → plan → capped send → advance.
 *
 * One entry point, two modes (gated by DRY_RUN):
 *   - DRY_RUN (default): NO writes, NO mail. Logs the full plan — who would be
 *     enrolled and which step would send, with audience + sequence + reason.
 *   - live (LIFECYCLE_DRY_RUN=false): writes enrollments, sends due steps via
 *     sendLifecycleEmail (which re-checks suppression + logs send-once), and
 *     advances enrollment state. Fully idempotent — safe to re-run.
 *
 * Two throttles protect deliverability on the Resend Free tier:
 *   - FREE_BACKFILL_CAP_PER_RUN — how many EXISTING free users join the funnel
 *     per run (new signups are exempt and always enrolled);
 *   - SEND_CAP_PER_RUN — a hard ceiling on emails actually sent per run, across
 *     all sequences. Sends are ordered most-overdue-first so time-critical
 *     trial-countdown mail is never starved behind welcome/value nudges; any
 *     overflow defers to the next run.
 *
 * Safety re-checks happen before every send: suppression (email_suppression +
 * digest list='all') and live paid/seat status (active paid → 'converted',
 * skip). Cross-audience dedup: the free-user sequence wins.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DRY_RUN,
  FREE_BACKFILL_CAP_PER_RUN,
  SEND_CAP_PER_RUN,
  NEW_SIGNUP_WINDOW_DAYS,
  SEQUENCE,
} from "./config";
import {
  buildAccountIndex,
  fetchFreeUserState,
  type Account,
  type AccountIndex,
} from "./accounts";
import {
  ANALYZER_STEPS,
  FREE_STEPS,
  type AnalyzerCtx,
  type FreeCtx,
  type StepRender,
} from "./sequences";
import { decideNextStep } from "./engine";
import { sendLifecycleEmail } from "./send";
import { normalizeEmail } from "./unsubscribe-token";

type AdminClient = ReturnType<typeof createAdminClient>;
const DAY_MS = 24 * 60 * 60 * 1000;

type Audience = "analyzer_lead" | "free_user";

interface WorkItem {
  id: string | null; // null = candidate not yet persisted (dry-run only)
  email: string;
  userId: string | null;
  audience: Audience;
  sequenceKey: string;
  enrolledAt: Date;
  isCandidate: boolean;
}

/** A due step ready to send, deferred to the capped send phase. */
interface SendIntent {
  w: WorkItem;
  step: number;
  key: string;
  dueAt: Date;
  render: (s: number) => StepRender | null;
  recompute: (handled: Set<number>) => ReturnType<typeof decideNextStep>;
  handled: Set<number>;
}

export interface LogEntry {
  email: string;
  audience: Audience;
  sequence: string;
  action:
    | "enroll"
    | "send"
    | "skip_step"
    | "wait"
    | "complete"
    | "suppressed"
    | "converted"
    | "deferred"
    | "hold";
  step?: number;
  key?: string;
  reason: string;
}

export interface RunSummary {
  dryRun: boolean;
  now: string;
  counts: {
    accounts: number;
    enrollAnalyzer: number;
    enrollFree: number;
    suppressedSuperseded: number;
    wouldSend: number;
    sent: number;
    deferred: number;
    skippedSteps: number;
    suppressed: number;
    converted: number;
    waiting: number;
    completed: number;
    held: number;
  };
  log: LogEntry[];
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

function addLog(
  log: LogEntry[],
  w: WorkItem,
  action: LogEntry["action"],
  reason: string,
  step?: number,
  key?: string
): void {
  log.push({
    email: maskEmail(w.email),
    audience: w.audience,
    sequence: w.sequenceKey,
    action,
    step,
    key,
    reason,
  });
}

export async function runLifecycle(now: Date = new Date()): Promise<RunSummary> {
  const admin = createAdminClient();
  const execute = !DRY_RUN;
  const log: LogEntry[] = [];
  const c: RunSummary["counts"] = {
    accounts: 0,
    enrollAnalyzer: 0,
    enrollFree: 0,
    suppressedSuperseded: 0,
    wouldSend: 0,
    sent: 0,
    deferred: 0,
    skippedSteps: 0,
    suppressed: 0,
    converted: 0,
    waiting: 0,
    completed: 0,
    held: 0,
  };

  const index = await buildAccountIndex(admin);
  c.accounts = index.accounts.length;

  // Prefetch suppression signals (in-memory; avoids per-row queries).
  const [{ data: supRows }, { data: unsubAllRows }, { data: existing }] =
    await Promise.all([
      admin.from("email_suppression").select("email"),
      admin.from("email_unsubscribes").select("email").eq("list", "all"),
      admin
        .from("lifecycle_enrollments")
        .select("id, email, user_id, audience, sequence_key, enrolled_at, status, next_send_at"),
    ]);

  const suppressed = new Set(
    (supRows ?? []).map((r) => normalizeEmail(r.email as string))
  );
  for (const r of unsubAllRows ?? []) {
    if (r.email) suppressed.add(normalizeEmail(r.email as string));
  }
  const enrollmentKey = (email: string, seq: string) => `${email}::${seq}`;
  const existingByKey = new Map<string, NonNullable<typeof existing>[number]>();
  for (const e of existing ?? []) {
    existingByKey.set(
      enrollmentKey(normalizeEmail(e.email as string), e.sequence_key as string),
      e
    );
  }

  // ── ENROLL: free users (new signups always; backfill capped) ──────────────
  const freeOwners = index.accounts.filter(
    (a) => a.plan === "free" && a.ownerId === null && !suppressed.has(a.email)
  );
  const freeNotEnrolled = freeOwners.filter(
    (a) => !existingByKey.has(enrollmentKey(a.email, SEQUENCE.FREE_USER))
  );
  const cutoff = now.getTime() - NEW_SIGNUP_WINDOW_DAYS * DAY_MS;
  const newSignups = freeNotEnrolled.filter(
    (a) => a.createdAt.getTime() >= cutoff
  );
  // Backfill only the historical backlog, oldest first, capped per run.
  const backfillPool = freeNotEnrolled
    .filter((a) => a.createdAt.getTime() < cutoff)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const freeToEnroll: Account[] = [
    ...newSignups,
    ...backfillPool.slice(0, FREE_BACKFILL_CAP_PER_RUN),
  ];
  const freeEnrollEmails = new Set(freeToEnroll.map((a) => a.email));

  // ── ENROLL: analyzer leads (distinct emails; free wins; skip registered) ──
  const { data: leadRows } = await admin.from("analyzer_leads").select("email");
  const leadEmails = new Set(
    (leadRows ?? []).map((r) => normalizeEmail(r.email as string))
  );
  const analyzerToEnroll: string[] = [];
  for (const email of Array.from(leadEmails)) {
    if (suppressed.has(email)) continue;
    if (index.registeredEmails.has(email)) continue; // free/paid user → free wins
    if (freeEnrollEmails.has(email)) continue; // about-to-be free user → free wins
    if (existingByKey.has(enrollmentKey(email, SEQUENCE.ANALYZER_LEAD))) continue;
    analyzerToEnroll.push(email);
  }

  // Cross-audience supersede: existing analyzer enrollment for an email that is
  // (now) a free user → suppress the lead sequence.
  const supersededAnalyzer: string[] = [];
  for (const a of freeOwners) {
    const ex = existingByKey.get(enrollmentKey(a.email, SEQUENCE.ANALYZER_LEAD));
    if (ex && ex.status === "active") supersededAnalyzer.push(ex.id as string);
  }

  c.enrollFree = freeToEnroll.length;
  c.enrollAnalyzer = analyzerToEnroll.length;
  c.suppressedSuperseded = supersededAnalyzer.length;

  for (const a of freeToEnroll) {
    log.push({
      email: maskEmail(a.email),
      audience: "free_user",
      sequence: SEQUENCE.FREE_USER,
      action: "enroll",
      reason:
        a.createdAt.getTime() >= cutoff
          ? "new free signup"
          : "backfill (existing free user)",
    });
  }
  for (const email of analyzerToEnroll) {
    log.push({
      email: maskEmail(email),
      audience: "analyzer_lead",
      sequence: SEQUENCE.ANALYZER_LEAD,
      action: "enroll",
      reason: "new analyzer lead",
    });
  }

  if (execute) {
    if (freeToEnroll.length > 0) {
      await admin.from("lifecycle_enrollments").upsert(
        freeToEnroll.map((a) => ({
          email: a.email,
          user_id: a.id,
          audience: "free_user",
          sequence_key: SEQUENCE.FREE_USER,
          current_step: 0,
          next_send_at: now.toISOString(),
          status: "active",
        })),
        { onConflict: "email,sequence_key", ignoreDuplicates: true }
      );
    }
    if (analyzerToEnroll.length > 0) {
      await admin.from("lifecycle_enrollments").upsert(
        analyzerToEnroll.map((email) => ({
          email,
          user_id: null,
          audience: "analyzer_lead",
          sequence_key: SEQUENCE.ANALYZER_LEAD,
          current_step: 0,
          next_send_at: now.toISOString(),
          status: "active",
        })),
        { onConflict: "email,sequence_key", ignoreDuplicates: true }
      );
    }
    if (supersededAnalyzer.length > 0) {
      await admin
        .from("lifecycle_enrollments")
        .update({ status: "suppressed" })
        .in("id", supersededAnalyzer);
    }
  }

  // ── Build the working set to PROCESS ──────────────────────────────────────
  let working: WorkItem[];
  if (execute) {
    // Reload active, due enrollments (includes the ones just inserted).
    const { data: due } = await admin
      .from("lifecycle_enrollments")
      .select("id, email, user_id, audience, sequence_key, enrolled_at")
      .eq("status", "active")
      .lte("next_send_at", now.toISOString());
    working = (due ?? []).map((e) => ({
      id: e.id as string,
      email: normalizeEmail(e.email as string),
      userId: (e.user_id as string | null) ?? null,
      audience: e.audience as Audience,
      sequenceKey: e.sequence_key as string,
      enrolledAt: e.enrolled_at ? new Date(e.enrolled_at as string) : now,
      isCandidate: false,
    }));
  } else {
    // Dry-run: simulate candidates (enrolledAt=now) + any existing active rows.
    const candidates: WorkItem[] = [
      ...freeToEnroll.map((a) => ({
        id: null,
        email: a.email,
        userId: a.id,
        audience: "free_user" as Audience,
        sequenceKey: SEQUENCE.FREE_USER,
        enrolledAt: now,
        isCandidate: true,
      })),
      ...analyzerToEnroll.map((email) => ({
        id: null,
        email,
        userId: null,
        audience: "analyzer_lead" as Audience,
        sequenceKey: SEQUENCE.ANALYZER_LEAD,
        enrolledAt: now,
        isCandidate: true,
      })),
    ];
    const supersededSet = new Set(supersededAnalyzer);
    const existingActive: WorkItem[] = (existing ?? [])
      .filter((e) => e.status === "active" && !supersededSet.has(e.id as string))
      .map((e) => ({
        id: e.id as string,
        email: normalizeEmail(e.email as string),
        userId: (e.user_id as string | null) ?? null,
        audience: e.audience as Audience,
        sequenceKey: e.sequence_key as string,
        enrolledAt: e.enrolled_at ? new Date(e.enrolled_at as string) : now,
        isCandidate: false,
      }));
    working = [...candidates, ...existingActive];
  }

  // Bulk state for the free users in the working set.
  const freeUserIds = working
    .filter((w) => w.audience === "free_user" && w.userId)
    .map((w) => w.userId as string);
  const { connected, active } = await fetchFreeUserState(admin, freeUserIds);

  const deps: PlanDeps = {
    admin,
    index,
    suppressed,
    connected,
    active,
    now,
    execute,
    log,
    counts: c,
  };

  // ── PHASE A: plan every work item (apply non-send effects, collect sends) ──
  const intents: SendIntent[] = [];
  for (const w of working) {
    const intent = await planItem(w, deps);
    if (intent) intents.push(intent);
  }

  // ── PHASE B: capped send, most-overdue first; overflow defers to next run ──
  intents.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  let sentThisRun = 0;
  for (const si of intents) {
    if (sentThisRun >= SEND_CAP_PER_RUN) {
      c.deferred++;
      addLog(log, si.w, "deferred", "send cap reached — deferred to next run", si.step, si.key);
      if (execute && si.w.id) {
        await admin
          .from("lifecycle_enrollments")
          .update({ next_send_at: new Date(now.getTime() + DAY_MS).toISOString() })
          .eq("id", si.w.id);
      }
      continue;
    }

    if (!execute) {
      c.wouldSend++;
      addLog(log, si.w, "send", "due now (dry-run — not sent)", si.step, si.key);
      sentThisRun++;
      continue;
    }

    const content = si.render(si.step);
    if (!content) {
      // Should not happen post-Phase 3 (all steps have templates). Never send
      // contentless mail; don't consume a send-cap slot.
      c.held++;
      addLog(log, si.w, "hold", "no template for step", si.step, si.key);
      continue;
    }

    const res = await sendLifecycleEmail({
      to: si.w.email,
      enrollmentId: si.w.id as string,
      sequenceKey: si.w.sequenceKey,
      step: si.step,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (res.ok || res.status === "already_sent") {
      if (res.ok) c.sent++;
      addLog(log, si.w, "send", res.ok ? "sent" : "already sent", si.step, si.key);
      sentThisRun++;
      si.handled.add(si.step);
      const next = si.recompute(si.handled);
      const update: Record<string, unknown> = {
        current_step: si.step,
        last_sent_at: now.toISOString(),
      };
      if (next.terminal.type === "wait") {
        update.next_send_at = next.terminal.at.toISOString();
      } else if (next.terminal.type === "complete") {
        update.status = "completed";
      } else {
        update.next_send_at = now.toISOString(); // another step already due
      }
      await admin
        .from("lifecycle_enrollments")
        .update(update)
        .eq("id", si.w.id as string);
    } else if (res.status === "suppressed") {
      c.suppressed++;
      addLog(log, si.w, "suppressed", "suppressed at send-time", si.step, si.key);
      await admin
        .from("lifecycle_enrollments")
        .update({ status: "suppressed" })
        .eq("id", si.w.id as string);
    } else {
      addLog(log, si.w, "hold", `send failed: ${res.error ?? "unknown"}`, si.step, si.key);
    }
  }

  // Compact console summary for the cron logs.
  console.log(
    `[lifecycle] ${DRY_RUN ? "DRY-RUN" : "LIVE"} now=${now.toISOString()} ` +
      `accounts=${c.accounts} enrollFree=${c.enrollFree} enrollAnalyzer=${c.enrollAnalyzer} ` +
      `wouldSend=${c.wouldSend} sent=${c.sent} deferred=${c.deferred} skips=${c.skippedSteps} ` +
      `suppressed=${c.suppressed} converted=${c.converted} wait=${c.waiting} done=${c.completed} held=${c.held}`
  );
  for (const e of log) {
    console.log(
      `[lifecycle] ${e.action.toUpperCase()} ${e.audience}/${e.sequence}` +
        `${e.step !== undefined ? ` step=${e.step}(${e.key})` : ""} ` +
        `${e.email} — ${e.reason}`
    );
  }

  return { dryRun: DRY_RUN, now: now.toISOString(), counts: c, log };
}

interface PlanDeps {
  admin: AdminClient;
  index: AccountIndex;
  suppressed: Set<string>;
  connected: Set<string>;
  active: Set<string>;
  now: Date;
  execute: boolean;
  log: LogEntry[];
  counts: RunSummary["counts"];
}

/**
 * Plan one work item: apply all non-send effects (suppressed / converted /
 * skips / wait / complete) and return a SendIntent if a step is due now.
 * Sending itself is deferred to the capped Phase B.
 */
async function planItem(w: WorkItem, d: PlanDeps): Promise<SendIntent | null> {
  const { admin, index, suppressed, connected, active, now, execute, log, counts } = d;

  // 1. Suppression re-check.
  if (suppressed.has(w.email)) {
    counts.suppressed++;
    addLog(log, w, "suppressed", "on suppression list");
    if (execute && w.id) {
      await admin
        .from("lifecycle_enrollments")
        .update({ status: "suppressed" })
        .eq("id", w.id);
    }
    return null;
  }

  // 2. Free-user live paid / team-seat re-check.
  const account = index.byEmail.get(w.email) ?? null;
  if (w.audience === "free_user") {
    const isPaid = index.isPaidEmail(w.email);
    const isSeat = !!account?.ownerId;
    if (isPaid || isSeat) {
      counts.converted++;
      addLog(log, w, "converted", isPaid ? "active paid customer" : "now a team-member seat");
      if (execute && w.id) {
        await admin
          .from("lifecycle_enrollments")
          .update({ status: "converted" })
          .eq("id", w.id);
        if (isPaid) {
          await admin
            .from("email_suppression")
            .upsert(
              { email: w.email, reason: "paid" },
              { onConflict: "email", ignoreDuplicates: true }
            );
        }
      }
      return null;
    }
  }

  // 3. Steps already handled (sent/pending/skipped). Failed rows can retry.
  const handled = new Set<number>();
  if (w.id) {
    const { data: sends } = await admin
      .from("lifecycle_sends")
      .select("step, status")
      .eq("enrollment_id", w.id)
      .neq("status", "failed");
    for (const s of sends ?? []) handled.add(s.step as number);
  }

  // 4. Build ctx + decide. Each branch keeps a typed render/recompute/dueAt
  // bound to the same ctx (no unsafe casts).
  let decision: ReturnType<typeof decideNextStep>;
  let render: (s: number) => StepRender | null;
  let recompute: (handledSet: Set<number>) => ReturnType<typeof decideNextStep>;
  let dueAtFor: (s: number) => Date;
  if (w.audience === "analyzer_lead") {
    const ctx: AnalyzerCtx = { email: w.email };
    decision = decideNextStep(w.enrolledAt, ctx, ANALYZER_STEPS, handled, now);
    render = (s) => ANALYZER_STEPS.find((x) => x.step === s)?.render(ctx) ?? null;
    recompute = (h) => decideNextStep(w.enrolledAt, ctx, ANALYZER_STEPS, h, now);
    dueAtFor = (s) =>
      ANALYZER_STEPS.find((x) => x.step === s)?.dueAt(w.enrolledAt, ctx) ?? now;
  } else {
    const ctx: FreeCtx = {
      email: w.email,
      name: null,
      plan: account?.plan ?? "free",
      isPaid: false, // already excluded above
      trialEndsAt: account?.trialEndsAt ?? null,
      hasConnection: w.userId ? connected.has(w.userId) : false,
      hasActivity: w.userId ? active.has(w.userId) : false,
      onboardingCompleted: account?.onboardingCompleted ?? false,
      createdAt: account?.createdAt ?? w.enrolledAt,
    };
    decision = decideNextStep(w.enrolledAt, ctx, FREE_STEPS, handled, now);
    render = (s) => FREE_STEPS.find((x) => x.step === s)?.render(ctx) ?? null;
    recompute = (h) => decideNextStep(w.enrolledAt, ctx, FREE_STEPS, h, now);
    dueAtFor = (s) =>
      FREE_STEPS.find((x) => x.step === s)?.dueAt(w.enrolledAt, ctx) ?? now;
  }

  // 5. Record skips (independent of the send cap).
  for (const sk of decision.skips) {
    counts.skippedSteps++;
    addLog(log, w, "skip_step", "condition already met / not applicable", sk.step, sk.key);
    if (execute && w.id) {
      await admin.from("lifecycle_sends").insert({
        enrollment_id: w.id,
        sequence_key: w.sequenceKey,
        step: sk.step,
        status: "skipped",
      });
    }
  }

  // 6. Terminal.
  const t = decision.terminal;
  if (t.type === "complete") {
    counts.completed++;
    addLog(log, w, "complete", "no further steps");
    if (execute && w.id) {
      await admin
        .from("lifecycle_enrollments")
        .update({ status: "completed" })
        .eq("id", w.id);
    }
    return null;
  }
  if (t.type === "wait") {
    counts.waiting++;
    addLog(log, w, "wait", `next step due ${t.at.toISOString()}`, t.step, t.key);
    if (execute && w.id) {
      await admin
        .from("lifecycle_enrollments")
        .update({ next_send_at: t.at.toISOString() })
        .eq("id", w.id);
    }
    return null;
  }

  // t.type === 'send' → hand to the capped send phase.
  return {
    w,
    step: t.step,
    key: t.key,
    dueAt: dueAtFor(t.step),
    render,
    recompute,
    handled,
  };
}
