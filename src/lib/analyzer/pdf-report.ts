// Single-page A4 PDF summary of an analyzer run, sent as the lead-magnet
// attachment from /api/tools/analyze-app/email-report.
//
// @react-pdf/renderer is LAZY-IMPORTED inside generatePdfReport() so it does
// not bloat the cold-start bundle of any other route. Top-level imports of
// this library would pull ~50MB of pdfkit/font dependencies into every
// serverless function that transitively touches src/lib/analyzer/*.
//
// System fonts only — no external font fetch — to keep cold starts fast.
// Generated entirely in-memory: returns a Buffer for direct attachment via
// the Resend wrapper. Never writes to /tmp or any filesystem path.

import type { AnalysisResult } from "./pipeline";

export async function generatePdfReport(
  result: AnalysisResult
): Promise<Buffer> {
  // Lazy import — keeps unrelated route bundles small. See file header.
  const { renderToBuffer, Document, Page, Text, View, StyleSheet } =
    await import("@react-pdf/renderer");
  // React must be imported through the package's own React runtime to share
  // the reconciler instance @react-pdf uses internally.
  const React = (await import("react")).default;

  const { app, analysis } = result;
  const total = analysis.reviewCount;
  const responsePct = Math.round(analysis.metrics.responseRate * 100);
  const sent = analysis.metrics.sentimentBreakdown;
  const positivePct = total ? Math.round((sent.positive / total) * 100) : 0;
  const neutralPct = total ? Math.round((sent.neutral / total) * 100) : 0;
  const negativePct = Math.max(0, 100 - positivePct - neutralPct);

  const styles = StyleSheet.create({
    page: {
      padding: 36,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#1F1F2A",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    brand: {
      fontSize: 14,
      fontWeight: 700,
      color: "#6B4DFF",
    },
    badge: {
      marginLeft: "auto",
      fontSize: 9,
      color: "#71717A",
      letterSpacing: 1.5,
    },
    appName: {
      fontSize: 22,
      fontWeight: 700,
      marginTop: 4,
    },
    devLine: {
      fontSize: 11,
      color: "#71717A",
      marginTop: 2,
    },
    metricRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
    },
    metricCard: {
      flex: 1,
      padding: 12,
      borderWidth: 1,
      borderColor: "#E4E4E7",
      borderRadius: 6,
    },
    metricLabel: {
      fontSize: 8,
      color: "#71717A",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: 700,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 700,
      marginTop: 18,
      marginBottom: 8,
    },
    sentBar: {
      flexDirection: "row",
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: "#F4F4F5",
      marginTop: 4,
    },
    sentLegend: {
      flexDirection: "row",
      gap: 14,
      marginTop: 6,
      fontSize: 9,
      color: "#52525B",
    },
    clusterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: "#E4E4E7",
    },
    clusterLabel: {
      fontSize: 10,
      textTransform: "capitalize",
    },
    clusterCount: {
      fontSize: 9,
      color: "#52525B",
    },
    quote: {
      fontSize: 9,
      fontStyle: "italic",
      color: "#52525B",
      marginTop: 3,
    },
    sampleReply: {
      padding: 10,
      borderWidth: 1,
      borderColor: "#E4E4E7",
      borderRadius: 6,
    },
    reviewQuote: {
      fontSize: 9,
      fontStyle: "italic",
      color: "#52525B",
      paddingLeft: 6,
      borderLeftWidth: 2,
      borderLeftColor: "#D4D4D8",
    },
    replyText: {
      fontSize: 10,
      marginTop: 6,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 36,
      right: 36,
      textAlign: "center",
      fontSize: 8,
      color: "#71717A",
    },
  });

  const top = (xs: { label: string; count: number; sampleQuotes: string[] }[]) =>
    xs.slice(0, 5);

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(Text, { style: styles.brand }, "ReviewPilot"),
        React.createElement(
          Text,
          { style: styles.badge },
          "PLAY STORE REVIEW ANALYSIS"
        )
      ),
      React.createElement(Text, { style: styles.appName }, app.appName),
      app.developer
        ? React.createElement(Text, { style: styles.devLine }, app.developer)
        : null,
      React.createElement(
        Text,
        { style: { fontSize: 10, color: "#52525B", marginTop: 4 } },
        `${app.score ? app.score.toFixed(2) : "—"}★  ·  ${
          app.ratingCount
            ? Intl.NumberFormat("en-IN").format(app.ratingCount) + " ratings"
            : "rating count unavailable"
        }  ·  Sampled ${total} recent reviews`
      ),
      // Metrics
      React.createElement(
        View,
        { style: styles.metricRow },
        React.createElement(
          View,
          { style: styles.metricCard },
          React.createElement(Text, { style: styles.metricLabel }, "Response rate"),
          React.createElement(Text, { style: styles.metricValue }, `${responsePct}%`)
        ),
        React.createElement(
          View,
          { style: styles.metricCard },
          React.createElement(
            Text,
            { style: styles.metricLabel },
            "Unreplied negatives"
          ),
          React.createElement(
            Text,
            { style: styles.metricValue },
            String(analysis.metrics.unrepliedNegativeCount)
          )
        ),
        React.createElement(
          View,
          { style: styles.metricCard },
          React.createElement(Text, { style: styles.metricLabel }, "Recoverable"),
          React.createElement(
            Text,
            { style: styles.metricValue },
            String(analysis.metrics.recoverableCount)
          )
        )
      ),
      // Sentiment
      React.createElement(Text, { style: styles.sectionTitle }, "Sentiment breakdown"),
      React.createElement(
        View,
        { style: styles.sentBar },
        React.createElement(View, {
          style: { width: `${positivePct}%`, backgroundColor: "#10B981" },
        }),
        React.createElement(View, {
          style: { width: `${neutralPct}%`, backgroundColor: "#F59E0B" },
        }),
        React.createElement(View, {
          style: { width: `${negativePct}%`, backgroundColor: "#F43F5E" },
        })
      ),
      React.createElement(
        View,
        { style: styles.sentLegend },
        React.createElement(Text, null, `Positive ${positivePct}%`),
        React.createElement(Text, null, `Neutral ${neutralPct}%`),
        React.createElement(Text, null, `Negative ${negativePct}%`)
      ),
      // Complaints
      React.createElement(Text, { style: styles.sectionTitle }, "Top complaints"),
      analysis.complaints.length === 0
        ? React.createElement(
            Text,
            { style: { fontSize: 9, color: "#71717A" } },
            "No clear complaint clusters surfaced."
          )
        : React.createElement(
            View,
            null,
            ...top(analysis.complaints).map((c, i) =>
              React.createElement(
                View,
                { key: `c-${i}`, style: styles.clusterRow },
                React.createElement(Text, { style: styles.clusterLabel }, c.label),
                React.createElement(
                  Text,
                  { style: styles.clusterCount },
                  `${c.count} reviews`
                )
              )
            )
          ),
      // Praises
      React.createElement(Text, { style: styles.sectionTitle }, "Top praises"),
      analysis.praises.length === 0
        ? React.createElement(
            Text,
            { style: { fontSize: 9, color: "#71717A" } },
            "No clear praise clusters surfaced."
          )
        : React.createElement(
            View,
            null,
            ...top(analysis.praises).map((p, i) =>
              React.createElement(
                View,
                { key: `p-${i}`, style: styles.clusterRow },
                React.createElement(Text, { style: styles.clusterLabel }, p.label),
                React.createElement(
                  Text,
                  { style: styles.clusterCount },
                  `${p.count} reviews`
                )
              )
            )
          ),
      // Sample reply
      analysis.sampleReply
        ? React.createElement(
            View,
            null,
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              "Sample AI reply"
            ),
            React.createElement(
              View,
              { style: styles.sampleReply },
              React.createElement(
                Text,
                { style: styles.reviewQuote },
                `${"★".repeat(analysis.sampleReply.reviewRating)}${"☆".repeat(
                  5 - analysis.sampleReply.reviewRating
                )}  ${analysis.sampleReply.reviewText.slice(0, 400)}`
              ),
              React.createElement(
                Text,
                { style: styles.replyText },
                analysis.sampleReply.reply
              )
            )
          )
        : null,
      // Footer
      React.createElement(
        Text,
        { style: styles.footer },
        "Generated by ReviewPilot — start your free trial at reviewpilot.co.in"
      )
    )
  );

  const buf = await renderToBuffer(doc);
  // renderToBuffer's return type is Buffer in the @react-pdf/renderer types,
  // but the runtime instance is a Node Buffer either way. Cast to keep the
  // callsite ergonomics clean.
  return buf as Buffer;
}
