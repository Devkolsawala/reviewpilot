import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/components/marketing/og-template";

export const runtime = "edge";
export const alt =
  "ReviewPilot — Google Play Store review management with AI replies";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Play Store integration",
    title: "Google Play Store review management with AI replies.",
    kicker:
      "Service-account or invite-email · 350-char enforced · 8 Indian languages",
    accentColor: "#34A853",
  });
}
