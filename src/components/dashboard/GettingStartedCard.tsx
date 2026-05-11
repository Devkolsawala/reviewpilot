"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CELEBRATED_KEY = "rp:onboarding:celebrated";

export interface OnboardingStep {
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  done: boolean;
}

interface GettingStartedCardProps {
  steps: OnboardingStep[];
}

function CompletionRing({ complete, total }: { complete: number; total: number }) {
  const radius = 22;
  const stroke = 4;
  const c = 2 * Math.PI * radius;
  const pct = total === 0 ? 0 : Math.min(1, complete / total);
  const offset = c - pct * c;
  return (
    <div className="relative h-[52px] w-[52px] shrink-0">
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="url(#rp-getstarted-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 26 26)"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
        <defs>
          <linearGradient id="rp-getstarted-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-[11px] font-semibold leading-none">
        <span className="text-foreground">{complete}/{total}</span>
        <span className="text-[8px] text-muted-foreground/70 uppercase tracking-wider mt-0.5">done</span>
      </div>
    </div>
  );
}

function Confetti() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  // 12 little sparkle pieces shooting outwards from the centre
  const pieces = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden" aria-hidden>
      {pieces.map((i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dist = 80 + (i % 3) * 18;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const colors = ["#6366f1", "#8b5cf6", "#d946ef", "#10b981", "#f59e0b"];
        const color = colors[i % colors.length];
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: dx, y: dy, opacity: [0, 1, 0], scale: [0.4, 1, 0.8] }}
            transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.02 }}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
          />
        );
      })}
    </div>
  );
}

export function GettingStartedCard({ steps }: GettingStartedCardProps) {
  const reduceMotion = useReducedMotion();
  const total = steps.length;
  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === total;

  const [expandCompleted, setExpandCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fire confetti exactly once per user when 4/4 is first reached.
  useEffect(() => {
    if (!allDone) return;
    try {
      if (window.localStorage.getItem(CELEBRATED_KEY) === "1") return;
      window.localStorage.setItem(CELEBRATED_KEY, "1");
    } catch { /* ignore */ }
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 1400);
    return () => clearTimeout(t);
  }, [allDone]);

  const nextIncomplete = useMemo(
    () => steps.find((s) => !s.done),
    [steps]
  );

  // Visible incomplete steps (excluding the highlighted "next" one)
  const remainingIncomplete = steps.filter((s) => !s.done && s !== nextIncomplete);
  const completedSteps = steps.filter((s) => s.done);

  if (allDone) {
    return (
      <Card className="relative overflow-hidden border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.06)_0%,rgba(99,102,241,0.04)_50%,rgba(217,70,239,0.06)_100%)]">
        {showConfetti && <Confetti />}
        <CardContent className="p-6 text-center relative">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#10b981_0%,#6366f1_50%,#d946ef_100%)] shadow-[0_0_24px_-6px_rgba(99,102,241,0.6)]"
          >
            <Sparkles className="h-6 w-6 text-white" aria-hidden />
          </motion.div>
          <h3 className="font-sans text-base font-semibold tracking-tight">You&apos;re all set!</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Every onboarding step is complete. ReviewPilot is fully running on autopilot.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CompletionRing complete={completedCount} total={total} />
          <div className="min-w-0 flex-1">
            <h3 className="font-sans text-sm font-semibold tracking-tight">Getting Started</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedCount === 0
                ? "Connect a source to start replying with AI."
                : `Nice work — ${total - completedCount} step${
                    total - completedCount === 1 ? "" : "s"
                  } left.`}
            </p>
          </div>
        </div>

        {/* Highlighted next step */}
        {nextIncomplete && (
          <Link
            href={nextIncomplete.href}
            className={cn(
              "group relative block rounded-xl p-[1px] transition-shadow",
              "bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] hover:shadow-[0_0_18px_-6px_hsl(var(--ring)/0.5)]"
            )}
          >
            <div className="flex items-center gap-3 rounded-[11px] bg-card p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
                <nextIncomplete.icon className="h-4 w-4 text-accent" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-accent/80">
                  Next step
                </p>
                <p className="text-sm font-medium truncate">{nextIncomplete.label}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent group-hover:translate-x-0.5 transition-transform">
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        )}

        {/* Remaining incomplete steps */}
        {remainingIncomplete.length > 0 && (
          <ul className="space-y-1">
            {remainingIncomplete.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-border/60 bg-card text-muted-foreground">
                    <s.icon className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="flex-1 text-xs text-foreground/80 group-hover:text-foreground truncate">
                    {s.label}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Completed steps collapse */}
        {completedSteps.length > 0 && (
          <div className="border-t border-border/60 pt-3">
            <button
              type="button"
              onClick={() => setExpandCompleted((v) => !v)}
              className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={expandCompleted}
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                <span className="font-medium">
                  {completedSteps.length} completed
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  expandCompleted && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            <AnimatePresence initial={false}>
              {expandCompleted && (
                <motion.ul
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden mt-1 space-y-1"
                >
                  {completedSteps.map((s) => (
                    <li
                      key={s.label}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                      </span>
                      <span className="flex-1 text-xs text-muted-foreground line-through truncate">
                        {s.label}
                      </span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
