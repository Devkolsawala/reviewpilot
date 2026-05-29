import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/components/marketing/og-template";

export const runtime = "edge";
export const alt = "ReviewPilot — AppFollow alternative for Play Store automation";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "AppFollow alternative",
    title:
      "ReviewPilot vs AppFollow — for Play Store review automation in India.",
    kicker:
      "AI replies · Review recovery · WhatsApp Business · From $16/month",
  });
}
