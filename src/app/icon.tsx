// Browser-tab favicon — gradient indigo→violet→fuchsia "RP" matching the
// Navbar/Footer logo. Rendered at request time via ImageResponse so the
// design stays in sync with the in-page logo (no manual rasterizing).
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
          background:
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
          borderRadius: 7,
          color: "#ffffff",
          fontWeight: 800,
          fontSize: 14,
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
