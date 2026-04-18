import { cn } from "@/lib/utils";

interface PageShellProps {
 title: string;
 description?: string;
 eyebrow?: string;
 actions?: React.ReactNode;
 children: React.ReactNode;
 className?: string;
}

/**
 * Unified dashboard page shell: title, optional eyebrow/description, right-aligned
 * action slot, and content below. Keeps typography + spacing consistent across
 * every dashboard page.
 */
export function PageShell({
 title,
 description,
 eyebrow,
 actions,
 children,
 className,
}: PageShellProps) {
 return (
 <div className={cn("mx-auto max-w-7xl", className)}>
 <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
 <div className="min-w-0">
 {eyebrow && (
 <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
 {eyebrow}
 </p>
 )}
 <h1 className="mt-1 font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
 {title}
 </h1>
 {description && (
 <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
 {description}
 </p>
 )}
 </div>
 {actions && (
 <div className="flex shrink-0 items-center gap-2">{actions}</div>
 )}
 </header>
 <div>{children}</div>
 </div>
 );
}
