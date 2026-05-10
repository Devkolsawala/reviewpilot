import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

interface OgTemplateOptions {
  /** Small uppercase eyebrow above the headline (e.g. "WhatsApp automation"). */
  eyebrow: string;
  /** Main headline. Keep under ~70 chars; long titles are auto-shrunk by the layout. */
  title: string;
  /** Optional kicker placed under the title (e.g. "Meta-approved · Cloud API"). */
  kicker?: string;
  /** Hex color for the accent dot/eyebrow tint. Defaults to brand indigo. */
  accentColor?: string;
}

/**
 * Renders a 1200×630 ReviewPilot OG image at build/edge time.
 *
 * Uses inline styles only (next/og uses Satori — no Tailwind, no CSS variables).
 * Brand gradient indigo→fuchsia is rendered as an SVG-ish CSS gradient.
 */
export function renderOgImage({
  eyebrow,
  title,
  kicker,
  accentColor = "#6366f1",
}: OgTemplateOptions): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0b0b14 0%, #1a1330 55%, #2a0d3d 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative gradient blob (top-right) */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.55) 0%, rgba(217,70,239,0.35) 45%, rgba(0,0,0,0) 70%)",
            filter: "blur(2px)",
            display: "flex",
          }}
        />
        {/* Decorative gradient blob (bottom-left) */}
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at 60% 60%, rgba(217,70,239,0.45) 0%, rgba(99,102,241,0.25) 45%, rgba(0,0,0,0) 70%)",
            filter: "blur(2px)",
            display: "flex",
          }}
        />

        {/* Top: brand wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 22,
              color: "white",
            }}
          >
            R
          </div>
          <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4 }}>
            ReviewPilot
          </span>
        </div>

        {/* Middle: eyebrow + title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 980,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              alignSelf: "flex-start",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: accentColor,
                display: "flex",
              }}
            />
            <span
              style={{
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(250,250,250,0.7)",
                fontWeight: 500,
              }}
            >
              {eyebrow}
            </span>
          </div>

          <div
            style={{
              fontSize: title.length > 70 ? 60 : title.length > 50 ? 68 : 76,
              fontWeight: 600,
              letterSpacing: -1.6,
              lineHeight: 1.05,
              color: "#fafafa",
              display: "flex",
            }}
          >
            {title}
          </div>

          {kicker && (
            <div
              style={{
                fontSize: 24,
                color: "rgba(250,250,250,0.75)",
                lineHeight: 1.4,
                display: "flex",
              }}
            >
              {kicker}
            </div>
          )}
        </div>

        {/* Bottom: site URL + tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "rgba(250,250,250,0.55)",
              letterSpacing: 0.4,
            }}
          >
            reviewpilot.co.in
          </span>
          <span
            style={{
              fontSize: 18,
              padding: "10px 18px",
              borderRadius: 9999,
              border: "1px solid rgba(250,250,250,0.18)",
              color: "rgba(250,250,250,0.85)",
              background: "rgba(255,255,255,0.04)",
              display: "flex",
            }}
          >
            AI replies · Play Store · Google · WhatsApp
          </span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
    }
  );
}
