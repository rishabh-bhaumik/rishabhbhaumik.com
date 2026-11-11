"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { EASE } from "@/lib/motion";
import { LoopBar } from "./ui";

/**
 * 005.1's form, played through (Figma 8701:48309 → 51501 → 51835 → 52095): a cursor
 * picks Others, which opens a searchable dropdown. It scrolls the list, doesn't find
 * its business, so it clicks Search by Keyword and types "Foundry"; the list narrows to
 * the one match (scrolled out of view a moment ago), which it picks. Then it taps
 * Tenant, and the loop starts over.
 *
 * The four states are 442px-wide exports (596 tall at rest, 712 once Others opens its
 * field), shown at one width and top-aligned, so the form grows downwards as it would.
 * While the dropdown is open, its list and the search field are live HTML laid over the
 * export at Figma's positions (8701:51750, 8701:51663), so they can scroll and type.
 * Reduced motion: the last state, still, with no cursor.
 */
const STATES = [
  {
    src: "/media/draft/forms-anim/state-1.png",
    h: 596,
    alt: "Share Your Business Details form at rest: property types as suggestion chips",
  },
  {
    src: "/media/draft/forms-anim/state-2.png",
    h: 712,
    alt: "Others picked: a searchable dropdown of business types opens",
  },
  {
    src: "/media/draft/forms-anim/state-3.png",
    h: 712,
    alt: "A business type chosen from the dropdown; Owner or Tenant as picture cards",
  },
  { src: "/media/draft/forms-anim/state-4.png", h: 712, alt: "Tenant picked and Continue lit" },
];
const W = 442;
const cq = (px: number) => `${((px / W) * 100).toFixed(4)}cqw`;

/** The pick: the second option in the list, scrolled away before it's searched for. */
const PICK = "Aluminum Goods Manufacture- Foundry Hands Including Stampers";
const QUERY = "Foundry";
/** The list as the dropdown opens (the first six as in Figma), then more to scroll through. */
const OPTIONS = [
  "Agricultural Farms",
  PICK,
  "Aluminum Goods Manufacture- All other Employees",
  "Aluminum Powder and Paste Manufacturers",
  "Analytical Chemists",
  "Asbestos Cement Manufacturers - If Application work is done",
  "Automobile Service Stations",
  "Bakeries and Confectioneries",
  "Banks and Financial Institutions",
  "Beauty Parlours and Salons",
  "Book Binders and Printers",
  "Brick Kilns",
  "Cable and Wire Manufacturers",
  "Call Centres",
  // Further down: the near matches the search thins out letter by letter
  "Food Processing Units",
  "Footwear Manufacturers",
  "Foundation Contractors",
  "Fountain Pen Makers",
];

/** The list's viewport and the search text, in the 442px frame. */
const LIST = { x: 28.5, y: 359.5, w: 374, h: 315 };
const FIELD = { x: 31, y: 303.5, w: 313, h: 22 };
/** How far the list scrolls before the cursor gives up on it. */
const SCROLL = 330;

/** Cursor stops, in the 442px frame. */
const REST: [number, number] = [430, 640];
const OTHERS: [number, number] = [287, 206];
/** The swipe up the list: pressed low, dragged up, let go. */
const SWIPE_FROM: [number, number] = [230, 630];
const SWIPE_TO: [number, number] = [230, 430];
const SEARCH: [number, number] = [120, 316];
const RESULT: [number, number] = [160, 392];
const TENANT: [number, number] = [320, 478];

type Cam = { x: number; y: number; z: number };
/** The whole form, framed. */
const WIDE: Cam = { x: 221, y: 356, z: 1 };

