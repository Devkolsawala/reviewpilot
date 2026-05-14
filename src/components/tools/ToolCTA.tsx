import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolCTAProps {
  headline?: string;
  body?: string;
  buttonLabel?: string;
  href?: string;
}

export function ToolCTA({
  headline = "Like this? Get auto-replies + review monitoring with ReviewPilot.",
  body = "Connect Play Store and Google Business Profile in minutes. AI replies that fit every character limit, sentiment alerts, and a unified inbox — free for 7 days.",
  buttonLabel = "Start 7-day free trial",
  href = "/signup",
}: ToolCTAProps) {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-sans text-base font-medium tracking-tight text-foreground sm:text-lg">
            {headline}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {body}
          </p>
        </div>
        <Button variant="gradient" size="lg" asChild className="shrink-0">
          <Link href={href} className="flex items-center gap-2">
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
