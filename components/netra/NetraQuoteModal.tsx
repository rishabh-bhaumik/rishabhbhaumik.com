"use client";

import "@/components/bk/anek.css";
import { Instrument_Serif } from "next/font/google";
import { AnimatePresence, cubicBezier, m, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NetraBot, type NetraBotHandle } from "../netrabot/NetraBot";
import { BAYER } from "@/lib/netrabot/bayer";
import { useGrow } from "../project/GrowMedia";
import { Glyph } from "./NetraSplash";

export const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], display: "swap" });

/*
 * BimaNetra's quote modal, rebuilt from the BimaNetra app (QuoteModal, ResearchScan,
 * InteractiveInput, SegmentedField; Figma 503:14898) at its own size, on the home
 * cards' surface-to-bg gradient (following the theme; the modal light in either), no page behind it. The point
 * it makes: nobody fills a form. It comes in through a diagonal Bayer dither (#ff7700
 * front, top left first) with Profile already filled; the pointer confirms it; Business
 * loads (the page scan on the left, "Fetching…" in the fields) and fills itself; the
 * pointer confirms; Risk loads and fills itself the same way (here every answer is
 * filled, the Yes/No ones included); the pointer clicks Get Instant Quotes, and the
 * dither carries the modal off before the loop goes again. Starts once the frame is at
 * full size and on screen; leaving the screen resets it; reduced motion shows Risk,
 * filled, as one still.
 */

/** The modal: the engine panel (500) and the form (581), edge to edge. */
const W = 1081;
const H = 660;
/** The 16:9 frame it sits in: centred both ways (561px tall at 85%, 57px above and below). */
const FW = 1200;
const FH = 675;
const SCALE = 0.85;
const TOP = (FH - H * SCALE) / 2;

export const VIOLET = "#4100cf";
export const ORANGE = "#ff7700";
export const INK = "#1c1d1f";
export const BASIC = "#1c1c1c";
export const SECOND = "#6f7378";
export const TERT = "#a9acb1";
export const STROKE = "rgba(169,172,177,0.56)";
export const PLACEHOLDER = "rgba(169,172,177,0.48)";
export const TINT = "rgba(65,0,207,0.02)";
export const GREEN = "#00b200";
export const TIGHT = "-0.0117em";
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const POP = [0.34, 1.4, 0.64, 1] as const;

const COMPANY = "Pepe Jeans Innerfashion Private Limited";

// ---- The script (ms from the start of a loop) --------------------------------------

/** The dither: in, then out again at the end. */
const IN = [200, 1500] as const;
const OUT = [14000, 15300] as const;
const LOOP = 15900;
/** How steeply the dither leans: the soft edge is 1/SWEEP of the diagonal wide. */
const SWEEP = 2.5;

/** The three CTA clicks; each step follows 900ms later (the bot's celebrate). */
const CLICK = [2700, 7900, 13000] as const;
const CELEBRATE = 900;
const STEP_AT = [0, CLICK[0] + CELEBRATE, CLICK[1] + CELEBRATE] as const;
/** The page scan: 3 sweeps of 600ms and 2 flips of 450ms; then the fields resolve 80ms apart. */
const SCAN = 2700;
const WAVE = 80;

/** Where the pointer goes, in modal px. */
const AT = {
  enter: { x: 1040, y: 640 },
  cta: { x: 770, y: 611 },
  rest: { x: 930, y: 528 },
};
/** The pointer's moves: [start, end, from, to]; it rests between them. */
const MOVES: [number, number, keyof typeof AT, keyof typeof AT][] = [
  [1500, 2300, "enter", "cta"],
  [CLICK[0] + 200, CLICK[0] + 700, "cta", "rest"],
  [6700, 7400, "rest", "cta"],
  [CLICK[1] + 200, CLICK[1] + 700, "cta", "rest"],
  [12000, 12700, "rest", "cta"],
];
const POINTER_ON = [1450, OUT[0]] as const;

const EASE_MOVE = cubicBezier(0.45, 0, 0.2, 1);
const EASE_FLIP = cubicBezier(0.33, 0, 0.67, 1);
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** What each step's scan says, one line per sweep. */
export const SCAN_TITLES = [
  [],
  ["Probing MCA Data", "Reading Director History", "Studying Company Financials"],
  ["Assessing Business", "Understanding Risk", "Calculating Sum Insured"],
];

type Kind = "arrow" | "text" | "hand";
type Frame = {
  step: 0 | 1 | 2;
  /** The 900ms after a CTA click, button held. */
  advancing: boolean;
  /** How many of this step's fields have resolved (step 0: all). */
  resolved: number;
  /** The scan is done (the step is ready to confirm). */
  done: boolean;
  /** Which scan line shows. */
  line: number;
  kind: Kind;
  on: boolean;
  down: boolean;
  atCta: boolean;
  press: boolean;
};

function pointerAt(t: number) {
  let p = AT.enter;
  for (const [a, b, from, to] of MOVES) {
    if (t < a) break;
    if (t >= b) {
      p = AT[to];
      continue;
    }
    const e = EASE_MOVE((t - a) / (b - a));
    return { x: AT[from].x + (AT[to].x - AT[from].x) * e, y: AT[from].y + (AT[to].y - AT[from].y) * e, moving: true };
  }
  return { ...p, moving: false };
}

