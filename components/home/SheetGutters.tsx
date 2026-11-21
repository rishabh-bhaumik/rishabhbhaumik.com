"use client";

import { useEffect, useRef } from "react";

/*
 * Every number here is measured from the home orbit clip (orbit-dark.mp4, 144 frames
 * at 12fps), so the gutters move like its starfield:
 * - The field expands about the big orb's centre by 0.7% a frame: each star moves
 *   outward at 8.4% of its distance from the centre per second (a slow warp).
 * - ~160 stars on screen at once, about four times as dense near the orb as at the
 *   frame's edge; in the gutters' range that comes to about one per 10,000 CSS px².
 * - A star lives ~1.75s (most 1-3.6s, a few to 5s), born anywhere in the field.
 * - It pops in at about half its peak, brightens as it drifts out, flickers ~33%
 *   frame to frame, and blinks out at about three quarters of its peak.
 * - 1-4px points in a 1920 frame (the hero shows it ~1200 wide): 1-2 CSS px here.
 * - Peaks of 55-95% white on near-black.
 */
const FPS = 12;
const EXPAND = 0.084; // per second, of a star's distance from the centre
const AREA_PER_STAR = 10_000; // CSS px²
const LIFE_MEDIAN = 1.75; // s
const BIRTH = 0.56; // of peak, on its first frame
const DEATH = 0.76; // of peak, on its last
const TWINKLE = 0.33;
const PEAK: [number, number] = [0.55, 0.95];
/**
 * Around the page curtain (components/PageCurtain), a loop: as it starts, stars burst
 * out of the sheet's edges and rush outward across the gutters while the curtain comes
 * up; as it leaves, the gutters are revealed full of stars, which rush back in toward
 * the sheet and vanish at its rules, drawing the eye to the column, before the field
 * thins back and resumes its drift.
 */
export const CURTAIN_START_EVENT = "page-curtain:start";
export const CURTAIN_RISE_EVENT = "page-curtain:rise";
/** The outward burst: peak speed (per second of distance from the centre), as a sine bump over the curtain's way in. */
const BURST_RATE = 0.55;
const RUSH_FILL = 4; // extra stars, as a multiple of the usual count
const RUSH_AFTER = 0.6; // the rush starts this far into the curtain's rise
const RUSH_MS = 1200;
/** Peak inward speed, per second of distance from the centre; it eases up from 0 and back (a sine bump). */
const RUSH_RATE = 0.42;
/** The sheet's width (--shell-max); the gutters are what's left either side. */
const SHEET = 1200;

