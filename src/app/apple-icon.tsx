// PLACEHOLDER APPLE TOUCH ICON (180x180). To swap in the real logo:
//   1. Delete this file (src/app/apple-icon.tsx).
//   2. Drop a 180x180 PNG named `apple-icon.png` next to it
//      (src/app/apple-icon.png). Next.js 14 picks it up automatically.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A",
          borderRadius: 40,
          color: "#14B8A6",
          fontWeight: 800,
          fontSize: 72,
          fontFamily: "sans-serif",
          letterSpacing: "-2px",
        }}
      >
        RP
      </div>
    ),
    { width: 180, height: 180 }
  );
}