function frameAt(t: number): Frame {
  const step = t >= STEP_AT[2] ? 2 : t >= STEP_AT[1] ? 1 : 0;
  const local = t - STEP_AT[step];
  const fields = step === 1 ? 4 : 3;
  const resolved = step === 0 ? 4 : local < SCAN ? 0 : Math.min(fields, Math.floor((local - SCAN) / WAVE) + 1);
  const p = pointerAt(t);
  const atCta = !p.moving && p.x === AT.cta.x && p.y === AT.cta.y;
  const press = CLICK.some((c) => t >= c && t < c + 120);
  return {
    step,
    advancing: CLICK.some((c) => t >= c && t < c + CELEBRATE),
    resolved,
    done: step === 0 || local >= SCAN,
    line: local < 825 ? 0 : local < 1875 ? 1 : 2,
    kind: atCta ? "hand" : "arrow",
    on: t >= POINTER_ON[0] && t < POINTER_ON[1],
    down: press,
    atCta,
    press,
  };
}

const START = frameAt(0);
/** Reduced motion: Risk, filled in, ready for quotes. */
const STILL: Frame = { ...frameAt(CLICK[2] - 400), on: false, atCta: false, kind: "arrow" };

/** The scan's page turn (deg) and bar (0 top, 1 foot of the page) at ms into a step. */
function scanAt(local: number) {
  const seg = (a: number, b: number) => EASE_FLIP(clamp((local - a) / (b - a)));
  const rot = 180 * seg(600, 1050) + 180 * seg(1650, 2100);
  const bar =
    local < 600 ? seg(0, 600) : local < 1050 ? 1 : local < 1650 ? 1 - seg(1050, 1650) : local < 2100 ? 0 : seg(2100, 2700);
  return { rot, bar };
}

/** How much of the modal shows at t: 0 hidden, 1 whole; and which way the dither runs. */
function reveal(t: number) {
  if (t < IN[0]) return { p: 0, out: false };
  if (t < IN[1]) return { p: (t - IN[0]) / (IN[1] - IN[0]), out: false };
  if (t < OUT[0]) return { p: 1, out: false };
  if (t < OUT[1]) return { p: 1 - (t - OUT[0]) / (OUT[1] - OUT[0]), out: true };
  return { p: 0, out: true };
}

/** As NetraSplash's: how far the frame can grow on this screen (1 only when it fits). */
function startAt(frame: number) {
  const view = document.documentElement.clientHeight;
  const max = view >= frame ? 1 : ((frame + view) / (2 * frame)) ** 2;
  return Math.min(0.985, max - 0.01);
}

