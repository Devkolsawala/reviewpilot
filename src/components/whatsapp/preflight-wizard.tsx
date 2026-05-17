"use client";

/**
 * PreFlight onboarding wizard.
 *
 * Educates the user about the implications of connecting their WhatsApp
 * number to ReviewPilot BEFORE the existing connection flows (Embedded
 * Signup or manual System User token) launch. This component is purely a
 * UI/UX layer — it does not touch the OAuth callback, webhook handler,
 * AI reply pipeline, or any DB schema.
 *
 * Step 5 reuses the existing two-option picker from v1 and hands the user
 * off to either <EmbeddedSignupButton /> (which then shows the PIN modal
 * and the FB popup) or <WhatsAppConnectWizard /> (the manual flow).
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  Info,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Connection } from "@/types/connection";

import { EmbeddedSignupButton } from "@/components/whatsapp/embedded-signup-button";
import { WhatsAppConnectWizard } from "@/components/dashboard/WhatsAppConnectWizard";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const FOUNDER_BOOKING_URL =
  process.env.NEXT_PUBLIC_FOUNDER_BOOKING_URL ||
  "mailto:dev@reviewpilot.co.in?subject=ReviewPilot%20WhatsApp%20setup%20help&body=Hi%20Dev%2C%20I%20need%20help%20deciding%20how%20to%20connect%20my%20WhatsApp.%20Can%20we%20hop%20on%20a%20quick%20call%3F";

const TOTAL_STEPS = 5;

export type Scenario = "A" | "B" | "C" | "D";

// -----------------------------------------------------------------------------
// Telemetry helper — keeps the call-sites tidy and the format consistent.
// Placeholder until a real analytics SDK is wired up.
// -----------------------------------------------------------------------------

type TelemetryEvent =
  | "wizard_opened"
  | "step_advanced"
  | "step_back"
  | "skip_clicked"
  | "skip_confirmed"
  | "scenario_selected"
  | "checklist_completed"
  | "routed_to_ess"
  | "routed_to_manual"
  | "booking_link_clicked"
  | "email_summary_sent"
  | "email_summary_failed"
  | "cancelled"
  | "completed";

function track(event: TelemetryEvent, context?: Record<string, unknown>) {
  if (context) {
    console.log("[preflight]", event, context);
  } else {
    console.log("[preflight]", event);
  }
}

// -----------------------------------------------------------------------------
// State helpers
// -----------------------------------------------------------------------------

interface ChecklistState {
  metaAdmin: boolean;
  phoneAccess: boolean;
  historyAccepted: boolean;
  warningsAccepted: boolean;
  emailSummary: boolean;
}

const EMPTY_CHECKLIST: ChecklistState = {
  metaAdmin: false,
  phoneAccess: false,
  historyAccepted: false,
  warningsAccepted: false,
  emailSummary: false,
};

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export interface PreflightWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Forwarded to the manual WhatsAppConnectWizard when the user picks the
   * System User token path. Called with the newly-created Connection row.
   */
  onComplete?: (connection: Connection) => void;
}

