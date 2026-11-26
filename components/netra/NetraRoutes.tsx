"use client";

import { useLayoutEffect, useRef, useState } from "react";

/*
 * The six routes from one company name, from the planning whiteboard (/netra's sketches
 * photo, Figma 8913:30378), redrawn as a left-to-right flowchart in the manner of /draft's
 * CheckoutFlow: chips in stage boxes, dotted connectors whose dashes march from source to
 * target, the main path drawn brighter. The company name goes to Netra, which fails, makes a
 * fuzzy match or passes (the three cases, one stage each); it then fills the answers in or
 * validates them; the risk modal is answered no or yes; and each route ends on a quote (a
 * yes on the first two cases adds the whiteboard's "UE nudge", a yes on a pass is quoted
 * pre-underwritten). Laid out on a 1200 × 675 frame scaled to cover the GrowMedia frame;
 * follows the theme through the site's tokens, as NetraThesis does. Still under reduced motion.
 */

const W = 1200;
const H = 675;

type Tone = "ink" | "fail" | "pass" | "off";

/** The whiteboard's "UE", kept in capitals inside the frame's lowercase. */
const UE = (
  <>
    quote (<span className="normal-case">UE</span> nudge)
  </>
);
const TONE: Record<Tone, string> = {
  ink: "text-ink",
  fail: "text-[#ff5f57] light:text-[#d23a32]",
  pass: "text-[#27c840] light:text-[#17912b]",
  off: "text-ink/55",
};

const CHIP_H = 32;

/** A step, placed by its top left corner, `w` wide. */
function Chip({ x, y, w, head = false, tone = "ink", children }: { x: number; y: number; w: number; head?: boolean; tone?: Tone; children: React.ReactNode }) {
  return (
    <p
      className={`absolute flex items-center justify-center whitespace-nowrap rounded-[6px] border border-[rgba(169,172,177,0.1)] bg-surface light:border-black/[0.07] light:bg-[#f4f4f5] ${TONE[tone]}`}
      style={{ left: x, top: y, width: w, height: head ? 36 : CHIP_H, fontSize: head ? 15 : 13 }}
    >
      {children}
    </p>
  );
}

function Terminal({ cx, cy, children }: { cx: number; cy: number; children: React.ReactNode }) {
  return (
    <p
      className="absolute flex size-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(169,172,177,0.12)] bg-bg text-[14px] text-ink light:border-black/[0.06] light:bg-[#ededee]"
      style={{ left: cx, top: cy }}
    >
      {children}
    </p>
  );
}

/** An elbow from (x1, y1) across to `mx`, along to y2, then on to (x2, y2), with 8px corners. */
function elbow(x1: number, y1: number, x2: number, y2: number, mx: number) {
  if (Math.abs(y2 - y1) < 1) return `M${x1} ${y1}H${x2}`;
  const r = Math.min(8, Math.abs(y2 - y1) / 2);
  const s = y2 > y1 ? 1 : -1;
  return `M${x1} ${y1}H${mx - r}Q${mx} ${y1} ${mx} ${y1 + s * r}V${y2 - s * r}Q${mx} ${y2} ${mx + r} ${y2}H${x2}`;
}

/* Columns (left edges and widths). */
const START = { cx: 70, cy: H / 2 };
const NAME = { x: 136, w: 132 };
const STAGE = { x: 300, w: 700 };
const AGENT = { x: 330, w: 116 };
const STEP = { x: 486, w: 92 };
const MODAL = { x: 618, w: 104 };
const QUOTE = { x: 762, w: 196 };
const END = { cx: 1112, cy: H / 2 };

/** The three cases, top to bottom. */
const CASES: { head: string; headTone: Tone; agent: string; step: string; yes: React.ReactNode; yesTone: Tone }[] = [
  { head: "not found", headTone: "fail", agent: "agent (fail)", step: "fill", yes: UE, yesTone: "ink" },
  { head: "best guess", headTone: "ink", agent: "agent (fuzzy)", step: "validate", yes: UE, yesTone: "ink" },
  { head: "verified", headTone: "pass", agent: "agent (pass)", step: "validate", yes: "quote (pre-underwritten)", yesTone: "pass" },
];
const STAGE_H = 176;
const STAGE_GAP = 24;
const STAGE_TOP = (H - (STAGE_H * 3 + STAGE_GAP * 2)) / 2;

