import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Compass, ArrowLeft, Home } from "lucide-react";

export const metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
      <AuroraBackground intensity="subtle" />
      <div className="relative z-10 w-full max-w-xl text-center">
        {/* Gradient glyph */}
        <div className="mx-auto mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] shadow-[0_0_40px_-8px_hsl(var(--ring)/0.6)] ring-1 ring-border/60">
          <Compass className="h-7 w-7 text-white" />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
          Error 404
        </p>
        <h1 className="font-sans text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          Lost in orbit.
        </h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          The page you&rsquo;re looking for drifted out of view. It may have been moved, renamed, or never existed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_-4px_hsl(var(--ring)/0.6)] hover:brightness-110 transition-all"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
