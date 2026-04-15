import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EmailVerifiedPage() {
  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white font-heading font-bold text-sm">
          RP
        </div>
        <span className="font-heading text-xl font-bold">ReviewPilot</span>
      </div>

      <div className="flex flex-col items-center text-center mt-4">
        {/* Success icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 mb-6">
          <svg
            className="h-8 w-8 text-teal-500"
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

        <h1 className="font-heading text-2xl font-bold">Email verified!</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
          Your account is now active. You may close this tab or proceed to log in.
        </p>

        <Button asChild className="mt-8 w-full max-w-xs">
          <Link href="/login">Proceed to Login</Link>
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Opened this on another device? You can safely close this tab.
        </p>
      </div>
    </div>
  );
}
