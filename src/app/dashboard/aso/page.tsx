"use client";

import { PageTransition } from "@/components/dashboard/PageTransition";
import { UpgradeGate } from "@/components/dashboard/UpgradeGate";
import { AsoAnalysisClient } from "@/components/dashboard/aso/AsoAnalysisClient";

export default function AsoPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <header>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold tracking-tight">
            ASO Analysis
            <span className="text-accent">.</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Audit your Play Store listing against what your reviewers actually say.
          </p>
        </header>

        {/* Starter/Free users see the page behind the standard blur + upsell. */}
        <UpgradeGate feature="aso_analysis">
          <AsoAnalysisClient />
        </UpgradeGate>
      </div>
    </PageTransition>
  );
}
