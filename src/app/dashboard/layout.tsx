"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ProductTour } from "@/components/dashboard/ProductTour";
import { KeyboardShortcutsModal } from "@/components/dashboard/KeyboardShortcutsModal";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { TestModeBadge } from "@/components/dashboard/TestModeBadge";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { usePlan } from "@/hooks/usePlan";

function TrialExpiredLockout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border p-8 text-center max-w-md">
        <div className="text-4xl mb-4">⏰</div>
        <h2 className="text-xl font-bold mb-2">Your free trial has ended</h2>
        <p className="text-gray-500 mb-6">Upgrade to a paid plan to continue managing your reviews with AI.</p>
        <a href="/dashboard/settings/billing" className="inline-block bg-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-600">Choose a Plan</a>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { trialExpired, isLoading } = usePlan();
  const pathname = usePathname();
  const router = useRouter();

  const isBillingPage = pathname?.includes("/settings/billing");

  useEffect(() => {
    if (!isLoading && trialExpired && !isBillingPage) {
      router.replace("/dashboard/settings/billing");
    }
  }, [trialExpired, isLoading, isBillingPage, router]);

  // Show lockout overlay if trial has expired and not already on billing page
  if (!isLoading && trialExpired && !isBillingPage) {
    return <TrialExpiredLockout />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 overflow-y-auto">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-secondary/30 p-4 sm:p-6">
          <TrialBanner />
          {children}
        </main>
      </div>
      <OnboardingModal />
      <ProductTour />
      <KeyboardShortcutsModal />
      <TestModeBadge />
    </div>
  );
}
