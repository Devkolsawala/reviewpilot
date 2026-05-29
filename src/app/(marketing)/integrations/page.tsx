import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Smartphone,
  Building2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GridPattern } from "@/components/ui/grid-pattern";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

const PAGE_URL = `${SITE_URL}/integrations`;
const WHATSAPP_GREEN = "#25D366";

export const metadata: Metadata = {
  title: "Integrations — Play Store, Google & WhatsApp",
  description:
    "ReviewPilot integrates with Google Play Store and WhatsApp Business, with Google Business Profile coming soon. AI replies for every review and message in a unified inbox. From $16/mo.",
  alternates: { canonical: "/integrations" },
  openGraph: {
    title:
      "ReviewPilot Integrations — Play Store, Google Business Profile, WhatsApp",
    description:
      "Official integrations. One unified inbox. AI replies in your tone, in Indian languages. Google Business Profile coming soon.",
    url: PAGE_URL,
    type: "website",
    siteName: "ReviewPilot",
    // og:image is provided by ./opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot Integrations — Play Store, Google, WhatsApp",
    description:
      "Three integrations, one inbox. AI replies for India. From $16/mo.",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Integrations", item: PAGE_URL },
  ],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReviewPilot Integrations",
  description:
    "Official integrations with Google Play Store and WhatsApp Business Cloud API, with Google Business Profile coming soon.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: PAGE_URL,
  image: SITE_OG,
  featureList: [
    "Google Play Store reviews via Play Developer API",
    "WhatsApp Business via Meta Cloud API + Embedded Signup",
  ],
};

const INTEGRATIONS = [
  {
    href: "/integrations/google-play-store",
    title: "Google Play Store",
    body: "Pull every Play Store review via the Play Developer API. AI drafts respect the 350-character reply limit. Bulk-approve a backlog in minutes.",
    icon: Smartphone,
    cta: "Play Store integration →",
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  {
    href: "/integrations/google-business-profile",
    title: "Google Business Profile (soon)",
    body: "Coming soon: connect Google Business Profile via OAuth. Multi-location aware. Smart routing — 4–5★ to Google, 1–3★ to private feedback.",
    icon: Building2,
    cta: "Google Business Profile integration →",
    accent: "bg-blue-500/10 text-blue-600",
  },
  {
    href: "/integrations/whatsapp-business",
    title: "WhatsApp Business",
    body: "Meta-approved Embedded Signup. Cloud API webhooks deliver messages in real time. Free replies inside the 24-hour customer service window.",
    icon: MessageCircle,
    cta: "WhatsApp Business API integration →",
    custom: WHATSAPP_GREEN,
  },
];

export default function IntegrationsHubPage() {
  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-28">
          <AuroraBackground intensity="subtle" />
          <GridPattern variant="grid" fade className="opacity-[0.3]" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="uppercase tracking-[0.15em]">Integrations</span>
            </div>
            <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              ReviewPilot integrations — Play Store, Google Business Profile, and{" "}
              <span className="text-gradient-brand font-serif italic">
                WhatsApp Business
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Official integrations. One unified inbox. AI replies that
              sound like you, in major Indian languages. Built for Indian SMBs
              and app developers. Google Business Profile coming soon.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/signup">
                  Start 7-day free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="xl" asChild>
                <Link href="/unified-inbox">See the unified inbox</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Integration cards */}
        <section className="pb-20 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {INTEGRATIONS.map((it) => {
                const Icon = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-[0_0_40px_-12px_hsl(var(--ring)/0.4)]"
                  >
                    <div
                      className={
                        it.custom
                          ? "flex h-11 w-11 items-center justify-center rounded-xl"
                          : `flex h-11 w-11 items-center justify-center rounded-xl ${it.accent}`
                      }
                      style={
                        it.custom
                          ? {
                              backgroundColor: `${it.custom}1f`,
                              color: it.custom,
                            }
                          : undefined
                      }
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-5 font-sans text-xl font-semibold tracking-tight">
                      {it.title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm text-muted-foreground leading-relaxed">
                      {it.body}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      {it.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 sm:py-24 bg-muted/20 border-y border-border/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-12 sm:p-16 text-center backdrop-blur-sm">
              <Sparkles className="mx-auto h-6 w-6 text-accent" />
              <h2 className="mx-auto mt-4 max-w-2xl font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Connect every channel in one afternoon.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Three integrations. One inbox. From $16/month, billed in INR.
              </p>
              <div className="mt-8 flex justify-center">
                <Button variant="gradient" size="xl" asChild>
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
