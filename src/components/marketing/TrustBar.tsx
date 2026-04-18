import {
  ShieldCheck,
  Sparkles,
  Globe,
  Lock,
  Zap,
  Languages,
} from "lucide-react";

const PILLARS = [
  {
    icon: ShieldCheck,
    label: "Google-approved integrations",
  },
  {
    icon: Lock,
    label: "Encrypted at rest & in transit",
  },
  {
    icon: Sparkles,
    label: "AI replies tuned for Indian tone",
  },
  {
    icon: Languages,
    label: "8 Indian languages supported",
  },
  {
    icon: Zap,
    label: "Setup in under 10 minutes",
  },
  {
    icon: Globe,
    label: "Made in India, for India",
  },
];

export function TrustBar() {
  return (
    <section className="border-y border-border/40 bg-muted/10 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Built on principles that matter
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <li
                key={p.label}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {p.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
