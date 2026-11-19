"use client";

import "@/components/bk/anek.css";
import Image from "next/image";
import { Instrument_Serif } from "next/font/google";
import { AnimatePresence, animate, m, useMotionValue, useTransform, type MotionValue, type Transition } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NetraBot, type NetraBotHandle } from "../netrabot/NetraBot";
import { BAYER } from "@/lib/netrabot/bayer";
import { useGrow } from "../project/GrowMedia";
import NetraArcs from "./NetraArcs";

/**
 * /netra's opening frame (Figma 8831:35640, storyboards 01-08), drawn live on a
 * 1200×675 stage scaled to the frame.
 * - While the frame grows on scroll it is BimaKavach's violet curtain: the logomark
 *   grows its wordmark while the whole logo settles smaller, centred, as the frame
 *   reaches full size (scrubbed by GrowMedia's growth, so scrolling back reverses it).
 * - At full size a loop plays: the curtain lifts off the D&O product page, the camera
 *   moves its quote column to the centre while the rest dissolves, a pointer types
 *   "Pepe" and picks the MCA record, hovers the CTA, thinks better of it, clicks Know
 *   More, and the curtain rises from below to the opening logo, so the loop joins up.
 * - It stops (back under the curtain) when the frame leaves the screen; under reduced
 *   motion it is one still of the filled-in form.
 * The page is BimaNetra's own (fonts, colours, the gavel clip and its D&O icon), measured
 * from the storyboard; type is the live page's ×0.7776, the scale it was captured at.
 */

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], display: "swap" });

const W = 1200;
const H = 675;
const VIOLET = "#4100cf";
const ORANGE = "#ff7700";
const INK = "#1c1d1f";

/** The quote column, on the page and once the camera has centred it. */
const COL = { x: 663.2, y: 109.2, w: 512 };
const FOCUS = { x: 344 - COL.x, y: 70.4 - COL.y };

/**
 * The close-up while the pointer weighs up the CTA (storyboards 07.1 and 07.2): the
 * camera zooms 1.125× on the banner, field and CTA, which narrow to 422.6px (475px on
 * screen) and stay centred; then, as the field and CTA dissolve, it settles on the
 * banner alone. The camera pivots on the block's centre in the focused page.
 */
const ZOOM = 1.125;
const NARROW = 422.6;
const PIVOT = { x: 600, y: 452.95 };
const ZOOM_Y = [0, -101.45, -39.95] as const;
/** The gavel card's height, and the camera's pivot in its own box once the column is centred (y 70.4). */
const CARD_H = 303.4;
const CARD_PIVOT_Y = (PIVOT.y - 70.4) / CARD_H;

/** Where the pointer goes, in page px (column centred; the camera carries it when it zooms). */
const IN = { x: 1010, y: 668 };
const FIELD = { x: 520, y: 450 };
const ROW = { x: 432, y: 557 };
const CTA = { x: 690, y: 503 };
const KNOW = { x: 782, y: 399 };

const QUERY = "Pepe";
const NAME = "Pepe Jeans Innerfashion Private Limited";

type Kind = "arrow" | "text" | "hand";
/** What NetraBot watches: nothing (ahead), or an element marked data-look (the pointer, the field…). */
type Look = "ahead" | "pointer" | "media" | "icon" | "field" | "cta";
type Bot = { on: boolean; state: string; look: Look; react: { key: string; n: number } | null };
type Pointer = { x: number; y: number; kind: Kind; on: boolean; down: boolean; dur: number };
type Shot = {
  /** Over the page, lifted off the top, or rising back from below (one state, so it can't drop from the top). */
  curtain: "cover" | "up" | "return";
  focus: boolean;
  pointer: Pointer;
  typed: number;
  picked: boolean;
  field: boolean;
  suggest: boolean;
  row: boolean;
  cta: boolean;
  know: boolean;
  /** 0, the close-up on the form (07.1), then the banner alone (07.2). */
  zoom: 0 | 1 | 2;
  tap: { x: number; y: number; n: number } | null;
  /** NetraBot, beside Know More: shown, its resting state, where it looks, its last one-off reaction. */
  bot: Bot;
  /** Set on a reset under the curtain: everything snaps instead of animating. */
  jump: boolean;
};
type Beat = {
  at: number;
  set?: Partial<Omit<Shot, "pointer" | "tap" | "bot">>;
  pointer?: Partial<Pointer>;
  tap?: { x: number; y: number };
  /** NetraBot: any of shown / state / look, and `react` plays one animation once. */
  bot?: Partial<Omit<Bot, "react">> & { react?: string };
  /** Back to the opening, under the curtain. */
  reset?: true;
};

const START: Shot = {
  curtain: "cover",
  focus: false,
  pointer: { ...IN, kind: "arrow", on: false, down: false, dur: 0.9 },
  typed: 0,
  picked: false,
  field: false,
  suggest: false,
  row: false,
  cta: false,
  know: false,
  zoom: 0,
  tap: null,
  bot: { on: false, state: "idle", look: "ahead", react: null },
  jump: true,
};

/** The reduced-motion still: storyboard 07, the form filled in (NetraBot content beside it). */
const STILL: Shot = {
  ...START,
  curtain: "up",
  focus: true,
  picked: true,
  field: true,
  bot: { on: true, state: "happyIdle", look: "ahead", react: null },
};

/** One loop, in ms from the frame reaching full size. */
/**
 * One loop, in ms from the frame reaching full size. NetraBot rides along as the
 * visitor's stand-in: it peeks in, gets curious about the page and the icon forming
 * below, notices the pointer, listens while it types, searches and reads, nods at
 * the verified company, weighs up the CTA with us, then hops to catch our eye, and
 * celebrates when we come to it (Know More is right beside it).
 */
