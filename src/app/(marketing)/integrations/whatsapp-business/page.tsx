import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import {
  IntegrationPage,
  buildIntegrationSchemas,
} from "@/components/marketing/IntegrationPage";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";

const PAGE_URL = `${SITE_URL}/integrations/whatsapp-business`;
const WHATSAPP_GREEN = "#25D366";

export const metadata: Metadata = {
  title: "WhatsApp Business API Integration with Embedded Signup",
  description:
    "Official WhatsApp Cloud API integration with Meta Embedded Signup. AI replies, template management, multi-WABA support. Meta-approved Tech Provider. From $16/mo.",
  alternates: { canonical: "/integrations/whatsapp-business" },
  openGraph: {
    title: "WhatsApp Business API Integration with Embedded Signup",
    description:
      "Official Cloud API. Meta-approved. Embedded Signup in 60 seconds. Free replies inside the 24-hour window.",
    url: PAGE_URL,
    type: "website",
    siteName: "ReviewPilot",
    // og:image is provided by ./opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsApp Business API Integration with Embedded Signup",
    description: "Official WhatsApp Cloud API for Indian businesses.",
  },
};

const FAQS = [
  {
    q: "Is this the official WhatsApp Cloud API?",
    a: "Yes. ReviewPilot uses Meta's official WhatsApp Cloud API for inbound webhooks and outbound sends. We are a verified Meta Tech Provider with whatsapp_business_messaging and whatsapp_business_management permissions in Advanced Access.",
  },
  {
    q: "What is Meta Embedded Signup?",
    a: "Embedded Signup is Meta's official onboarding flow for Tech Providers. The customer clicks 'Continue with Facebook', signs in with Facebook in a popup, picks the WhatsApp Business Account and phone number to connect, and ReviewPilot subscribes the webhook automatically. It typically takes about 60 seconds.",
  },
  {
    q: "Which permissions does ReviewPilot request?",
    a: "Two scopes: whatsapp_business_messaging (for sending messages) and whatsapp_business_management (for managing templates and business profile). Both are in Meta Advanced Access.",
  },
  {
    q: "How are tokens stored?",
    a: "Long-lived Business Integration System User tokens are encrypted at rest with AES-256-GCM before being stored. Webhook signatures are validated with X-Hub-Signature-256 on every inbound request. Disconnect revokes the token cleanly.",
  },
  {
    q: "Does it support multi-WABA and multiple phone numbers?",
    a: "Yes. During Embedded Signup the customer picks which WhatsApp Business Account and which phone number to connect. Repeat the flow to connect additional numbers. Limits depend on plan.",
  },
];

const features = [
  "Meta Embedded Signup via Facebook Login for Business",
  "WhatsApp Cloud API webhook delivery (real time)",
  "Meta-approved Tech Provider — Advanced Access",
  "whatsapp_business_messaging + management scopes",
  "Long-lived Business Integration System User tokens",
  "Encrypted at rest with AES-256-GCM",
  "Multi-WABA and multi-phone-number support",
  "Template read + create + submit for approval",
  "Business profile management (about, description, email, address)",
];

export default function WhatsAppIntegrationPage() {
  return (
    <>
      <JsonLd
        data={buildIntegrationSchemas({
          pageUrl: PAGE_URL,
          siteUrl: SITE_URL,
          siteOg: SITE_OG,
          name: "ReviewPilot — WhatsApp Business API integration",
          description:
            "Official WhatsApp Cloud API integration with Meta Embedded Signup, Advanced Access permissions, and AES-256-GCM token encryption.",
          features,
          breadcrumbName: "WhatsApp Business",
          faqs: FAQS,
        })}
      />
      <IntegrationPage
        eyebrow="WhatsApp Business API integration"
        h1={
          <>
            WhatsApp Business API integration for{" "}
            <span className="text-gradient-brand font-serif italic">
              AI replies
            </span>
            .
          </>
        }
        subhead="The official WhatsApp Cloud API integration, connected via Meta's Embedded Signup. ReviewPilot is a verified Meta Tech Provider — your customers see your verified WABA number, not a third-party bridge."
        icon={MessageCircle}
        iconBg={`${WHATSAPP_GREEN}1f`}
        iconColor={WHATSAPP_GREEN}
        sections={[
          {
            title: "Embedded Signup via Facebook Login for Business",
            body: "Click 'Continue with Facebook' in the dashboard. Meta's official Embedded Signup popup walks the customer through Facebook login, WABA selection, and phone-number selection. ReviewPilot subscribes the webhook and finishes onboarding automatically. About 60 seconds end-to-end.",
            bullets: [
              "Official Meta flow — no shortcuts",
              "WABA + phone-number picker built in",
              "Webhook subscription automated",
            ],
          },
          {
            title: "Cloud API webhook delivery, in real time",
            body: "Inbound messages hit Meta's Cloud API webhook in real time — not polling. ReviewPilot validates the X-Hub-Signature-256 with your app secret, parses the payload, and stores the message in your unified inbox. Drafts are generated within seconds.",
            bullets: [
              "X-Hub-Signature-256 validated",
              "Real-time webhook (not polling)",
              "Message + status events handled",
            ],
          },
          {
            title: "Meta-approved Tech Provider",
            body: "ReviewPilot has whatsapp_business_messaging and whatsapp_business_management in Advanced Access — the production-ready tier of Meta's WhatsApp permissions. Your customers connect through a Meta-vetted integration, not a hand-rolled OAuth experiment.",
            bullets: [
              "Advanced Access on both WA scopes",
              "Verified Meta Tech Provider",
              "Production-grade onboarding",
            ],
          },
          {
            title: "Token encryption and disconnect",
            body: "Long-lived Business Integration System User tokens are encrypted at rest with AES-256-GCM before being stored in Supabase. Disconnect from Settings → Connections revokes the token at Meta, unsubscribes the webhook, and clears the encrypted blob from the database.",
            bullets: [
              "AES-256-GCM encryption at rest",
              "Token revocation on disconnect",
              "Webhook unsubscribed cleanly",
            ],
          },
          {
            title: "Templates and business profile, inside ReviewPilot",
            body: "Read existing message templates and submit new ones for Meta approval — without leaving the dashboard. Update WhatsApp About, description, email, and address from the same place. No tab-hopping into Meta Business Manager.",
            bullets: [
              "List, create, submit templates",
              "Update business profile fields",
              "Disconnect with one click — token revoked, webhook unsubscribed",
            ],
          },
        ]}
        faqs={FAQS}
        cross={[
          { href: "/whatsapp-automation", label: "WhatsApp Business automation overview" },
          { href: "/integrations", label: "All integrations" },
          { href: "/integrations/google-play-store", label: "Google Play Store" },
          { href: "/integrations/google-business-profile", label: "Google Business Profile" },
          { href: "/unified-inbox", label: "Unified inbox" },
        ]}
      />
    </>
  );
}
