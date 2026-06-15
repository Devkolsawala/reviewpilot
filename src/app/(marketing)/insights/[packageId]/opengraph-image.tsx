// Dynamic OG image for /insights/[packageId] — branded review-health scorecard.
//
// Reads the cached analysis from Supabase (does NOT trigger a fresh scrape —
// social-card crawlers must never burn rate-limit quota). Renders the app name,
// the deterministic Review Health Score, and its letter grade in the ReviewPilot
// design system (cream + indigo, Plus Jakarta Sans). Falls back to a branded
// generic card when no cache exists.
//
// Plus Jakarta Sans is fetched from Google Fonts at request time and memoized
// at module scope so warm invocations reuse it. If the fetch fails we fall back
// to the platform sans-serif rather than failing the card.

import { ImageResponse } from "next/og";
import { readCachedAnalysis } from "@/lib/analyzer/pipeline";
import { computeHealthScore } from "@/lib/analyzer/health-score";

export const runtime = "nodejs";
export const alt = "ReviewPilot Play Store review health scorecard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageParams {
  params: { packageId: string };
}

// Design-system palette.
const CREAM = "#F9F7F4";
const INDIGO = "#4338CA";
const INK = "#1E1B2E"; // near-black heading ink
const MUTED = "#6B6680"; // secondary text
const CARD = "#FFFFFF";
const BORDER = "#E7E3DC";
const INDIGO_TINT = "#EEECFB";

// ── Font loading (memoized) ──────────────────────────────────────────────────

type FontData = { name: string; data: ArrayBuffer; weight: 600 | 700 | 800 }[];
let fontsPromise: Promise<FontData> | null = null;

async function loadFont(weight: 600 | 700 | 800): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}`,
        {
          headers: {
            // Desktop UA → Google serves a TTF src that ImageResponse can use.
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      )
    ).text();
    const url = css.match(
      /src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:truetype|opentype)'\)/
    )?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

async function loadFonts(): Promise<FontData> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const [semibold, bold, extra] = await Promise.all([
        loadFont(600),
        loadFont(700),
        loadFont(800),
      ]);
      const fonts: FontData = [];
      if (semibold) fonts.push({ name: "Plus Jakarta Sans", data: semibold, weight: 600 });
      if (bold) fonts.push({ name: "Plus Jakarta Sans", data: bold, weight: 700 });
      if (extra) fonts.push({ name: "Plus Jakarta Sans", data: extra, weight: 800 });
      return fonts;
    })();
  }
  return fontsPromise;
}

export default async function Image({ params }: ImageParams) {
  const cached = await readCachedAnalysis(params.packageId).catch(() => null);
  const fonts = await loadFonts();
  const fontFamily = fonts.length ? "Plus Jakarta Sans" : "sans-serif";

  const appName = cached?.app.appName || params.packageId;
  const developer = cached?.app.developer || "";
  const rating = cached?.app.score ? cached.app.score.toFixed(2) : null;

  const hasScore = !!cached && cached.analysis.reviewCount > 0;
  const health = hasScore
    ? computeHealthScore({
        responseRate: cached!.analysis.metrics.responseRate,
        unrepliedNegativeCount: cached!.analysis.metrics.unrepliedNegativeCount,
        sentimentBreakdown: cached!.analysis.metrics.sentimentBreakdown,
        ratingTrend90d: cached!.analysis.metrics.ratingTrend90d,
        reviewCount: cached!.analysis.reviewCount,
      })
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: CREAM,
          padding: "64px 72px",
          fontFamily,
          color: INK,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: INDIGO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: CREAM,
            }}
          >
            R
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: INK }}>
            ReviewPilot
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 15,
              color: MUTED,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontWeight: 600,
            }}
          >
            Play Store Review Health
          </div>
        </div>

        {/* App identity */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginTop: 56,
          }}
        >
          {cached?.app.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cached.app.iconUrl}
              alt=""
              width={104}
              height={104}
              style={{ borderRadius: 24, border: `1px solid ${BORDER}` }}
            />
          ) : (
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: 24,
                background: CARD,
                border: `1px solid ${BORDER}`,
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                letterSpacing: -1,
                lineHeight: 1.05,
                color: INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 820,
              }}
            >
              {appName}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 10,
                fontSize: 22,
                color: MUTED,
                fontWeight: 600,
              }}
            >
              {developer && (
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 520,
                  }}
                >
                  {developer}
                </span>
              )}
              {rating && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: INDIGO }}>★</span>
                  <span style={{ color: INK, fontWeight: 700 }}>{rating}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scorecard */}
        <div style={{ marginTop: "auto", display: "flex" }}>
          {health ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                width: "100%",
                padding: "28px 32px",
                borderRadius: 24,
                background: CARD,
                border: `1px solid ${BORDER}`,
              }}
            >
              {/* Grade chip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 132,
                  height: 132,
                  borderRadius: 22,
                  background: INDIGO_TINT,
                  color: INDIGO,
                  fontSize: 88,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {health.grade}
              </div>

              {/* Score + verdict */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: 16,
                    color: MUTED,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    fontWeight: 600,
                  }}
                >
                  Review Health Score
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontSize: 76, fontWeight: 800, color: INDIGO }}>
                    {health.score}
                  </span>
                  <span style={{ fontSize: 30, fontWeight: 700, color: MUTED }}>
                    /100
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "28px 32px",
                borderRadius: 24,
                background: CARD,
                border: `1px solid ${BORDER}`,
                fontSize: 30,
                fontWeight: 700,
                color: INK,
              }}
            >
              Free Play Store review health check →
              <span style={{ color: INDIGO, marginLeft: 10 }}>reviewpilot.co.in</span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
