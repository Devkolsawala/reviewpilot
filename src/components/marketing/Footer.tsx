"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

/* Brand icons — lucide-react v1.7 dropped brand marks; inline SVGs instead. */
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.01c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18.92-.26 1.92-.39 2.9-.39.98 0 1.98.13 2.9.39 2.2-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.12 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.77 1.06.77 2.14v3.17c0 .31.21.66.8.55 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

type FooterLink = { label: string; href: string };
type FooterGroup = { heading: string; links: FooterLink[] };

const PRODUCT: FooterGroup = {
  heading: "Product",
  links: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Unified inbox", href: "/unified-inbox" },
    { label: "WhatsApp Business automation", href: "/whatsapp-automation" },
    { label: "Team collaboration", href: "/features#team-collaboration" },
    { label: "Request a demo", href: "/demo" },
  ],
};

const INTEGRATIONS: FooterGroup = {
  heading: "Integrations",
  links: [
    { label: "All integrations", href: "/integrations" },
    { label: "WhatsApp Business API", href: "/integrations/whatsapp-business" },
    { label: "Google Play Store", href: "/integrations/google-play-store" },
    { label: "Google Business Profile (soon)", href: "/integrations/google-business-profile" },
  ],
};

const SOLUTIONS: FooterGroup = {
  heading: "Solutions",
  links: [
    { label: "For app developers", href: "/for-app-developers" },
    { label: "For local businesses", href: "/for-local-business" },
    { label: "Birdeye alternative", href: "/vs/birdeye" },
    { label: "AppFollow alternative", href: "/vs/appfollow" },
    { label: "vs Podium", href: "/compare/reviewpilot-vs-podium" },
    { label: "vs Famepilot", href: "/compare/reviewpilot-vs-famepilot" },
  ],
};

const FREE_TOOLS: FooterGroup = {
  heading: "Free Tools",
  links: [
    { label: "Play Store Analyzer", href: "/tools/play-store-analyzer" },
    { label: "AI Reply Generator", href: "/tools/ai-review-reply-generator" },
    { label: "Play Store Character Counter", href: "/tools/play-store-character-counter" },
    { label: "App Rating Calculator", href: "/tools/app-rating-calculator" },
    { label: "Play Store app reports", href: "/insights" },
  ],
};

const COMPANY: FooterGroup = {
  heading: "Company",
  links: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Docs", href: "/docs" },
  ],
};

const LEGAL: FooterGroup = {
  heading: "Legal",
  links: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Data Deletion", href: "/data-deletion" },
  ],
};

/* Four columns, Anthropic-style: some columns stack two labeled groups beneath
   each other so every label keeps to a single line. The 5 original groups map to
   4 columns (Company split into Company + Legal, mirroring Anthropic's
   "Terms and policies" block). Every link target + label is preserved. */
const FOOTER_COLUMNS: FooterGroup[][] = [
  [PRODUCT],
  [SOLUTIONS, INTEGRATIONS],
  [FREE_TOOLS],
  [COMPANY, LEGAL],
];

/* Splits a "Label (soon)" string into the label plus an inline "soon" pill,
   so the marker never wraps to a second line. Data array stays untouched. */
function FooterLinkLabel({ label }: { label: string }) {
  const match = label.match(/^(.*?)\s*\(soon\)\s*$/i);
  if (!match) {
    return <span className="whitespace-nowrap">{label}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="whitespace-nowrap">{match[1]}</span>
      <span className="rounded bg-brand-700/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
        soon
      </span>
    </span>
  );
}

/* A single labelled group: uppercase header + its links. Stacked within a
   column when a column carries more than one group. */
function LinkGroup({ group, className }: { group: FooterGroup; className?: string }) {
  return (
    <div className={className}>
      <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {group.heading}
      </h4>
      <ul className="mt-4 space-y-3">
        {group.links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="inline-flex whitespace-nowrap text-sm text-foreground/75 transition-colors hover:text-brand-700"
            >
              <FooterLinkLabel label={l.label} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 min-[520px]:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_repeat(4,auto)] lg:gap-x-5 xl:gap-x-12">
          {/* Brand rail — `contents` on mobile so the brand block and the
              socials/copyright block are independent grid items (lets order
              utilities push copyright last on mobile); a flex column on desktop
              so socials + copyright pin to the bottom-left of the rail. */}
          <div className="contents lg:flex lg:min-w-0 lg:max-w-sm lg:flex-col lg:col-span-1">
            {/* Brand block — logo, tagline, newsletter */}
            <div className="min-w-0 max-w-sm min-[520px]:col-span-2 lg:col-span-1 lg:max-w-none">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/favicon.svg"
                  alt="ReviewPilot logo"
                  className="h-8 w-8 shrink-0"
                  aria-hidden="true"
                />
                <span className="font-sans text-[15px] font-semibold tracking-tight">
                  ReviewPilot
                </span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                AI replies for Play Store reviews and WhatsApp Business
                messages, plus review recovery and AI insights — one unified
                inbox built for Indian SMBs and app developers. Google Business
                Profile coming soon. From $16/mo.
              </p>

              {/* Newsletter — disabled until backend wiring lands */}
              <form
                className="mt-6"
                onSubmit={(e) => e.preventDefault()}
                aria-label="Newsletter signup"
              >
                <label
                  htmlFor="footer-newsletter"
                  className="text-xs uppercase tracking-[0.15em] text-muted-foreground"
                >
                  Monthly product letter
                </label>
                <div className="mt-2 flex max-w-sm flex-wrap items-center gap-2 rounded-full border border-border/60 bg-background/60 p-1 backdrop-blur-sm focus-within:border-accent/50">
                  <Mail className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    id="footer-newsletter"
                    type="email"
                    placeholder="you@company.in"
                    className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {/* TODO(marketing): wire to newsletter endpoint */}
                  <button
                    type="submit"
                    disabled
                    className="rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-3 py-1.5 text-xs font-medium text-white opacity-60 cursor-not-allowed"
                    aria-disabled
                  >
                    Subscribe
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Once a month. Unsubscribe anytime.
                </p>
              </form>
            </div>

            {/* Socials + copyright — last on mobile (order-last), bottom-left of
                the rail on desktop (lg:order-none + lg:mt-auto). */}
            <div className="order-last min-[520px]:col-span-2 lg:order-none lg:col-span-1 lg:mt-auto lg:pt-12">
              <div className="flex items-center gap-1">
                <SocialLink href="https://twitter.com" label="Twitter" icon={TwitterIcon} />
                <SocialLink
                  href="https://www.linkedin.com/company/reviewpilot"
                  label="LinkedIn"
                  icon={LinkedinIcon}
                />
                <SocialLink href="https://github.com" label="GitHub" icon={GithubIcon} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                © {new Date().getFullYear()} ReviewPilot · Made in India.
              </p>
            </div>
          </div>

          {/* Four link columns; columns 2 & 4 stack two groups so labels stay
              single-line. Labels never wrap mid-phrase. */}
          {FOOTER_COLUMNS.map((groups, i) => (
            <div key={i} className="min-w-0">
              {groups.map((group, gi) => (
                <LinkGroup
                  key={group.heading}
                  group={group}
                  className={gi > 0 ? "mt-10" : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
    </a>
  );
}
