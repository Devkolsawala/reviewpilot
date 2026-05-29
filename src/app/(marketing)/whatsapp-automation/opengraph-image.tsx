import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/components/marketing/og-template";

export const runtime = "edge";
export const alt = "ReviewPilot — WhatsApp Business automation with AI replies";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "WhatsApp Business automation",
    title: "AI replies for every WhatsApp Business message — Meta-approved.",
    kicker:
      "Embedded Signup in 60 seconds · Free inside 24-hour window · Indian languages",
    accentColor: "#25D366",
  });
}