type Beat = {
  at: number;
  state?: number;
  cursor?: [number, number];
  /** The touch dot: `lift` swells it just before a tap, `down` presses it in. */
  tap?: "idle" | "lift" | "down";
  /** False for a press that drags (the swipe) rather than taps: no ring. */
  ripple?: boolean;
  /** The camera: the point to centre (442px frame) and the zoom. */
  cam?: Cam;
  /** The scrollbar thumb lit (#4100CF) while the list moves. */
  active?: boolean;
  hide?: boolean;
  scroll?: number;
  typed?: number;
};
/** One loop, in ms. */
const LOOP = 14600;
const TYPE_AT = 6500;
const TYPE_STEP = 220;
const BEATS: Beat[] = [
  { at: 0, state: 0, cursor: REST, scroll: 0, typed: 0, cam: WIDE },
  { at: 900, cursor: OTHERS, cam: { x: 250, y: 220, z: 1.55 } },
  { at: 1700, tap: "lift" },
  { at: 2000, tap: "down" },
  { at: 2200, tap: "idle", state: 1, cam: { x: 221, y: 470, z: 1.3 } },
  // Into the list and down it, past the pick
  { at: 3000, cursor: SWIPE_FROM },
  { at: 3600, tap: "lift" },
  { at: 3850, tap: "down", ripple: false },
  { at: 3950, cursor: SWIPE_TO, scroll: SCROLL, active: true },
  { at: 4900, tap: "idle" },
  { at: 5350, active: false },
  // Up to the search field, click, type
  { at: 5400, cursor: SEARCH, cam: { x: 200, y: 360, z: 1.75 } },
  { at: 5900, tap: "lift" },
  { at: 6200, tap: "down" },
  { at: 6350, tap: "idle", typed: 0, scroll: 0 },
  // Off the field, so the typing shows
  { at: 6450, cursor: [270, 352] },
  ...Array.from(QUERY, (_, i) => ({ at: TYPE_AT + i * TYPE_STEP, typed: i + 1 })),
  // The match, picked
  { at: 8400, cursor: RESULT, cam: { x: 210, y: 380, z: 1.75 } },
  { at: 9000, tap: "lift" },
  { at: 9300, tap: "down" },
  { at: 9500, tap: "idle", state: 2, cam: { x: 250, y: 440, z: 1.45 } },
  // Tenant
  { at: 10500, cursor: TENANT, cam: { x: 290, y: 470, z: 1.65 } },
  { at: 11300, tap: "lift" },
  { at: 11600, tap: "down" },
  { at: 11800, tap: "idle", state: 3 },
  // Pull back down to the lit Continue, then out to the whole form
  { at: 12200, cam: { x: 221, y: 560, z: 1.25 } },
  { at: 13100, cam: WIDE },
  { at: 13600, hide: true },
  { at: 14100, hide: true, cursor: REST },
];

/** Figma's interface-icon/ticker (grey at 48%), as exported. */
function Tick() {
  return (
    <Image
      src="/media/draft/forms-anim/ticker.svg"
      alt=""
      width={17}
      height={17}
      unoptimized
      style={{ width: cq(17), height: cq(17) }}
    />
  );
}

/**
 * One option, as Figma's _ActionListItem (8701:51768): 8px padding, a 4px gap, body/200
 * (Anek Latin Medium 16/1.5, #6F7378) and the ticker in a 17px column, 4px from the top.
 */
function Option({ label }: { label: string }) {
  return (
    <div
      className="flex items-start bg-white"
      style={{ padding: cq(8), gap: cq(4), borderRadius: cq(8) }}
    >
      <span className="min-w-0 flex-1">{label}</span>
      <span className="flex shrink-0 items-center" style={{ width: cq(17), paddingBlock: cq(4) }}>
        <Tick />
      </span>
    </div>
  );
}

