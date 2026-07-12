/**
 * Availability / online-hours.
 *
 * This is intentionally shaped like a data source so it can be swapped for a
 * real database/API call later without touching the UI. `getAvailability()` is
 * async on purpose — today it resolves the static `WEEKLY_SCHEDULE` below, but
 * the moment you have a DB you only change the body of this one function.
 *
 * The UI (LocalClock) calls `resolveStatus(schedule, now)` every minute to
 * decide which colour the status dot should be.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday … 6 = Saturday

/** A half-open range of local hours, e.g. { start: 10, end: 18 } = 10:00–17:59. */
export interface HourRange {
  start: number; // 0–24
  end: number; // 0–24
}

export interface AvailabilitySchedule {
  /** IANA timezone the schedule is defined in, e.g. "Asia/Kolkata". */
  timezone: string;
  /** Available hour ranges per weekday. Empty array = offline all day. */
  hours: Record<Weekday, HourRange[]>;
}

export type Status = "online" | "away" | "offline";

/**
 * Static fallback schedule. Replace `getAvailability()` with a DB fetch when
 * ready — keep this as the offline/default so the dot never breaks.
 *
 * Current rule of thumb: weekdays 10:00–19:00 IST, lighter weekend window.
 */
export const WEEKLY_SCHEDULE: AvailabilitySchedule = {
  timezone: "Asia/Kolkata",
  hours: {
    0: [], // Sun — offline
    1: [{ start: 10, end: 19 }], // Mon
    2: [{ start: 10, end: 19 }], // Tue
    3: [{ start: 10, end: 19 }], // Wed
    4: [{ start: 10, end: 19 }], // Thu
    5: [{ start: 10, end: 19 }], // Fri
    6: [{ start: 12, end: 16 }], // Sat — short window
  },
};

/**
 * Async accessor — the seam for a future database. Today it just returns the
 * static schedule; swap the body for `await fetch(...)` later.
 */
export async function getAvailability(): Promise<AvailabilitySchedule> {
  return WEEKLY_SCHEDULE;
}

/** The local hour (0–23) and weekday in the schedule's timezone for a given instant. */
function localPartsInZone(
  date: Date,
  timezone: string,
): { weekday: Weekday; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, Weekday> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    weekday: weekdayMap[get("weekday")] ?? 0,
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
  };
}

/**
 * Resolve the current status against a schedule.
 * - online  : inside an available range
 * - away    : within 30 min before a range opens or after it closes (soft edge)
 * - offline : otherwise
 */
export function resolveStatus(
  schedule: AvailabilitySchedule,
  now: Date = new Date(),
): Status {
  const { weekday, hour, minute } = localPartsInZone(now, schedule.timezone);
  const nowMinutes = hour * 60 + minute;
  const ranges = schedule.hours[weekday] ?? [];

  for (const r of ranges) {
    const startMin = r.start * 60;
    const endMin = r.end * 60;
    if (nowMinutes >= startMin && nowMinutes < endMin) return "online";
    if (nowMinutes >= startMin - 30 && nowMinutes < startMin) return "away"; // about to open
    if (nowMinutes >= endMin && nowMinutes < endMin + 30) return "away"; // just closed
  }
  return "offline";
}

export const STATUS_META: Record<
  Status,
  { label: string; color: string; glow: string }
> = {
  online: { label: "Available now", color: "#34d399", glow: "rgba(52,211,153,0.55)" },
  away: { label: "Around, slow to reply", color: "#fbbf24", glow: "rgba(251,191,36,0.5)" },
  offline: { label: "Offline", color: "#6b7280", glow: "rgba(107,114,128,0.0)" },
};
