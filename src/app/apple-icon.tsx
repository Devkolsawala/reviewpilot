// iOS home-screen icon — same gradient "RP" mark as the in-page logo,
// rendered at 180x180 with iOS-style rounded corners.
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
          background:
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
          borderRadius: 40,
          color: "#ffffff",
          fontWeight: 800,
          fontSize: 80,
          fontFamily: "sans-serif",
          letterSpacing: "-3px",
        }}
      >
        RP
      </div>
    ),
    { width: 180, height: 180 }
  );
}
