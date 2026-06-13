"use client";

import { PageTransition } from "@/components/dashboard/PageTransition";
import { VersionImpactClient } from "@/components/dashboard/version-impact/VersionImpactClient";

export default function VersionImpactPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <header>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold tracking-tight">
            Version Impact
            <span className="text-accent">.</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            See exactly how each release moved your rating, sentiment, and complaints.
          </p>
        </header>

        {/* The deterministic comparison is FREE for all plans. Only the AI
            verdict panel inside is gated (Growth/Agency) — so unlike ASO, the
            whole page is NOT wrapped in UpgradeGate. */}
        <VersionImpactClient />
      </div>
    </PageTransition>
  );
}
