"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
      <AuroraBackground intensity="subtle" />
      <div className="relative z-10 w-full max-w-xl text-center">
        <div className="mx-auto mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] shadow-[0_0_40px_-8px_hsl(var(--ring)/0.6)] ring-1 ring-border/60">
          <AlertTriangle className="h-7 w-7 text-white" />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
          Unexpected error
        </p>
        <h1 className="font-sans text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          Something broke.
        </h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          We hit a snag rendering this page. Try again — if it keeps happening, our team has been notified.
        </p>

        {error?.digest && (
          <p className="font-mono text-[10px] text-muted-foreground/60 mb-6">
            ref: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_-4px_hsl(var(--ring)/0.6)] hover:brightness-110 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
