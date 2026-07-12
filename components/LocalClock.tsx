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
 * The header's reworked "link": the visitor's live LOCAL time plus a status
 * dot that reflects Rishabh's availability (computed from the schedule in
 * lib/availability — wire that to a DB later and this updates for free).
 */
export default function LocalClock() {
  const [time, setTime] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<AvailabilitySchedule | null>(null);
  const [status, setStatus] = useState<Status>("offline");

  // Visitor's local time, ticking every second. First tick is deferred to a
  // timer callback so we never setState synchronously inside the effect body.
  useEffect(() => {
    const fmt = () =>
      new Date()
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .toUpperCase();
    const update = () => setTime(fmt());
    const first = setTimeout(update, 0);
    const id = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

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

  return (
    <span
      className="group/clock flex items-center justify-end gap-2 whitespace-nowrap"
      title={meta.label}
    >
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
      <span className="font-mono text-[12px] leading-none text-faint tabular-nums">
        {/* suppressHydrationWarning: time is client-only, differs from SSR */}
        <span suppressHydrationWarning>{time ?? "--:-- --"}</span>{" "}
        <span className="text-faint/70">(local)</span>
      </span>
      <span className="sr-only">{meta.label}</span>
    </span>
  );
}
