"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ProductTour } from "@/components/dashboard/ProductTour";
import { KeyboardShortcutsModal } from "@/components/dashboard/KeyboardShortcutsModal";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { TestModeBadge } from "@/components/dashboard/TestModeBadge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-secondary/30 p-4 sm:p-6">
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
