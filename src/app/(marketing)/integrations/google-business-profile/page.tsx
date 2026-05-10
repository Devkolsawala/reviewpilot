import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import {
  IntegrationPage,
  buildIntegrationSchemas,
} from "@/components/marketing/IntegrationPage";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

const PAGE_URL = `${SITE_URL}/integrations/google-business-profile`;

export const metadata: Metadata = {
  title:
    "Google Business Profile Review Management for Local Businesses",
  description:
    "Google Business Profile review management with AI replies. OAuth connection, multi-location support, smart routing, recovery engine. Built for India. From $16/mo.",
  alternates: { canonical: "/integrations/google-business-profile" },
  openGraph: {
    title: "Google Business Profile Review Management for Local Businesses",
    description:
      "OAuth connection, multi-location, AI brand-voice replies. The GMB review reply automation Indian SMBs were waiting for.",
    url: PAGE_URL,
    type: "website",
    siteName: "ReviewPilot",
    // og:image is provided by ./opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Business Profile Review Management with AI",
    description: "GMB review reply automation for Indian SMBs.",
  },
};

const FAQS = [
  {
    q: "How does ReviewPilot connect to Google Business Profile?",
    a: "Connection is via Google OAuth. Sign in with the Google account that owns the Business Profile, grant ReviewPilot read/reply access, and you're live. No service-account JSON, no copy-pasting tokens.",
  },
  {
    q: "Does it support multiple locations?",
    a: "Yes. Multi-location is supported on Growth and Agency plans. Every location keeps its own dashboard view but shares the unified inbox and AI engine.",
  },
  {
    q: "What is the recovery engine?",
    a: "The recovery engine flags 1–3★ reviews for human approval and surfaces a recovery view — the dashboard shows recovery rate over time, so you can prove that proactive replies are improving your average rating.",
  },
  {
    q: "Does the AI use my brand voice?",
    a: "Yes. Each GBP location has its own App Context Profile with tone, FAQs, and brand voice. The AI uses all of it on every draft — so a salon's replies sound different from a clinic's, even if they're both run by the same agency account.",
  },
  {
    q: "Can the AI reply in Hindi and other Indian languages?",
    a: "Yes. The AI auto-detects the reviewer's language and replies in the same one. English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, and Gujarati are supported.",
  },
];

const features = [
  "Google OAuth one-click connection",
  "Multi-location support on Growth & Agency",
  "AI replies in 8 Indian languages",
  "Recovery engine for 1–3★ reviews",
  "Same App Context Profile system as Play Store",
  "Unified inbox with WhatsApp and Play Store",
];

export default function GBPIntegrationPage() {
  return (
    <>
      <JsonLd
        data={buildIntegrationSchemas({
          pageUrl: PAGE_URL,
          siteUrl: SITE_URL,
          siteOg: SITE_OG,
          name: "ReviewPilot — Google Business Profile integration",
          description:
            "Google Business Profile review management with OAuth connection, multi-location support, and AI replies in 8 Indian languages.",
          features,
          breadcrumbName: "Google Business Profile",
          faqs: FAQS,
        })}
      />
      <IntegrationPage
        eyebrow="Google Business Profile integration"
        h1={
          <>
            Google Business Profile review management for{" "}
            <span className="text-gradient-brand font-serif italic">
              local businesses
            </span>
            .
          </>
        }
        subhead="Connect Google Business Profile in one click via OAuth. AI drafts replies in your tone, in the reviewer's language, across every location. Smart routing keeps your public rating high while one-star feedback funnels to a private channel."
        icon={Building2}
        iconBg="rgba(59, 130, 246, 0.15)"
        iconColor="#3b82f6"
        sections={[
          {
            title: "OAuth one-click connection",
            body: "Sign in with the Google account that owns your Business Profile, grant the read/reply scopes, and ReviewPilot is live. No JSON files, no shared credentials. The OAuth token is encrypted at rest and refreshed automatically.",
            bullets: [
              "Google OAuth — no service account",
              "Encrypted refresh tokens",
              "Reconnect in one click anytime",
            ],
          },
          {
            title: "Multi-location dashboards",
            body: "Run a chain of restaurants, a network of clinics, or an agency managing dozens of clients. Each location has its own dashboard view, its own App Context Profile, and its own brand voice — but they all roll up into one unified inbox.",
            bullets: [
              "Per-location App Context",
              "Roll-up analytics across all locations",
              "Agency-friendly seat structure",
            ],
          },
          {
            title: "Recovery engine for 1–3★ reviews",
            body: "Negative reviews don't just get a generic apology. The recovery engine flags them for human approval, drafts a specific reply referencing your known fixes, and tracks recovery rate over time so you can prove the impact.",
            bullets: [
              "1–3★ flagged for human review",
              "Specific drafts grounded in App Context",
              "Recovery-rate trend lines",
            ],
          },
          {
            title: "Smart routing for review collection",
            body: "Use the SMS / collection flows to route 4–5★ customers straight to your Google Business Profile review form, while 1–3★ feedback is captured privately. Protect your public rating without ignoring complaints.",
            bullets: [
              "4–5★ → public Google review",
              "1–3★ → private feedback",
              "Pre-filled templates per location",
            ],
          },
        ]}
        faqs={FAQS}
        cross={[
          { href: "/integrations", label: "All integrations" },
          { href: "/integrations/google-play-store", label: "Google Play Store" },
          { href: "/integrations/whatsapp-business", label: "WhatsApp Business" },
          { href: "/for-local-business", label: "For local businesses" },
          { href: "/unified-inbox", label: "Unified inbox" },
        ]}
      />
    </>
  );
}