const BEATS: Beat[] = [
  { at: 450, set: { curtain: "up", jump: false } },
  { at: 1150, bot: { on: true, look: "media" } },
  { at: 2450, bot: { react: "curiousTilt" } },
  { at: 3000, set: { focus: true }, bot: { look: "icon" } },
  { at: 3250, bot: { react: "curiousPeek" } },
  { at: 4300, pointer: { ...FIELD, on: true, dur: 0.95 } },
  { at: 4450, bot: { look: "pointer", react: "doubleTake" } },
  { at: 4950, pointer: { kind: "text" } },
  { at: 5300, pointer: { down: true }, tap: FIELD },
  { at: 5420, pointer: { down: false }, set: { field: true }, bot: { state: "listening", look: "field" } },
  { at: 5750, set: { typed: 1 } },
  { at: 5950, set: { typed: 2 } },
  { at: 6150, set: { typed: 3, suggest: true }, bot: { state: "searching" } },
  { at: 6350, set: { typed: 4 } },
  { at: 6950, pointer: { ...ROW, kind: "arrow", dur: 0.7 }, bot: { look: "pointer" } },
  { at: 7450, pointer: { kind: "hand" }, set: { row: true }, bot: { state: "reading" } },
  { at: 7800, pointer: { down: true }, tap: ROW },
  { at: 7920, pointer: { down: false }, set: { picked: true, suggest: false, row: false } },
  // The company's verified: it nods, content.
  { at: 8000, bot: { state: "happyIdle", react: "nodYes", look: "field" } },
  { at: 8550, pointer: { ...CTA, kind: "arrow", dur: 0.8 }, bot: { look: "pointer" } },
  // On the CTA the camera closes in and the gavel lifts away (the D&O icon stays).
  { at: 9250, pointer: { kind: "hand" }, set: { cta: true, zoom: 1 }, bot: { state: "thinking" } },
  // It hovers, drifts, and thinks better of it; NetraBot wonders with us, then hops to say hello.
  { at: 10000, pointer: { x: CTA.x + 6, y: CTA.y - 2, dur: 0.6 }, bot: { react: "curiousTilt" } },
  { at: 10600, pointer: { x: CTA.x - 3, y: CTA.y + 1, dur: 0.5 }, bot: { react: "helloHop", state: "happyIdle" } },
  // Off to Know More: the field, then the CTA, dissolve down, leaving the banner.
  { at: 11100, pointer: { ...KNOW, dur: 1 }, set: { cta: false, zoom: 2 } },
  { at: 11200, pointer: { kind: "arrow" } },
  { at: 11550, bot: { react: "winkReaction" } },
  { at: 12100, pointer: { kind: "hand" }, set: { know: true } },
  { at: 12250, pointer: { down: true }, tap: KNOW },
  { at: 12300, bot: { react: "celebrate" } },
  { at: 12370, pointer: { down: false } },
  { at: 12450, set: { curtain: "return" } },
  // Under the curtain, the page resets for the next loop.
  { at: 13650, reset: true },
];
const LOOP = 14600;
/** How long the curtain holds at full size before the loop commits (its first beat). */
const HOLD = BEATS[0].at;

function apply(s: Shot, b: Beat): Shot {
  if (b.reset) return START;
  let bot = s.bot;
  if (b.bot) {
    const { react, ...rest } = b.bot;
    bot = { ...bot, ...rest, react: react ? { key: react, n: (bot.react?.n ?? 0) + 1 } : bot.react };
  }
  return {
    ...s,
    ...b.set,
    pointer: b.pointer ? { ...s.pointer, ...b.pointer } : s.pointer,
    tap: b.tap ? { ...b.tap, n: (s.tap?.n ?? 0) + 1 } : s.tap,
    bot,
  };
}

/**
 * How far the frame can grow on this screen (it only reaches 1 when it fits). The
 * viewport is measured as framer's useScroll measures it (the scrolling element's
 * clientHeight, not innerHeight, which grows when a phone's URL bar hides).
 */
function startAt(frame: number) {
  const view = document.documentElement.clientHeight;
  const max = view >= frame ? 1 : ((frame + view) / (2 * frame)) ** 2;
  return Math.min(0.985, max - 0.01);
}

const CURTAIN_OVERHANG = 48;
const CAMERA: Transition = { duration: 1.1, ease: [0.65, 0, 0.25, 1] };
const NOW: Transition = { duration: 0 };
const sink = (gone: boolean) => (gone ? { opacity: 0, y: 18 } : { opacity: 1, y: 0 });

