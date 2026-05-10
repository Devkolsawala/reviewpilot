import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/components/marketing/og-template";

export const runtime = "edge";
export const alt = "ReviewPilot integrations — Play Store, Google, WhatsApp";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Integrations",
    title:
      "Play Store, Google Business Profile, and WhatsApp Business — three official integrations.",
    kicker: "One unified inbox · AI replies in 8 Indian languages",
  });
}
