"use client";

import "@/components/bk/anek.css";
import { AnimatePresence, cubicBezier, m, useMotionValue, type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NetraBot, type NetraBotHandle } from "../netrabot/NetraBot";
import { useGrow } from "../project/GrowMedia";
import {
  Bag,
  BASIC,
  Chevron,
  Clear,
  GREEN,
  IkkatDivider,
  INK,
  Info,
  Meter,
  METER,
  ORANGE,
  Pill,
  PLACEHOLDER,
  Ring,
  Roundel,
  Scan,
  SECOND,
  serif,
  Shimmer,
  Spinner,
  STEPS,
  StrokeCheck,
  STROKE,
  TASKS,
  TERT,
  TIGHT,
  TINT,
  VIOLET,
} from "./NetraQuoteModal";

/*
 * BimaNetra on a phone, Case B (the "partly verified" case): the D&O page in /draft's iPhone,
 * where a founder types "Sabyasachi", the MCA type-ahead drops down, they pick
 * "Sabyasachi Calcutta" and tap Get My Quote; the quote sheet rises and runs the whole flow.
 * Profile: Netra's card introduces itself and folds into its strip, the founder types their
 * name, phone and email, and confirms. Business: the card rises again and reads up on the
 * company (the page scan), the fields fill in behind it (two guessed in yellow, the PAN
 * verified, the turnover left for the founder), it folds, and the founder sets the business
 * type to Retail & Wholesale, picks a turnover and confirms. Risk: the same research, ₹10 Cr suggested, the founder answers No and No and
 * taps Get Instant Quotes, and the sheet drops. A dotted circle marks each tap.
 *
 * Every value, size and timing is from the BimaNetra app (QuoteModal, CompanySuggest,
 * InteractiveInput, ResearchScan; measured in its build at 390 × 844), rebuilt from
 * NetraQuoteModal's parts. The screen is laid out at 390 × 846 CSS px (a 47px status bar,
 * then the page) and scaled into the phone, which stands in a 1200 × 675 stage scaled to
 * cover the GrowMedia frame. Starts once the frame is at full size and on screen; leaving
 * resets it; reduced motion shows Risk answered, as one still.
 */

// ---- Geometry --------------------------------------------------------------------

const FW = 1200;
const FH = 675;
/** The phone (/draft's iPhone 15 Pro, 2360 × 4652), 640 tall in the stage. */
const PH = 640;
const PW = (PH * 2360) / 4652;
const PX = (FW - PW) / 2;
const PY = (FH - PH) / 2;
/** Its screen, under the PNG's cutout. */
const SX = PX + 0.0847 * PW;
const SY = PY + 0.043 * PH;
const SWD = 0.8305 * PW;
const SHT = 0.9136 * PH;
/** The web screen inside it, in CSS px. */
const VW = 390;
const C = SWD / VW;
const VH = SHT / C;
/** iOS's status bar, over the page. */
const SB = 47;

/** The quote sheet (x4, 40 below the status bar, to the foot) and its rows, sheet-relative. */
const SHEET = { x: 4, y: SB + 40, w: 382 };
const SHEET_H = VH - SHEET.y;
const FIELDS_TOP = 107.5;
/** iOS's bottom safe area (the home bar's), which lifts the CTA and everything above it. */
const SAFE = 24;
const CARD_FOOT = 684 - SAFE;
const CTA_TOP = 696 - SAFE;
const STRIP_H = [72.5, 88, 88];

// ---- The script (ms from the start of a loop) -------------------------------------------

const LOOP = 33500;
const COMPANY_TYPED = "Sabyasachi";
const COMPANY = "Sabyasachi Calcutta LLP";
const NAME = "Sabyasachi Mukherjee";
const PHONE = "9007296854";
const EMAIL = "ceo@sabyasachi.in";

/** Hero: the field takes focus and the page scrolls HERO_SCROLL up; "Sabyasachi" is typed 120ms a key. */
const FOCUS = 1200;
/**
 * The D&O page sits 41px tighter than the app's build (a shorter gavel and four smaller gaps),
 * so at the start the CTA clears the home bar with the room Confirm and Continue has (about
 * 38px under it). The scroll is 41 shorter to match, so the field, drawer and CTA land where
 * the app has them once it has scrolled.
 */
const HERO_SCROLL = 159;
const SCROLL = 1250;
const TYPE = 1700;
const PICK = 3600;
const GO = 4600;
/** The sheet: up at 4700, down at 31100. */
const SHEET_IN = 4700;
const SHEET_OUT = 31600;
/** Profile: the runner staggers in, then the card folds. */
const RUNNER = 5450;
const FOLD = 6350;
const FOLDED = 6950;
/** Profile's typing: [focus, first key, ms a key]. */
const NAME_AT = [7500, 7600, 70] as const;
const PHONE_AT = [9400, 9500, 90] as const;
const EMAIL_AT = [10800, 10900, 70] as const;
/** The three confirms; the step changes 900ms after each (Netra celebrates). */
const CONFIRM = [13300, 22700, 30700] as const;
const CELEBRATE = 900;
const STEP_AT = [SHEET_IN, CONFIRM[0] + CELEBRATE, CONFIRM[1] + CELEBRATE] as const;
/** Research after a step change: fields in, card opens, scan done, closing, closed. */
const R = { fields: 160, open: 460, scan: 2700, closing: [4300, 4060], closed: [4900, 4660] };
/** Business: the turnover list; the fields scroll so it fits above the strip (the status bar
    takes 47px from the row, so this is the app's 60.5 plus that). */
const LIST_SCROLL = 108 + SAFE;
const LIST_OPEN = 21000;
const LIST_PICK = 21800;
/** Business: before that, the founder sets the guessed Type of Business to Retail & Wholesale. */
const TOB_OPEN = 19500;
const TOB_PICK = 20300;
/** Risk: the two answers. */
const ANSWER = [29400, 29900] as const;
/** The end: the sheet drops, then a fade back to the start. */
const FADE = [33100, 33500] as const;