export default function NetraSplash({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const grow = useGrow();
  // The frame's size; unknown until measured, so the server HTML (and the frame before
  // hydration) shows the curtain's violet rather than an unscaled stage.
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [shot, setShot] = useState<Shot>(START);
  const [still, setStill] = useState(false);
  const [seen, setSeen] = useState(false);
  // The D&O icon's hand-over from the bottom left to under the column (NetraArcs).
  const swap = useMotionValue(0);
  // The close-up camera, as values (not an animate prop) so the gavel card can undo its
  // zoom exactly; and the card's dither dissolve.
  const camScale = useMotionValue(1);
  const camY = useMotionValue(0);
  const unzoom = useTransform(camScale, (v) => 1 / v);
  const gone = useMotionValue(0);

  // Measure the frame before paint (fractional sizes, which transforms don't affect).
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The icon hands over as the camera centres the column; resets snap.
  useEffect(() => {
    if (shot.jump) {
      swap.jump(shot.focus ? 1 : 0);
      return;
    }
    if (!shot.focus) return;
    const run = animate(swap, 1, { duration: 1.6, ease: "linear" });
    return () => run.stop();
  }, [shot.focus, shot.jump, swap]);

  // The camera closes in on the form, then settles on the banner; resets snap.
  useEffect(() => {
    const t: Transition = shot.jump ? NOW : { ...CAMERA, duration: shot.zoom === 2 ? 1 : 1.2 };
    const a = animate(camScale, shot.zoom ? ZOOM : 1, t);
    const b = animate(camY, ZOOM_Y[shot.zoom], t);
    return () => {
      a.stop();
      b.stop();
    };
  }, [shot.zoom, shot.jump, camScale, camY]);

  // The gavel card dithers away as the close-up starts.
  const closing = shot.zoom > 0;
  useEffect(() => {
    if (shot.jump) {
      gone.jump(closing ? 1 : 0);
      return;
    }
    if (!closing) return;
    const run = animate(gone, 1, { duration: 0.85, ease: "linear" });
    return () => run.stop();
  }, [closing, shot.jump, gone]);

  // The gavel clip plays only while the page is showing (not under the curtain, not off screen).
  const live = seen && shot.curtain === "up";
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (live) void v.play().catch(() => {});
    else v.pause();
  }, [live]);

  // The loop: starts once the frame is at full size and on screen, plays to its end,
  // and goes again while that still holds. Leaving the screen resets it.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = window.setTimeout(() => {
        setStill(true);
        setShot(STILL);
      });
      return () => window.clearTimeout(t);
    }
    let timers: number[] = [];
    let playing = false;
    let inView = false;
    const ready = () => inView && grow.get() >= startAt(el.offsetHeight);
    // The curtain holds for a beat first; if the frame has been scrolled on past by
    // then, the loop doesn't start (it waits for the frame to come back to full size).
    const run = () => {
      playing = true;
      timers = [
        window.setTimeout(() => {
          if (!ready()) {
            playing = false;
            return;
          }
          timers = BEATS.map((b) => window.setTimeout(() => setShot((s) => apply(s, b)), b.at - HOLD));
          timers.push(
            window.setTimeout(() => {
              playing = false;
              if (ready()) run();
            }, LOOP - HOLD),
          );
        }, HOLD),
      ];
    };
    const start = () => {
      if (!playing && ready()) run();
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      setSeen(inView);
      if (inView) {
        start();
      } else {
        if (playing) {
          timers.forEach((t) => window.clearTimeout(t));
          timers = [];
          playing = false;
          setShot(START);
        }
      }
    });
    io.observe(el);
    const off = grow.on("change", start);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      io.disconnect();
      off();
    };
  }, [grow]);

  // The stage overlaps the frame by a pixel on every side: were their edges to coincide,
  // the browser would blend the frame's own fill into the stage's along a fractional
  // edge (a hairline on the curtain). The 0.3% overscan is invisible.
  const k = box ? Math.max((box.w + 2) / W, (box.h + 2) / H) : 1;
  const stage = box ? `translate(${(box.w - W * k) / 2}px, ${(box.h - H * k) / 2}px) scale(${k})` : undefined;

  const cam = shot.jump ? NOW : CAMERA;
  const close: Transition = shot.jump ? NOW : { ...CAMERA, duration: shot.zoom === 2 ? 1 : 1.2 };
  const fade: Transition = shot.jump ? NOW : { duration: 0.6, ease: "easeOut" };

  return (
    <div
      ref={root}
      role="img"
      aria-label={label}
      className="absolute inset-0 overflow-hidden"
      style={{ background: VIOLET }}
    >
      <div
        aria-hidden
        className={`absolute left-0 top-0 origin-top-left select-none ${live ? "" : "[&_*]:[animation-play-state:paused]"}`}
        style={{
          width: W,
          height: H,
          transform: stage,
          visibility: box ? undefined : "hidden",
          fontFamily: '"Anek Latin", Arial, sans-serif',
          color: INK,
        }}
      >
        {/* The page; its background stays put while the camera moves over it */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ background: "linear-gradient(184.35deg, #f4f1ff 3.2%, #fff 39.37%)" }}
        >
          <m.div className="absolute inset-0" style={{ originX: PIVOT.x / W, originY: PIVOT.y / H, scale: camScale, y: camY }}>
            {/* The D&O icon: bottom left on the page, handing over to one under the column
                as the camera centres it (it stays through the close-up). */}
            {box && <NetraArcs k={k} swap={swap} />}

            <m.div className="absolute inset-0" initial={false} animate={{ opacity: shot.focus ? 0 : 1 }} transition={fade}>
              <Header />
              <Breadcrumb />
              <Lede />
              <Ticker />
            </m.div>

            <m.div
              className="absolute"
              style={{ left: COL.x, top: COL.y }}
              initial={false}
              animate={{
                x: shot.focus ? FOCUS.x + (shot.zoom ? (COL.w - NARROW) / 2 : 0) : 0,
                y: shot.focus ? FOCUS.y : 0,
                width: shot.zoom ? NARROW : COL.w,
              }}
              transition={shot.zoom ? close : cam}
            >
              {/* In the close-up the gavel card isn't zoomed: it undoes the camera's scale about
                  the same pivot (so the clip and still stay pinned to it, unscaled), keeps its
                  place as the column narrows (same timing), rises with the camera and a little
                  more, and dithers away. */}
              <m.div
                className="absolute left-0 top-0"
                style={{ width: COL.w, height: CARD_H, scale: unzoom, originX: 0.5, originY: CARD_PIVOT_Y }}
                initial={false}
                animate={shot.zoom ? { y: -24, x: -(COL.w - NARROW) / 2 } : { y: 0, x: 0 }}
                transition={close}
              >
                <Dissolve progress={gone} k={k} radius={9.3}>
                  <MediaCard videoRef={video} />
                </Dissolve>
              </m.div>
              <Banner hover={shot.know} bot={seen || still ? <Netra bot={shot.bot} root={root} /> : null} />
              {/* Leaving for Know More: the field, then the CTA, dissolve down. */}
              <m.div initial={false} animate={sink(shot.zoom === 2)} transition={shot.jump ? NOW : { duration: 0.55, ease: "easeIn" }}>
                <Field shot={shot} />
              </m.div>
              <m.div
                initial={false}
                animate={sink(shot.zoom === 2)}
                transition={shot.jump ? NOW : { duration: 0.55, ease: "easeIn", delay: 0.15 }}
              >
                <Cta hover={shot.cta} />
              </m.div>
              <m.div initial={false} animate={{ opacity: shot.focus ? 0 : 1 }} transition={fade}>
                <Providers />
              </m.div>
              <AnimatePresence>{shot.suggest && <Suggestions active={shot.row} typed={shot.typed} />}</AnimatePresence>
            </m.div>

            {!still && <PointerLayer shot={shot} />}
          </m.div>
        </div>

        {/* The curtain. It overhangs the stage by 48px above and below, so its eased
            ends (the slow last pixels of arriving, the slow first ones of leaving) happen
            outside the frame: inside it the edge only ever crosses at speed, never
            lingering as a hairline of page along the top or bottom. Centred content is
            unmoved, as the overhang is even. */}
        <m.div
          className="absolute inset-x-0 z-40 grid place-items-center"
          style={{ top: -CURTAIN_OVERHANG, bottom: -CURTAIN_OVERHANG, background: VIOLET }}
          initial={false}
          animate={{ y: shot.curtain === "up" ? "-100%" : shot.curtain === "return" ? ["100%", "0%"] : "0%" }}
          transition={shot.jump ? NOW : { duration: 1, ease: [0.76, 0, 0.24, 1] }}
        >
          <Logo />
        </m.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ curtain */