export default function NetraQuoteModal({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const modal = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const maskCanvas = useRef<HTMLCanvasElement | null>(null);
  const bot = useRef<NetraBotHandle>(null);
  const grow = useGrow();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState<Frame>(START);
  const [still, setStill] = useState(false);
  const px = useMotionValue(AT.enter.x);
  const py = useMotionValue(AT.enter.y);
  const rot = useMotionValue(0);
  const bar = useMotionValue(0);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // The 1200 x 675 frame scaled to cover the box, a pixel over on each side.
  const k = box ? Math.max((box.w + 2) / FW, (box.h + 2) / FH) : 1;
  const stage = box ? `translate(${(box.w - FW * k) / 2}px, ${(box.h - FH * k) / 2}px) scale(${k})` : undefined;
  const kRef = useRef(k);
  useLayoutEffect(() => {
    kRef.current = k;
  }, [k]);

  // The dither, ~2 screen px a cell: a mask on the modal (shown cells) and, over it, the
  // orange band at the edge. Both drawn at cell size and scaled up unsmoothed.
  const paint = (p: number, out: boolean) => {
    const c = canvas.current;
    const el = modal.current;
    if (!c || !el) return;
    // The drop shadow can't come through the mask (it lies outside the modal), so it is
    // its own layer, fading with the dither: in as it lands, out as it carries off.
    if (shade.current) shade.current.style.opacity = String(clamp((p - 0.15) / 0.85) ** 1.5);
    if (p >= 1) {
      c.style.visibility = "hidden";
      el.style.maskImage = el.style.webkitMaskImage = "none";
      return;
    }
    c.style.visibility = "visible";
    const cell = Math.max(1, 2 / (kRef.current * SCALE));
    const cw = Math.ceil(W / cell);
    const ch = Math.ceil(H / cell);
    const mc = (maskCanvas.current ??= document.createElement("canvas"));
    for (const cv of [c, mc]) {
      if (cv.width !== cw || cv.height !== ch) {
        cv.width = cw;
        cv.height = ch;
      }
    }
    const ctx = c.getContext("2d");
    const mctx = mc.getContext("2d");
    if (!ctx || !mctx) return;
    const front = ctx.createImageData(cw, ch);
    const shown = mctx.createImageData(cw, ch);
    const f = front.data;
    const s = shown.data;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        // 0 at the top left, 1 at the bottom right; out runs from the same corner.
        let u = (x / cw + y / ch) / 2;
        if (out) u = 1 - u;
        const a = clamp(p * (1 + SWEEP) - SWEEP * u);
        const th = BAYER[(y & 15) * 16 + (x & 15)] + 0.5;
        const i = (y * cw + x) * 4;
        if (a > th) {
          s[i + 3] = 255;
        } else if (a > 0 && a > th - 0.16) {
          f[i] = 255;
          f[i + 1] = 119;
          f[i + 2] = 0;
          f[i + 3] = 230;
        }
      }
    }
    ctx.putImageData(front, 0, 0);
    mctx.putImageData(shown, 0, 0);
    el.style.maskImage = el.style.webkitMaskImage = `url(${mc.toDataURL()})`;
  };

  // The loop, on one clock: the dither, pointer and scan every frame, the rest as it changes.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = window.setTimeout(() => {
        setStill(true);
        setFrame(STILL);
        rot.set(360);
        paint(1, false);
      });
      return () => window.clearTimeout(t);
    }
    let raf = 0;
    let t0 = 0;
    let inView = false;
    let last = "";
    let reacted = new Set<string>();
    const ready = () => inView && grow.get() >= startAt(el.offsetHeight);
    const show = (f: Frame) => {
      const key = JSON.stringify(f);
      if (key !== last) {
        last = key;
        setFrame(f);
      }
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      reacted = new Set();
      px.jump(AT.enter.x);
      py.jump(AT.enter.y);
      rot.jump(0);
      bar.jump(0);
      show(START);
      paint(0, false);
    };
    const tick = (now: number) => {
      if (!t0) t0 = now;
      let t = now - t0;
      if (t >= LOOP) {
        // Round again only while the frame is still at full size; otherwise wait for it.
        reacted = new Set();
        if (!ready()) {
          reset();
          return;
        }
        t0 = now;
        t = 0;
      }
      const r = reveal(t);
      paint(r.p, r.out);
      const p = pointerAt(t);
      px.set(p.x);
      py.set(p.y);
      const f = frameAt(t);
      const sc = scanAt(t - STEP_AT[f.step]);
      rot.set(f.step === 0 ? 0 : sc.rot);
      bar.set(sc.bar);
      show(f);
      // The bot celebrates each click and nods as each step fills itself.
      const beats: [string, boolean, string][] = [
        ["c0", t >= CLICK[0], "celebrate"],
        ["n1", f.step === 1 && f.done, "nodYes"],
        ["c1", t >= CLICK[1], "celebrate"],
        ["n2", f.step === 2 && f.done, "nodYes"],
        ["c2", t >= CLICK[2], "celebrate"],
      ];
      for (const [n, ok, react] of beats) {
        if (ok && !reacted.has(n)) {
          reacted.add(n);
          bot.current?.react(react);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && ready()) {
        t0 = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    paint(0, false);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) start();
      else if (raf) reset();
    });
    io.observe(el);
    const off = grow.on("change", start);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      off();
    };
  }, [grow, px, py, rot, bar]);

  const ready = frame.done && !frame.advancing;
  const botState = frame.step > 0 && !frame.done ? "searching" : "happyIdle";
  // Its eyes on the pointer: ±1 at nine bot-widths (the bot sits at 24,64, 64px).
  const gaze = () => {
    const reach = 64 * 9;
    return { x: clamp((px.get() - 56) / reach, -1, 1), y: clamp((py.get() - 96) / reach, -1, 1) };
  };

  return (
    // The home cards' gradient, following the theme; the modal itself stays light in either
    // (the light tokens apply inside the stage).
    <div
      ref={root}
      role="img"
      aria-label={label}
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-surface to-bg"
    >
      <div
        aria-hidden
        data-theme="light"
        className="absolute left-0 top-0 origin-top-left select-none"
        style={{ width: FW, height: FH, transform: stage, visibility: box ? undefined : "hidden" }}
      >
        <div
          className="absolute origin-top-left"
          style={{
            width: W,
            height: H,
            left: (FW - W * SCALE) / 2,
            top: TOP,
            transform: `scale(${SCALE})`,
            fontFamily: '"Anek Latin", Arial, sans-serif',
            color: INK,
          }}
        >
          <div ref={shade} aria-hidden className="absolute inset-0 rounded-[14px] opacity-0 shadow-[0_24px_80px_rgba(28,28,28,0.24)]" />
          {/* Hidden until the dither brings it in (the mask, set as it runs). */}
          <div
            ref={modal}
            className="relative flex size-full overflow-hidden rounded-[14px] [image-rendering:pixelated] [mask-image:linear-gradient(transparent,transparent)] [mask-size:100%_100%] [-webkit-mask-size:100%_100%]"
          >
            <Engine frame={frame} botState={botState} bot={bot} gaze={still ? undefined : gaze} rot={rot} bar={bar} />
            <Form frame={frame} ready={ready} />
          </div>
          <canvas ref={canvas} className="absolute inset-0 size-full rounded-[14px] [image-rendering:pixelated]" />
          {!still && <Pointer x={px} y={py} frame={frame} />}
        </div>
      </div>
    </div>
  );
}

// ---- Icons ----------------------------------------------------------------------

