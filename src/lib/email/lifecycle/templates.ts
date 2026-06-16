/**
 * Lifecycle email templates (Phase 3).
 *
 * Each render returns { subject, html, text } for the BODY only. The contact
 * line, one-click "Stop these emails" link, from=noreply@ and reply-to=hello@
 * are all added by sendLifecycleEmail() — templates must NOT repeat them.
 *
 * Copy rules: plain and honest. No "real-time", "instant", or "immediately".
 * No fabricated stats, fake urgency, or invented social proof. We only state
 * what the product actually does.
 *
 * Design system: cream #F9F7F4 canvas, indigo #4338CA accent, Plus Jakarta Sans.
 */

import { NEW_SIGNUP_WINDOW_DAYS } from "./config";
import type { FreeCtx, StepRender } from "./sequences";

const INDIGO = "#4338CA";
const CREAM = "#F9F7F4";
const INK = "#1F1F2A";
const BORDER = "#E7E3DC";
const FONT =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://reviewpilot.co.in"
  );
}

const URLS = {
  connect: () => `${baseUrl()}/dashboard/settings/connections`,
  billing: () => `${baseUrl()}/dashboard/settings/billing`,
  dashboard: () => `${baseUrl()}/dashboard`,
  inbox: () => `${baseUrl()}/dashboard/inbox`,
  signup: () => `${baseUrl()}/signup`,
  analyzer: () => `${baseUrl()}/tools/play-store-analyzer`,
};

interface LayoutOpts {
  heading: string;
  /** Body paragraphs as plain strings (rendered as <p> in HTML). */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Optional bullet list rendered between paragraphs and CTA. */
  bullets?: string[];
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function layoutHtml(o: LayoutOpts): string {
  const paras = o.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${INK};">${p}</p>`
    )
    .join("");
  const bullets = o.bullets?.length
    ? `<ul style="margin:0 0 18px;padding-left:20px;color:${INK};font-size:15px;line-height:1.6;">${o.bullets
        .map((b) => `<li style="margin:0 0 6px;">${b}</li>`)
        .join("")}</ul>`
    : "";
  const cta = o.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="border-radius:10px;background:${INDIGO};">
        <a href="${o.cta.url}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(
        o.cta.label
      )}</a></td></tr></table>`
    : "";

  return `<div style="background:${CREAM};padding:28px 16px;font-family:${FONT};">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;padding:32px 30px;">
    <div style="font-size:14px;font-weight:700;color:${INDIGO};letter-spacing:0.02em;margin-bottom:20px;">ReviewPilot</div>
    <h1 style="font-size:21px;line-height:1.3;font-weight:700;color:${INK};margin:0 0 16px;">${esc(
      o.heading
    )}</h1>
    ${paras}
    ${bullets}
    ${cta}
  </div>
