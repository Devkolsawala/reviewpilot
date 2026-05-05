/**
 * Format a count for display in marketing UI.
 *   < 1,000   → "247"
 *   < 10,000  → "1,247"
 *   ≥ 10,000  → "12.5K" / "1.2M"
 *
 * We always show real numbers — never inflate.
 */
export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n < 1000) return String(Math.floor(n));
  if (n < 10_000) return Math.floor(n).toLocaleString("en-US");
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.floor(k) : Math.round(k * 10) / 10}K`;
  }
  const m = n / 1_000_000;
  return `${m >= 100 ? Math.floor(m) : Math.round(m * 10) / 10}M`;
}
