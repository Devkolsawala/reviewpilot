import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/components/marketing/og-template";

export const runtime = "edge";
export const alt =
  "ReviewPilot — WhatsApp Business API integration with Embedded Signup";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "WhatsApp Business API",
    title: "Official Cloud API + Meta Embedded Signup, in 60 seconds.",
    kicker:
      "Verified Tech Provider · whatsapp_business_messaging + management · AES-256-GCM at rest",
    accentColor: "#25D366",
  });
}
