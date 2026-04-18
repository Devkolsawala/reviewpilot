import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(217,70,239,0.12))] ring-1 ring-accent/30 text-accent">
        {icon}
      </div>
      <h3 className="font-sans text-lg font-semibold tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Button variant="gradient" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
