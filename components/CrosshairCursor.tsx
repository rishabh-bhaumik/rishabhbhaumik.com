"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { PROJECTS } from "@/data/site";

/** Mouse and keyboard desktops only; phones and tablets never get it. */
const DESKTOP = "(hover: hover) and (pointer: fine) and (min-width: 768px)";

/** The case studies (every project that links to its own page) and the resume read undisturbed. */
const QUIET_ROUTES = [
  ...PROJECTS.map((p) => p.href).filter((h) => h.startsWith("/")),
  "/resume",
];

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const isDesktop = () => window.matchMedia(DESKTOP).matches;

/**
 * A scanner-style cursor overlay: a hairline across the page in each axis,
 * crossing under the pointer, a 4px dot where they meet, and the coordinates
 * stacked one character per line (x above-right, y below-left). The native
 * cursor is hidden while it is on (globals.css). Colours come from the theme
 * tokens, so it follows light and dark.
 *
 * The pointer is tracked outside React: each frame writes transforms and the
 * readout text straight to the elements, so moving the mouse never re-renders.
 */
export default function CrosshairCursor() {
  const pathname = usePathname() ?? "/";
  const desktop = useSyncExternalStore(subscribe, isDesktop, () => false);
  const active =
    desktop && !QUIET_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  const root = useRef<HTMLDivElement>(null);
  const vLine = useRef<HTMLDivElement>(null);
  const hLine = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const xLabel = useRef<HTMLDivElement>(null);
  const yLabel = useRef<HTMLDivElement>(null);
  const xText = useRef<HTMLDivElement>(null);
  const yText = useRef<HTMLDivElement>(null);

  // The system cursor is hidden for as long as the overlay is on (see globals.css).
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    html.setAttribute("data-crosshair", "");
    return () => html.removeAttribute("data-crosshair");
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const els = {
      root: root.current,
      v: vLine.current,
      h: hLine.current,
      dot: dot.current,
      xl: xLabel.current,
      yl: yLabel.current,
      x: xText.current,
      y: yText.current,
    };
    if (!els.root || !els.v || !els.h || !els.dot || !els.xl || !els.yl || !els.x || !els.y) return;
    const { root: r, v, h, dot: d, xl, yl, x: xt, y: yt } = els;

    let x = 0;
    let y = 0;
    let frame = 0;
    const paint = () => {
      frame = 0;
      v.style.transform = `translate3d(${x}px,0,0)`;
      h.style.transform = `translate3d(0,${y}px,0)`;
      d.style.transform = `translate3d(${x - 2}px,${y - 2}px,0)`;
      xl.style.transform = `translate3d(${x + 8}px,${y - 4}px,0)`;
      yl.style.transform = `translate3d(${x - 8}px,${y + 4}px,0)`;
      xt.textContent = `${x}:X`;
      yt.textContent = `Y:${y}`;
    };
    const onMove = (e: MouseEvent) => {
      x = Math.round(e.clientX);
      y = Math.round(e.clientY);
      r.style.opacity = "1";
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const hide = () => {
      r.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [active]);

  if (!active) return null;

  const fixed = "pointer-events-none fixed left-0 top-0 will-change-transform";
  const label = `${fixed} z-[100] select-none whitespace-nowrap text-12 tabular-nums text-ink/10`;
  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none opacity-0">
      <div ref={vLine} className={`${fixed} z-[99] h-screen w-px bg-ink/[0.02]`} />
      <div ref={hLine} className={`${fixed} z-[99] h-px w-screen bg-ink/[0.02]`} />
      <div ref={dot} className={`${fixed} z-[100] size-1 rounded-full bg-ink`} />
      {/* x sits above-right of the crossing; y below-left (its box ends at the line). */}
      <div ref={xLabel} className={`${label}`}>
        {/* Stacked upwards from the crossing: the digits, :, then X on top-to-bottom reading. */}
        <div ref={xText} className="-translate-y-full leading-[1.1] [text-orientation:upright] [writing-mode:vertical-lr]">
          0:X
        </div>
      </div>
      <div ref={yLabel} className={`${label}`}>
        {/* Upright characters stacked top to bottom: Y, :, then each digit. */}
        <div ref={yText} className="-translate-x-full leading-[1.1] [text-orientation:upright] [writing-mode:vertical-lr]">
          Y:0
        </div>
      </div>
    </div>
  );
}
