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

/**
 * Human, professional date-time for UI labels.
 *   "11 June 2026, 10:54 AM"  (day-month-year, 12-hour clock)
 * Returns "" for an unparseable input so callers can fall back cleanly.
 */
export function formatDateTime(input: string | number | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

/** Compact date for dense lists: "11 Jun 2026, 10:54 AM". */
export function formatDateTimeShort(input: string | number | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}
