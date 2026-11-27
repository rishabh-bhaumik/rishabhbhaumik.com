"use client";

import { useLayoutEffect, useRef, useState } from "react";

/*
 * BimaNetra's core thesis (Figma 8903:31127, "container-research"): the old deterministic
 * journey as three pages (landing, quote, checkout), the drop-off at each, and the line
 * under it. Laid out on Figma's own 1200 × 675 frame and scaled to the GrowMedia frame.
 * The dashed connectors are drawn on the exported vectors' centrelines as dashed
 * strokes so the dashes can march from page to page (`netra-dash`, kept with the SVG), as
 * /draft's CheckoutFlow does; still under reduced motion. The thin solid leaders from the
 * junctions to the figures are the exported vectors' paths, re-traced in frame px.
 * Follows the theme: Figma's dark composition (#1c1d1f down to black, black pages, white
 * lines at 10%) in dark; in light the same composition on the page's own colours (surface
 * down to bg, pages in bg, ink lines at 12%), through the --th-* variables set on the root.
 */

const W = 1200;
const H = 675;

const MUTED = "var(--th-muted)";
/** The connectors and leaders: white at 10% (ink at 12% in light). */
const LINE = "var(--th-line)";

/** The palette per theme, as CSS variables on the root. */
const THEME = [
  "[--th-top:#1c1d1f] [--th-foot:#000] [--th-page:#000] [--th-page-edge:#1c1d1f] [--th-label:#6f7378]",
  "[--th-line:rgba(255,255,255,0.1)] [--th-dot:#1c1c1c] [--th-dot-edge:#262626] [--th-muted:rgba(169,172,177,0.48)]",
  "[--th-figure:rgba(169,172,177,0.48)] [--th-strong:#fff]",
  "light:[--th-top:var(--color-surface)] light:[--th-foot:var(--color-bg)] light:[--th-page:var(--color-bg)] light:[--th-page-edge:var(--color-rule)]",
  "light:[--th-label:var(--color-faint)] light:[--th-line:rgba(20,18,16,0.12)] light:[--th-dot:var(--color-surface)] light:[--th-dot-edge:var(--color-surface-2)]",
  "light:[--th-muted:var(--color-faint)] light:[--th-figure:rgba(20,18,16,0.6)] light:[--th-strong:var(--color-ink)]",
].join(" ");

/** The three pages, in frame px; their labels in label/secondary (#6f7378). */
const PAGES = [
  { label: "landing page, filling form", left: 60.11, top: 82 },
  { label: "quote page, selecting quote", left: 475.12, top: 202 },
  { label: "checkout page, making payment", left: 838.11, top: 427 },
];

/** The two drop-offs: big figure, then the reason customers gave. */
const DROPS = [
  { value: "20%", quote: "“this form is long and complicated”", left: 855.12, top: 44.83 },
  { value: "35%", quote: "“i dont know what to pick”", left: 60.11, top: 432 },
];

/** The junction dots (centres) where the leaders leave the journey. */
const JUNCTIONS = [
  { x: 600.1, y: 131.62 },
  { x: 602.26, y: 486 },
];

/** Landing → quote, then quote → checkout: each dashed line runs from source to target. */
const DASHED = [
  "M316.19 131.62H592.09A10 10 0 0 1 602.09 141.62V200.5",
  "M602.27 322V476A10 10 0 0 0 612.27 486H832.42",
];

/** The leaders from the junctions out to the figures (Vector 5328 and 5329). */
const LEADERS = [
  "M600.11 131.63H817.07C819.83 131.63 822.5 130.13 824.69 128.11L847.9 100.81",
  "M602.26 486.16H359.34C357.6 486.16 355.88 486.6 354.34 487.5L324.88 504.51",
];

export default function NetraThesis({
  label,
  thesis = true,
}: {
  label: string;
  /** The core-thesis lines in the bottom right; off where the frame's caption carries the thesis (/netra). */
  thesis?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(Math.max((e.contentRect.width + 2) / W, (e.contentRect.height + 2) / H)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={root}
      role="img"
      aria-label={label}
      className={`absolute inset-0 overflow-hidden ${THEME}`}
      style={{ background: "linear-gradient(to bottom, var(--th-top) 19.729%, var(--th-foot))" }}
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 select-none lowercase"
        style={{
          width: W,
          height: H,
          transform: `translate(-50%, -50%) scale(${k ?? 1})`,
          visibility: k ? undefined : "hidden",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
          {/* The march: one dash period (7.5 + 7.5) a loop, so it repeats seamlessly. */}
          <style>{"@keyframes netra-dash{to{stroke-dashoffset:-15}}"}</style>
          {LEADERS.map((d) => (
            <path key={d} d={d} stroke={LINE} strokeWidth="1" />
          ))}
          {JUNCTIONS.map((j) => (
            <circle key={j.x} cx={j.x} cy={j.y} r="2.67" fill={LINE} />
          ))}
          {DASHED.map((d) => (
            <path
              key={d}
              d={d}
              stroke={LINE}
              strokeWidth="2"
              strokeDasharray="7.5 7.5"
              className="animate-[netra-dash_1.2s_linear_infinite] motion-reduce:animate-none"
            />
          ))}
        </svg>

        {JUNCTIONS.map((j) => (
          <span
            key={j.x}
            className="absolute size-[30.5px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--th-dot-edge)] bg-[var(--th-dot)]"
            style={{ left: j.x, top: j.y }}
          />
        ))}

        {PAGES.map((p) => (
          <div
            key={p.label}
            className="absolute grid h-[120px] w-[254px] place-items-center rounded-[2px] border-[0.5px] border-[var(--th-page-edge)] bg-[var(--th-page)] text-[12px] leading-none text-[var(--th-label)]"
            style={{ left: p.left, top: p.top }}
          >
            {p.label}
          </div>
        ))}

        {DROPS.map((d) => (
          <div key={d.value} className="absolute flex w-[257px] flex-col gap-3" style={{ left: d.left, top: d.top }}>
            <p className="text-[128px] leading-none opacity-10" style={{ color: "var(--th-figure)" }}>
              {d.value}
            </p>
            <p className="text-[12px] leading-[1.5]">
              <span style={{ color: MUTED }}>customers left this page. After reviews, the most common reason is </span>
              <span style={{ color: "var(--th-strong)" }}>{d.quote}</span>
            </p>
          </div>
        ))}

        {/* Three lines, left-aligned with each other; the block's right edge (its longest line)
            sits where Figma's caption ends (x 1173.74) and its foot on that caption's baseline. */}
        {thesis && (
          <div
            className="absolute flex flex-col items-start gap-[6px] whitespace-nowrap text-left text-[12px] leading-none"
            style={{ right: 26.26, bottom: 23.14, color: MUTED }}
          >
            <p>Core thesis:</p>
            <p>deterministic flows ask every business the same questions. An agentic flow asks only the ones that matter, and does the rest for them.</p>
            <p>Additionally, probabilistic models can infer from data, behaviour, and expectations</p>
          </div>
        )}
      </div>
    </div>
  );
}
