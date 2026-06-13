// src/lib/marketing/features.ts
//
// Single source of truth for marketing feature data.
// Every marketing surface (homepage, pricing, comparison tables, persona pages,
// pillar hub, footer, navbar, JSON-LD) imports from here. Do not duplicate
// feature data anywhere else.
//
// To change a feature's status (e.g., GBP from "coming_soon" to "live"), edit
// this file once and the entire marketing site updates.

import {
  Bot,
  MessageCircle,
  Smartphone,
  MessageSquareText,
  Brain,
  HeartPulse,
  BarChart3,
  BellRing,
  MapPinned,
  Rocket,
  GitCompareArrows,
  type LucideIcon,
} from "lucide-react";

export type FeatureStatus = "live" | "coming_soon";

export type Feature = {
  id: string;
  title: string;
  shortLabel: string; // For comparison-table row labels
  description: string; // 1-2 sentence pitch for feature cards
  icon: LucideIcon;
  status: FeatureStatus;
  href?: string; // optional link to a dedicated page
  isHeroDifferentiator?: boolean; // Pushes the card to the top of grids
};

export const FEATURES: Feature[] = [
  {
    id: "review_recovery_engine",
    title: "Review Recovery Engine",
    shortLabel: "Review Recovery Engine",
    description:
      "Convert 1–3★ reviewers into 4–5★ promoters. AI embeds a recovery link in your reply, captures the reviewer when they click, and tracks your recovery rate as the headline metric.",
    icon: HeartPulse,
    status: "live",
    isHeroDifferentiator: true,
  },
  {
    id: "ai_insights",
    title: "AI Insights",
    shortLabel: "AI Insights (Themes + ABSA)",
    description:
      "Theme Map, Critical Issues, and Aspect-Based Sentiment cluster your reviews so you can see what users actually love and hate — not just star averages.",
    icon: Brain,
    status: "live",
    isHeroDifferentiator: true,
  },
  {
    id: "ai_auto_replies",
    title: "AI Auto-Replies",
    shortLabel: "AI auto-replies",
    description:
      "Context-aware AI replies in your brand voice. Manual, semi-auto, or fully automatic — your choice per review.",
    icon: Bot,
    status: "live",
  },
  {
    id: "play_store_reviews",
    title: "Play Store Reviews",
    shortLabel: "Play Store reviews",
    description:
      "Two-hour sync of all your Play Store reviews. Reply directly. Track rating trends per app.",
    icon: Smartphone,
    status: "live",
    href: "/integrations/google-play-store",
  },
  {
    id: "whatsapp_business_automation",
    title: "WhatsApp Business Automation",
    shortLabel: "WhatsApp Business automation",
    description:
      "Collect reviews and run review-recovery follow-ups via WhatsApp — where your customers actually reply.",
    icon: MessageCircle,
    status: "live",
    href: "/whatsapp-automation",
  },
  {
    id: "sentiment_analytics",
    title: "Sentiment Analytics",
    shortLabel: "Sentiment analytics",
    description:
      "Net Sentiment Score, sentiment trend over time, and emotion + urgency tagging on every review.",
    icon: BarChart3,
    status: "live",
  },
  {
    id: "review_alerts",
    title: "AI-Verified Review Alerts",
    shortLabel: "AI-verified review alerts",
    description:
      "Get emailed when a genuinely negative review lands — AI checks the sentiment first, so a 1★ “great app btw” never pages you.",
    icon: BellRing,
    status: "live",
  },
  {
    id: "aso_analysis",
    title: "ASO Analysis",
    shortLabel: "ASO Analysis",
    description:
      "Get an ASO health score, keyword gaps mined from your real reviews, and AI-rewritten title, description, and What's New copy. The only listing optimizer powered by your own review data — not a generic keyword database.",
    icon: Rocket,
    status: "live",
  },
  {
    id: "version_impact",
    title: "Version Impact Analyzer",
    shortLabel: "Version impact analysis",
    description:
      "See exactly what each release did to your rating — which version cost you stars and which complaints spiked, release by release. Play Store reviews only.",
    icon: GitCompareArrows,
    status: "live",
  },
  {
    id: "google_business_profile",
    title: "Google Business Profile",
    shortLabel: "Google Business Profile",
    description:
      "Reply to your Google reviews from the same inbox. Currently in API approval with Google.",
    icon: MapPinned,
    status: "coming_soon",
    href: "/integrations/google-business-profile",
  },
  {
    id: "sms_collection",
    title: "SMS Review Collection",
    shortLabel: "SMS collection",
    description:
      "Send review requests via SMS after customer transactions. Rolling out alongside our Indian DLT compliance work.",
    icon: MessageSquareText,
    status: "coming_soon",
  },
];

