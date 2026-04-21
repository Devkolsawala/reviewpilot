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

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Play Store reviews", href: "/features/google-play-reviews" },
      { label: "Google Business Profile", href: "/features/google-business-profile" },
      { label: "Request a demo", href: "/demo" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "For app developers", href: "/for-app-developers" },
      { label: "For local businesses", href: "/for-local-business" },
      { label: "Birdeye alternative", href: "/alternatives/birdeye-alternative" },
      { label: "vs Podium", href: "/compare/reviewpilot-vs-podium" },
      { label: "vs Famepilot", href: "/compare/reviewpilot-vs-famepilot" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Docs", href: "/docs" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Data Deletion", href: "/data-deletion" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + newsletter */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)] text-xs font-bold text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)]">
                RP
              </div>
              <span className="font-sans text-[15px] font-semibold tracking-tight">
                ReviewPilot
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              AI review management for Indian app makers and local businesses.
              From ₹1,500/mo — built for the teams who care about every star.
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
              <div className="mt-2 flex max-w-sm items-center gap-2 rounded-full border border-border/60 bg-background/60 p-1 backdrop-blur-sm focus-within:border-accent/50">
                <Mail className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  id="footer-newsletter"
                  type="email"
                  placeholder="you@company.in"
                  className="flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
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

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-foreground/75 transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ReviewPilot · Made in India.
          </p>
          <div className="flex items-center gap-1">
            <SocialLink href="https://twitter.com" label="Twitter" icon={TwitterIcon} />
            <SocialLink href="https://linkedin.com" label="LinkedIn" icon={LinkedinIcon} />
            <SocialLink href="https://github.com" label="GitHub" icon={GithubIcon} />
          </div>
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