export default function FormDemo() {
  const [state, setState] = useState(0);
  const [cursor, setCursor] = useState<[number, number]>(REST);
  const [tap, setTap] = useState<"idle" | "lift" | "down">("idle");
  const [active, setActive] = useState(false);
  /** Counts taps, so each one leaves its own ring. */
  const [rings, setRings] = useState(0);
  const [cam, setCam] = useState<Cam>(WIDE);
  /** Counts loops, so the bar restarts with each one. */
  const [loops, setLoops] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [scroll, setScroll] = useState(0);
  const [typed, setTyped] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    let timers: number[] = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = window.setTimeout(() => {
        setStill(true);
        setState(STATES.length - 1);
      });
      return () => window.clearTimeout(t);
    }
    const run = () => {
      setLoops((n) => n + 1);
      timers = BEATS.map((b) =>
        window.setTimeout(() => {
          if (b.state !== undefined) setState(b.state);
          if (b.cursor) setCursor(b.cursor);
          if (b.tap) setTap(b.tap);
          if (b.tap === "down" && b.ripple !== false) setRings((n) => n + 1);
          if (b.active !== undefined) setActive(b.active);
          if (b.cam) setCam(b.cam);
          if (b.scroll !== undefined) setScroll(b.scroll);
          if (b.typed !== undefined) setTyped(b.typed);
          setHidden(!!b.hide);
        }, b.at),
      );
      timers.push(window.setTimeout(run, LOOP));
    };
    run();
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const open = state === 1;
  // Filtered as you type, a letter at a time: F, Fo, Fou… down to the one match.
  const query = QUERY.slice(0, typed).toLowerCase();
  const filtered = typed > 0;
  const options = filtered ? OPTIONS.filter((o) => o.toLowerCase().includes(query)) : OPTIONS;
  // Figma's Scrollbar (8701:51803): a 12px thumb on a full-height track, run down the
  // track as the list scrolls (SCROLL is about the list's full travel).
  const THUMB = 12;
  const thumbTop = (scroll / SCROLL) * (LIST.h - THUMB) * 0.85;

  return (
    <>
      <div className="@container absolute left-[33.93%] top-[3.98%] aspect-[442/712] w-[32.14%]">
        {/* The camera: zooms in on where the interaction is, the chosen point slid to the
          frame's centre (WIDE is the frame's centre in the form's units), with a slight
          tilt while it's in close. The frame clips what falls outside. */}
        <m.div
          className="absolute inset-0"
          initial={false}
          style={{ transformPerspective: 1400 }}
          animate={{
            originX: cam.x / W,
            originY: cam.y / 712,
            x: `${((WIDE.x - cam.x) / W) * 100}%`,
            y: `${((WIDE.y - cam.y) / 712) * 100}%`,
            scale: cam.z,
            rotateX: cam.z > 1 ? 4 : 0,
          }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.25, 1] }}
        >
          {STATES.map((s, i) => (
            <Image
              key={s.src}
              src={s.src}
              alt={i === state ? s.alt : ""}
              aria-hidden={i !== state}
              width={W * 3}
              height={s.h * 3}
              sizes="(min-width: 1512px) 310px, 21vw"
              priority={i === 0}
              className={`absolute left-0 top-0 h-auto w-full transition-opacity duration-500 ease-out ${
                i === state ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}

          {/* The open dropdown, live: its list (scrolls, then narrows) and the search text. */}
          {!still && (
            <div
              aria-hidden
              // In only once the dropdown's export has faded up (no ghost over the resting form).
              className={`transition-opacity ease-out ${open ? "opacity-100 delay-500 duration-200" : "opacity-0 duration-300"}`}
              style={{ fontFamily: '"Anek Latin"', fontVariationSettings: '"wdth" 100' }}
            >
              <div
                className="absolute overflow-hidden bg-white text-[#6F7378]"
                style={{
                  left: cq(LIST.x),
                  top: cq(LIST.y),
                  width: cq(LIST.w + 10),
                  height: cq(LIST.h),
                  fontSize: cq(16),
                  lineHeight: 1.5,
                  fontWeight: 500,
                  fontFeatureSettings: '"dlig" 1',
                }}
              >
                <div
                  className={`transition-[transform,opacity] ease-[cubic-bezier(0.45,0,0.2,1)] ${
                    scroll > 0 ? "duration-[1400ms]" : "duration-150"
                  }`}
                  style={{ width: cq(LIST.w), transform: `translateY(-${cq(scroll)})` }}
                >
                  {/* Narrowed in place as each letter lands. (No layout animation here: under the
                  zooming camera it re-measures every frame and the rows bounce.) */}
              {options.map((o) => (
                <Option key={o} label={o} />
              ))}
                </div>
                <span
                  className={`absolute rounded-full bg-[#F4F1FF] transition-opacity duration-300 ${filtered ? "opacity-0" : ""}`}
                  style={{ left: cq(382), top: 0, width: cq(2), height: cq(LIST.h) }}
                >
                  <span
                    className={`absolute left-0 w-full rounded-full transition-[top,background-color] duration-[1400ms] ease-[cubic-bezier(0.45,0,0.2,1)] ${
                      active ? "bg-[#4100CF]" : "bg-[#E8E2FF]"
                    }`}
                    style={{ top: cq(thumbTop), height: cq(THUMB) }}
                  />
                </span>
              </div>
              {/* Covers the placeholder once the field is clicked; typed text and a caret. */}
              {typed > 0 && (
                <div
                  className="absolute flex items-center bg-[#FAF9FD] text-[#1C1D1F]"
                  style={{
                    left: cq(FIELD.x),
                    top: cq(FIELD.y),
                    width: cq(FIELD.w),
                    height: cq(FIELD.h),
                    fontSize: cq(16),
                    paddingLeft: cq(1.5),
                  }}
                >
                  {QUERY.slice(0, typed)}
                  <span
                    className="animate-pulse bg-[#4100CF]"
                    style={{ width: cq(1), height: cq(18), marginLeft: cq(1) }}
                  />
                </div>
              )}
            </div>
          )}

          {/* The touch dot: drifts between targets, swells just before a tap, presses in on it,
          and leaves a ring behind. Centred on its point. */}
          {!still && (
            <m.div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0"
              initial={false}
              animate={{ x: cq(cursor[0]), y: cq(cursor[1]), opacity: hidden ? 0 : 1 }}
              transition={{
                x: { duration: 0.9, ease: EASE },
                y: { duration: 0.9, ease: EASE },
                opacity: { duration: 0.4 },
              }}
            >
              <m.span
                className="absolute rounded-full border border-white/80 bg-[#1C1D1F]/35 shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                style={{ width: cq(22), height: cq(22), left: cq(-11), top: cq(-11) }}
                animate={{ scale: tap === "lift" ? 1.45 : tap === "down" ? 0.7 : 1 }}
                transition={{ duration: tap === "down" ? 0.12 : 0.28, ease: EASE }}
              />
              {rings > 0 && (
                <m.span
                  key={rings}
                  className="absolute rounded-full border border-[#1C1D1F]/40"
                  style={{ width: cq(22), height: cq(22), left: cq(-11), top: cq(-11) }}
                  initial={{ scale: 0.7, opacity: 0.9 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              )}
            </m.div>
          )}
        </m.div>
      </div>
      {/* The frame's loop bar, in step with the loop (the frame is the positioned parent). */}
      {!still && loops > 0 && <LoopBar key={loops} seconds={LOOP / 1000} once />}
    </>
  );
}
