/**
 * Timezone helpers for the digest feature.
 *
 * Cloudflare Workers fire every 2 hours, so digest dispatch logic uses
 * "send no earlier than" gating combined with idempotency (digest_logs unique
 * index). These helpers convert between UTC instants and user-local wall-clock
 * fields (hour, day-of-week, date) without pulling in a timezone library.
 *
 * DST transitions near midnight are handled by re-deriving the local date
 * after each shift instead of doing UTC arithmetic on hours.
 */

export type TzParts = {
  year: number;
  month: number;       // 1–12
  day: number;
  hour: number;        // 0–23
  minute: number;
  second: number;
  weekday: number;     // 0=Sun..6=Sat (matches JS Date.getDay)
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export function getTzParts(date: Date, timeZone: string): TzParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  // Some runtimes emit "24" for midnight under hour12:false; normalise.
  const hourStr = map.hour === "24" ? "00" : map.hour;
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: parseInt(hourStr, 10),
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  };
}

/**
 * Returns a UTC Date representing 00:00:00 of (year, month, day) in `timeZone`.
 * Uses the standard offset-difference trick: pick a UTC guess, see what local
 * time it maps to, shift by the gap.
 */
export function startOfDayInTzAsUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const local = getTzParts(new Date(utcGuess), timeZone);
  const localAsIfUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second
  );
  const offsetMs = localAsIfUtc - utcGuess;
  return new Date(utcGuess - offsetMs);
}

/** Start of the local day in `timeZone` for instant `now`, as UTC. */
export function startOfTodayInTzAsUtc(now: Date, timeZone: string): Date {
  const p = getTzParts(now, timeZone);
  return startOfDayInTzAsUtc(p.year, p.month, p.day, timeZone);
}

/**
 * Most recent occurrence of (weekday=dow, hour=hour, minute=0) at or before
 * `now`, in the user's `timeZone`. Returned as UTC.
 *
 * Used as the weekly digest's `period_start` — the unique index on
 * digest_logs(user_id, digest_type, period_start) guarantees exactly one
 * weekly send per slot.
 */
export function mostRecentWeeklySlotAsUtc(
  now: Date,
  timeZone: string,
  dow: number,
  hour: number
): Date {
  const nowLocal = getTzParts(now, timeZone);
  let daysBack = (nowLocal.weekday - dow + 7) % 7;
  if (daysBack === 0 && nowLocal.hour < hour) daysBack = 7;

  const todayMidnightUtc = startOfDayInTzAsUtc(
    nowLocal.year,
    nowLocal.month,
    nowLocal.day,
    timeZone
  );
  // Step back to the slot's day, then re-derive its local Y/M/D so DST
  // boundaries don't accumulate hour drift.
  const stepped = new Date(todayMidnightUtc.getTime() - daysBack * 86_400_000);
  const slotDay = getTzParts(stepped, timeZone);
  const slotMidnightUtc = startOfDayInTzAsUtc(
    slotDay.year,
    slotDay.month,
    slotDay.day,
    timeZone
  );
  return new Date(slotMidnightUtc.getTime() + hour * 3_600_000);
}
