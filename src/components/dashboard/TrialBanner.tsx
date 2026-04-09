'use client';
import { usePlan } from '@/hooks/usePlan';

export function TrialBanner() {
  const { planId, trialDaysLeft, trialExpired } = usePlan();

  // Only show for free plan users with a trial
  if (planId !== 'free') return null;
  if (trialDaysLeft === null) return null;

  if (trialExpired) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Your free trial has ended</p>
            <p className="text-sm text-red-600 dark:text-red-400">Upgrade to continue using ReviewPilot.</p>
          </div>
          <a href="/dashboard/settings/billing" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 whitespace-nowrap ml-4">Upgrade Now</a>
        </div>
      </div>
    );
  }

  if (trialDaysLeft <= 3) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              {trialDaysLeft === 0 ? 'Last day of your free trial!' : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">Upgrade to keep your data and unlock all features.</p>
          </div>
          <a href="/dashboard/settings/billing" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 whitespace-nowrap ml-4">Upgrade Now</a>
        </div>
      </div>
    );
  }

  // Subtle reminder for 4–7 days left
  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-800 dark:text-blue-200">{trialDaysLeft} days left in your free trial</p>
        <a href="/dashboard/settings/billing" className="text-sm font-medium text-blue-700 dark:text-blue-300 underline">View Plans</a>
      </div>
    </div>
  );
}