/** The combination mark at 642×72; the mark alone is its first 69px. */
const LOGO_W = 642;
const MARK_W = 69;

/**
 * Scrubbed by the frame's growth: the wordmark slides out of the mark while all of it
 * settles smaller, the two together. The logo sits mid-frame, so it only comes on screen
 * once the frame is half in (growth 0.5); both moves happen after that.
 */
function Logo() {
  const g = useGrow();
  const hidden = useTransform(g, [0.58, 0.9], [LOGO_W - MARK_W, 0], { clamp: true });
  const clipPath = useTransform(hidden, (h) => `inset(-2px ${h.toFixed(2)}px -2px -2px)`);
  const x = useTransform(hidden, (h) => h / 2);
  // It settles smaller while the wordmark comes out and re-centres, not after.
  const scale = useTransform(g, [0.58, 0.97], [1, 2 / 3], { clamp: true });
  return (
    <m.div style={{ scale }}>
      <m.div style={{ x, clipPath }}>
        <Image src="/media/netra/bk-combination.svg" alt="" width={LOGO_W} height={72} unoptimized />
      </m.div>
    </m.div>
  );
}

/* ------------------------------------------------------------------ page */

const f = (px: number) => `${(px * 0.7776).toFixed(2)}px`;
const TIGHT = "-0.0117em";

const IKKAT =
  "M334.906 382.075C389.613 382.075 433.962 337.726 433.962 283.019C433.962 228.311 478.311 183.962 533.019 183.962H672.17C722.969 183.962 764.151 142.781 764.151 91.9811C764.151 41.1813 805.332 0 856.132 0L1143.87 0C1194.67 0 1235.85 41.1813 1235.85 91.9811C1235.85 142.781 1277.03 183.962 1327.83 183.962H1504.72C1559.42 183.962 1603.77 228.311 1603.77 283.019C1603.77 337.726 1648.12 382.075 1702.83 382.075L1882.08 382.075C1947.2 382.075 2000 434.872 2000 500C2000 565.128 1947.2 617.924 1882.08 617.924H1702.83C1648.12 617.924 1603.77 662.274 1603.77 716.981C1603.77 771.689 1559.42 816.038 1504.72 816.038H1327.83C1277.03 816.038 1235.85 857.219 1235.85 908.019C1235.85 958.819 1194.67 1000 1143.87 1000L856.132 1000C805.332 1000 764.151 958.819 764.151 908.019C764.151 857.219 722.97 816.038 672.17 816.038H533.019C478.311 816.038 433.962 771.689 433.962 716.981C433.962 662.274 389.613 617.924 334.906 617.924H117.925C52.7967 617.924 0 565.128 0 500C0 434.872 52.7966 382.075 117.925 382.075H334.906ZM811.321 497.678C811.321 553.668 856.709 599.057 912.699 599.057H1096.73C1152.72 599.057 1198.11 553.668 1198.11 497.678C1198.11 441.689 1152.72 396.3 1096.73 396.3L912.699 396.3C856.709 396.3 811.321 441.689 811.321 497.678Z";

/** The ikkat (ikat) bead the D&O page punctuates with, 2:1. */
function Ikkat({ w, fill = VIOLET, className = "", style }: { w: number; fill?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={w} height={w / 2} viewBox="0 0 2000 1000" className={`shrink-0 ${className}`} style={style}>
      <path fillRule="evenodd" d={IKKAT} fill={fill} />
    </svg>
  );
}

function Header() {
  const item = { fontSize: f(14), fontWeight: 500, lineHeight: 1 };
  return (
    <div
      className="absolute inset-x-0 top-0"
      style={{ height: 41.52, background: "rgba(255,255,255,0.5)", borderBottom: "0.5px solid #dfe0e2" }}
    >
      <Image
        src="/media/netra/bimakavach-logotype.svg"
        alt=""
        width={176}
        height={20}
        unoptimized
        className="absolute"
        style={{ left: 24.84, top: 12.8, width: 136, height: "auto" }}
      />
      <div className="absolute flex items-center" style={{ left: 185.7, top: 15.1, ...item }}>
        <span>Policies</span>
        <svg width="6" height="6" viewBox="0 0 10 10" className="ml-[7px]" fill="none">
          <path d="m2 3.5 3 3 3-3" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Ikkat w={6.2} className="ml-[7.6px] mr-[9.3px]" />
        <span>About Us</span>
        <Ikkat w={6.2} className="ml-[9.3px] mr-[9.3px]" />
        <span>Claims</span>
      </div>
      <div
        className="absolute grid place-items-center text-white"
        style={{
          left: 1137.5,
          top: 9.31,
          width: 37.6,
          height: 22.5,
          borderRadius: 7,
          background: VIOLET,
          fontSize: f(12),
          fontWeight: 600,
          letterSpacing: TIGHT,
        }}
      >
        Login
      </div>
    </div>
  );
}