/** Every tap, in screen px (status bar included), in order. */
const TAPS = [
  { t: FOCUS, x: 195, y: 712 },
  { t: PICK, x: 195, y: 696 },
  { t: GO, x: 195, y: 619 },
  { t: NAME_AT[0], x: 195, y: 358 },
  { t: PHONE_AT[0], x: 195, y: 465 },
  { t: EMAIL_AT[0], x: 195, y: 571 },
  { t: CONFIRM[0], x: 195, y: 807.5 - SAFE },
  { t: TOB_OPEN, x: 195, y: 358 },
  { t: TOB_PICK, x: 195, y: 407.5 },
  { t: LIST_OPEN, x: 195, y: 465 },
  { t: LIST_PICK, x: 195, y: 622.5 - SAFE },
  { t: CONFIRM[1], x: 195, y: 807.5 - SAFE },
  { t: ANSWER[0], x: 287, y: 265 },
  { t: ANSWER[1], x: 287, y: 369 },
  { t: CONFIRM[2], x: 195, y: 807.5 - SAFE },
];

const EASE_MOVE = cubicBezier(0.45, 0, 0.2, 1);
const EASE_FLIP = cubicBezier(0.33, 0, 0.67, 1);
const ENGINE = [0.83, 0, 0.17, 1] as const;
const OUT = [0.16, 1, 0.3, 1] as const;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const typed = (t: number, at: number, ms: number, len: number) => (t < at ? 0 : Math.min(len, Math.floor((t - at) / ms) + 1));

/** The dotted circle: where it is, whether it shows, and the tap it is on. */
function pointerAt(t: number) {
  for (let i = 0; i < TAPS.length; i++) {
    const a = TAPS[i];
    const prev = TAPS[i - 1];
    const next = TAPS[i + 1];
    const near = !!prev && a.t - prev.t < 2000;
    const from = near ? prev : { x: a.x + 40, y: a.y + 70 };
    const start = near ? prev.t + 1 : a.t - 650;
    const end = next && next.t - a.t < 2000 ? next.t - 550 : a.t + 350;
    if (t < start) return { x: from.x, y: from.y, on: false, tap: -1 };
    if (t > end) continue;
    const s = a.t - 550;
    const e = a.t - 80;
    const k = t < s ? 0 : t >= e ? 1 : EASE_MOVE((t - s) / (e - s));
    return { x: from.x + (a.x - from.x) * k, y: from.y + (a.y - from.y) * k, on: true, tap: t >= a.t && t < a.t + 400 ? i : -1 };
  }
  const last = TAPS[TAPS.length - 1];
  return { x: last.x, y: last.y, on: false, tap: -1 };
}

/** The scan's page turn and bar at ms into the research (as NetraQuoteModal's). */
function scanAt(local: number) {
  const seg = (a: number, b: number) => EASE_FLIP(clamp((local - a) / (b - a)));
  const rot = 180 * seg(600, 1050) + 180 * seg(1650, 2100);
  const bar = local < 600 ? seg(0, 600) : local < 1050 ? 1 : local < 1650 ? 1 - seg(1050, 1650) : local < 2100 ? 0 : seg(2100, 2700);
  return { rot, bar };
}

type Card = "intro" | "open" | "closing" | "closed";
type Shot = {
  // The page.
  focus: boolean;
  scrolled: boolean;
  chars: number;
  drawer: boolean;
  picked: boolean;
  goPress: boolean;
  // The sheet.
  sheet: boolean;
  step: 0 | 1 | 2;
  card: Card;
  runner: boolean;
  fieldsIn: boolean;
  /** Research: the scan line, done, fields resolved (0 to 4). */
  line: number;
  done: boolean;
  resolved: number;
  // Profile.
  focusField: "name" | "phone" | "email" | null;
  name: number;
  phone: number;
  email: number;
  // Business and Risk.
  /** Which select's list is open. */
  list: "tob" | "turnover" | null;
  /** The founder has set Type of Business. */
  tob: boolean;
  turnover: boolean;
  answers: number;
  // The CTA.
  ready: boolean;
  advancing: boolean;
  press: boolean;
  /** Netra. */
  mood: string;
  fade: boolean;
};

function shotAt(t: number): Shot {
  const step = t >= STEP_AT[2] ? 2 : t >= STEP_AT[1] ? 1 : 0;
  const local = t - STEP_AT[step];
  const name = typed(t, NAME_AT[1], NAME_AT[2], NAME.length);
  const phone = typed(t, PHONE_AT[1], PHONE_AT[2], PHONE.length);
  const email = typed(t, EMAIL_AT[1], EMAIL_AT[2], EMAIL.length);
  const answers = (t >= ANSWER[0] ? 1 : 0) + (t >= ANSWER[1] ? 1 : 0);
  const turnover = t >= LIST_PICK;

  let card: Card;
  let done = false;
  let resolved = 0;
  if (step === 0) {
    card = t < FOLD ? "intro" : t < FOLDED ? "closing" : "closed";
    resolved = 4;
    done = true;
  } else {
    const r = step - 1;
    card = local < R.open ? "closed" : local < R.closing[r] ? "open" : local < R.closed[r] ? "closing" : "closed";
    const scanned = local - R.open - R.scan;
    resolved = scanned < 0 ? 0 : Math.min(4, Math.floor(scanned / 80) + 1);
    done = step === 1 ? local >= R.open + R.scan + 240 : local >= R.open + R.scan;
  }
  const scanLocal = local - R.open;
  const line = scanLocal < 825 ? 0 : scanLocal < 1875 ? 1 : 2;

  const advancing = CONFIRM.some((c) => t >= c && t < c + CELEBRATE);
  const ready =
    step === 0 ? email === EMAIL.length : step === 1 ? done && turnover : done && answers === 2;
  const list = t >= TOB_OPEN && t < TOB_PICK ? "tob" : t >= LIST_OPEN && t < LIST_PICK ? "turnover" : null;
  const focusField =
    t >= NAME_AT[0] && t < PHONE_AT[0] ? "name" : t >= PHONE_AT[0] && t < EMAIL_AT[0] ? "phone" : t >= EMAIL_AT[0] && t < CONFIRM[0] ? "email" : null;
  const keyAt = [NAME_AT, PHONE_AT, EMAIL_AT].some(([, a, ms], i) => {
    const len = [NAME, PHONE, EMAIL][i].length;
    return t >= a && t < a + ms * len + 1200;
  });
  const researching = step > 0 && local >= R.open && !done;
  const mood =
    step === 0 && card === "intro"
      ? "thinking"
      : researching
        ? "searching"
        : keyAt
          ? "listening"
          : focusField || list
            ? "thinking"
            : ready
              ? "happyIdle"
              : "idle";

  return {
    focus: t >= FOCUS,
    scrolled: t >= SCROLL,
    chars: t < PICK ? typed(t, TYPE, 120, COMPANY_TYPED.length) : COMPANY_TYPED.length,
    drawer: typed(t, TYPE, 120, COMPANY_TYPED.length) >= 3 && t < PICK,
    picked: t >= PICK,
    goPress: t >= GO && t < GO + 120,
    sheet: t >= SHEET_IN && t < SHEET_OUT,
    step,
    card,
    runner: t >= RUNNER,
    fieldsIn: step === 0 || local >= R.fields,
    line,
    done,
    resolved,
    focusField,
    name,
    phone,
    email,
    list,
    tob: t >= TOB_PICK,
    turnover,
    answers,
    ready,
    advancing,
    press: CONFIRM.some((c) => t >= c && t < c + 120),
    mood,
    fade: t >= FADE[0],
  };
}

