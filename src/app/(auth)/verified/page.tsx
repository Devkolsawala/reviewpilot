import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EmailVerifiedPage() {
  return (
    <div>
      <div className="lg:hidden flex items-center gap-2 mb-10">
        <img src="/favicon.svg" alt="ReviewPilot logo" className="h-8 w-8 shrink-0" aria-hidden="true" />
        <span className="font-sans text-[15px] font-semibold tracking-tight">
          ReviewPilot
        </span>
      </div>

      <div className="flex flex-col items-center text-center mt-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] mb-6 ring-1 ring-accent/30">
          <svg
            className="h-7 w-7 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="font-sans text-2xl font-semibold tracking-tight">
          Email verified
        </h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
          Your account is active. You may close this tab or proceed to log in.
        </p>

        <Button asChild variant="gradient" className="mt-8 w-full max-w-xs">
          <Link href="/login">Proceed to log in</Link>
        </Button>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Opened this on another device? You can safely close this tab.
        </p>
      </div>
    </div>
  );
}
