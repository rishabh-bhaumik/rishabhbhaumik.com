"use client";

import { useEffect, useState } from "react";
import {
  getAvailability,
  resolveStatus,
  STATUS_META,
  type AvailabilitySchedule,
  type Status,
} from "@/lib/availability";

/**
 * The header's centre: the visitor's live local time, a status dot for
 * Rishabh's availability (computed from the schedule in lib/availability; wire
 * that to a DB later and this updates for free), then "(local)". The dot sits
 * on the page's centre line. Display only: the theme switch lives in the dock.
 */
export default function LocalClock({
  timeZone,
  label = "(local)",
  compact = false,
  dotFirst = false,
}: {
  /** Whose time: the visitor's by default, or a fixed zone (the home footer's India time). */
  timeZone?: string;
  label?: string;
  /** Home's sheet nav and footer: one small row (10px), no centring grid. */
  compact?: boolean;
  /** Compact only: the dot leads ("● 01:52 AM (local)") instead of sitting between. */
  dotFirst?: boolean;
} = {}) {
  const [time, setTime] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<AvailabilitySchedule | null>(null);
  const [status, setStatus] = useState<Status>("offline");

  // Visitor's local time. The display only shows minutes, so it updates on
  // each minute boundary (not every second), and not at all in a hidden tab.
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone });
    let id = 0;
    const update = () => {
      setTime(fmt.format(new Date()).toUpperCase());
      id = window.setTimeout(update, 60_000 - (Date.now() % 60_000) + 50);
    };
    const onVisibility = () => {
      window.clearTimeout(id);
      if (!document.hidden) update();
    };
    id = window.setTimeout(update, 0);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [timeZone]);

  // Load availability schedule once (the future DB seam).
  useEffect(() => {
    let active = true;
    getAvailability().then((s) => {
      if (active) setSchedule(s);
    });
    return () => {
      active = false;
    };
  }, []);

  // Re-evaluate status every 30s against the schedule.
  useEffect(() => {
    if (!schedule) return;
    const tick = () => setStatus(resolveStatus(schedule));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [schedule]);

  const meta = STATUS_META[status];

  const dot = (
    <span className="relative inline-flex size-1.5 shrink-0" aria-hidden="true">
      {status === "online" && (
        <span
          className="absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
          style={{ backgroundColor: meta.color }}
        />
      )}
      <span className="relative inline-flex size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
    </span>
  );

  if (compact) {
    return (
      <span className="flex items-center gap-1 whitespace-nowrap text-10 leading-none text-faint" title={meta.label}>
        {dotFirst && dot}
        <span suppressHydrationWarning className="tabular-nums">
          {time ?? "--:-- --"}
        </span>
        {!dotFirst && dot}
        <span>{label}</span>
        <span className="sr-only">{meta.label}</span>
      </span>
    );
  }

  return (
    // Three columns, the outer two always equal, so the dot is the row's exact centre.
    <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 whitespace-nowrap" title={meta.label}>
      {/* One row: the time, the status dot, then "(local)". */}
      {/* suppressHydrationWarning: time is client-only, differs from SSR */}
      <span suppressHydrationWarning className="justify-self-end font-mono text-12 leading-none text-faint tabular-nums">
        {time ?? "--:-- --"}
      </span>
      <span
        className="relative inline-flex size-2 shrink-0"
        aria-hidden="true"
      >
        {status === "online" && (
          <span
            className="absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
            style={{ backgroundColor: meta.color }}
          />
        )}
        <span
          className="relative inline-flex size-2 rounded-full"
          style={{
            backgroundColor: meta.color,
            boxShadow: `0 0 8px ${meta.glow}`,
          }}
        />
      </span>
      <span className="justify-self-start font-mono text-12 leading-none text-faint/70">{label}</span>
      <span className="sr-only">{meta.label}</span>
    </span>
  );
}
