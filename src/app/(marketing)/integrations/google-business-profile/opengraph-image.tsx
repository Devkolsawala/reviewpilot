import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/components/marketing/og-template";

export const runtime = "edge";
export const alt =
  "ReviewPilot — Google Business Profile review management for local businesses";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Google Business Profile",
    title:
      "Google Business Profile review management for Indian local businesses.",
    kicker:
      "OAuth · Multi-location · Recovery engine · 8 Indian languages",
    accentColor: "#4285F4",
  });
}