</div>`;
}

function layoutText(o: LayoutOpts): string {
  const parts = [o.heading, "", ...o.paragraphs];
  if (o.bullets?.length) {
    parts.push("", ...o.bullets.map((b) => `- ${b}`));
  }
  if (o.cta) {
    parts.push("", `${o.cta.label}: ${o.cta.url}`);
  }
  return parts.join("\n");
}

function build(subject: string, o: LayoutOpts): StepRender {
  return { subject, html: layoutHtml(o), text: layoutText(o) };
}

function daysUntil(d: Date | null): number {
  if (!d) return 0;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}

// ── Analyzer-lead templates ─────────────────────────────────────────────────
export function renderAnalyzerRecap(): StepRender {
  return build("A quick recap of your Play Store review analysis", {
    heading: "Here's what your review analysis covered",
    paragraphs: [
      "Thanks for running your app through the ReviewPilot analyzer. In case it's useful, here's a recap of what it looked at:",
    ],
    bullets: [
      "Your developer response rate on recent reviews",
      "Sentiment split across positive, neutral, and negative",
      "The complaint and praise themes that came up most",
      "A sample reply written for the worst unanswered review",
    ],
    cta: { label: "Run another analysis", url: URLS.analyzer() },
  });
}

export function renderAnalyzerCommonFixes(): StepRender {
  return build("Three fixes that tend to lift review scores", {
    heading: "The changes that usually move the needle",
    paragraphs: [
      "From looking at a lot of Play Store listings, three habits do most of the work on a rating over time:",
    ],
    bullets: [
      "Reply to negative reviews while they're still recent — a reply often nudges an updated rating.",
      "Tackle the single most common complaint theme first, rather than spreading effort thin.",
      "Ask happy users to revisit their review after you ship a fix they asked for.",
    ],
    cta: { label: "See how ReviewPilot helps", url: URLS.signup() },
  });
}

export function renderAnalyzerTrialPitch(): StepRender {
  return build("Want this handled for you? (7-day free trial)", {
    heading: "Put your review replies on autopilot",
    paragraphs: [
      "ReviewPilot keeps an eye on your Play Store reviews, drafts a reply for each one in your tone, and lets you approve or auto-post — so you're not starting from a blank box every time.",
      "The trial runs for 7 days, no card needed to look around.",
    ],
    cta: { label: "Start your free trial", url: URLS.signup() },
  });
}

// ── Free-user templates ─────────────────────────────────────────────────────
function isFreshSignup(ctx: FreeCtx): boolean {
  return (
    Date.now() - ctx.createdAt.getTime() <
    NEW_SIGNUP_WINDOW_DAYS * 86400000
  );
}

export function renderFreeWelcomeSetup(ctx: FreeCtx): StepRender {
  if (isFreshSignup(ctx)) {
    // Fresh signup → genuine welcome + connect prompt.
    return build("Welcome to ReviewPilot — let's connect your app", {
      heading: "Welcome aboard",
      paragraphs: [
        "Glad you're here. ReviewPilot helps you stay on top of your Play Store reviews and reply to them without the busywork.",
        "The one step that unlocks everything is connecting your app, so we can pull in your reviews:",
      ],
      cta: { label: "Connect your app", url: URLS.connect() },
    });
  }
  // Backfilled / established account that never connected → re-engagement,
  // no "welcome" wording.
  return build("Here's what you might be missing", {
    heading: "Your ReviewPilot account is still waiting on one step",
    paragraphs: [
      "You created a ReviewPilot account a while back but haven't connected an app yet — so it hasn't had anything to work with.",
      "Once your app is connected, ReviewPilot pulls in your Play Store reviews and drafts a reply for each one in your tone:",
    ],
    bullets: [
      "AI-drafted replies you can approve or edit",
      "A sentiment and theme breakdown of your reviews",
      "A daily digest so nothing slips through",
    ],
    cta: { label: "Connect your app", url: URLS.connect() },
  });
}

export function renderFreeValueNudge(ctx: FreeCtx): StepRender {
  if (ctx.hasActivity) {
    // Already replying → "next win" variant.
    return build("Your next win with ReviewPilot", {
      heading: "You're rolling — here's how to get more out of it",
      paragraphs: [
        "Now that you're replying to reviews, a few features tend to save the most time next:",
      ],
      bullets: [
        "Auto-reply rules for the rating bands you trust",
        "The weekly digest, for a quick read on where sentiment is heading",
        "The recovery view, to follow up on reviews you've turned around",
      ],
      cta: { label: "Open your dashboard", url: URLS.dashboard() },
    });
  }
  return build("A calmer way to handle your Play Store reviews", {
    heading: "What ReviewPilot does on your free plan",
    paragraphs: [
      "If replying to reviews keeps falling to the bottom of the list, here's what's already included on your plan:",
    ],
    bullets: [
      "An AI-drafted reply for each review, in your tone",
      "Sentiment and theme tags so you can see patterns",
      "A daily digest of what changed",
    ],
    cta: { label: "Go to your inbox", url: URLS.inbox() },
  });
}

export function renderTrialEnding2d(ctx: FreeCtx): StepRender {
  const n = daysUntil(ctx.trialEndsAt);
  const when = n <= 1 ? "soon" : `in ${n} days`;
  return build(`Your ReviewPilot trial ends ${when}`, {
    heading: `Your trial ends ${when}`,
    paragraphs: [
      `Your free trial wraps up ${when}. If ReviewPilot has been pulling its weight, picking a plan keeps everything running without a gap:`,
    ],
    bullets: [
      "Auto-reply and bulk reply",
      "Sentiment analysis and advanced analytics",
      "Higher reply limits and more connected apps",
    ],
    cta: { label: "Choose a plan", url: URLS.billing() },
  });
}

export function renderTrialEnding1d(ctx: FreeCtx): StepRender {
  const n = daysUntil(ctx.trialEndsAt);
  const when = n <= 1 ? "tomorrow" : `in ${n} days`;
  return build(`Your ReviewPilot trial ends ${when}`, {
    heading: `Last call — your trial ends ${when}`,
    paragraphs: [
      `A quick heads-up that your trial ends ${when}. If you'd like to keep auto-reply, sentiment analysis, and the higher limits, you can pick a plan in a minute:`,
      "Prefer to stay on the free plan? No action needed — your account simply continues with the free features.",
    ],
    cta: { label: "Choose a plan", url: URLS.billing() },
  });
}

export function renderWinback(): StepRender {
  return build("Still want a hand with your reviews?", {
    heading: "No rush — the door's open whenever you're ready",
    paragraphs: [
      "Your trial has ended and you're back on the free plan, which is completely fine.",
      "If the paid features would help — auto-reply, sentiment analysis, higher limits — you can turn them on any time. And if something didn't click for you, just reply and tell me; I read every response.",
    ],
    cta: { label: "See the plans", url: URLS.billing() },
  });
}