function Breadcrumb() {
  const crumb = { fontSize: f(10), fontWeight: 600, letterSpacing: "-0.0017em", lineHeight: 1 };
  return (
    <>
      <svg className="absolute" style={{ left: 24.84, top: 76.36 }} width={966} height={2}>
        <defs>
          <pattern id="netra-ikkat-line" width="18.5" height="2" patternUnits="userSpaceOnUse">
            <path transform="scale(0.002)" fillRule="evenodd" d={IKKAT} fill={VIOLET} />
          </pattern>
        </defs>
        <rect width="966" height="2" fill="url(#netra-ikkat-line)" />
      </svg>
      <div className="absolute flex items-center uppercase" style={{ left: 1002.8, top: 71.5, ...crumb }}>
        <span style={{ color: "#bec2c6" }}>Home</span>
        <Ikkat w={4} fill="#bec2c6" className="mx-[8px]" />
        <span>Director&rsquo;s &amp; Officer&rsquo;s Insurance</span>
      </div>
    </>
  );
}

const CHECKS = ["Protects directors’ personal assets", "Covers employee lawsuits", "Covers shareholder claims"];
const STATS = [
  { value: "4,500", label: "Companies Covered", x: 0 },
  { value: "80%", label: "Claims Settled in 40 Days", x: 136 },
  { value: "98%", label: "Client Retention", x: 292.8 },
];

