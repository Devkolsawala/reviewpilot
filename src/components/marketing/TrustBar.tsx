import { Marquee } from "@/components/ui/marquee";

// TODO(marketing): replace with real customer wordmarks when available.
// Kept as neutral typographic placeholders — no invented brands.
const PLACEHOLDER_WORDMARKS = [
  { name: "Stack", style: "font-serif italic" },
  { name: "NEXA", style: "font-mono tracking-[0.3em]" },
  { name: "Lumen", style: "font-sans font-semibold lowercase" },
  { name: "Paloma", style: "font-serif" },
  { name: "Orbit", style: "font-mono uppercase tracking-wider" },
  { name: "Finch", style: "font-sans font-light italic" },
  { name: "Quill", style: "font-serif italic" },
  { name: "Veloce", style: "font-sans font-semibold uppercase tracking-widest" },
];

export function TrustBar() {
  return (
    <section className="border-y border-border/40 bg-muted/20 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by growing teams shipping reviews faster
        </p>
        <Marquee className="mt-6">
          {PLACEHOLDER_WORDMARKS.map((w, i) => (
            <span
              key={`${w.name}-${i}`}
              className={`text-xl text-muted-foreground/70 transition-colors hover:text-foreground ${w.style}`}
            >
              {w.name}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
