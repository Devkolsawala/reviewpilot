'use client';
import { usePathname } from 'next/navigation';
import { usePlan } from '@/hooks/usePlan';

export function TrialBanner() {
  const pathname = usePathname();
  const { planId, plan, trialDaysLeft, trialExpired, isLoading, cancellationPending, cancelDate } = usePlan();

  // Billing page shows its own cancellation banners — don't duplicate
  const isBillingPage = pathname === '/dashboard/settings/billing';

  if (isLoading) return null;

  // ── PAID PLAN: cancellation pending — show days countdown ──────────────────
  if (!isBillingPage && planId !== 'free' && cancellationPending && cancelDate) {
    const msLeft = cancelDate.getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
    const dateLabel = cancelDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    if (daysLeft <= 3) {
      return (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">
                {daysLeft === 0 ? `Your ${plan.name} plan expires today!` : `Your ${plan.name} plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                After {dateLabel}, your account moves to the free plan.
              </p>
            </div>
            <a href="/dashboard/settings/billing" className="shrink-0 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
              Re-subscribe
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Your {plan.name} plan expires in {daysLeft} days
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
              Active until {dateLabel}. Re-subscribe to avoid losing access.
            </p>
          </div>
          <a href="/dashboard/settings/billing" className="shrink-0 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
            Re-subscribe
          </a>
        </div>
      </div>
    );
  }

  // ── FREE PLAN: trial states ─────────────────────────────────────────────────
  // Billing page shows its own trial banner — don't duplicate
  if (isBillingPage) return null;
  if (planId !== 'free') return null;
  if (trialDaysLeft === null) return null;

  if (trialExpired) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Your free trial has ended</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">Upgrade to continue using ReviewPilot.</p>
          </div>
          <a href="/dashboard/settings/billing" className="shrink-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
            Upgrade Now
          </a>
        </div>
      </div>
    );
  }

  if (trialDaysLeft <= 3) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              {trialDaysLeft === 0 ? 'Last day of your free trial!' : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">Upgrade to keep your data and unlock all features.</p>
          </div>
          <a href="/dashboard/settings/billing" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
            Upgrade Now
          </a>
        </div>
      </div>
    );
  }

  // Subtle reminder for 4–7 days left
  if (trialDaysLeft <= 7) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">{trialDaysLeft} days left in your free trial</p>
          <a href="/dashboard/settings/billing" className="text-sm font-medium text-blue-700 dark:text-blue-300 underline whitespace-nowrap">View Plans</a>
        </div>
      </div>
    );
  }

  return null;
}
