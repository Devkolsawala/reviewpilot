import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/components/marketing/og-template";

export const runtime = "edge";
export const alt = "ReviewPilot — Affordable Birdeye alternative for India";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Birdeye alternative",
    title: "ReviewPilot vs Birdeye — affordable review management for India.",
    kicker:
      "From ₹1,500/month · INR billing · Play Store + Google + WhatsApp in one inbox",
  });
}
