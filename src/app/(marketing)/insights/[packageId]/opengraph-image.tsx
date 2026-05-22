// Dynamic OG image for /insights/[packageId].
//
// Reads the cached analysis from Supabase (does NOT trigger a fresh scrape —
// social-card crawlers should never burn rate-limit quota). Falls back to a
// branded generic card if no cache exists. System fonts only — no external
// font fetch — to keep cold starts fast on Vercel.

import { ImageResponse } from "next/og";
import { readCachedAnalysis } from "@/lib/analyzer/pipeline";

export const runtime = "nodejs";
export const alt = "ReviewPilot Play Store analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageParams {
  params: { packageId: string };
}

const BRAND = "#6B4DFF";
const BG = "#0B0B12";
const FG = "#F5F5F7";
const MUTED = "#A1A1AA";

export default async function Image({ params }: ImageParams) {
  const cached = await readCachedAnalysis(params.packageId).catch(() => null);

  const appName = cached?.app.appName || params.packageId;
  const developer = cached?.app.developer || "";
  const rating = cached?.app.score ? cached.app.score.toFixed(2) : "—";
  const responseRate = cached
    ? Math.round(cached.analysis.metrics.responseRate * 100)
    : null;
  const unrepliedNegative = cached
    ? cached.analysis.metrics.unrepliedNegativeCount
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${BG} 0%, #14141F 100%)`,
          padding: "64px 72px",
          fontFamily: "sans-serif",
          color: FG,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            R
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: -0.3,
            }}
          >
            ReviewPilot
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 16,
              color: MUTED,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Play Store Analysis
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginTop: 72,
          }}
        >
          {cached?.app.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cached.app.iconUrl}
              alt=""
              width={120}
              height={120}
              style={{ borderRadius: 24, border: `1px solid #2A2A35` }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 24,
                background: "#1C1C26",
                border: `1px solid #2A2A35`,
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 820,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: -1,
                lineHeight: 1.05,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {appName}
            </div>
            {developer && (
              <div
                style={{
                  fontSize: 24,
                  color: MUTED,
                  marginTop: 8,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 820,
                }}
              >
                {developer}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 16,
                fontSize: 28,
              }}
            >
              <span style={{ color: "#FBBF24" }}>★</span>
              <span style={{ fontWeight: 600 }}>{rating}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 24,
          }}
        >
          <Stat
            label="Response rate"
            value={responseRate === null ? "—" : `${responseRate}%`}
          />
          <Stat
            label="Unreplied negatives"
            value={
              unrepliedNegative === null ? "—" : String(unrepliedNegative)
            }
          />
          <Stat label="Source" value="Public Play Store" />
        </div>
      </div>
    ),
    { ...size }
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "20px 24px",
        borderRadius: 16,
        background: "#15151E",
        border: `1px solid #2A2A35`,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: 1.5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}