const START = shotAt(0);
/** Reduced motion: Risk, answered and ready to get quotes. */
const STILL = shotAt(30000);

/** As NetraSplash's: how far the frame can grow on this screen (1 only when it fits). */
function startAt(frame: number) {
  const view = document.documentElement.clientHeight;
  const max = view >= frame ? 1 : ((frame + view) / (2 * frame)) ** 2;
  return Math.min(0.985, max - 0.01);
}

export default function NetraMobileFlow({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<NetraBotHandle>(null);
  const strip = useRef<NetraBotHandle>(null);
  const grow = useGrow();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [shot, setShot] = useState<Shot>(START);
  const [still, setStill] = useState(false);
  const [tap, setTap] = useState(-1);
  const [pointerOn, setPointerOn] = useState(false);
  const px = useMotionValue(TAPS[0].x);
  const py = useMotionValue(TAPS[0].y + 70);
  const rot = useMotionValue(0);
  const bar = useMotionValue(0);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const k = box ? Math.max((box.w + 2) / FW, (box.h + 2) / FH) : 1;
  const stage = box ? `translate(${(box.w - FW * k) / 2}px, ${(box.h - FH * k) / 2}px) scale(${k})` : undefined;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = window.setTimeout(() => {
        setStill(true);
        setShot(STILL);
        rot.set(360);
      });
      return () => window.clearTimeout(id);
    }
    let raf = 0;
    let t0 = 0;
    let inView = false;
    let last = "";
    let lastTap = -1;
    let lastOn = false;
    let reacted = new Set<string>();
    const ready = () => inView && grow.get() >= startAt(el.offsetHeight);
    const react = (name: string) => {
      card.current?.react(name);
      strip.current?.react(name);
    };
    const show = (s: Shot) => {
      const key = JSON.stringify(s);
      if (key !== last) {
        last = key;
        setShot(s);
      }
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      reacted = new Set();
      px.jump(TAPS[0].x);
      py.jump(TAPS[0].y + 70);
      rot.jump(0);
      bar.jump(0);
      setTap(-1);
      setPointerOn(false);
      lastTap = -1;
      lastOn = false;
      show(START);
    };
    const tick = (now: number) => {
      if (!t0) t0 = now;
      let t = now - t0;
      if (t >= LOOP) {
        reacted = new Set();
        if (!ready()) {
          reset();
          return;
        }
        t0 = now;
        t = 0;
      }
      const p = pointerAt(t);
      px.set(p.x);
      py.set(p.y);
      if (p.tap !== lastTap) setTap((lastTap = p.tap));
      if (p.on !== lastOn) setPointerOn((lastOn = p.on));
      const s = shotAt(t);
      if (s.step > 0) {
        const sc = scanAt(t - STEP_AT[s.step] - R.open);
        rot.set(s.done ? 360 : sc.rot);
        bar.set(sc.bar);
      }
      show(s);
      const beats: [string, boolean, string][] = [
        ["n0", t >= EMAIL_AT[1] + EMAIL_AT[2] * (EMAIL.length - 1) + 1200, "nodYes"],
        ["c0", t >= CONFIRM[0], "celebrate"],
        ["n1", s.step === 1 && s.done, "nodYes"],
        ["c1", t >= CONFIRM[1], "celebrate"],
        ["n2", s.step === 2 && s.done, "nodYes"],
        ["c2", t >= CONFIRM[2], "celebrate"],
      ];
      for (const [n, ok, r] of beats) {
        if (ok && !reacted.has(n)) {
          reacted.add(n);
          react(r);
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

  // Netra's eyes on the dotted circle, from wherever it sits (the card or the strip).
  const gaze = () => {
    const open = shot.card === "intro" || shot.card === "open";
    const bx = 61;
    const by = open ? SHEET.y + FIELDS_TOP + 41 : SHEET.y + CARD_FOOT - STRIP_H[shot.step] / 2;
    return { x: clamp((px.get() - bx) / 300, -1, 1), y: clamp((py.get() - by) / 300, -1, 1) };
  };

  return (
    <div
      ref={root}
      role="img"
      aria-label={label}
      className="absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(to bottom, var(--color-surface) 20%, var(--color-bg))" }}
    >
      <style>{"@keyframes netra-caret{50%{opacity:0}}"}</style>
      <div
        aria-hidden
        className="absolute left-0 top-0 origin-top-left select-none"
        style={{ width: FW, height: FH, transform: stage, visibility: box ? undefined : "hidden" }}
      >
        {/* The screen, under the frame's cutout. */}
        <div className="absolute overflow-hidden rounded-[13%/6.2%] bg-white" style={{ left: SX, top: SY, width: SWD, height: SHT }}>
          <div
            className="absolute left-0 top-0 origin-top-left overflow-hidden"
            style={{ width: VW, height: VH, transform: `scale(${C})`, fontFamily: '"Anek Latin", Arial, sans-serif', color: INK }}
          >
            <Page shot={shot} />
            <AnimatePresence>
              {shot.sheet && (
                <m.div
                  key="scrim"
                  className="absolute inset-0 backdrop-blur-[6px]"
                  style={{ background: "rgba(169,172,177,0.8)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {shot.sheet && (
                <m.div
                  key="sheet"
                  className="absolute overflow-hidden rounded-t-[24px] border-[0.5px] border-b-0 border-[#e6e8ea] bg-white shadow-[0_-12px_16px_rgba(169,172,177,0.24)]"
                  style={{ left: SHEET.x, top: SHEET.y, width: SHEET.w, height: SHEET_H }}
                  initial={{ y: "100%" }}
                  animate={{ y: 0, transition: { duration: 0.45, ease: OUT } }}
                  exit={{ y: "100%", transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
                >
                  <Sheet shot={shot} card={card} strip={strip} gaze={still ? undefined : gaze} rot={rot} bar={bar} />
                </m.div>
              )}
            </AnimatePresence>
            <StatusBar dark={shot.sheet} />
            {/* The home bar. */}
            <span className="absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full" style={{ background: INK }} />
            {!still && <Dot x={px} y={py} on={pointerOn} tap={tap} />}
            {/* The end: a fade back to the start. */}
            <m.div
              className="pointer-events-none absolute inset-0 bg-white"
              initial={false}
              animate={{ opacity: shot.fade ? 1 : 0 }}
              transition={{ duration: shot.fade ? 0.4 : 0 }}
            />
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- the frame over its screen, laid out in stage px */}
        <img src="/media/iphone-15-pro.png" alt="" className="pointer-events-none absolute" style={{ left: PX, top: PY, width: PW, height: PH }} />
      </div>
    </div>
  );
}

// ---- Chrome ------------------------------------------------------------------------

function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div
      className="absolute inset-x-0 top-0 flex items-center justify-between px-8 pt-1 transition-colors duration-200"
      style={{ height: SB, background: dark ? "transparent" : "#f6f3ff", fontFamily: "-apple-system, 'SF Pro Text', Arial, sans-serif" }}
    >
      <span className="text-[16px] font-semibold" style={{ color: INK }}>
        9:41
      </span>
      <span className="flex items-center gap-[6px]" style={{ color: INK }}>
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 7a6 6 0 0 1 8 0" />
          <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden>
          <rect x=".5" y=".5" width="22" height="11" rx="3.5" stroke="currentColor" opacity=".4" />
          <rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor" />
          <path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4Z" fill="currentColor" opacity=".4" />
        </svg>
      </span>
    </div>
  );
}

/** The dotted circle: a tap is a squeeze and one dotted ring spreading out. */
function Dot({ x, y, on, tap }: { x: MotionValue<number>; y: MotionValue<number>; on: boolean; tap: number }) {
  const ring = "absolute inset-0 rounded-full border-2 border-dotted border-[rgba(28,29,31,0.8)]";
  return (
    <m.div className="pointer-events-none absolute left-0 top-0 z-30" style={{ x, y }} animate={{ opacity: on ? 1 : 0 }} transition={{ duration: 0.2 }}>
      <div className="absolute -left-[18px] -top-[18px] size-9">
        <m.div
          className={`${ring} bg-[rgba(255,255,255,0.25)] shadow-[0_0_0_1px_rgba(255,255,255,0.9)]`}
          animate={{ scale: tap >= 0 ? [1, 0.86, 1] : 1 }}
          transition={{ duration: 0.24, times: [0, 0.33, 1] }}
        />
        <AnimatePresence>
          {tap >= 0 && (
            <m.div
              key={tap}
              className={ring}
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}

// ---- The D&O page --------------------------------------------------------------------

function Page({ shot }: { shot: Shot }) {
  const value = shot.picked ? COMPANY : COMPANY_TYPED.slice(0, shot.chars);
  return (
    <div className="absolute inset-0" style={{ background: "#fbfaff" }}>
      <m.div
        className="absolute inset-x-0"
        style={{ top: SB, height: 1200, background: "linear-gradient(184.35deg, #f4f1ff 3.2%, #fff 39.37%)" }}
        animate={{ y: shot.scrolled ? -HERO_SCROLL : 0 }}
        transition={{ duration: shot.scrolled ? 0.45 : 0, ease: OUT }}
      >
        {/* Navbar */}
        <div className="absolute inset-x-0 top-0 flex h-[53.5px] items-center justify-between border-b-[0.5px] border-[#dfe0e2] bg-white/50 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- BimaKavach's logotype */}
          <img src="/media/netra/bimakavach-logotype.svg" alt="" width={175.3} height={20} />
          <span className="flex h-[29px] items-center rounded-[12px] border-[0.5px] border-[#4100cf] bg-[#4100cf] px-[10px] text-[12px] font-semibold text-white">
            Login
          </span>
        </div>
        {/* Breadcrumb */}
        <div className="absolute left-4 top-[69.5px] flex h-5 items-center gap-2 text-[11px] font-medium uppercase tracking-[0.04em]" style={{ color: TERT }}>
          {Array.from({ length: 3 }, (_, i) => (
            <span
              key={i}
              className="h-[5px] w-[10px]"
              style={{ background: VIOLET, mask: "url(/media/netra/ikkat-bead.svg) center / contain no-repeat", WebkitMask: "url(/media/netra/ikkat-bead.svg) center / contain no-repeat" }}
            />
          ))}
          <span>Home</span>
          <span>›</span>
          <span style={{ color: SECOND }}>Directors &amp; Officers Insurance</span>
        </div>
        {/* Eyebrow */}
        <div className="absolute left-4 right-4 top-[121.5px] flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold uppercase" style={{ color: INK, letterSpacing: TIGHT }}>
            Directors &amp; Officers Insurance
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-[#a9eaa2] px-[6px] py-1 text-[12px] font-medium leading-none" style={{ background: "linear-gradient(to bottom, #fff, #ecfbea)", color: GREEN }}>
            <Bag />
            Immediate Purchase
          </span>
        </div>
        {/* Title */}
        <p className={`${serif.className} absolute left-4 top-[166.5px] text-[34px] leading-none`} style={{ color: INK }}>
          Get <span style={{ color: VIOLET }}>₹10 Cr</span> Cover at
          <br />
          <span style={{ color: VIOLET }}>₹10,000/Year</span>.
        </p>
        <p className="absolute left-4 right-4 top-[250.5px] text-[16px] font-medium leading-[1.5]" style={{ color: "#9082b3" }}>
          Protects executives when business decisions lead to lawsuits
        </p>
        {/* Coverage chip */}
        <span className="absolute left-4 top-[322.5px] inline-flex h-[31px] items-center gap-2 rounded-full border-[0.5px] border-[#e6e8ea] bg-white px-3 text-[14px] font-medium" style={{ color: BASIC }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the coverage check */}
          <img src="/media/netra/coverage-check.svg" alt="" width={14} height={14} />
          Covers legal &amp; defence costs
        </span>
        {/* Media */}
        <div className="absolute left-4 top-[365.5px] h-[196.1px] w-[358px] overflow-hidden rounded-[12px] border-[0.5px] border-[#e6e8ea] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- the gavel art */}
          <img src="/media/netra/gavel.webp" alt="" className="size-full object-cover" />
        </div>
        {/* Promo banner */}
        <div className="absolute left-4 top-[569.6px] grid w-[358px] gap-1 rounded-[12px] px-3 py-2" style={{ background: "linear-gradient(to right, #fff6ed, transparent)" }}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-[6px] border-[0.5px] border-[#ffd2a8] bg-[#fff6ed] px-[6px] py-1 text-[14px] font-medium leading-none" style={{ color: ORANGE }}>
              <span className="size-1 rounded-full" style={{ background: ORANGE }} />
              New
            </span>
            <span className="text-[12px] font-semibold underline" style={{ color: "#1458d2" }}>
              Know More
            </span>
          </div>
          <span className="text-[14px] font-medium leading-[1.3]" style={{ color: INK }}>
            Personalise my quote with BimaNetra
          </span>
        </div>
        {/* The company field */}
        <div className="absolute left-4 top-[643.8px] w-[358px]">
          <HeroField value={value} focus={shot.focus && !shot.sheet} success={shot.chars >= 4} />
        </div>
        <AnimatePresence>{shot.drawer && <Drawer query={COMPANY_TYPED.slice(0, shot.chars)} />}</AnimatePresence>
        {/* CTA */}
        <m.div
          className="absolute left-4 top-[702.3px] flex h-[58px] w-[358px] items-center justify-between rounded-[16px] border border-[#ff7700] px-4 text-[16px] font-semibold text-white"
          style={{ background: ORANGE, letterSpacing: TIGHT }}
          animate={{ scale: shot.goPress ? 0.98 : 1 }}
          transition={{ duration: 0.1 }}
        >
          Get My Quote in 2 Minutes
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="m6 3.5 4.5 4.5L6 12.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </m.div>
        {/* Below the CTA */}
        <p className="absolute inset-x-0 top-[780.3px] text-center text-[14px] font-medium" style={{ color: SECOND }}>
          Policy Provided by
        </p>
        <div className="absolute left-4 right-4 top-[811px] flex items-center justify-between">
          {["SBI", "Digit", "Chola", "United"].map((n) => (
            // eslint-disable-next-line @next/next/no-img-element -- insurer logos
            <img key={n} src={`/media/netra/insurers/${n}.webp`} alt="" className="h-7 w-auto object-contain" />
          ))}
        </div>
      </m.div>
      {/* The safe area under the home bar: the page stops above it, as the sheet does, so at the
          start nothing is cut in half under the bar (the page there is plain white). */}
      <div className="absolute inset-x-0 bottom-0 bg-white" style={{ height: SAFE }} />
    </div>
  );
}

function HeroField({ value, focus, success }: { value: string; focus: boolean; success: boolean }) {
  const lit = focus || success;
  return (
    <div
      className="flex h-[42.5px] items-center gap-2 rounded-t-[6px] px-3 transition-colors duration-150"
      style={{ borderBottom: lit ? `1px solid ${VIOLET}` : `0.5px solid ${STROKE}`, background: lit ? TINT : "#fff" }}
    >
      <span className="flex min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap text-[16px] font-medium leading-[18px]">
        {value ? (
          <>
            <span className="truncate" style={{ color: VIOLET }}>
              {value}
            </span>
            {focus && <Caret />}
          </>
        ) : (
          <>
            {focus && <Caret />}
            <span style={{ color: PLACEHOLDER }}>Start with your company&rsquo;s legal name</span>
          </>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {value && <Clear />}
        <Info />
        <span className="h-[14px] w-px" style={{ background: STROKE }} />
        <Roundel color={success ? GREEN : STROKE} />
      </span>
    </div>
  );
}

function Caret() {
  return <span className="ml-px inline-block h-[18px] w-[1.5px] animate-[netra-caret_1s_step-end_infinite]" style={{ background: VIOLET }} />;
}

/** The MCA type-ahead (CompanySuggest): no web match, then the one MCA record, already active. */
function Drawer({ query }: { query: string }) {
  return (
    <m.div
      className="absolute left-4 top-[690.3px] z-10 w-[358px] rounded-[16px] border-[0.5px] border-[#e6e8ea] bg-white p-2 shadow-[0_0_12px_rgba(169,172,177,0.24)]"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease: OUT }}
    >
      <div className="flex min-h-12 items-center gap-3 rounded-[8px] bg-[#f4f5f6] px-4">
        <span className="min-w-0 flex-1 truncate text-[16px] font-medium" style={{ color: SECOND }}>
          No result for &ldquo;{query}&rdquo;.{" "}
          <span className="underline" style={{ color: "#1458d2" }}>
            Enter a new company?
          </span>
        </span>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="shrink-0">
          <circle cx="8" cy="8" r="8" fill={STROKE} />
          <path d="m5.5 5.5 5 5m0-5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium" style={{ color: TERT }}>
        MCA Records
        <span className="h-[0.5px] flex-1 bg-[#d2d5d8]" />
      </div>
      <div className="flex h-16 items-center justify-between rounded-[8px] bg-[#f4f5f6] p-4">
        <span className="flex flex-col gap-1">
          <span className="text-[16px] font-medium leading-none" style={{ color: SECOND }}>
            Sabyasachi Calcutta
          </span>
          <span className="text-[12px] font-medium leading-none">
            <span style={{ color: "#bec2c6" }}>Registered as: </span>
            <span style={{ color: TERT }}>SABYASACHI CALCUTTA LLP</span>
          </span>
        </span>
        <Roundel color={GREEN} />
      </div>
    </m.div>
  );
}

// ---- The quote sheet ----------------------------------------------------------------

function Sheet({
  shot,
  card,
  strip,
  gaze,
  rot,
  bar,
}: {
  shot: Shot;
  card: React.RefObject<NetraBotHandle | null>;
  strip: React.RefObject<NetraBotHandle | null>;
  gaze?: () => { x: number; y: number };
  rot: MotionValue<number>;
  bar: MotionValue<number>;
}) {
  const open = shot.card === "intro" || shot.card === "open";
  const stripH = STRIP_H[shot.step];
  const fieldsH = CARD_FOOT - stripH - 12 - FIELDS_TOP;
  return (
    <>
      {/* Header: Back (after Profile), the title, Close; the pills on their own line. */}
      <div className="absolute left-[12.5px] right-[12.5px] top-[24.5px] h-8">
        <AnimatePresence>
          {shot.step > 0 && (
            <m.span
              className="absolute left-0 top-1 grid size-6 place-items-center rounded-[8px] border-[0.5px] border-[#e6e8ea] bg-white"
              style={{ color: SECOND }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 4 6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </m.span>
          )}
        </AnimatePresence>
        <m.span
          className={`${serif.className} absolute top-0 text-[32px] leading-none`}
          style={{ color: INK }}
          animate={{ x: shot.step > 0 ? 36 : 0 }}
          transition={{ duration: 0.3, ease: OUT }}
        >
          {STEPS[shot.step]}
        </m.span>
        <span className="absolute right-0 top-0 grid size-6 place-items-center rounded-[8px] border-[0.5px] border-[#e6e8ea] bg-white" style={{ color: SECOND }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      <ol className="absolute left-[12.5px] top-[68.5px] flex items-center gap-3">
        {STEPS.map((s, i) => {
          const state = i < shot.step ? "done" : i === shot.step ? "now" : "next";
          return <Pill key={`${s}-${state}`} label={s} state={state} />;
        })}
      </ol>

      {/* The fields: the only scrolling row, a hairline at its foot; they sink and fade while
          the card is up. */}
      <div
        className="absolute left-[12.5px] w-[357px] overflow-hidden border-b-[0.5px] border-[#d2d5d8] transition-[height] duration-[600ms]"
        style={{ top: FIELDS_TOP, height: fieldsH }}
      >
        <m.div
          animate={{ y: open ? 48 : 0, opacity: open ? 0 : 1 }}
          transition={{ duration: shot.card === "intro" ? 0 : 0.6, ease: ENGINE }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {shot.fieldsIn && (
              <m.div
                key={shot.step}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.24, ease: OUT } }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.16, ease: OUT } }}
              >
                <m.div animate={{ y: shot.list === "turnover" ? -LIST_SCROLL : 0 }} transition={{ duration: 0.2 }}>
                  {shot.step === 0 ? <Profile shot={shot} /> : shot.step === 1 ? <Business shot={shot} /> : <Risk shot={shot} />}
                </m.div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </div>

      {/* Netra's card: up over the fields while it works, folded to the strip above the CTA. */}
      <m.div
        className="absolute left-[12.5px] w-[357px] overflow-hidden rounded-[12px] border border-dashed border-[#ffd2a8]"
        style={{ bottom: SHEET_H - CARD_FOOT, background: "linear-gradient(to bottom, #fff, #fff6ed 82.567%)" }}
        initial={false}
        animate={{ height: open ? CARD_FOOT - FIELDS_TOP : stripH }}
        transition={{ duration: shot.card === "intro" ? 0 : 0.6, ease: ENGINE }}
      >
        <AnimatePresence initial={false}>
          {open ? (
            <m.div key="open" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
              <CardBody shot={shot} bot={card} gaze={gaze} rot={rot} bar={bar} />
            </m.div>
          ) : (
            <m.div
              key="strip"
              className="absolute inset-x-3 bottom-0 flex items-center gap-3"
              style={{ height: stripH }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.45, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <m.span className="block size-12 shrink-0" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.5, duration: 0.3 }}>
                <NetraBot ref={strip} size={48} state={shot.mood} getGaze={gaze} label="Netra" />
              </m.span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <MeterRow step={shot.step} />
                <Head shot={shot} chevron={180} />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      <div className="absolute left-[12.5px] w-[357px]" style={{ top: CTA_TOP }}>
        <MobileCta last={shot.step === 2} enabled={shot.ready && !shot.advancing} press={shot.press} />
      </div>
    </>
  );
}

function MeterRow({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      <Meter />
      <span className="text-[14px] font-semibold leading-none" style={{ color: SECOND, letterSpacing: TIGHT }}>
        {METER[step]}
      </span>
    </div>
  );
}

/** The active task's head: what Netra is on, and how far along. */
function Head({ shot, chevron }: { shot: Shot; chevron: number }) {
  const task = TASKS[shot.step];
  let icon: React.ReactNode;
  let text: React.ReactNode;
  if (shot.step === 0) {
    const ready = shot.ready;
    icon = ready ? (
      <Roundel color={VIOLET} />
    ) : (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
        <circle cx="8" cy="8" r="7.25" stroke={VIOLET} strokeWidth="1.5" />
      </svg>
    );
    text = ready ? (
      <Shimmer>Ready to Confirm Profile</Shimmer>
    ) : (
      <span className="flex-1 text-[14px] font-medium leading-[1.2]" style={{ color: BASIC }}>
        {task.pending}
      </span>
    );
  } else if (shot.done) {
    icon = <StrokeCheck />;
    text = (
      <span className="flex-1 text-[14px] font-medium leading-[1.2]" style={{ color: BASIC }}>
        {task.ready}
      </span>
    );
  } else {
    icon = <Ring />;
    text = <Shimmer>{task.pending}</Shimmer>;
  }
  return (
    <div className="flex items-center gap-2 rounded-[8px] border-[0.5px] border-[#d1c6ff] bg-[#f4f1ff] px-3 py-2">
      {icon}
      {text}
      {shot.step > 0 && (
        <m.span animate={{ rotate: chevron }} transition={{ duration: 0.3 }}>
          <Chevron />
        </m.span>
      )}
    </div>
  );
}

/** The card while it is up: Netra, the meter, the active task (with its scan), the rest at the foot. */
function CardBody({
  shot,
  bot,
  gaze,
  rot,
  bar,
}: {
  shot: Shot;
  bot: React.RefObject<NetraBotHandle | null>;
  gaze?: () => { x: number; y: number };
  rot: MotionValue<number>;
  bar: MotionValue<number>;
}) {
  const pending = TASKS.slice(shot.step + 1);
  const intro = shot.step === 0;
  const item = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: shot.runner || !intro ? 1 : 0, y: shot.runner || !intro ? 0 : 8 },
    transition: { duration: 0.55, delay: intro ? 0.1 + i * 0.12 : 0 },
  });
  return (
    <div className="flex h-full flex-col gap-3 px-3 pb-3 pt-2">
      <m.span
        className="block size-16 shrink-0"
        initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.1, duration: 0.55 }}
      >
        <NetraBot ref={bot} size={64} state={shot.mood} getGaze={gaze} label="Netra" />
      </m.span>
      <m.div {...item(0)}>
        <MeterRow step={shot.step} />
      </m.div>
      <m.div {...item(1)} className="flex min-h-0 flex-1 flex-col gap-2">
        <Head shot={shot} chevron={0} />
        {!intro && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, delay: 0.12 }} className="min-h-0 flex-1 overflow-hidden">
            <Scan step={shot.step} line={shot.line} done={shot.done} rot={rot} bar={bar} />
          </m.div>
        )}
      </m.div>
      <div className="mt-auto flex flex-col gap-2">
        {pending.map((p, i) => (
          <m.div key={p.key} {...item(2 + i)} className="flex items-center gap-3 px-2 py-1">
            <span className="size-[14px] shrink-0 rounded-full border-2" style={{ borderColor: TERT }} />
            <span className="text-[14px] font-medium leading-[1.2]" style={{ color: TERT }}>
              {p.pending}
            </span>
          </m.div>
        ))}
      </div>
    </div>
  );
}