type Star = { x: number; y: number; born: number; life: number; peak: number; size: number; spark: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** Lifetimes skew long (lognormal): median 1.75s, the middle half 1.1-3.6s. */
const lifetime = () => {
  const n = Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  return Math.min(5.5, Math.max(0.6, LIFE_MEDIAN * Math.exp(0.6 * n)));
};

/**
 * The gutters either side of the ruled sheet: the home orbit clip's starfield, carried
 * out past the sheet. Stars stream away from the middle of the screen (where the orb
 * would be) at the clip's rate, faster the further out they are, popping in, brightening
 * and flickering as they go, then blinking out. Steps at 12fps, the clip's own rate.
 * - Ink-coloured, so in light mode they're dark points, like the clip's negative.
 * - Drawn only where there's a gutter; paused while the tab is hidden.
 * - Under reduced motion it draws one still field.
 */
export default function SheetGutters() {
  const left = useRef<HTMLCanvasElement>(null);
  const right = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvases = [left.current!, right.current!];
    const ctxs = canvases.map((c) => c?.getContext("2d"));
    if (!ctxs[0] || !ctxs[1]) return;

    let vw = 0;
    let vh = 0;
    let gutter = 0;
    let ink = "#fff";
    let frame = 0;
    let last = 0;
    let lastPaint = 0;
    /** When the inward rush starts (0: none pending). Until then a fresh fill holds still. */
    let rushAt = 0;
    /** The rush's direction (-1 in toward the sheet, +1 out) and length (ms). */
    let rushDir = -1;
    let rushMs = RUSH_MS;
    // Stars live in viewport coordinates, centred on the screen's middle.
    let stars: Star[] = [];
    let target = 0;

    const readInk = () => {
      ink = getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim() || "#fff";
    };

    /** A new star somewhere in a gutter: denser toward the sheet, as the clip is toward the orb. */
    const spawn = (now: number, anyAge: boolean): Star => {
      const side = Math.random() < 0.5 ? -1 : 1;
      const inset = gutter * Math.random() ** 1.5; // from the sheet's edge outward
      const life = lifetime();
      return {
        x: vw / 2 + side * (SHEET / 2 + inset),
        y: rand(0, vh),
        // On first fill, start stars part-way through their lives so they don't all pop together.
        born: anyAge ? now - Math.random() * life * 1000 : now,
        life,
        peak: rand(...PEAK),
        size: Math.random() < 0.7 ? 1 : Math.random() < 0.7 ? 1.5 : 2,
        spark: 1,
      };
    };

    const size = () => {
      vw = document.documentElement.clientWidth;
      vh = window.innerHeight;
      gutter = Math.max(0, Math.floor((vw - SHEET) / 2));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvases.forEach((c) => {
        c.style.width = `${gutter}px`;
        c.style.height = `${vh}px`;
        c.width = Math.round(gutter * dpr);
        c.height = Math.round(vh * dpr);
      });
      ctxs.forEach((x) => x!.setTransform(dpr, 0, 0, dpr, 0, 0));
      target = Math.round((2 * gutter * vh) / AREA_PER_STAR);
      const now = performance.now();
      stars = Array.from({ length: target }, () => spawn(now, true));
    };

    /** How fast the field grows (per second): the drift outward, or the rush inward after the curtain. */
    const rate = (now: number) => {
      if (!rushAt) return EXPAND;
      if (now < rushAt) return 0;
      const p = (now - rushAt) / rushMs;
      if (p >= 1) {
        rushAt = 0;
        return EXPAND;
      }
      return rushDir * (rushDir < 0 ? RUSH_RATE : BURST_RATE) * Math.sin(Math.PI * p);
    };

    /** `dt`: seconds since the last paint (0 for a still frame); `step`: a 12fps beat, when stars twinkle. */
    const paint = (now: number, dt: number, step: boolean) => {
      const [l, r] = ctxs as CanvasRenderingContext2D[];
      l.clearRect(0, 0, gutter, vh);
      r.clearRect(0, 0, gutter, vh);
      l.fillStyle = r.fillStyle = ink;
      const cx = vw / 2;
      const cy = vh / 2;
      const grow = Math.exp(rate(now) * dt);
      const rightEdge = vw - gutter;
      stars = stars.filter((s) => {
        s.x = cx + (s.x - cx) * grow;
        s.y = cy + (s.y - cy) * grow;
        if (step) s.spark = 1 + (Math.random() * 2 - 1) * TWINKLE;
        const age = (now - s.born) / 1000 / s.life;
        if (age >= 1 || s.y < -2 || s.y > vh + 2) return false;
        // Pops in at about half its peak, brightens as it goes, gone at about three quarters.
        const level = BIRTH + (1 - BIRTH) * Math.min(1, age / 0.8) - (age > 0.8 ? (1 - DEATH) * ((age - 0.8) / 0.2) : 0);
        const alpha = Math.max(0, Math.min(1, s.peak * level * s.spark));
        if (s.x < gutter) {
          l.globalAlpha = alpha;
          l.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
          return s.x > -2;
        }
        if (s.x >= rightEdge) {
          r.globalAlpha = alpha;
          r.fillRect(Math.round(s.x - rightEdge), Math.round(s.y), s.size, s.size);
          return s.x < vw + 2;
        }
        return false; // a resize left it over the sheet
      });
      while (stars.length < target) stars.push(spawn(now, false));
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      // The rush runs at the full frame rate (big moves would jump at 12fps); the drift steps at the clip's 12.
      const rushing = rushAt && now >= rushAt;
      const step = now - last >= 1000 / FPS;
      if (!rushing && !step) return;
      if (step) last = now;
      const dt = lastPaint ? Math.min(0.1, (now - lastPaint) / 1000) : 1 / FPS;
      lastPaint = now;
      paint(now, dt, step);
    };

    /** The curtain is rising: fill the gutters, hold, then rush in as it clears. */
    const onRise = (e: Event) => {
      if (motion.matches || gutter < 1) return;
      const rise = (e as CustomEvent<{ duration: number }>).detail?.duration ?? 700;
      const now = performance.now();
      rushAt = now + rise * RUSH_AFTER;
      rushDir = -1;
      rushMs = RUSH_MS;
      const extra = Math.round(target * RUSH_FILL);
      for (let i = 0; i < extra; i++) {
        const s = spawn(now, false);
        // Spread evenly across the gutter (not bunched at the sheet) and lit from the start.
        const side = s.x < vw / 2 ? -1 : 1;
        s.x = vw / 2 + side * (SHEET / 2 + gutter * Math.random());
        s.born = now - rand(0.05, 0.25) * 1000;
        s.life = rand(1.3, 2.2);
        stars.push(s);
      }
    };
    window.addEventListener(CURTAIN_RISE_EVENT, onRise);

    /** The curtain is starting: stars burst out of the sheet's edges and rush outward as it comes up. */
    const onStart = (e: Event) => {
      if (motion.matches || gutter < 1) return;
      const rise = (e as CustomEvent<{ duration: number }>).detail?.duration ?? 900;
      const now = performance.now();
      rushAt = now;
      rushDir = 1;
      rushMs = rise;
      const extra = Math.round(target * RUSH_FILL);
      for (let i = 0; i < extra; i++) {
        const s = spawn(now, false);
        // Packed against the sheet's rules, so they pour out of it.
        const side = s.x < vw / 2 ? -1 : 1;
        s.x = vw / 2 + side * (SHEET / 2 + gutter * 0.35 * Math.random() ** 2);
        s.born = now - rand(0, 0.1) * 1000;
        s.life = rand(1.2, 2);
        stars.push(s);
      }
    };
    window.addEventListener(CURTAIN_START_EVENT, onStart);

    const start = () => {
      cancelAnimationFrame(frame);
      if (gutter < 1) return;
      if (motion.matches) {
        paint(performance.now(), 0, false); // one still field
        return;
      }
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };

    readInk();
    size();
    start();

    // The theme flips data-theme on <html>: repaint with the new ink.
    const themeWatch = new MutationObserver(() => {
      readInk();
      if (motion.matches) start();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    const onResize = () => {
      size();
      start();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", start);
    motion.addEventListener("change", start);
    return () => {
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener(CURTAIN_RISE_EVENT, onRise);
      window.removeEventListener(CURTAIN_START_EVENT, onStart);
      document.removeEventListener("visibilitychange", start);
      motion.removeEventListener("change", start);
    };
  }, []);

  return (
    <>
      <canvas ref={left} aria-hidden className="pointer-events-none fixed left-0 top-0 hidden min-[1202px]:block" />
      <canvas ref={right} aria-hidden className="pointer-events-none fixed right-0 top-0 hidden min-[1202px]:block" />
    </>
  );
}
