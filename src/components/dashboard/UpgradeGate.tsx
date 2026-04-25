'use client';
import { usePlan } from '@/hooks/usePlan';

export function UpgradeGate({ feature, children, fallback }: {
 feature: string;
 children: React.ReactNode;
 fallback?: React.ReactNode;
}) {
 const { can, isLoading } = usePlan();

 // While loading, render children without gating to avoid layout shift
 if (isLoading) return <>{children}</>;
 if (can(feature)) return <>{children}</>;

 // Explicit fallback (including `null` → render nothing) takes precedence over the default card.
 // Using `fallback || default` used to treat `null` as falsy and render the default card,
 // which caused the "Upgrade to unlock" popup to flash on the inbox page for free users.
 if (fallback !== undefined) return <>{fallback}</>;

 return (
 <div className="relative">
 <div className="opacity-30 pointer-events-none blur-[2px]">{children}</div>
 <div className="absolute inset-0 flex items-center justify-center p-4">
 <div className="bg-white dark:bg-gray-900 border rounded-xl p-5 sm:p-6 text-center shadow-lg w-full max-w-sm">
 <p className="text-base sm:text-lg font-semibold mb-2">Upgrade to unlock</p>
 <p className="text-sm text-gray-500 mb-4">This feature requires a higher plan.</p>
 <a
 href="/dashboard/settings/billing"
 className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center bg-accent text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors"
 >
 Upgrade Plan
 </a>
 </div>
 </div>
 </div>
 );
}