/** Each case's rows: the stage's top, the chain's centre line, and the no / yes rows. */
const ROWS = CASES.map((_, i) => {
  const top = STAGE_TOP + i * (STAGE_H + STAGE_GAP);
  const mid = top + 104;
  return { top, mid, no: mid - 30, yes: mid + 30 };
});

/** Connectors, each running source to target; `bright` is the main path (verified, yes). */
const LINES: { d: string; bright?: boolean }[] = [];
const nameMid = START.cy;
LINES.push({ d: `M${START.cx + 36} ${nameMid}H${NAME.x}`, bright: true });
ROWS.forEach((r, i) => {
  const main = i === 2;
  LINES.push({ d: elbow(NAME.x + NAME.w, nameMid, AGENT.x, r.mid, 296), bright: main });
  LINES.push({ d: `M${AGENT.x + AGENT.w} ${r.mid}H${STEP.x}`, bright: main });
  LINES.push({ d: elbow(STEP.x + STEP.w, r.mid, MODAL.x, r.no, 598) });
  LINES.push({ d: elbow(STEP.x + STEP.w, r.mid, MODAL.x, r.yes, 598), bright: main });
  LINES.push({ d: `M${MODAL.x + MODAL.w} ${r.no}H${QUOTE.x}` });
  LINES.push({ d: `M${MODAL.x + MODAL.w} ${r.yes}H${QUOTE.x}`, bright: main });
  LINES.push({ d: elbow(QUOTE.x + QUOTE.w, r.no, END.cx - 36, END.cy, 1040) });
  LINES.push({ d: elbow(QUOTE.x + QUOTE.w, r.yes, END.cx - 36, END.cy, 1040), bright: main });
});

export default function NetraRoutes({ label }: { label: string }) {
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
      className="absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(to bottom, var(--color-surface) 20%, var(--color-bg))" }}
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
        {ROWS.map((r, i) => (
          <div
            key={i}
            className="absolute rounded-[14px] border border-[rgba(169,172,177,0.08)] bg-[rgba(169,172,177,0.03)] light:border-[rgba(169,172,177,0.18)] light:bg-[rgba(169,172,177,0.08)]"
            style={{ left: STAGE.x, top: r.top, width: STAGE.w, height: STAGE_H }}
          />
        ))}

        {/* The march: one dash period (5 + 5) a loop, so it repeats seamlessly. */}
        <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <style>{"@keyframes netra-routes{to{stroke-dashoffset:-10}}"}</style>
          {LINES.map((l, i) => (
            <path
              key={i}
              d={l.d}
              strokeWidth={l.bright ? 1.4 : 1.1}
              strokeDasharray="5 5"
              className={`animate-[netra-routes_1.2s_linear_infinite] motion-reduce:animate-none ${
                l.bright
                  ? "stroke-[#C8C8C8] light:stroke-[#7a7a7a]"
                  : "stroke-[#A9ACB1] [stroke-opacity:0.3] light:stroke-black light:[stroke-opacity:0.28]"
              }`}
            />
          ))}
        </svg>

        <Terminal cx={START.cx} cy={START.cy}>start</Terminal>
        <Chip x={NAME.x} y={nameMid - 18} w={NAME.w} head>
          company name
        </Chip>

        {CASES.map((c, i) => {
          const r = ROWS[i];
          return (
            <div key={c.head}>
              <Chip x={STAGE.x + 16} y={r.top + 14} w={112} head tone={c.headTone}>
                {c.head}
              </Chip>
              <Chip x={AGENT.x} y={r.mid - CHIP_H / 2} w={AGENT.w}>
                {c.agent}
              </Chip>
              <Chip x={STEP.x} y={r.mid - CHIP_H / 2} w={STEP.w}>
                {c.step}
              </Chip>
              <Chip x={MODAL.x} y={r.no - CHIP_H / 2} w={MODAL.w} tone="off">
                modal (no)
              </Chip>
              <Chip x={MODAL.x} y={r.yes - CHIP_H / 2} w={MODAL.w}>
                modal (yes)
              </Chip>
              <Chip x={QUOTE.x} y={r.no - CHIP_H / 2} w={QUOTE.w} tone="off">
                quote
              </Chip>
              <Chip x={QUOTE.x} y={r.yes - CHIP_H / 2} w={QUOTE.w} tone={c.yesTone}>
                {c.yes}
              </Chip>
            </div>
          );
        })}

        <Terminal cx={END.cx} cy={END.cy}>end</Terminal>
      </div>
    </div>
  );
}