// Convenience helpers — components should use these, not filter FEATURES directly
export const liveFeatures = () => FEATURES.filter((f) => f.status === "live");
export const comingSoonFeatures = () =>
  FEATURES.filter((f) => f.status === "coming_soon");
export const heroDifferentiators = () =>
  FEATURES.filter((f) => f.isHeroDifferentiator);
export const featureById = (id: string) => FEATURES.find((f) => f.id === id);

// ────────────────────────────────────────────────────────────────────────────
// COMPARISON TABLE DATA
// Used by the homepage "Better coverage at a fraction of the price" table
// and by any /vs/* or /compare/* pages that consume the shared component.
// ────────────────────────────────────────────────────────────────────────────

export type CellState = "yes" | "no" | "partial" | "soon";

export type Competitor = {
  name: string;
  priceLabel: string; // e.g. "from ~$266/mo"
  highlight?: boolean;
  features: Record<string, CellState>;
};

export const REVIEWPILOT: Competitor = {
  name: "ReviewPilot",
  priceLabel: "from $16/mo",
  highlight: true,
  features: {
    review_recovery_engine: "yes",
    ai_insights: "yes",
    ai_auto_replies: "yes",
    play_store_reviews: "yes",
    whatsapp_business_automation: "yes",
    sentiment_analytics: "yes",
    version_impact: "yes",
    google_business_profile: "soon",
    sms_collection: "soon",
  },
};

export const COMPETITORS: Competitor[] = [
  {
    name: "Birdeye",
    priceLabel: "from ~$266/mo",
    features: {
      review_recovery_engine: "no",
      ai_insights: "partial", // basic sentiment, no theme clustering
      ai_auto_replies: "yes",
      play_store_reviews: "no",
      whatsapp_business_automation: "yes",
      sentiment_analytics: "yes",
      google_business_profile: "yes",
      sms_collection: "yes",
    },
  },
  {
    name: "Podium",
    priceLabel: "from ~$213/mo",
    features: {
      review_recovery_engine: "no",
      ai_insights: "no",
      ai_auto_replies: "no",
      play_store_reviews: "no",
      whatsapp_business_automation: "no",
      sentiment_analytics: "yes",
      google_business_profile: "yes",
      sms_collection: "yes",
    },
  },
  {
    name: "AppFollow",
    priceLabel: "from ~$160/mo",
    features: {
      review_recovery_engine: "no",
      ai_insights: "partial", // keyword tracking, not theme + ABSA
      ai_auto_replies: "yes",
      play_store_reviews: "yes",
      whatsapp_business_automation: "no",
      sentiment_analytics: "yes",
      google_business_profile: "no",
      sms_collection: "no",
    },
  },
];

// Order in which feature rows appear in the comparison table.
// Differentiators on top so the eye lands on rows where ReviewPilot wins.
export const COMPARISON_ROW_ORDER: string[] = [
  "review_recovery_engine",
  "ai_insights",
  "ai_auto_replies",
  "play_store_reviews",
  "whatsapp_business_automation",
  "sentiment_analytics",
  "version_impact",
  "google_business_profile",
  "sms_collection",
];
