import Link from "next/link";
import { Building2, MessageCircle, Inbox, ArrowRight } from "lucide-react";

const WHATSAPP_GREEN = "#25D366";

export function ThreePlatformBand() {
  return (
    <section
      aria-labelledby="three-platform-band"
      className="relative overflow-hidden border-y border-border/60 bg-muted/20 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            One inbox. Three platforms.
          </p>
          <h2
            id="three-platform-band"
            className="mt-3 font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl"
          >
            Play Store, Google Business Profile, and WhatsApp —{" "}
            <span className="text-gradient-brand">in one unified inbox</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            One AI engine, one workflow, one source-typed view. Play Store and
            WhatsApp Business are live today; Google Business Profile is coming
            soon.
          </p>
        </div>

        {/* Platform tiles */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <PlatformTile
            href="/integrations/google-play-store"
            label="Google Play Store"
            caption="AI replies inside the 350-char limit"
            icon={<GooglePlayLogo className="h-7 w-7" />}
          />
          <PlatformTile
            href="/integrations/google-business-profile"
            label="Google Business Profile (soon)"
            caption="Coming soon — OAuth, multi-location, recovery engine"
            icon={
              <Building2
                className="h-6 w-6"
                style={{ color: "#3b82f6" }}
                aria-hidden
              />
            }
          />
          <PlatformTile
            href="/integrations/whatsapp-business"
            label="WhatsApp Business"
            caption="Meta Embedded Signup, Cloud API, AI replies"
            icon={
              <MessageCircle
                className="h-6 w-6"
                style={{ color: WHATSAPP_GREEN }}
                aria-hidden
              />
            }
            accentColor={WHATSAPP_GREEN}
          />
        </div>

        {/* Unified inbox callout */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/unified-inbox"
            className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-accent/50"
          >
            <Inbox className="h-4 w-4 text-accent" />
            See the unified inbox
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Fallback secondary nav */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
          <Link
            href="/whatsapp-automation"
            className="text-muted-foreground hover:text-foreground"
          >
            WhatsApp Business automation
          </Link>
          <Link
            href="/integrations"
            className="text-muted-foreground hover:text-foreground"
          >
            All integrations
          </Link>
          <Link
            href="/vs/birdeye"
            className="text-muted-foreground hover:text-foreground"
          >
            Birdeye alternative
          </Link>
          <Link
            href="/vs/appfollow"
            className="text-muted-foreground hover:text-foreground"
          >
            AppFollow alternative
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlatformTile({
  href,
  label,
  caption,
  icon,
  accentColor,
}: {
  href: string;
  label: string;
  caption: string;
  icon: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-[0_0_40px_-12px_hsl(var(--ring)/0.4)]"
      style={
        accentColor
          ? ({ ["--accent-tint" as string]: `${accentColor}1a` } as React.CSSProperties)
          : undefined
      }
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-base font-semibold tracking-tight text-foreground">
          {label}
        </p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {caption}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">
          Learn more
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/* Google Play brand mark — same SVG used in Hero */
function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#34A853"
        d="M3.6 21.3c-.4-.2-.6-.7-.6-1.2V3.9c0-.5.2-1 .6-1.2l9.7 9.3-9.7 9.3z"
      />
      <path
        fill="#FBBC04"
        d="M16.6 16.4l-3.3-3.3 3.3-3.3 4.1 2.3c.8.5.8 1.6 0 2l-4.1 2.3z"
      />
      <path
        fill="#EA4335"
        d="M13.3 12l-9.7 9.3c.3.2.7.2 1.2-.1L16.6 16l-3.3-4z"
      />
      <path
        fill="#4285F4"
        d="M13.3 12L4.8 2.8c-.5-.3-.9-.3-1.2-.1L13.3 12z"
      />
    </svg>
  );
}
