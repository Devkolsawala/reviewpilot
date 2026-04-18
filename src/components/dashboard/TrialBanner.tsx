'use client';
import { usePathname } from 'next/navigation';
import { usePlan } from '@/hooks/usePlan';
import Link from 'next/link';
import { AlertTriangle, Clock, Sparkles } from 'lucide-react';

export function TrialBanner() {
  const pathname = usePathname();
  const { planId, plan, trialDaysLeft, trialExpired, isLoading, cancellationPending, cancelDate } = usePlan();

  const isBillingPage = pathname === '/dashboard/settings/billing';

  if (isLoading) return null;

  // ── PAID PLAN: cancellation pending ──
  if (!isBillingPage && planId !== 'free' && cancellationPending && cancelDate) {
    const msLeft = cancelDate.getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
    const dateLabel = cancelDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    if (daysLeft <= 3) {
      return (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-sans text-sm font-semibold tracking-tight text-destructive">
                {daysLeft === 0 ? `Your ${plan.name} plan expires today` : `Your ${plan.name} plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
              </p>
              <p className="mt-0.5 text-xs text-destructive/80">
                After {dateLabel}, your account moves to the free plan.
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings/billing" className="shrink-0 rounded-lg bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_16px_-4px_hsl(var(--ring)/0.6)] hover:brightness-110 whitespace-nowrap transition-all">
            Re-subscribe
          </Link>
        </div>
      );
    }

    return (
      <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-sans text-sm font-semibold tracking-tight text-amber-600 dark:text-amber-400">
              Your {plan.name} plan expires in {daysLeft} days
            </p>
            <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
              Active until {dateLabel}. Re-subscribe to avoid losing access.
            </p>
          </div>
        </div>
        <Link href="/dashboard/settings/billing" className="shrink-0 rounded-lg bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_16px_-4px_hsl(var(--ring)/0.6)] hover:brightness-110 whitespace-nowrap transition-all">
          Re-subscribe
        </Link>
      </div>
    );
  }

  // ── FREE PLAN: trial states ──
  if (isBillingPage) return null;
  if (planId !== 'free') return null;
  if (trialDaysLeft === null) return null;

  if (trialExpired) {
    return (
      <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-sans text-sm font-semibold tracking-tight text-destructive">Your free trial has ended</p>
            <p className="mt-0.5 text-xs text-destructive/80">Upgrade to continue using ReviewPilot.</p>
          </div>
        </div>
        <Link href="/dashboard/settings/billing" className="shrink-0 rounded-lg bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_16px_-4px_hsl(var(--ring)/0.6)] hover:brightness-110 whitespace-nowrap transition-all">
          Upgrade now
        </Link>
      </div>
    );
  }

  if (trialDaysLeft <= 3) {
    return (
      <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-sans text-sm font-semibold tracking-tight text-amber-600 dark:text-amber-400">
              {trialDaysLeft === 0 ? 'Last day of your free trial' : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`}
            </p>
            <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">Upgrade to keep your data and unlock all features.</p>
          </div>
        </div>
        <Link href="/dashboard/settings/billing" className="shrink-0 rounded-lg bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_16px_-4px_hsl(var(--ring)/0.6)] hover:brightness-110 whitespace-nowrap transition-all">
          Upgrade now
        </Link>
      </div>
    );
  }

  // Subtle reminder 4–7 days
  if (trialDaysLeft <= 7) {
    return (
      <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <p className="text-sm text-foreground/85">{trialDaysLeft} days left in your free trial</p>
        </div>
        <Link href="/dashboard/settings/billing" className="text-xs font-medium text-accent hover:underline whitespace-nowrap">
          View plans →
        </Link>
      </div>
    );
  }

  return null;
}
