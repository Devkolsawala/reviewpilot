import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-foreground">
        <AuroraBackground intensity="normal" />
        <GridPattern variant="grid" fade className="opacity-[0.35]" />

        <Link href="/" className="relative flex items-center gap-2">
          <img src="/favicon.svg" alt="ReviewPilot logo" className="h-8 w-8 shrink-0" aria-hidden="true" />
          <span className="font-sans text-[15px] font-semibold tracking-tight">
            ReviewPilot
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Made in India
          </p>
          <h2 className="mt-4 font-sans text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Turn{" "}
            <span className="text-gradient-brand font-serif italic">
              every review
            </span>{" "}
            into revenue.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            AI-powered review management for Indian app developers and local
            businesses. From $16/mo — built for teams who care about every
            star.
          </p>

          <figure className="mt-10 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
            <blockquote className="text-sm leading-relaxed text-foreground/90">
              &ldquo;Cut our Play Store response time from 3 days to 11 minutes.
              Our rating went from 4.1 to 4.5 in a quarter.&rdquo;
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-[11px] font-semibold text-white">
                RS
              </div>
              <div>
                <p className="text-xs font-medium">Rohit Sharma</p>
                <p className="text-[10px] text-muted-foreground">
                  Founder, indie Android studio
                </p>
              </div>
            </figcaption>
          </figure>
        </div>

        <p className="relative text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} ReviewPilot
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