// ---- The steps' fields ------------------------------------------------------------------

const FUZZY_HELP = "Fetched from publicly available sources. BimaNetra can make mistakes.";
const TURNOVERS = ["Up to ₹1 Cr", "₹1 Cr to ₹5 Cr", "₹5 Cr to ₹50 Cr", "₹50 Cr to ₹250 Cr", "₹250 Cr to ₹500 Cr", "₹500 Cr to ₹700 Cr", "₹700 Cr and Above"];
/** Sabyasachi's turnover, the list's last option. */
const PICKED = "₹700 Cr and Above";
const BUSINESSES = ["Retail & Wholesale", "IT & Digital Businesses", "Manufacturing", "Professional Services", "Hospitality", "Unclassified / Miscellaneous"];
const GUESS = "Unclassified / Miscellaneous";
const RETAIL = "Retail & Wholesale";

function Profile({ shot }: { shot: Shot }) {
  const phone = PHONE.slice(0, shot.phone).replace(/^(\d{4})(\d{0,3})(\d{0,3})$/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
  const email = EMAIL.slice(0, shot.email);
  return (
    <>
      <MField label="Company Name" value={COMPANY} status="userFilled" help="Retrieved legal company name from MCA." />
      <MField
        label="Your Full Name"
        value={NAME.slice(0, shot.name)}
        placeholder="Enter Full Name"
        status={shot.name > 0 ? "success" : "empty"}
        focus={shot.focusField === "name"}
        clearable
      />
      <MField
        label="Your Phone Number"
        prefix="+91"
        value={phone}
        placeholder="0000 000 000"
        status={shot.phone === PHONE.length ? "success" : "empty"}
        focus={shot.focusField === "phone"}
        clearable
      />
      <MField
        label="Your Email Address"
        value={email}
        placeholder="Enter Email Address"
        status={shot.email === EMAIL.length ? "success" : "empty"}
        focus={shot.focusField === "email"}
        ghost={shot.email === 4 ? "gmail.com" : undefined}
        clearable
      />
    </>
  );
}

function Business({ shot }: { shot: Shot }) {
  const at = (i: number) => shot.resolved > i;
  return (
    <div className="relative">
      <MField label="Company Type" select value="Limited Liability Partnership" status={at(0) ? "fuzzy" : "loading"} help={at(0) ? FUZZY_HELP : undefined} />
      {/* The guess stays yellow until the founder re-picks it; then it is theirs, and green. */}
      <MField
        label="Type of Business"
        select
        open={shot.list === "tob"}
        value={shot.tob ? RETAIL : GUESS}
        status={!at(1) ? "loading" : shot.tob ? "success" : "fuzzy"}
        help={at(1) && !shot.tob ? FUZZY_HELP : undefined}
      />
      <MField
        label="Company's Annual Turnover"
        select
        open={shot.list === "turnover"}
        value={shot.turnover ? PICKED : ""}
        placeholder="Select Annual Turnover"
        status={!at(2) ? "loading" : shot.turnover ? "success" : "empty"}
        focus={shot.list === "turnover"}
      />
      <MField label="Company PAN" required={false} value="AATFS4271L" status={at(3) ? "success" : "loading"} clearable />
      {shot.list === "tob" && <SelectList top={189} options={BUSINESSES} selected={GUESS} hover={RETAIL} />}
      {shot.list === "turnover" && <SelectList top={295.5} options={TURNOVERS} hover={PICKED} />}
    </div>
  );
}

/** A select's open list (SelectMenu): 40px rows, the current value ticked green, the row under the tap lit. */
function SelectList({ top, options, selected, hover }: { top: number; options: string[]; selected?: string; hover: string }) {
  return (
    <div
      className="absolute inset-x-0 z-10 rounded-[12px] border-[0.5px] border-[#e6e8ea] bg-white p-1 shadow-[0_0_12px_rgba(169,172,177,0.24)]"
      style={{ top }}
    >
      {options.map((o) => (
        <div
          key={o}
          className="flex h-10 items-center justify-between rounded-[8px] px-3 text-[16px] font-medium"
          style={{ color: SECOND, background: o === hover ? "#f4f5f6" : "transparent" }}
        >
          {o}
          <Roundel color={o === selected ? GREEN : STROKE} />
        </div>
      ))}
    </div>
  );
}

function Risk({ shot }: { shot: Shot }) {
  const done = shot.done;
  return (
    <>
      <MYesNo label="Does your business have an existing Directors & Officers policy?" picked={shot.answers > 0 ? "No" : null} />
      <MYesNo label="Any claims or incidents in the last 5 years?" picked={shot.answers > 1 ? "No" : null} />
      <IkkatDivider />
      <div className="mb-3 flex items-center gap-2 rounded-[8px] px-3 py-2" style={{ background: `linear-gradient(to right, ${done ? "#ecfbea" : "#f4f1ff"}, transparent)` }}>
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
      <MField
        label="Sum Insured"
        select
        value="₹10 Cr"
        valueIcon={<Bag />}
        status={done ? "success" : "loading"}
        loadingText="Approximating…"
        help={done ? "Typical cover for a business like yours" : undefined}
        helpColor={BASIC}
        helpAlign="start"
      />
    </>
  );
}

type Status = "empty" | "success" | "userFilled" | "fuzzy" | "loading";

/** One InteractiveInput at 390: label row 36, box 42.5, help row 28. */
function MField({
  label,
  value,
  status,
  placeholder,
  prefix,
  select = false,
  open = false,
  clearable = false,
  required = true,
  focus = false,
  ghost,
  valueIcon,
  loadingText = "Fetching…",
  help,
  helpColor = TERT,
  helpAlign = "end",
}: {
  label: string;
  value: string;
  status: Status;
  placeholder?: string;
  prefix?: string;
  select?: boolean;
  open?: boolean;
  clearable?: boolean;
  required?: boolean;
  focus?: boolean;
  ghost?: string;
  valueIcon?: React.ReactNode;
  loadingText?: string;
  help?: string;
  helpColor?: string;
  helpAlign?: "start" | "end";
}) {
  const busy = status === "loading";
  const look =
    busy
      ? { line: `1px solid ${STROKE}`, bg: "#e6e8ea", ink: PLACEHOLDER }
      : status === "fuzzy"
        ? { line: "1px solid #ffe890", bg: "rgba(255,207,14,0.04)", ink: "#b38f0a" }
        : status === "userFilled"
          ? { line: `1px solid ${STROKE}`, bg: TINT, ink: BASIC }
          : status === "success" || focus
            ? { line: `1px solid ${VIOLET}`, bg: TINT, ink: VIOLET }
            : { line: `0.5px solid ${STROKE}`, bg: "#fff", ink: VIOLET };
  const roundel =
    status === "fuzzy" ? (
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="shrink-0">
        <circle cx="8" cy="8" r="8" fill="#ffcf0e" />
        <path d="M8 4.2v4.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11.4" r="1" fill="#fff" />
      </svg>
    ) : (
      <Roundel color={status === "success" ? GREEN : status === "userFilled" ? VIOLET : STROKE} />
    );
  return (
    <div className="flex flex-col">
      <div className="flex h-9 items-center gap-[2px] px-2 text-[12px] font-medium leading-none" style={{ color: BASIC }}>
        {label}
        {required && <span style={{ color: "#f10000" }}>*</span>}
      </div>
      <div
        className="flex h-[42.5px] items-center gap-2 rounded-t-[6px] px-3 transition-[background-color,border-color] duration-200"
        style={{ borderBottom: look.line, background: look.bg }}
      >
        {prefix && (
          <span className="border-r pr-2 text-[16px] font-medium leading-[18px]" style={{ color: TERT, borderColor: STROKE }}>
            {prefix}
          </span>
        )}
        <span className="flex min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap text-[16px] font-medium leading-[18px]">
          {busy ? (
            <span style={{ color: PLACEHOLDER }}>{loadingText}</span>
          ) : value ? (
            <>
              <span className="flex min-w-0 items-center gap-[6px]">
                <span className="truncate" style={{ color: look.ink }}>
                  {value}
                </span>
                {valueIcon}
              </span>
              {focus && <Caret />}
              {ghost && <span style={{ color: "#9082b3" }}>{ghost}</span>}
            </>
          ) : (
            <>
              {focus && <Caret />}
              <span style={{ color: PLACEHOLDER }}>{placeholder}</span>
            </>
          )}
        </span>
        {select && !busy && (
          <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <Chevron />
          </m.span>
        )}
        <span className="flex shrink-0 items-center gap-2">
          {clearable && !busy && value && <Clear />}
          <Info />
          <span className="h-[14px] w-px" style={{ background: STROKE }} />
          {busy ? <Spinner /> : roundel}
        </span>
      </div>
      <div
        className={`flex h-7 min-w-0 items-center px-2 text-[12px] font-medium leading-[1.2] ${helpAlign === "end" ? "justify-end" : "justify-start"}`}
        style={{ color: helpColor }}
      >
        <span className="truncate">{help}</span>
      </div>
    </div>
  );
}

/** A Yes/No question (SegmentedField) at 390: the label wraps, the pills side by side. */
function MYesNo({ label, picked }: { label: string; picked: "Yes" | "No" | null }) {
  return (
    <div className="flex flex-col">
      <div className="p-2 text-[14px] font-medium leading-[1.2]" style={{ color: BASIC }}>
        {label}
        <span style={{ color: "#f10000" }}>*</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["Yes", "No"] as const).map((o) => {
          const on = picked === o;
          return (
            <div
              key={o}
              className="flex h-[42.5px] items-center justify-between gap-2 rounded-[16px] border-[0.5px] px-3 text-[16px] font-medium leading-[18px] transition-colors duration-200"
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

/** The sheet's CTA at 390: r16 (a step under the app's r24), purple, and on Risk the orange "Get Instant Quotes". */
function MobileCta({ last, enabled, press }: { last: boolean; enabled: boolean; press: boolean }) {
  const tone = last ? ORANGE : VIOLET;
  return (
    <m.div
      className="flex h-[49px] items-center justify-between rounded-[16px] border-[0.5px] px-7 text-[16px] font-semibold leading-none"
      animate={{
        backgroundColor: enabled ? tone : "rgba(169,172,177,0.24)",
        borderColor: enabled ? tone : STROKE,
        color: enabled ? "#ffffff" : PLACEHOLDER,
        scale: press ? 0.98 : 1,
      }}
      transition={{ duration: press ? 0.08 : 0.2 }}
      style={{ letterSpacing: TIGHT }}
    >
      {last ? "Get Instant Quotes" : "Confirm and Continue"}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2.5 8h11M9.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </m.div>
  );
}
