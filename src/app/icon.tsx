// PLACEHOLDER FAVICON (32x32). To swap in the real logo:
//   1. Delete this file (src/app/icon.tsx).
//   2. Drop a 32x32 PNG named `icon.png` next to it (src/app/icon.png).
// Next.js 14 will auto-pick it up from the App Router file convention.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A",
          borderRadius: 7,
          color: "#14B8A6",
          fontWeight: 800,
          fontSize: 13,
          fontFamily: "sans-serif",
          letterSpacing: "-0.5px",
        }}
      >
        RP
      </div>
    ),
    { width: 32, height: 32 }
  );
}
