"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Clock, ArrowRight } from "lucide-react";

function TrialExpiredLockout() {
 return (
 <div className="min-h-screen flex items-center justify-center bg-background p-4">
 <div className="relative max-w-md w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 text-center">
 <div
 aria-hidden
 className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(99,102,241,0.08)_0%,rgba(139,92,246,0.05)_50%,rgba(217,70,239,0.08)_100%)]"
 />
 <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] ring-1 ring-accent/30">
 <Clock className="h-6 w-6 text-accent" />
 </div>
 <h2 className="font-sans text-xl font-semibold tracking-tight mb-2">
 Your free trial has ended
 </h2>
 <p className="text-sm text-muted-foreground mb-6">
 Upgrade to a paid plan to continue managing your reviews with AI.
 </p>
 <Link
 href="/dashboard/settings/billing"
 className="inline-flex items-center gap-1.5 bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] hover:brightness-110 text-white px-6 py-3 rounded-lg font-medium text-sm shadow-[0_0_24px_-8px_hsl(var(--ring)/0.6)] transition-all"
 >
 Choose a plan
 <ArrowRight className="h-4 w-4" />
 </Link>
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

 if (!isLoading && trialExpired && !isBillingPage) {
 return <TrialExpiredLockout />;
 }

 return (
 <div className="flex h-screen overflow-hidden bg-background">
 <a
 href="#main-content"
 className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-[0_0_20px_-4px_hsl(var(--ring)/0.6)]"
 >
 Skip to main content
 </a>
 <Sidebar />

 {/* Mobile sidebar */}
 <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
 <SheetContent side="left" className="p-0 w-64 overflow-y-auto border-r border-border/60">
 <Sidebar mobile />
 </SheetContent>
 </Sheet>

 <div className="flex flex-1 flex-col overflow-hidden">
 <TopBar onMenuClick={() => setMobileOpen(true)} />
 <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6">
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
