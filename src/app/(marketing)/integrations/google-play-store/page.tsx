import type { Metadata } from "next";
import { Smartphone } from "lucide-react";
import {
  IntegrationPage,
  buildIntegrationSchemas,
} from "@/components/marketing/IntegrationPage";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

const PAGE_URL = `${SITE_URL}/integrations/google-play-store`;

export const metadata: Metadata = {
  title: "Google Play Store Review Management with AI Replies",
  description:
    "Play Store review management software with AI-drafted replies. Connect via service account, respect the 350-character limit, recover negative reviews. From $16/mo.",
  alternates: { canonical: "/integrations/google-play-store" },
  openGraph: {
    title: "Google Play Store Review Management with AI Replies",
    description:
      "AI replies for every Play Store review. Service-account or invite-email connection. From $16/mo.",
    url: PAGE_URL,
    type: "website",
    siteName: "ReviewPilot",
    // og:image is provided by ./opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Play Store Review Management with AI Replies",
    description:
      "AI-drafted Play Store replies inside the 350-char limit. Built for India.",
  },
};

const FAQS = [
  {
    q: "How does ReviewPilot connect to Google Play Console?",
    a: "Two methods: (1) Service-account JSON — create a service account in Google Cloud, grant it Play Console permissions, and upload the JSON in our wizard. (2) Invite-email flow — invite our managed service account into your Play Console and we handle the rest. Both take under 5 minutes.",
  },
  {
    q: "Does ReviewPilot respect the 350-character Play Store reply limit?",
    a: "Yes. The 350-char limit is baked into the AI prompt and enforced at draft time. You'll never get a reply that exceeds the limit, and the character counter is visible in every draft.",
  },
  {
    q: "How often are Play Store reviews polled?",
    a: "Every 2 hours via Vercel cron, on every plan. Newer reviews surface first in the inbox.",
  },
  {
    q: "Does ReviewPilot use the App Context Profile when drafting?",
    a: "Yes. Your App Context Profile — known issues, latest release notes, FAQs, brand tone — is included in every prompt so the AI can answer specifically. A 1-star 'app crashes on Redmi' review can reference your actual fix in v2.3.1.",
  },
  {
    q: "Can I bulk-reply to a backlog?",
    a: "Yes. Bulk reply is available on Growth and Agency plans. Filter by date, rating, or keyword, generate dozens of drafts in one click, scan them, and publish in one pass.",
  },
];

const features = [
  "Service-account or invite-email connection",
  "350-character reply limit auto-enforced",
  "Reviews polled every 2 hours via Vercel cron",
  "App Context Profile baked into every AI draft",
  "Multi-language (8 Indian languages)",
  "Bulk reply on Growth and Agency plans",
];

export default function PlayStoreIntegrationPage() {
  return (
    <>
      <JsonLd
        data={buildIntegrationSchemas({
          pageUrl: PAGE_URL,
          siteUrl: SITE_URL,
          siteOg: SITE_OG,
          name: "ReviewPilot — Google Play Store integration",
          description:
            "Google Play Store review management with AI-drafted replies, service-account connection, and 350-character limit enforcement.",
          features,
          breadcrumbName: "Google Play Store",
          faqs: FAQS,
        })}
      />
      <IntegrationPage
        eyebrow="Google Play Store integration"
        h1={
          <>
            Google Play Store review management with{" "}
            <span className="text-gradient-brand font-serif italic">
              AI replies
            </span>
            .
          </>
        }
        subhead="Connect your Play Console via service account or invite-email. ReviewPilot pulls every new review every 2 hours, drafts an on-brand reply within the 350-character limit, and lets you approve or auto-publish in one click."
        icon={Smartphone}
        iconBg="rgba(16, 185, 129, 0.15)"
        iconColor="#10b981"
        sections={[
          {
            title: "Two ways to connect — both take under 5 minutes",
            body: "Pick the connection method that fits your team. Service-account JSON is the standard Play Developer API path; invite-email is faster if you don't want to touch Google Cloud Console. Both are equally secure — credentials are encrypted at rest with AES-256-GCM.",
            bullets: [
              "Service-account JSON upload",
              "Invite-email to a managed service account",
              "Encrypted credentials at rest",
            ],
          },
          {
            title: "350-character reply limit, baked into the prompt",
            body: "Play Store rejects replies over 350 characters. ReviewPilot's prompt enforces this hard limit so every AI draft fits the first time. No retries, no truncation, no rejected publishes.",
            bullets: [
              "Hard limit at the prompt layer",
              "Live character counter in the editor",
              "Drafts never get rejected by the API",
            ],
          },
          {
            title: "Recovery engine for negative reviews",
            body: "1–3★ reviews are flagged for human review and routed to a recovery flow. The AI drafts a careful, specific apology — referencing your actual fix when the App Context Profile lists the bug — so unhappy users see action, not platitudes.",
            bullets: [
              "1–3★ flagged for human approval",
              "AI references known fixes from App Context",
              "Trend lines show recovery rate over time",
            ],
          },
          {
            title: "App Context Profile per connection",
            body: "Each connected app gets its own App Context Profile: tone, known bugs, latest release notes, FAQ library, and brand voice. The AI references all of it on every draft, so replies feel specific — not generic.",
            bullets: [
              "Tone selector per app",
              "FAQ library the AI can cite",
              "Brand-voice notes baked into every prompt",
            ],
          },
        ]}
        faqs={FAQS}
        cross={[
          { href: "/integrations", label: "All integrations" },
          { href: "/integrations/google-business-profile", label: "Google Business Profile" },
          { href: "/integrations/whatsapp-business", label: "WhatsApp Business" },
          { href: "/for-app-developers", label: "Play Store review tool for developers" },
          { href: "/unified-inbox", label: "Unified inbox" },
        ]}
      />
    </>
  );
}