/** The left column: eyebrow and pill, the headline, the checklist and the proof row. */
function Lede() {
  const hi = { color: VIOLET };
  return (
    <div className="absolute" style={{ left: 40.36, top: 127.8, width: 600 }}>
      <div className="flex items-center" style={{ height: 19.3, gap: 9.3 }}>
        <span className="uppercase" style={{ fontSize: f(14), fontWeight: 600, letterSpacing: TIGHT, lineHeight: 1 }}>
          Directors &amp; Officers Insurance
        </span>
        <span
          className="flex items-center"
          style={{
            height: 19.3,
            gap: 3.1,
            padding: "0 6.2px",
            borderRadius: 1000,
            border: "0.5px solid #a9eaa2",
            background: "linear-gradient(to bottom, #fff 50%, #ecfbea)",
            color: "#00b200",
            fontSize: f(12),
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          <svg width="9.3" height="9.3" viewBox="0 0 24 24" fill="none" stroke="#00b200" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
          </svg>
          Immediate Purchase
        </span>
      </div>

      <div style={{ ...serif.style, marginTop: 18.6, fontSize: f(48), lineHeight: 1 }}>
        Get <span style={hi}>₹10 Cr</span> Cover at
        <br />
        <span style={hi}>₹10,000/Year</span>.
      </div>
      <p style={{ marginTop: 18.6, fontSize: f(18), fontWeight: 500, lineHeight: 1.5, color: "#9082b3" }}>
        Protects executives when business decisions lead to lawsuits
      </p>

      <ul style={{ marginTop: 18.6 }}>
        {CHECKS.map((c) => (
          <li
            key={c}
            className="flex items-center"
            style={{ height: 24, marginBottom: 6.2, gap: 4.7, fontSize: f(14), fontWeight: 500, lineHeight: 1 }}
          >
            <Image src="/media/netra/coverage-check.svg" alt="" width={10.9} height={10.9} unoptimized />
            {c}
          </li>
        ))}
      </ul>

      <div className="absolute" style={{ top: 289.3, width: 582.5, height: 0.5, background: "#d2d5d8", opacity: 0.5 }} />
      {STATS.map((s, i) => (
        <div key={s.value} className="absolute" style={{ left: s.x, top: 308.3 }}>
          <div style={{ ...serif.style, fontSize: 38, lineHeight: "40px", color: ORANGE }}>{s.value}</div>
          <div style={{ fontSize: f(12), fontWeight: 500, lineHeight: 1.14 }}>{s.label}</div>
          {i < 2 && <Ikkat w={9.3} className="absolute" style={{ left: 101.8, top: 18 }} />}
        </div>
      ))}
    </div>
  );
}

function Ticker() {
  const pair = (
    <>
      <span className="flex items-center" style={{ width: 83.8 }}>
        <Ikkat w={6.2} fill="#fff" className="mx-[4.65px]" />
        quotes in minutes
      </span>
      <span className="flex items-center" style={{ width: 90.8 }}>
        <Ikkat w={6.2} fill="#fff" className="mx-[4.65px]" />
        coverage in minutes
      </span>
    </>
  );
  return (
    <div className="absolute inset-x-0 overflow-hidden" style={{ top: 658, height: 17, background: VIOLET }}>
      <div
        className="absolute flex animate-[netra-ticker_4.4s_linear_infinite] items-center whitespace-nowrap text-white"
        style={{ left: -146.2, top: 0, height: 17, fontSize: f(10), fontWeight: 500 }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="flex">
            {pair}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the quote column */

/**
 * Dithers its content away as `progress` runs 0 to 1, in place of a fade: cells (2 screen
 * px) drop out in Bayer order, and the ones just going light up #ff7700, as the D&O icon's
 * hand-over (NetraArcs) and Netra's DitherWash do. Done with two repeating 16-cell mask
 * tiles (what's left, and its orange front), made at the screen's resolution so the cells
 * stay crisp, one pair per 1/64 of progress.
 */
function Dissolve({
  progress,
  k,
  radius,
  children,
}: {
  progress: MotionValue<number>;
  k: number;
  radius: number;
  children: React.ReactNode;
}) {
  const body = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = body.current;
    const fr = front.current;
    if (!el || !fr) return;
    const px = Math.max(1, Math.round(2 * (window.devicePixelRatio || 1)));
    const tile = `${(32 / k).toFixed(3)}px`;
    const cache = new Map<number, [string, string]>();
    const tiles = (level: number) => {
      const hit = cache.get(level);
      if (hit) return hit;
      const make = (keep: (t: number) => boolean, colour: string) => {
        const c = Object.assign(document.createElement("canvas"), { width: 16 * px, height: 16 * px });
        const g = c.getContext("2d")!;
        g.fillStyle = colour;
        for (let y = 0; y < 16; y++)
          for (let x = 0; x < 16; x++) if (keep(BAYER[y * 16 + x] + 0.5)) g.fillRect(x * px, y * px, px, px);
        return c.toDataURL();
      };
      const a = 1 - level / 64;
      const pair: [string, string] = [make((t) => a > t, "#000"), make((t) => a <= t && a > t - 0.16, "#000")];
      cache.set(level, pair);
      return pair;
    };
    const mask = (node: HTMLElement, url: string | null) => {
      const s = node.style;
      const v = url ? `url(${url})` : "";
      s.maskImage = v;
      s.webkitMaskImage = v;
      s.maskSize = url ? `${tile} ${tile}` : "";
      s.webkitMaskSize = url ? `${tile} ${tile}` : "";
      s.maskRepeat = url ? "repeat" : "";
      s.webkitMaskRepeat = url ? "repeat" : "";
    };
    const set = (p: number) => {
      if (p <= 0) {
        mask(el, null);
        el.style.visibility = "";
        fr.style.visibility = "hidden";
        return;
      }
      if (p >= 1) {
        el.style.visibility = "hidden";
        fr.style.visibility = "hidden";
        return;
      }
      const [keep, edge] = tiles(Math.max(1, Math.min(63, Math.round(p * 64))));
      el.style.visibility = "";
      fr.style.visibility = "";
      mask(el, keep);
      mask(fr, edge);
    };
    set(progress.get());
    return progress.on("change", set);
  }, [progress, k]);
  return (
    <>
      <div ref={body} className="absolute inset-0">
        {children}
      </div>
      <div ref={front} className="absolute inset-0" style={{ background: ORANGE, borderRadius: radius, visibility: "hidden" }} />
    </>
  );
}

/** The gavel on its looping glow: violet, a colour-dodge wash, the clip lightened over it and the still on top. */
function MediaCard({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  return (
    <div
      data-look="media"
      className="absolute left-0 top-0 overflow-hidden"
      style={{ width: 512, height: CARD_H, borderRadius: 9.3, border: "0.5px solid #e6e8ea" }}
    >
      <div className="absolute isolate overflow-hidden" style={{ left: -14, top: -8.3, width: 540, height: 320, background: VIOLET }}>
        <div className="absolute inset-0 mix-blend-color-dodge" style={{ background: VIOLET }} />
        <video
          ref={videoRef}
          src="/media/netra/gavel-glow.mp4"
          poster="/media/netra/gavel-glow.webp"
          muted
          loop
          playsInline
          preload="none"
          className="absolute max-w-none object-cover mix-blend-lighten"
          style={{ left: -74.9, top: -32.9, width: 684.9, height: 385.9 }}
        />
        <Image
          src="/media/netra/gavel.webp"
          alt=""
          width={540}
          height={320}
          unoptimized
          className="absolute inset-0 h-full w-full object-cover object-bottom"
        />
      </div>
    </div>
  );
}

/** "New · Personalise my quote with BimaNetra … [NetraBot] Know More". */
function Banner({ hover, bot }: { hover: boolean; bot: React.ReactNode }) {
  return (
    <div
      className="absolute left-0 flex items-center justify-between"
      style={{
        top: 309.6,
        width: "100%",
        height: 36.5,
        padding: "0 12.4px",
        borderRadius: 9.3,
        background: "linear-gradient(to right, #fff6ed, transparent)",
      }}
    >
      <div className="flex items-center" style={{ gap: 3.1 }}>
        <span
          className="flex items-center"
          style={{
            gap: 3.1,
            padding: "3.1px 4.7px",
            borderRadius: 4.7,
            border: "0.5px solid #ffd2a8",
            background: "#fff6ed",
            color: ORANGE,
            fontSize: f(14),
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          <span className="rounded-full" style={{ width: 3.1, height: 3.1, background: ORANGE }} />
          New
        </span>
        <span style={{ fontSize: f(14), fontWeight: 500, lineHeight: 1 }}>Personalise my quote with BimaNetra</span>
      </div>
      <div className="flex items-center" style={{ gap: 4.7 }}>
        <span className="relative shrink-0" style={{ width: BOT_SIZE, height: BOT_SIZE }}>
          {bot}
        </span>
        <span
          className="underline transition-colors duration-200"
          style={{ fontSize: f(12), fontWeight: 600, letterSpacing: TIGHT, color: hover ? "#a9acb1" : "#1458d2" }}
        >
          Know More
        </span>
      </div>
    </div>
  );
}

const BOT_SIZE = 22;

/**
 * NetraBot (ported from BimaNetra, components/netrabot), driven by the loop: shown or
 * not, a resting state, one-off reactions, and its eyes on whatever `look` names,
 * found by data-look inside the splash and read every frame (so it tracks the moving
 * pointer through the camera's zoom). Normalised to the bot: ±1 at 9 bot-widths away.
 */
function Netra({ bot, root }: { bot: Bot; root: React.RefObject<HTMLDivElement | null> }) {
  const ref = useRef<NetraBotHandle>(null);
  const self = useRef<HTMLSpanElement>(null);
  const look = useRef<Look>(bot.look);
  useEffect(() => {
    look.current = bot.look;
  }, [bot.look]);
  const n = bot.react?.n;
  const key = bot.react?.key;
  useEffect(() => {
    if (key) ref.current?.react(key);
  }, [n, key]);
  const gaze = () => {
    const me = self.current?.getBoundingClientRect();
    const target = look.current === "ahead" ? null : root.current?.querySelector(`[data-look="${look.current}"]`);
    if (!me || !target) return null;
    const t = target.getBoundingClientRect();
    // The pointer is a zero-size box at its hot spot; anything else, its centre (the icon: its upper part).
    const tx = t.left + t.width / 2;
    const ty = look.current === "icon" ? t.top + t.height * 0.55 : t.top + t.height / 2;
    const reach = me.width * 9;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    return { x: clamp((tx - (me.left + me.width / 2)) / reach), y: clamp((ty - (me.top + me.height / 2)) / reach) };
  };
  return (
    <span ref={self} className="absolute inset-0">
      <NetraBot ref={ref} size={BOT_SIZE} state={bot.state} visible={bot.on} enter="peekUp" exit="blurAway" effects getGaze={gaze} />
    </span>
  );
}

const STROKE = "rgba(169,172,177,0.56)";

function Roundel({ fill, children }: { fill: string; children: React.ReactNode }) {
  return (
    <svg width="10.9" height="10.9" viewBox="0 0 16 16" className="shrink-0">
      <circle cx="8" cy="8" r="8" fill={fill} className="transition-[fill] duration-200" />
      {children}
    </svg>
  );
}

/** The company field: idle, focused and typing, then filled from the record with its green check. */
function Field({ shot }: { shot: Shot }) {
  const on = shot.field;
  const value = shot.picked ? NAME : QUERY.slice(0, shot.typed);
  return (
    <div
      data-look="field"
      className="absolute left-0 flex items-center transition-[border-color,background-color] duration-150"
      style={{
        top: 362.2,
        width: "100%",
        height: 34.9,
        gap: 6.2,
        padding: "0 9.3px",
        borderRadius: "4.7px 4.7px 0 0",
        background: on ? "rgba(65,0,207,0.02)" : "#fff",
        borderBottom: `${on ? 0.8 : 0.5}px solid ${on ? VIOLET : STROKE}`,
      }}
    >
      <div className="flex min-w-0 flex-1 items-center whitespace-nowrap" style={{ fontSize: f(18), fontWeight: 500, lineHeight: 1 }}>
        <span style={{ color: VIOLET }}>{value}</span>
        {on && !shot.picked && (
          <span className="animate-pulse" style={{ width: 0.8, height: 14, marginLeft: 0.8, background: VIOLET }} />
        )}
        {!value && <span style={{ color: "rgba(169,172,177,0.48)" }}>Start with your company&rsquo;s legal name</span>}
      </div>
      <div className="flex items-center" style={{ gap: 6.2 }}>
        {value && (
          <svg width="10.9" height="10.9" viewBox="0 0 16 16">
            <path d="m4.5 4.5 7 7m0-7-7 7" stroke="#1c1c1c" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
        <svg width="10.9" height="10.9" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#1458d2" strokeWidth="1.3" />
          <circle cx="8" cy="5" r="0.9" fill="#1458d2" />
          <path d="M8 7.5v4" stroke="#1458d2" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span style={{ width: 0.8, height: 10.9, background: STROKE }} />
        <Roundel fill={shot.picked ? "#00b200" : STROKE}>
          <path d="m4.8 8.2 2 2 4-4.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Roundel>
      </div>
    </div>
  );
}

function Cta({ hover }: { hover: boolean }) {
  return (
    <div
      data-look="cta"
      className="absolute left-0 flex items-center overflow-hidden text-white transition-[box-shadow,filter] duration-300"
      style={{
        top: 409.5,
        width: "100%",
        height: 46,
        gap: 6.2,
        padding: "0 12.4px",
        // Netra's radius-20 (a stop under the live CTA's 24), at the stage's ×0.7776.
        borderRadius: 15.55,
        background: ORANGE,
        border: `1px solid ${ORANGE}`,
        boxShadow: hover ? "0 0 12.4px rgba(255,119,0,0.48)" : "0 0 0 rgba(255,119,0,0)",
        filter: hover ? "brightness(0.96)" : "none",
      }}
    >
      <span className="flex-1" style={{ fontSize: f(16), fontWeight: 600, letterSpacing: TIGHT, lineHeight: 1.5 }}>
        Get My Quote in 2 Minutes
      </span>
      <svg width="12.4" height="12.4" viewBox="0 0 24 24" fill="none" className="animate-[netra-nudge_2s_ease-in-out_infinite]">
        <path d="m9 18 6-6-6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span
        className="pointer-events-none absolute inset-y-0 left-0 animate-[netra-sheen_4s_cubic-bezier(1,0,0,1)_infinite]"
        style={{
          width: "35%",
          transform: "translateX(-100%) skewX(-18deg)",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)",
        }}
      />
    </div>
  );
}

const INSURERS = [
  { src: "Chola", x: 1.8, w: 52.4 },
  { src: "Digit", x: 76.4, w: 24.5 },
  { src: "Oriental", x: 121.3, w: 49.6 },
  { src: "Reliance", x: 192.8, w: 51.4 },
  { src: "SBI", x: 266, w: 56.5 },
  { src: "United", x: 343.7, w: 70.6 },
];

function Providers() {
  return (
    <div className="absolute left-0" style={{ top: 479.7, width: 512 }}>
      <p style={{ fontSize: f(14), fontWeight: 500, lineHeight: 1.5, color: "#1c1c1c" }}>Policy Provided by</p>
      {INSURERS.map((i) => (
        <Image
          key={i.src}
          src={`/media/netra/insurers/${i.src}.webp`}
          alt=""
          width={i.w}
          height={18.6}
          unoptimized
          className="absolute"
          style={{ left: i.x, top: 25.7 }}
        />
      ))}
    </div>
  );
}

/** The type-ahead under the field: the "no result" row, then the MCA record it matched. */
function Suggestions({ active, typed }: { active: boolean; typed: number }) {
  const small = { fontSize: f(14), fontWeight: 500, lineHeight: 1.3 };
  return (
    <m.div
      className="absolute left-0 z-10 bg-white"
      style={{
        top: 400.2,
        width: "100%",
        padding: 6.2,
        borderRadius: 12.4,
        border: "0.5px solid #e6e8ea",
        boxShadow: "0 0 9.3px rgba(169,172,177,0.24)",
      }}
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between" style={{ height: 34, padding: "0 12.4px", borderRadius: 6.2, background: "#f4f5f6" }}>
        <span style={{ ...small, color: "#6f7378" }}>
          No result for &ldquo;{QUERY.slice(0, typed)}&rdquo;.{" "}
          <span className="underline" style={{ color: "#1458d2" }}>
            Enter a new company?
          </span>
        </span>
        <Roundel fill={STROKE}>
          <path d="m5.5 5.5 5 5m0-5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </Roundel>
      </div>
      <div className="flex items-center" style={{ height: 22, gap: 6.2, padding: "0 12.4px", fontSize: f(12), color: "#a9acb1" }}>
        MCA Records
        <span className="flex-1" style={{ height: 0.5, background: "#e6e8ea" }} />
      </div>
      <div
        className="flex items-center justify-between transition-colors duration-150"
        style={{ height: 48, padding: "0 12.4px", borderRadius: 6.2, background: active ? "#f4f5f6" : "transparent" }}
      >
        <span className="flex flex-col" style={{ gap: 2 }}>
          <span style={{ fontSize: f(16), fontWeight: 500, lineHeight: 1.3, color: "#6f7378" }}>Pepe Jeans Innerwear</span>
          <span style={{ fontSize: f(12), fontWeight: 500, lineHeight: 1.3, color: "#a9acb1" }}>
            Registered as: PEPE JEANS INNERFASHION PRIVATE LIMITED
          </span>
        </span>
        <Roundel fill={active ? "#00b200" : STROKE}>
          <path d="m4.8 8.2 2 2 4-4.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Roundel>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------------ the pointer */

const EASE_MOVE = [0.45, 0, 0.2, 1] as const;

function PointerLayer({ shot }: { shot: Shot }) {
  const p = shot.pointer;
  const move: Transition = shot.jump ? NOW : { duration: p.dur, ease: EASE_MOVE };
  return (
    <>
      <AnimatePresence>
        {shot.tap && !shot.jump && (
          <m.span
            key={shot.tap.n}
            className="pointer-events-none absolute z-20 rounded-full"
            style={{ left: shot.tap.x - 9, top: shot.tap.y - 9, width: 18, height: 18, border: `1.2px solid ${VIOLET}` }}
            initial={{ scale: 0.4, opacity: 0.55 }}
            animate={{ scale: 1.7, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <m.div
        data-look="pointer"
        className="pointer-events-none absolute left-0 top-0 z-30"
        initial={false}
        animate={{ x: p.x, y: p.y, opacity: p.on ? 1 : 0 }}
        transition={{ x: move, y: move, opacity: shot.jump ? NOW : { duration: 0.3 } }}
      >
        <m.div
          initial={false}
          animate={{ scale: p.down ? 0.86 : 1 }}
          transition={{ duration: p.down ? 0.08 : 0.16 }}
          style={{ originX: 0, originY: 0 }}
        >
          <Glyph kind={p.kind} />
        </m.div>
      </m.div>
    </>
  );
}

/** A plain arrow, an I-beam over the field and a pointing hand over things to click; each drawn so its hot spot sits at 0,0. */
function Glyph({ kind }: { kind: Kind }) {
  const shadow = { filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.25))" };
  if (kind === "text")
    return (
      <svg width="9" height="20" viewBox="0 0 9 20" className="absolute" style={{ left: -4.5, top: -10, ...shadow }}>
        <path d="M1.5 1.5h2.2c.5 0 .8.4.8.8m3-.8H5.3c-.5 0-.8.4-.8.8v15.4c0 .4-.3.8-.8.8H1.5m6 0H5.3c-.5 0-.8-.4-.8-.8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M1.5 1.5h2.2c.5 0 .8.4.8.8m3-.8H5.3c-.5 0-.8.4-.8.8v15.4c0 .4-.3.8-.8.8H1.5m6 0H5.3c-.5 0-.8-.4-.8-.8" stroke="#111" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    );
  if (kind === "hand")
    return (
      <svg width="17" height="21" viewBox="0 0 17 21" className="absolute" style={{ left: -5.6, top: -0.8, ...shadow }}>
        <path
          d="M5.6 1.9c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v6.2l.1-.6c.1-.7.7-1.2 1.4-1.1.7.1 1.2.7 1.1 1.4l-.1 1.2.2-.6c.2-.7.9-1 1.6-.8.6.2 1 .9.8 1.5l-.2.9.3-.3c.5-.5 1.3-.4 1.7.1.4.5.4 1.1 0 1.6l-1.6 2.9c-.3 2.4-1.4 4.6-3.6 5.3l-.1 1.6H5.8v-1.9c-.9-.6-1.6-1.4-2.2-2.4L1 11.7c-.4-.7-.2-1.5.4-1.9.6-.4 1.4-.2 1.8.3l2.4 2.9V1.9Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path d="M8.4 12.3v3.2m2.3-3.4v3.4m2.2-3.1v3" stroke="#111" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="15" height="22" viewBox="0 0 15 22" className="absolute" style={{ left: -1, top: -1, ...shadow }}>
      <path d="M1 1v17.2l4.3-4.1 2.9 6.6 2.8-1.2-2.9-6.5h6L1 1Z" fill="#111" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