export function PreflightWizard({
  open,
  onOpenChange,
  onComplete,
}: PreflightWizardProps) {
  const [step, setStep] = useState<number>(0); // 0-indexed; Step 1 = 0
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>(EMPTY_CHECKLIST);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  // Step 5 sub-state: which method the user picked inside the final step.
  // `null` means "show the picker"; "manual" swaps in WhatsAppConnectWizard.
  const [step5Method, setStep5Method] = useState<"manual" | null>(null);

  // Reset everything when the wizard is closed so a re-open is fresh.
  useEffect(() => {
    if (!open) {
      setStep(0);
      setScenario(null);
      setChecklist(EMPTY_CHECKLIST);
      setDirection(1);
      setSkipConfirmOpen(false);
      setCancelConfirmOpen(false);
      setStep5Method(null);
    } else {
      track("wizard_opened");
    }
  }, [open]);

  const advance = useCallback(
    (to: number) => {
      track("step_advanced", { from: step + 1, to: to + 1 });
      setDirection(1);
      setStep(to);
      if (to === TOTAL_STEPS - 1) {
        track("completed");
      }
    },
    [step]
  );

  const goBack = useCallback(() => {
    if (step === 0) return;
    track("step_back", { from: step + 1 });
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }, [step]);

  // Centralized "the user wants to leave mid-flow" handler. Always asks
  // for confirmation so accidental clicks (or stray Escape presses) don't
  // wipe their progress.
  const requestCancel = useCallback(() => {
    setCancelConfirmOpen(true);
  }, []);

  const confirmCancel = useCallback(() => {
    track("cancelled", { atStep: step + 1, scenario });
    setCancelConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange, step, scenario]);

  const requestSkip = useCallback(() => {
    track("skip_clicked", { atStep: step + 1 });
    setSkipConfirmOpen(true);
  }, [step]);

  const confirmSkip = useCallback(() => {
    track("skip_confirmed", { atStep: step + 1 });
    setSkipConfirmOpen(false);
    setDirection(1);
    setStep(TOTAL_STEPS - 1);
    track("completed");
  }, [step]);

  function handleScenarioSelect(s: Scenario) {
    setScenario(s);
    track("scenario_selected", { scenario: s });
  }

  function handleChecklistChange<K extends keyof ChecklistState>(
    key: K,
    value: boolean
  ) {
    setChecklist((prev) => {
      const next = { ...prev, [key]: value };
      const requiredKeys: (keyof ChecklistState)[] = [
        "metaAdmin",
        "phoneAccess",
        "historyAccepted",
        "warningsAccepted",
      ];
      const allRequired = requiredKeys.every((k) => next[k]);
      const wasAllRequired = requiredKeys.every((k) => prev[k]);
      if (allRequired && !wasAllRequired) {
        track("checklist_completed");
      }
      return next;
    });
  }

  // After Step 4 → 5, optionally fire the email summary. We don't block on
  // it — the wizard advances immediately and any failure is surfaced as a
  // small toast (per spec).
  async function maybeSendEmailSummary() {
    if (!checklist.emailSummary || !scenario) return;
    try {
      const res = await fetch("/api/whatsapp/preflight-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const message = data?.error || `HTTP ${res.status}`;
        track("email_summary_failed", { error: message });
        toast({
          title: "Couldn't send email summary",
          description: "You can continue — the rest of the flow still works.",
          variant: "destructive",
        });
        return;
      }
      track("email_summary_sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      track("email_summary_failed", { error: message });
      toast({
        title: "Couldn't send email summary",
        description: "You can continue — the rest of the flow still works.",
        variant: "destructive",
      });
    }
  }

  function handleReadyClick() {
    advance(4);
    // Fire-and-forget — don't await; user is already on Step 5.
    void maybeSendEmailSummary();
  }

  // -- Dialog open/close routing ---------------------------------------------
  //
  // Radix's Dialog will fire onOpenChange on:
  //  · backdrop click  → we suppress via onInteractOutside.preventDefault.
  //  · Escape          → we suppress via onEscapeKeyDown.preventDefault.
  //  · explicit close  → only via our Close button → requestCancel.
  // The wrapper still uses controlled `open` so React stays in charge.

  function handleDialogOpenChange(next: boolean) {
    if (!next) {
      requestCancel();
    } else {
      onOpenChange(true);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            requestCancel();
          }}
          className={cn(
            // Mobile: full-screen slide-up. Desktop: centered modal capped
            // at 640px. We override the default Radix Dialog positioning
            // for the small-screen layout because the default uses a fixed
            // translate that doesn't play well with a full-height sheet.
            "max-w-[640px] p-0 gap-0 overflow-hidden",
            "sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl",
            // mobile = full-screen sheet
            "w-screen h-[100dvh] max-h-[100dvh] rounded-none border-0 left-0 top-0 translate-x-0 translate-y-0",
            // desktop = centered card
            "sm:w-[calc(100vw-2rem)] sm:h-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]"
          )}
          aria-label="WhatsApp connection pre-flight wizard"
        >
          {/* Header: stepper + skip + close */}
          <div className="flex items-start justify-between gap-2 border-b border-border/60 bg-background/95 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur">
            <Stepper currentStep={step} />
            <div className="flex shrink-0 items-center gap-1">
              {step < TOTAL_STEPS - 1 && (
                <button
                  type="button"
                  onClick={requestSkip}
                  className="hidden text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md px-2 py-1 sm:inline-flex"
                  aria-label="Skip wizard (I know what I'm doing)"
                >
                  Skip wizard (I know what I&apos;m doing)
                </button>
              )}
              <button
                type="button"
                onClick={requestCancel}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close wizard"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile skip link (header is too cramped on small viewports) */}
          {step < TOTAL_STEPS - 1 && (
            <div className="border-b border-border/40 bg-secondary/30 px-4 py-2 text-center sm:hidden">
              <button
                type="button"
                onClick={requestSkip}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Skip wizard (I know what I&apos;m doing)
              </button>
            </div>
          )}

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction === 1 ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === 1 ? -24 : 24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {step === 0 && (
                  <Step1Welcome
                    onContinue={() => advance(1)}
                    onCancel={requestCancel}
                  />
                )}
                {step === 1 && (
                  <Step2Scenario
                    selected={scenario}
                    onSelect={handleScenarioSelect}
                    onBack={goBack}
                    onNext={() => advance(2)}
                  />
                )}
                {step === 2 && (
                  <Step3Conditional
                    scenario={scenario}
                    onBack={goBack}
                    onProceed={() => advance(3)}
                    onChooseDifferentNumber={() => {
                      track("cancelled", {
                        atStep: 3,
                        scenario,
                        reason: "different_number_recommended",
                      });
                      toast({
                        title: "Come back when ready",
                        description:
                          "Come back when you have a dedicated business number ready.",
                      });
                      onOpenChange(false);
                    }}
                    onScenarioOverrideToB={() => {
                      // Option D → "Continue anyway" : per spec, treat as B
                      setScenario("B");
                      track("scenario_selected", {
                        scenario: "B",
                        via: "D_continue_anyway",
                      });
                      advance(3);
                    }}
                  />
                )}
                {step === 3 && (
                  <Step4Checklist
                    scenario={scenario}
                    checklist={checklist}
                    onChange={handleChecklistChange}
                    onBack={goBack}
                    onReady={handleReadyClick}
                  />
                )}
                {step === 4 && (
                  <Step5Picker
                    method={step5Method}
                    onPickEss={() => {
                      track("routed_to_ess");
                      // Close the wizard so the ESS button takes over with
                      // its own PIN modal + FB popup. The button is still
                      // rendered above (it owns its own lifecycle).
                      onOpenChange(false);
                    }}
                    onPickManual={() => {
                      track("routed_to_manual");
                      setStep5Method("manual");
                    }}
                    onManualBack={() => setStep5Method(null)}
                    onManualComplete={(conn) => {
                      onOpenChange(false);
                      onComplete?.(conn);
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* "Skip the wizard?" confirmation */}
      <Dialog open={skipConfirmOpen} onOpenChange={setSkipConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip the wizard?</DialogTitle>
            <DialogDescription>
              The wizard helps prevent common onboarding mistakes like
              accidentally losing your WhatsApp chat history. Are you sure
              you want to skip?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSkipConfirmOpen(false)}>
              Take me back to the wizard
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={confirmSkip}
            >
              Yes, skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* "Cancel and lose progress?" confirmation */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel and exit the wizard?</DialogTitle>
            <DialogDescription>
              Your progress through the pre-flight wizard will be lost. You
              can always start again from the Connections page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setCancelConfirmOpen(false)}>
              Keep going
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={confirmCancel}
            >
              Exit wizard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// -----------------------------------------------------------------------------
// Stepper UI
// -----------------------------------------------------------------------------

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={currentStep + 1}
      aria-label={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const state =
          i < currentStep ? "done" : i === currentStep ? "current" : "future";
        return (
          <div key={i} className="flex items-center">
            <div
              className={cn(
                "flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold transition-colors",
                state === "current" &&
                  "bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] text-white shadow-[0_0_0_3px_hsl(var(--ring)/0.15)]",
                state === "done" &&
                  "bg-accent/20 text-accent",
                state === "future" &&
                  "bg-secondary text-muted-foreground"
              )}
              aria-current={state === "current" ? "step" : undefined}
            >
              {state === "done" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div
                className={cn(
                  "h-px w-3 sm:w-6 transition-colors",
                  i < currentStep ? "bg-accent/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Shared bits
// -----------------------------------------------------------------------------

function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 1 — Welcome + critical disclaimer
// -----------------------------------------------------------------------------

function Step1Welcome({
  onContinue,
  onCancel,
}: {
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <StepHeading
        title="Before we connect your WhatsApp"
        subtitle="Connecting WhatsApp to ReviewPilot has important implications for how you use WhatsApp. Take 2 minutes to make sure you're set up correctly."
      />

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/30 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <Info className="h-[18px] w-[18px] text-amber-700 dark:text-amber-300" aria-hidden />
          </div>
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Important: We only see messages from the moment you connect.
            </p>
            <p className="text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
              ReviewPilot will receive new customer messages starting from
              the moment you complete this connection. We do{" "}
              <strong>NOT</strong> have access to your existing WhatsApp chat
              history — those messages stay in WhatsApp&apos;s servers and
              your phone app, but they will not appear in your ReviewPilot
              inbox.
            </p>
            <p className="text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
              This means: any reviews, complaints, or customer conversations
              from before connecting are not retrievable through ReviewPilot.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={onContinue}
        >
          I understand — let&apos;s continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="block w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md py-1"
        >
          Cancel and go back
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 2 — Current WhatsApp setup
// -----------------------------------------------------------------------------

interface ScenarioOption {
  id: Scenario;
  title: string;
  sub: string;
  Icon: typeof MessageCircle;
}

const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    id: "A",
    title: "I use WhatsApp Business app on my phone",
    sub: "The green WhatsApp Business app — separate icon from regular WhatsApp",
    Icon: MessageCircle,
  },
  {
    id: "B",
    title: "I use regular WhatsApp (personal app) for my business",
    sub: "The standard WhatsApp app — same one used for personal chats",
    Icon: MessageSquare,
  },
  {
    id: "C",
    title:
      "I have a separate business number not yet on any WhatsApp app",
    sub: "A new SIM or unused number specifically for this business",
    Icon: Phone,
  },
  {
    id: "D",
    title: "I'm not sure / something else",
    sub: "We'll guide you to the safest option",
    Icon: HelpCircle,
  },
];

function Step2Scenario({
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  selected: Scenario | null;
  onSelect: (s: Scenario) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  // Arrow-key roving focus for accessibility.
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number
  ) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = SCENARIO_OPTIONS[(index + 1) % SCENARIO_OPTIONS.length];
      onSelect(next.id);
      document
        .getElementById(`scenario-option-${next.id}`)
        ?.focus();
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev =
        SCENARIO_OPTIONS[
          (index - 1 + SCENARIO_OPTIONS.length) % SCENARIO_OPTIONS.length
        ];
      onSelect(prev.id);
      document
        .getElementById(`scenario-option-${prev.id}`)
        ?.focus();
    }
  }

  return (
    <div>
      <StepHeading
        title="How do you currently use WhatsApp for this business?"
        subtitle="This helps us recommend the right connection method for you."
      />

      <div
        role="radiogroup"
        aria-label="WhatsApp setup scenario"
        className="space-y-2.5"
      >
        {SCENARIO_OPTIONS.map((opt, idx) => {
          const isSelected = selected === opt.id;
          return (
            <div
              key={opt.id}
              id={`scenario-option-${opt.id}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!selected && idx === 0) ? 0 : -1}
              onClick={() => onSelect(opt.id)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelect(opt.id);
                } else {
                  handleKeyDown(e, idx);
                }
              }}
              className={cn(
                "group flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 sm:p-4 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "border-accent/60 bg-accent/5"
                  : "border-border hover:border-accent/40 hover:bg-secondary/40"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isSelected
                    ? "bg-accent/10 text-accent"
                    : "bg-secondary text-muted-foreground group-hover:text-foreground"
                )}
              >
                <opt.Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {opt.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                  {opt.sub}
                </p>
              </div>
              <div
                className={cn(
                  "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected
                    ? "border-accent bg-accent"
                    : "border-muted-foreground/40"
                )}
                aria-hidden
              >
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-background" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          variant="gradient"
          className="flex-1"
          disabled={!selected}
          onClick={onNext}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 3 — Conditional content
// -----------------------------------------------------------------------------

function Step3Conditional({
  scenario,
  onBack,
  onProceed,
  onChooseDifferentNumber,
  onScenarioOverrideToB,
}: {
  scenario: Scenario | null;
  onBack: () => void;
  onProceed: () => void;
  onChooseDifferentNumber: () => void;
  onScenarioOverrideToB: () => void;
}) {
  if (!scenario) {
    // Defensive — shouldn't happen because Step 2 disables Next without
    // a selection, but guard anyway.
    return (
      <div className="text-sm text-muted-foreground">
        Please go back and pick an option.
      </div>
    );
  }

  function trackBooking() {
    track("booking_link_clicked", { scenario });
  }

  if (scenario === "A") {
    return (
      <div>
        <StepHeading title="Important: connecting will change how your WhatsApp Business app works" />

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Keep column */}
          <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/30 p-4">
            <p className="mb-2.5 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              What you&apos;ll keep ✅
            </p>
            <ul className="space-y-1.5 text-sm text-emerald-900/90 dark:text-emerald-100/90">
              <KeepBullet>Your phone number stays the same</KeepBullet>
              <KeepBullet>
                Your business is still reachable on WhatsApp
              </KeepBullet>
              <KeepBullet>
                Customers can still message you on the same number
              </KeepBullet>
            </ul>
          </div>

          {/* Changes column */}
          <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/30 p-4">
            <p className="mb-2.5 text-sm font-semibold text-amber-900 dark:text-amber-100">
              What changes ⚠️
            </p>
            <ul className="space-y-1.5 text-sm text-amber-900/90 dark:text-amber-100/90">
              <ChangeBullet>
                WhatsApp Business app on this number will stop receiving NEW
                messages — incoming messages go to ReviewPilot instead
              </ChangeBullet>
              <ChangeBullet>
                All previously linked devices (WhatsApp Web, etc.) get
                unlinked
              </ChangeBullet>
              <ChangeBullet>Broadcast lists become read-only</ChangeBullet>
              <ChangeBullet>
                Group chats won&apos;t sync to ReviewPilot
              </ChangeBullet>
              <ChangeBullet>
                WhatsApp Status updates won&apos;t sync
              </ChangeBullet>
              <ChangeBullet>
                Message editing/revoke gets disabled
              </ChangeBullet>
            </ul>
          </div>
        </div>

        <InfoBox>
          <p>
            <strong>Coexistence support is coming soon.</strong> This will let
            you keep using the WhatsApp Business app alongside ReviewPilot. If
            you want to wait for Coexistence support before connecting,
            contact us to be notified when it&apos;s ready.
          </p>
        </InfoBox>

        <div className="mt-6 space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="gradient" className="flex-1" onClick={onProceed}>
              I understand — proceed with connection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <a
            href={FOUNDER_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackBooking}
            className="block text-center text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md py-1"
          >
            Wait for Coexistence — contact us
          </a>
        </div>
      </div>
    );
  }

  if (scenario === "B") {
    return (
      <div>
        <StepHeading title="Important: this number can no longer be used as personal WhatsApp" />

        <div className="rounded-xl border border-red-400/60 bg-red-50 dark:border-red-500/40 dark:bg-red-950/30 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
              <ShieldAlert
                className="h-[18px] w-[18px] text-red-700 dark:text-red-300"
                aria-hidden
              />
            </div>
            <div className="space-y-2.5">
              <p className="text-sm text-red-950 dark:text-red-100 leading-relaxed">
                Connecting this number to ReviewPilot will permanently move it
                to WhatsApp&apos;s Business platform. This means:
              </p>
              <ul className="space-y-1.5 text-sm text-red-950/90 dark:text-red-100/90">
                <RedBullet>
                  Your personal WhatsApp on this number will stop working
                </RedBullet>
                <RedBullet>
                  You will lose access to all chat history in the WhatsApp
                  app (it stays on Meta&apos;s servers but is no longer
                  accessible from a phone)
                </RedBullet>
                <RedBullet>
                  You cannot reverse this without going through a 7-day
                  cooldown period
                </RedBullet>
                <RedBullet>
                  Family and friends who message you on this number will
                  reach your business inbox in ReviewPilot
                </RedBullet>
              </ul>
            </div>
          </div>
        </div>

        <InfoBox>
          <p>
            <strong>Strong recommendation:</strong> get a separate SIM card
            (₹50-100 in India) and use that as your business number. Keep
            your existing personal WhatsApp untouched. This is what most
            businesses we work with end up doing.
          </p>
        </InfoBox>

        <div className="mt-6 space-y-2">
          <Button
            variant="gradient"
            className="w-full"
            onClick={onChooseDifferentNumber}
          >
            I&apos;ll use a different business number — let me come back later
          </Button>
          <Button
            variant="outline"
            className="w-full border-red-400/60 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-950/30"
            onClick={onProceed}
          >
            I understand the risks — proceed anyway
          </Button>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <a
              href={FOUNDER_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackBooking}
              className="text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
            >
              Talk to founder before deciding
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (scenario === "C") {
    return (
      <div>
        <StepHeading title="Great — you're set up for the smoothest onboarding" />

        <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/30 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <Sparkles
                className="h-[18px] w-[18px] text-emerald-700 dark:text-emerald-300"
                aria-hidden
              />
            </div>
            <div className="space-y-2.5">
              <p className="text-sm text-emerald-950 dark:text-emerald-100 leading-relaxed">
                Since this number isn&apos;t on any existing WhatsApp app, you
                can connect it directly without losing any data.
              </p>
              <ul className="space-y-1.5 text-sm text-emerald-950/90 dark:text-emerald-100/90">
                <KeepBullet>Your number stays yours</KeepBullet>
                <KeepBullet>
                  All future customer messages flow into ReviewPilot
                </KeepBullet>
                <KeepBullet>
                  AI-drafted replies for fast response times
                </KeepBullet>
                <KeepBullet>
                  Full template management from the dashboard
                </KeepBullet>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          You&apos;ll need to verify this number via SMS or voice call during
          the next step.
        </p>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="gradient" className="flex-1" onClick={onProceed}>
            Continue to connection
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Scenario D
  return (
    <div>
      <StepHeading
        title="No problem — let's make sure you're set up safely"
        subtitle="Choose whichever feels right. If unsure, we strongly recommend talking to us first — a 15-minute call ensures you don't lose any important data or access."
      />

      <div className="space-y-2">
        <a
          href={FOUNDER_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackBooking}
          className="block"
        >
          <Button variant="gradient" className="w-full" type="button">
            Talk to founder first (recommended)
          </Button>
        </a>
        <Button
          variant="outline"
          className="w-full"
          onClick={onChooseDifferentNumber}
        >
          I&apos;ll use a different number that&apos;s not currently on
          WhatsApp
        </Button>
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <button
            type="button"
            onClick={onScenarioOverrideToB}
            className="text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
          >
            Continue anyway and I&apos;ll figure it out
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-blue-300/60 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/30 p-4 text-sm text-blue-950 dark:text-blue-100 leading-relaxed">
      {children}
    </div>
  );
}

function KeepBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

function ChangeBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <AlertTriangle
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

function RedBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <ShieldAlert
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400"
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

// -----------------------------------------------------------------------------
// Step 4 — Pre-connection checklist
// -----------------------------------------------------------------------------

function Step4Checklist({
  scenario,
  checklist,
  onChange,
  onBack,
  onReady,
}: {
  scenario: Scenario | null;
  checklist: ChecklistState;
  onChange: <K extends keyof ChecklistState>(
    key: K,
    value: boolean
  ) => void;
  onBack: () => void;
  onReady: () => void;
}) {
  const allRequired =
    checklist.metaAdmin &&
    checklist.phoneAccess &&
    checklist.historyAccepted &&
    checklist.warningsAccepted;

  // Adjust the "warnings" copy slightly based on chosen scenario so the
  // checkbox reads truthfully.
  const warningsLabel =
    scenario === "B"
      ? "I have read the warnings on the previous screen — including the personal-WhatsApp risks — and accept the implications"
      : scenario === "A"
      ? "I have read the warnings on the previous screen — including the Business-app behavior changes — and accept the implications"
      : "I have read the warnings on the previous screen and accept the implications";

  return (
    <div>
      <StepHeading
        title="Quick pre-connection checklist"
        subtitle="Please confirm each of these before we connect:"
      />

      <div className="space-y-2.5">
        <ChecklistItem
          id="cl-meta"
          checked={checklist.metaAdmin}
          onChange={(v) => onChange("metaAdmin", v)}
          label="I have admin access to my Meta Business Account (or I'm willing to create one during the connection flow)"
        />
        <ChecklistItem
          id="cl-phone"
          checked={checklist.phoneAccess}
          onChange={(v) => onChange("phoneAccess", v)}
          label="I have access to the phone number I want to connect (for SMS verification if needed)"
        />
        <ChecklistItem
          id="cl-history"
          checked={checklist.historyAccepted}
          onChange={(v) => onChange("historyAccepted", v)}
          label="I understand that previous chat history will not appear in ReviewPilot"
        />
        <ChecklistItem
          id="cl-warnings"
          checked={checklist.warningsAccepted}
          onChange={(v) => onChange("warningsAccepted", v)}
          label={warningsLabel}
        />
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/40 p-3">
        <ChecklistItem
          id="cl-email"
          variant="optional"
          checked={checklist.emailSummary}
          onChange={(v) => onChange("emailSummary", v)}
          label={
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <span>
                <span className="text-muted-foreground">(Optional)</span>{" "}
                Email me a summary of these warnings for my records
              </span>
            </span>
          }
        />
      </div>

      <div className="mt-6 flex gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          variant="gradient"
          className="flex-1"
          disabled={!allRequired}
          onClick={onReady}
        >
          I&apos;m ready — connect now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ChecklistItem({
  id,
  checked,
  onChange,
  label,
  variant = "required",
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  variant?: "required" | "optional";
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        variant === "required"
          ? checked
            ? "border-accent/40 bg-accent/5"
            : "border-border hover:border-accent/30 hover:bg-secondary/40"
          : "border-transparent"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-border bg-background text-accent cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      />
      <span className="text-sm leading-snug text-foreground">{label}</span>
    </label>
  );
}

// -----------------------------------------------------------------------------
// Step 5 — Connection method picker (final step)
// -----------------------------------------------------------------------------

function Step5Picker({
  method,
  onPickEss,
  onPickManual,
  onManualBack,
  onManualComplete,
}: {
  method: "manual" | null;
  onPickEss: () => void;
  onPickManual: () => void;
  onManualBack: () => void;
  onManualComplete: (conn: Connection) => void;
}) {
  if (method === "manual") {
    // The existing manual wizard takes over the rest of the flow. We pass
    // its onBack into our local "go back to the picker" handler so the
    // user can switch methods without dismissing the modal.
    return (
      <WhatsAppConnectWizard
        onBack={onManualBack}
        onComplete={onManualComplete}
      />
    );
  }

  return (
    <div>
      <StepHeading title="How would you like to connect?" />

      <div className="space-y-3">
        {/* Recommended path — wraps EmbeddedSignupButton so the existing
            PIN modal + FB popup still drive the rest of the flow. */}
        <div
          className={cn(
            "rounded-xl border-2 p-4 transition-colors",
            "border-accent/40 bg-accent/5"
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Continue with Facebook
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] bg-accent/10 text-accent dark:bg-accent/15 dark:text-accent"
            >
              Recommended
            </Badge>
          </div>
          <p className="mb-3 text-xs text-muted-foreground leading-snug">
            Use your Facebook account to authorize ReviewPilot. Takes about
            60 seconds. No technical setup needed.
          </p>
          {/* Wrap the existing button so clicking it both logs telemetry
              and tells the wizard to close. The button still owns its own
              PIN modal + FB popup. */}
          <div onClickCapture={onPickEss}>
            <EmbeddedSignupButton />
          </div>
        </div>

        {/* Advanced path */}
        <button
          type="button"
          onClick={onPickManual}
          className={cn(
            "block w-full rounded-xl border-2 border-border p-4 text-left transition-colors",
            "hover:border-blue-400/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Connect with System User token
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Advanced
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            For developers and customers with existing Meta Business setups.
            Requires WhatsApp Business Account ID and System User access
            token.
          </p>
        </button>
      </div>
    </div>
  );
}
