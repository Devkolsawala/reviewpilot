import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/components/marketing/og-template";

export const runtime = "edge";
export const alt =
  "ReviewPilot — Unified inbox for Play Store, Google, and WhatsApp";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Unified review inbox",
    title:
      "Play Store reviews, Google reviews, and WhatsApp messages — in one inbox.",
    kicker:
      "One AI engine · One workflow · Source-typed views · Built for India",
  });
}