/** A filled roundel with a white tick. */
export function Roundel({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="8" fill={color} />
      <path d="m4.8 8.2 2 2 4-4.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StrokeCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="7.25" stroke={VIOLET} strokeWidth="1.5" />
      <path d="m4.8 8.2 2 2 4-4.4" stroke={VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chevron({ color = TERT }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path d="m4 6 4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Spinner() {
  return (
    <m.svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
    >
      <circle cx="8" cy="8" r="6.5" stroke={STROKE} strokeWidth="2" />
      <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" stroke={VIOLET} strokeWidth="2" strokeLinecap="round" />
    </m.svg>
  );
}

export function Info() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="7" stroke="#1458d2" strokeWidth="1.3" />
      <circle cx="8" cy="5" r=".9" fill="#1458d2" />
      <path d="M8 7.5v4" stroke="#1458d2" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Clear() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path d="m4.5 4.5 7 7m0-7-7 7" stroke={BASIC} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Text that shimmers while BimaNetra works (AITextLoading). */
export function Shimmer({ children }: { children: React.ReactNode }) {
  return (
    <m.span
      className="flex-1 bg-clip-text text-[14px] font-medium leading-[1.2] text-transparent"
      style={{
        backgroundImage: `linear-gradient(90deg, ${BASIC} 0%, color-mix(in srgb, ${BASIC} 28%, #fff) 50%, ${BASIC} 100%)`,
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% 50%", "-200% 50%"] }}
      transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
    >
      {children}
    </m.span>
  );
}

// ---- The engine panel (left) -----------------------------------------------------

export const TASKS = [
  { key: "profile", pending: "Enter your Profile Details", done: "Profile Confirmed" },
  { key: "business", pending: "Assessing Business", done: "Business Secured", ready: "Business Assessed. Waiting for Confirmation" },
  { key: "risk", pending: "Assessing Risk", done: "Risk Secured", ready: "Risk Assessed. Waiting for Confirmation" },
];
export const METER = ["Getting Started", "Assessing Business", "Assessing Risk"];

function Engine({
  frame,
  botState,
  bot,
  gaze,
  rot,
  bar,
}: {
  frame: Frame;
  botState: string;
  bot: React.RefObject<NetraBotHandle | null>;
  gaze?: () => { x: number; y: number };
  rot: MotionValue<number>;
  bar: MotionValue<number>;
}) {
  const ease = [0.4, 0, 0.2, 1] as const;
  return (
    <div
      className="flex h-full w-[500px] shrink-0 flex-col rounded-l-[14px] border border-dashed border-[#ffd2a8] px-6 pb-6 pt-16"
      style={{ background: "linear-gradient(to bottom, #ffffff, #fff6ed 82.567%)" }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <span className="block size-16 shrink-0">
          <NetraBot
            ref={bot}
            size={64}
            state={botState}
            getGaze={gaze}
            label={`BimaNetra is running 3 tasks to personalise your quote for ${COMPANY}`}
          />
        </span>
        <div className="flex min-h-0 flex-1 flex-col gap-2 py-6">
          <div key={frame.step} className="inline-flex items-center gap-2">
            <Meter />
            <span className="text-[14px] font-semibold leading-none" style={{ color: SECOND, letterSpacing: TIGHT }}>
              {METER[frame.step]}
            </span>
          </div>
          <ol className="flex min-h-0 flex-1 flex-col gap-2">
            {TASKS.map((task, i) => {
              const transition = { layout: { duration: 0.4, ease } };
              if (i < frame.step)
                return (
                  <m.li key={task.key} layout="position" transition={transition} className="flex items-center gap-3 px-2 py-1">
                    <Roundel color={VIOLET} />
                    <span className="text-[14px] font-medium leading-[1.2]" style={{ color: VIOLET }}>
                      {task.done}
                    </span>
                  </m.li>
                );
              if (i > frame.step)
                return (
                  <m.li key={task.key} layout="position" transition={transition} className="flex items-center gap-3 px-2 py-1">
                    <span className="size-[14px] shrink-0 rounded-full border-2" style={{ borderColor: TERT }} />
                    <span className="text-[14px] font-medium leading-[1.2]" style={{ color: TERT }}>
                      {task.pending}
                    </span>
                  </m.li>
                );
              // The active task: Profile is ready to confirm; Business and Risk scan, then wait.
              return (
                <m.li key={task.key} layout="position" transition={transition} className="flex min-h-0 flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-[8px] border-[0.5px] border-[#d1c6ff] bg-[#f4f1ff] px-3 py-2">
                    {i === 0 ? <Roundel color={VIOLET} /> : frame.done ? <StrokeCheck /> : <Ring />}
                    {i === 0 ? (
                      <Shimmer>Ready to Confirm Profile</Shimmer>
                    ) : frame.done ? (
                      <span className="flex-1 text-[14px] font-medium leading-[1.2]" style={{ color: BASIC }}>
                        {task.ready}
                      </span>
                    ) : (
                      <Shimmer>{task.pending}</Shimmer>
                    )}
                    {i > 0 && <Chevron />}
                  </div>
                  {i > 0 && (
                    <m.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.28, delay: 0.12, ease }}
                      className="min-h-0 flex-1 overflow-hidden"
                    >
                      <Scan step={frame.step} line={frame.line} done={frame.done} rot={rot} bar={bar} />
                    </m.div>
                  )}
                </m.li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

/** The ring that spins while a task runs (RingSweep). */
export function Ring() {
  return (
    <m.span
      className="size-[14px] shrink-0 rounded-full border-2 border-[#e6e8ea]"
      style={{ borderTopColor: VIOLET }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, ease: "linear", repeat: Infinity }}
    />
  );
}

/** The 3×3 pulsing grid by the meter's label (AgentProgress). */
export function Meter() {
  return (
    <span className="grid size-[13px] grid-cols-3 gap-[1.5px]">
      {Array.from({ length: 9 }, (_, i) => (
        <m.span
          key={i}
          className="rounded-[1px]"
          style={{ background: VIOLET }}
          animate={{ opacity: [0.28, 1, 0.28], scale: [0.72, 1, 0.72] }}
          transition={{ duration: 1.55, ease: [0.77, 0, 0.175, 1], repeat: Infinity, delay: i * 0.14 }}
        />
      ))}
    </span>
  );
}

/**
 * The bar's light on the paper (ResearchScan's glint), riding with the bar: a violet
 * wash, then dither thinning away from it (a 2px checker at the bar, one dot in four,
 * sparse dots), each band fading to its edges and crawling a step at a time.
 */
const DITHER_BANDS = [
  { top: 36, h: 24, o: 0.175, bg: `repeating-conic-gradient(${VIOLET} 0 25%, transparent 0 50%) 0 0 / 4px 4px` },
  { top: 18, h: 60, o: 0.2, bg: `radial-gradient(circle at 1px 1px, ${VIOLET} 0.8px, transparent 1.2px) 0 0 / 4px 4px` },
  { top: 0, h: 96, o: 0.15, bg: `radial-gradient(circle at 1px 1px, ${VIOLET} 0.8px, transparent 1.2px) 0 0 / 8px 6px` },
];
const BAND_FADE = "linear-gradient(to bottom, transparent, black 35%, black 65%, transparent)";

function Glint({ y, done }: { y: MotionValue<number>; done: boolean }) {
  return (
    <m.div
      className="pointer-events-none absolute inset-x-0 top-0 h-24"
      style={{ y }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, transparent, color-mix(in srgb, #4100cf 6%, transparent), transparent)" }}
      />
      {DITHER_BANDS.map((b) => (
        <span
          key={b.top}
          className="absolute inset-x-0 animate-[netra-crawl_0.2s_steps(2)_infinite]"
          style={{ top: b.top, height: b.h, opacity: b.o, background: b.bg, maskImage: BAND_FADE, WebkitMaskImage: BAND_FADE }}
        />
      ))}
    </m.div>
  );
}

/** One face of the scanned page: a heading bar and two short paragraphs of grey bars, and the bar's light. */
function Sheet({ back = false, glint, done }: { back?: boolean; glint: MotionValue<number>; done: boolean }) {
  const lines = ["92%", "100%", "64%", null, "100%", "86%", "48%"];
  return (
    <div
      className="absolute inset-0 flex flex-col gap-[10px] overflow-hidden rounded-[6px] border-[0.5px] border-[#dfe0e2] bg-white px-6 py-[26px] [backface-visibility:hidden]"
      style={back ? { transform: "rotateY(180deg)" } : undefined}
    >
      <Glint y={glint} done={done} />
      <span className="mb-[6px] block h-2 w-[72%] rounded-[3px] bg-[#dfe0e2]" />
      {lines.map((w, i) =>
        w ? <span key={i} className="block h-[5px] rounded-[3px] bg-[#e6e8ea]" style={{ width: w }} /> : <span key={i} className="block h-2" />,
      )}
    </div>
  );
}

/**
 * The ResearchScan: a page tipped back under a violet bar that sweeps it, turning over
 * between sweeps, one line of copy per sweep; done, it faces you with a tick at its corner.
 */
export function Scan({ step, line, done, rot, bar }: { step: number; line: number; done: boolean; rot: MotionValue<number>; bar: MotionValue<number> }) {
  const barY = useTransform(bar, (b) => b * 230 - 5);
  // The light, 96px tall, centred on the bar.
  const glintY = useTransform(bar, (b) => b * 230 - 48);
  const shadow = useTransform(rot, (r) => Math.max(0.1, Math.abs(Math.cos((r * Math.PI) / 180))));
  const title = done ? "Research complete" : SCAN_TITLES[step][line];
  return (
    <div className="flex flex-col items-center gap-4 pt-2 text-center">
      <div className="relative flex h-[244px] w-full flex-col items-center justify-end [perspective:900px]">
        <m.div
          className="relative h-[230px] w-[168px] [transform-style:preserve-3d]"
          animate={{ rotateX: done ? 0 : 8 }}
          transition={{ duration: 0.4 }}
          style={{ rotateY: rot }}
        >
          <Sheet glint={glintY} done={done} />
          <Sheet back glint={glintY} done={done} />
          {/* The bar, overhanging the page. */}
          <m.div className="absolute -inset-x-[14px] top-0" style={{ y: barY }} animate={{ opacity: done ? 0 : 1 }} transition={{ duration: 0.2 }}>
            <div className="h-[10px] rounded-[2px]" style={{ background: VIOLET, boxShadow: "0 0 14px rgba(65,0,207,0.2)" }} />
          </m.div>
          <m.span
            className="absolute -bottom-3 -right-3"
            initial={false}
            animate={done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.3, delay: done ? 0.15 : 0 }}
          >
            <Roundel color={VIOLET} size={28} />
          </m.span>
        </m.div>
      </div>
      <m.div
        className="mb-1 h-4 w-[168px]"
        // A soft pool of shade under the page: faint, blurred, fading out from its middle.
        style={{
          scaleX: shadow,
          y: -12,
          background: "radial-gradient(closest-side, rgba(169,172,177,0.38), rgba(169,172,177,0.12) 60%, transparent)",
          filter: "blur(3px)",
        }}
      />
      <div className="-mt-6 flex flex-col gap-1">
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={title}
            className="min-h-[17.5px] text-[14px] font-medium leading-[1.25]"
            style={{ color: INK }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {title}
          </m.span>
        </AnimatePresence>
        <span className="text-[12px] font-medium leading-[1.3]" style={{ color: SECOND }}>
          {done ? "Review the details, then confirm" : "This will just take a few moments"}
        </span>
      </div>
    </div>
  );
}

// ---- The form (right) -------------------------------------------------------------

export const STEPS = ["Profile", "Business", "Risk"] as const;
/** The fields' swap between steps (custom: the step coming in; 0 is the loop wrapping). */
const SWAP = {
  enter: (to: number) => (to === 0 ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 8, filter: "blur(4px)" }),
  show: (to: number) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: to === 0 ? 0 : 0.24, ease: EASE_OUT } }),
  exit: (to: number) => ({ opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: to === 0 ? 0 : 0.16, ease: EASE_OUT } }),
};

function Form({ frame, ready }: { frame: Frame; ready: boolean }) {
  return (
    <div className="flex h-full w-[581px] shrink-0 flex-col bg-white px-6 pb-6 pt-3">
      <div className="flex min-h-0 flex-1 flex-col gap-8 py-3">
        <div className="flex h-8 items-center justify-between">
          <div className="flex items-center gap-3">
            {frame.step > 0 && (
              <span className="grid size-6 place-items-center rounded-[8px] border-[0.5px] border-[#e6e8ea] bg-white" style={{ color: SECOND }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M10 4 6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
            <span className={`${serif.className} text-[32px] leading-none`} style={{ color: INK }}>
              {STEPS[frame.step]}
            </span>
            <ol className="flex items-center gap-3">
              {STEPS.map((s, i) => (
                <Pill key={`${s}-${i < frame.step ? "done" : i === frame.step ? "now" : "next"}`} label={s} state={i < frame.step ? "done" : i === frame.step ? "now" : "next"} />
              ))}
            </ol>
          </div>
          <span className="grid size-6 place-items-center rounded-[8px] border-[0.5px] border-[#e6e8ea] bg-white" style={{ color: SECOND }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        {/* Each step's fields swap out and in; back to Profile (the loop wrapping, the
            modal hidden) is instant. */}
        <AnimatePresence mode="wait" initial={false} custom={frame.step}>
          <m.div
            key={frame.step}
            className="flex flex-col"
            custom={frame.step}
            variants={SWAP}
            initial="enter"
            animate="show"
            exit="exit"
          >
            {frame.step === 0 ? <ProfileFields /> : frame.step === 1 ? <BusinessFields resolved={frame.resolved} /> : <RiskFields resolved={frame.resolved} />}
          </m.div>
        </AnimatePresence>
      </div>
      <div className="flex shrink-0 flex-col gap-6">
        <div className="flex h-[6px] items-center gap-4">
          <span className="h-[0.5px] flex-1 bg-[#ffe4cc]" />
          <span
            className="h-[6px] w-3"
            style={{ background: VIOLET, mask: "url(/media/netra/ikkat-bead.svg) center / contain no-repeat", WebkitMask: "url(/media/netra/ikkat-bead.svg) center / contain no-repeat" }}
          />
          <span className="h-[0.5px] flex-1 bg-[#ffe4cc]" />
        </div>
        <Cta last={frame.step === 2} enabled={ready} hover={ready && frame.atCta} press={frame.press} />
      </div>
    </div>
  );
}

function ProfileFields() {
  return (
    <>
      <Field label="Company Name" value={COMPANY} status="prefilled" help="Company Name is verified by BimaNetra™" />
      <Field label="Your Full Name" value="Amit Sharma" status="success" clearable />
      <Field label="Your Phone Number" prefix="+91" value="9008 600 661" status="success" clearable />
      <Field label="Your Email Address" value="finance@pepejeans.in" status="success" clearable />
    </>
  );
}

function BusinessFields({ resolved }: { resolved: number }) {
  const st = (i: number) => (resolved > i ? "success" : "loading");
  return (
    <>
      <Field label="Company Type" value="Private Limited Company" status={st(0)} select loading="Fetching…" />
      <Field label="Type of Business" value="Retail & Wholesale" status={st(1)} select loading="Fetching…" />
      <Field label="Company's Annual Turnover" value="₹5 Cr to ₹50 Cr" status={st(2)} select loading="Fetching…" />
      <Field label="Company PAN" value="AAJCP5565B" status={st(3)} required={false} clearable loading="Fetching…" />
    </>
  );
}

function RiskFields({ resolved }: { resolved: number }) {
  const done = resolved >= 3;
  return (
    <>
      <YesNo label="Does your business have an existing Directors & Officers policy?" picked={resolved > 0 ? "No" : null} />
      <YesNo label="Any claims or incidents in the last 5 years?" picked={resolved > 1 ? "No" : null} />
      <IkkatDivider />
      <div
        className="mb-3 flex items-center gap-2 rounded-[8px] px-3 py-2"
        style={{ background: `linear-gradient(to right, ${done ? "#ecfbea" : "#f4f1ff"}, transparent)` }}
      >
        <span className="inline-flex items-center gap-1 rounded-[6px] border-[0.5px] border-[#a3e1d2] bg-[rgba(0,171,130,0.12)] px-[6px] py-1 text-[14px] font-medium leading-none" style={{ color: BASIC }}>
          <span className="size-1 rounded-full bg-[#00ab82]" />
          New
        </span>
        <span className="flex-1 text-[14px] font-medium leading-[1.2]" style={{ color: done ? GREEN : VIOLET }}>
          {done ? "Your quote is personalised!" : "Your quote is being personalised"}
        </span>
        {!done && (
          <span className="text-[14px] font-semibold" style={{ color: "#1458d2", letterSpacing: TIGHT }}>
            Skip
          </span>
        )}
      </div>
      <Field
        label="Sum Insured"
        value="₹10 Cr"
        status={resolved > 2 ? "success" : "loading"}
        select
        loading="Approximating…"
        valueIcon={<Bag />}
        help={resolved > 2 ? "Typical for businesses your size" : undefined}
        helpColor={GREEN}
        helpAlign="start"
      />
    </>
  );
}

/** Lucide's shopping bag: ₹10 Cr is in the Immediate Purchase group. */
export function Bag() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M16 10a4 4 0 0 1-8 0" />
      <path d="M3.103 6.034h17.794" />
      <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
    </svg>
  );
}

/** The Ikkat row between the Yes/No questions and the coverage: 26 marks, two patterns in turn. */
const IKKAT_A =
  "M334.906 382.075C389.613 382.075 433.962 337.726 433.962 283.019C433.962 228.311 478.311 183.962 533.019 183.962H672.17C722.969 183.962 764.151 142.781 764.151 91.9811C764.151 41.1813 805.332 0 856.132 0L1143.87 0C1194.67 0 1235.85 41.1813 1235.85 91.9811C1235.85 142.781 1277.03 183.962 1327.83 183.962H1504.72C1559.42 183.962 1603.77 228.311 1603.77 283.019C1603.77 337.726 1648.12 382.075 1702.83 382.075L1882.08 382.075C1947.2 382.075 2000 434.872 2000 500C2000 565.128 1947.2 617.924 1882.08 617.924H1702.83C1648.12 617.924 1603.77 662.274 1603.77 716.981C1603.77 771.689 1559.42 816.038 1504.72 816.038H1327.83C1277.03 816.038 1235.85 857.219 1235.85 908.019C1235.85 958.819 1194.67 1000 1143.87 1000L856.132 1000C805.332 1000 764.151 958.819 764.151 908.019C764.151 857.219 722.97 816.038 672.17 816.038H533.019C478.311 816.038 433.962 771.689 433.962 716.981C433.962 662.274 389.613 617.924 334.906 617.924H117.925C52.7967 617.924 0 565.128 0 500C0 434.872 52.7966 382.075 117.925 382.075H334.906ZM811.321 497.678C811.321 553.668 856.709 599.057 912.699 599.057H1096.73C1152.72 599.057 1198.11 553.668 1198.11 497.678C1198.11 441.689 1152.72 396.3 1096.73 396.3L912.699 396.3C856.709 396.3 811.321 441.689 811.321 497.678Z";
const IKKAT_B =
  "M1004.72 1146.23C1168.84 1146.23 1301.89 1013.18 1301.89 849.057C1301.89 684.934 1434.93 551.887 1599.06 551.887H2016.51C2168.91 551.887 2292.45 428.343 2292.45 275.943C2292.45 123.544 2416 0 2568.4 0H3431.6C3584 0 3707.55 123.544 3707.55 275.943C3707.55 428.343 3831.09 551.887 3983.49 551.887L4514.15 551.887C4678.27 551.887 4811.32 684.934 4811.32 849.057C4811.32 1013.18 4944.37 1146.23 5108.49 1146.23H5646.23C5841.61 1146.23 6000 1304.62 6000 1500C6000 1695.38 5841.61 1853.77 5646.23 1853.77H5108.49C4944.37 1853.77 4811.32 1986.82 4811.32 2150.94C4811.32 2315.07 4678.27 2448.11 4514.15 2448.11H3983.49C3831.09 2448.11 3707.55 2571.66 3707.55 2724.06C3707.55 2876.46 3584 3000 3431.6 3000H2568.4C2416 3000 2292.45 2876.46 2292.45 2724.06C2292.45 2571.66 2168.91 2448.11 2016.51 2448.11L1599.06 2448.11C1434.93 2448.11 1301.89 2315.07 1301.89 2150.94C1301.89 1986.82 1168.84 1853.77 1004.72 1853.77L353.774 1853.77C158.39 1853.77 0 1695.38 0 1500C0 1304.62 158.39 1146.23 353.774 1146.23L1004.72 1146.23Z";

export function IkkatDivider() {
  return (
    <div className="mb-5 flex items-center justify-between px-2">
      {Array.from({ length: 26 }, (_, i) => (
        <svg key={i} width="8" height="4" viewBox={i % 2 ? "0 0 6000 3000" : "0 0 2000 1000"} aria-hidden>
          <path d={i % 2 ? IKKAT_B : IKKAT_A} fill={VIOLET} fillRule="evenodd" />
        </svg>
      ))}
    </div>
  );
}

/** A Yes/No question (SegmentedField): two options side by side, the picked one lit. */
export function YesNo({ label, picked }: { label: string; picked: "Yes" | "No" | null }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center p-2 text-[14px] font-medium leading-none" style={{ color: BASIC }}>
        {label}
        <span style={{ color: "#f10000" }}>*</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["Yes", "No"] as const).map((o) => {
          const on = picked === o;
          return (
            <div
              key={o}
              className="flex items-center justify-between gap-2 rounded-[16px] border-[0.5px] p-3 text-[16px] font-medium leading-[18px] transition-colors duration-200"
              style={{ color: on ? BASIC : TERT, background: on ? "#f4f1ff" : TINT, borderColor: on ? "#d1c6ff" : STROKE }}
            >
              {o}
              {on ? (
                <Roundel color={GREEN} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="8" cy="8" r="7" stroke={STROKE} strokeWidth="1.4" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-7" />
    </div>
  );
}

export function Pill({ label, state }: { label: string; state: "done" | "now" | "next" }) {
  const look = {
    done: { border: "#a9eaa2", bg: "linear-gradient(to bottom, #ffffff, #ecfbea)", ink: SECOND, size: "text-[14px]" },
    now: { border: "#d1c6ff", bg: "linear-gradient(to bottom, #ffffff, #f4f1ff)", ink: INK, size: "text-[14px]" },
    next: { border: "#d2d5d8", bg: "linear-gradient(to bottom, #f4f5f6, #e6e8ea)", ink: PLACEHOLDER, size: "text-[12px]" },
  }[state];
  // Done pops in, the current one blooms (the app's HANDOFF).
  const enter = state === "done" ? { scale: 0.9 } : state === "now" ? { scale: 0.85, opacity: 0.6 } : false;
  return (
    <m.li
      initial={enter}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: POP, delay: state === "done" ? 0.1 : 0.3 }}
      className="inline-flex min-h-6 items-center gap-1 rounded-full border-[0.5px] px-2 py-[6px]"
      style={{ borderColor: look.border, background: look.bg }}
    >
      {state === "done" ? (
        <span className="grid size-3 place-items-center rounded-full border-[0.533px] border-[#a9eaa2]">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 5a5 5 0 1 1 10 0A5 5 0 0 1 0 5Zm7.4-1.24a.34.34 0 0 0-.48-.48L4.2 6 3.08 4.87a.34.34 0 1 0-.48.48l1.36 1.37c.13.13.35.13.48 0L7.4 3.76Z"
              fill={GREEN}
            />
          </svg>
        </span>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <rect x=".27" y=".27" width="11.47" height="11.47" rx="5.73" fill="none" stroke={state === "now" ? "#d1c6ff" : STROKE} strokeWidth=".53" />
          <circle cx="6" cy="6" r="5" fill={state === "now" ? VIOLET : STROKE} />
        </svg>
      )}
      <span className={`font-medium leading-none ${look.size}`} style={{ color: look.ink }}>
        {label}
      </span>
    </m.li>
  );
}

/** One InteractiveInput (md, underline): label row 36, box 43, help row 28. */
export function Field({
  label,
  value,
  status,
  prefix,
  select = false,
  clearable = false,
  required = true,
  loading,
  valueIcon,
  help,
  helpColor = TERT,
  helpAlign = "end",
}: {
  label: string;
  value: string;
  status: "prefilled" | "success" | "loading";
  prefix?: string;
  select?: boolean;
  clearable?: boolean;
  required?: boolean;
  loading?: string;
  valueIcon?: React.ReactNode;
  help?: string;
  helpColor?: string;
  helpAlign?: "start" | "end";
}) {
  const busy = status === "loading";
  const prefilled = status === "prefilled";
  return (
    <div className="flex flex-col">
      <div className="flex h-9 items-center gap-[2px] px-2 text-[12px] font-medium leading-none" style={{ color: BASIC }}>
        {label}
        {required && <span style={{ color: "#f10000" }}>*</span>}
      </div>
      <div
        className="flex h-[43px] items-center gap-2 rounded-t-[6px] px-3 transition-[background-color,border-color] duration-200"
        style={{
          borderBottom: `1px solid ${busy || prefilled ? STROKE : VIOLET}`,
          background: busy ? "#e6e8ea" : TINT,
        }}
      >
        {prefix && (
          <span className="border-r pr-2 text-[16px] font-medium leading-[18px]" style={{ color: TERT, borderColor: STROKE }}>
            {prefix}
          </span>
        )}
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden whitespace-nowrap text-[16px] font-medium leading-[18px]">
          {busy ? (
            <span style={{ color: PLACEHOLDER }}>{loading}</span>
          ) : (
            <span className="flex min-w-0 items-center gap-[6px]">
              <span className="truncate" style={{ color: prefilled ? BASIC : VIOLET }}>
                {value}
              </span>
              {valueIcon}
            </span>
          )}
          {select && !busy && <Chevron />}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {clearable && !busy && <Clear />}
          <Info />
          <span className="h-[14px] w-px" style={{ background: STROKE }} />
          {busy ? <Spinner /> : <Roundel color={prefilled ? VIOLET : GREEN} />}
        </span>
      </div>
      <div
        className={`flex h-7 items-center px-2 text-[12px] font-medium leading-[1.2] ${helpAlign === "end" ? "justify-end" : "justify-start"}`}
        style={{ color: helpColor }}
      >
        {help}
      </div>
    </div>
  );
}

export function Cta({ last, enabled, hover, press }: { last: boolean; enabled: boolean; hover: boolean; press: boolean }) {
  // Violet on Profile and Business; on Risk, orange "Get Instant Quotes".
  const tone = last ? ORANGE : VIOLET;
  const glow = last ? "rgba(255,119,0,0.48)" : "rgba(65,0,207,0.48)";
  return (
    <m.div
      className="flex items-center justify-between gap-4 rounded-[14px] border-[0.5px] px-7 py-4 text-[16px] font-semibold leading-none"
      animate={{
        backgroundColor: enabled ? (hover && !last ? "#3800b4" : tone) : "rgba(169,172,177,0.24)",
        borderColor: enabled ? tone : STROKE,
        color: enabled ? "#ffffff" : PLACEHOLDER,
        boxShadow: enabled && hover ? `0 0 16px ${glow}` : "0 0 0px rgba(0,0,0,0)",
        scale: press ? 0.98 : 1,
      }}
      transition={{ duration: press ? 0.08 : 0.2 }}
      style={{ letterSpacing: TIGHT }}
    >
      {last ? "Get Instant Quotes" : "Confirm and Continue"}
      <m.svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden animate={{ x: enabled && hover ? 3 : 0 }} transition={{ duration: 0.2 }}>
        <path d="M2.5 8h11M9.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </m.svg>
    </m.div>
  );
}

// ---- The pointer -----------------------------------------------------------------

function Pointer({ x, y, frame }: { x: MotionValue<number>; y: MotionValue<number>; frame: Frame }) {
  return (
    <m.div className="pointer-events-none absolute left-0 top-0 z-30" style={{ x, y }} animate={{ opacity: frame.on ? 1 : 0 }} transition={{ duration: 0.3 }}>
      <m.div style={{ originX: 0, originY: 0 }} animate={{ scale: frame.down ? 0.86 : 1 }} transition={{ duration: frame.down ? 0.08 : 0.16 }}>
        <Glyph kind={frame.kind} />
      </m.div>
    </m.div>
  );
}
