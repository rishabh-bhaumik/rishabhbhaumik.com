"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { MotionValue } from "framer-motion";

/**
 * The D&O product icon behind the quote column (Figma 2EDDHIZGAlRvGgPbX3x0a8 4846:247):
 * fifteen copies of one ogee, stacked concentrically and scaled, alternating an
 * orange-to-white radial gradient with a peach band lit by an orange inner shadow.
 * Collapsed (every ring at the innermost one's size) it is a single small ogee (4846:279).
 *
 * The page shows one at the bottom left; when the camera centres the column, `swap`
 * runs 0 → 1 and it hands over to a second one under the column instead of moving:
 * - the left one collapses, ring by ring, and is pulled away down and to the left;
 * - the centre one forms from its core, rings expanding (outer ones last) as it rises
 *   from the bottom into place;
 * - both appear and vanish through an ordered (Bayer) dither, as Netra's DitherWash
 *   does on the RM card, with the dissolving front picked out in its #ff7700.
 * Drawn on a canvas over the band it can reach (page y 400 to 760), in
 * stage units scaled by `k`; at rest (swap 0 or 1) it is drawn once, crisp.
 */

/** The ogee, 260×340.77, centred on (130, 170.39) (the icon's outer vector). */
const OGEE =
  "M68.98 39.41H73.66C98.86 39.41 121.29 23.68 130 .04C138.71 23.68 161.14 39.41 186.34 39.41H191.02C223.75 39.41 259.69 65.93 259.73 98.66C259.76 98.69 259.8 98.72 259.85 98.72C259.93 98.72 260 98.78 260 98.87V239.51C260 239.59 259.93 239.65 259.85 239.65C259.8 239.65 259.76 239.68 259.73 239.71V240.76C259.73 275.54 222.13 303.73 187.35 303.73H184.12C160.16 303.73 138.74 318.43 130 340.74C121.26 318.43 99.84 303.73 75.88 303.73H72.65C37.87 303.73 .27 275.54 .27 240.76V239.71C.24 239.68 .2 239.65 .15 239.65C.07 239.65 0 239.59 0 239.51V98.87C0 98.78.07 98.72.15 98.72C.2 98.72.24 98.69.27 98.66C.31 65.93 36.25 39.41 68.98 39.41Z";
const BASE_W = 260;
const HALF_H = 170.39;
/** The rings' widths in the 344px icon, outermost first; odd ones gradient, even ones peach. */
const RINGS = [260, 247.49, 239.1, 224.6, 215.2, 204.8, 197.8, 185.8, 177.2, 168.5, 159.8, 151, 140.1, 132.1, 109.6].map(
  (w) => w / BASE_W,
);
const CORE = RINGS[RINGS.length - 1];
/** The icon's 344px on the stage: 1074 stage px. */
const ICON = 1074 / 344;

/** Where it sits on the page (bottom left) and under the centred column, in stage px. */
const LEFT = { x: -2.85, y: 989 };
const CENTRE = { x: 601.4, y: 1052.4 };
/**
 * The band the rings can reach, in page px: from 400 down past the stage's foot (675),
 * since the close-up's camera (1.125×, lifted up to 101px) brings page y ≈ 741 up to
 * the frame's bottom edge; the page clips whatever lies beyond it.
 */
const TOP = 400;
const BOTTOM = 760;
const W = 1200;
const H = BOTTOM - TOP;
/** Each copy fades to white from 419px above its centre (the page's white wash), over 416px. */
const FADE_FROM = -419;
const FADE_LEN = 416;

/** 16×16 Bayer thresholds, 0..1. */
const BAYER = (() => {
  let m = [0];
  for (let n = 1; n < 16; n *= 2) {
    const next = new Array<number>(4 * n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = m[y * n + x] * 4;
        next[y * 2 * n + x] = v;
        next[y * 2 * n + x + n] = v + 2;
        next[(y + n) * 2 * n + x] = v + 3;
        next[(y + n) * 2 * n + x + n] = v + 1;
      }
    m = next;
  }
  return Float32Array.from(m, (v) => (v + 0.5) / 256);
})();

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeIn = (p: number) => p * p * p;
const easeOut = (p: number) => 1 - (1 - p) ** 3;

/** One ring's top half (the only half that ever reaches the stage), drawn once at `px` per icon unit. */
function sprite(kind: "glow" | "peach", px: number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(BASE_W * px);
  c.height = Math.ceil(HALF_H * px);
  const g = c.getContext("2d")!;
  const path = new Path2D(OGEE);
  g.scale(px, px);
  g.save();
  g.clip(path);
  if (kind === "glow") {
    // #ff7700 at 15% out to white, on an ellipse 0.565w × 0.636h (Figma's gradient transform).
    g.translate(130, HALF_H);
    g.scale(146.9, 216.8);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0.15, "#ff7700");
    grad.addColorStop(1, "#ffffff");
    g.fillStyle = grad;
    g.fillRect(-1.2, -1.2, 2.4, 2.4);
  } else {
    g.fillStyle = "#ffe9d3";
    g.fillRect(0, 0, BASE_W, HALF_H * 2);
    // Inner shadow: a frame around the shape, clipped away, casts its blur inward.
    g.shadowColor = "rgba(255, 119, 0, 0.8)";
    g.shadowBlur = 2.86 * px;
    const frame = new Path2D();
    frame.rect(-100, -100, BASE_W + 200, HALF_H * 2 + 200);
    frame.addPath(path);
    g.fillStyle = "#000";
    g.fill(frame, "evenodd");
  }
  g.restore();
  return c;
}

type Copy = {
  /** Centre, stage px. */
  x: number;
  y: number;
  /** Per-ring collapse, 0 (full) to 1 (at the core's size). */
  collapse: (i: number) => number;
  /** Dither visibility at a stage point (1 shown, 0 gone), or null when fully shown. */
  alpha: ((x: number, y: number) => number) | null;
};

/** The screen's pixel ratio, kept current when the window moves between screens. */
function useDpr() {
  return useSyncExternalStore(
    (changed) => {
      let query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      const onChange = () => {
        query.removeEventListener("change", onChange);
        query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        query.addEventListener("change", onChange);
        changed();
      };
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.devicePixelRatio || 1,
    () => 1,
  );
}

/** The canvases only the hand-over needs: a layer per copy, and the dither mask and its front. */
type Handover = {
  buf: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  maskC: HTMLCanvasElement;
  frontC: HTMLCanvasElement;
  maskG: CanvasRenderingContext2D;
  frontG: CanvasRenderingContext2D;
  mask: ImageData;
  front: ImageData;
};

const release = (...canvases: HTMLCanvasElement[]) => canvases.forEach((c) => ((c.width = 0), (c.height = 0)));

export default function NetraArcs({ k, swap }: { k: number; swap: MotionValue<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = useDpr();
  // Quantised, so a resize only rebuilds when the resolution or the dither cell really change.
  // Canvas px per stage px: the screen's, capped (the rings are soft; this keeps memory sane).
  const s = Math.min(Math.ceil(k * dpr * 4) / 4, 1.5);
  // A dither cell per ~2 screen px.
  const cell = Math.max(1, Math.round((2 / k) * 4) / 4);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = Math.round(W * s);
    canvas.height = Math.round(H * s);
    const sprites = { glow: sprite("glow", ICON * s), peach: sprite("peach", ICON * s) };
    const cw = Math.ceil(W / cell);
    const ch = Math.ceil(H / cell);

    // Allocated when a hand-over starts, released when it settles.
    let hand: Handover | null = null;
    const open = (): Handover => {
      if (hand) return hand;
      const buf = Object.assign(document.createElement("canvas"), { width: canvas.width, height: canvas.height });
      const maskC = Object.assign(document.createElement("canvas"), { width: cw, height: ch });
      const frontC = Object.assign(document.createElement("canvas"), { width: cw, height: ch });
      const maskG = maskC.getContext("2d")!;
      const frontG = frontC.getContext("2d")!;
      hand = {
        buf,
        g: buf.getContext("2d")!,
        maskC,
        frontC,
        maskG,
        frontG,
        mask: maskG.createImageData(cw, ch),
        front: frontG.createImageData(cw, ch),
      };
      return hand;
    };
    const close = () => {
      if (!hand) return;
      release(hand.buf, hand.maskC, hand.frontC);
      hand = null;
    };

    /** The copy's box on the stage (its outermost ring), clipped to what can show. */
    const extent = (c: Copy, bottom: number) => {
      const scale = RINGS[0] + (CORE - RINGS[0]) * c.collapse(0);
      const w = BASE_W * ICON * scale;
      const x0 = Math.max(0, c.x - w / 2);
      const x1 = Math.min(W, c.x + w / 2);
      const y0 = Math.max(TOP, c.y - HALF_H * ICON * scale);
      const y1 = Math.min(bottom, c.y);
      return x1 > x0 && y1 > y0 ? { x0, x1, y0, y1 } : null;
    };

    const rings = (g: CanvasRenderingContext2D, c: Copy) => {
      RINGS.forEach((r, i) => {
        const scale = r + (CORE - r) * c.collapse(i);
        const w = BASE_W * ICON * scale;
        const h = HALF_H * ICON * scale;
        g.drawImage(i % 2 ? sprites.peach : sprites.glow, (c.x - w / 2) * s, (c.y - h - TOP) * s, w * s, h * s);
      });
    };

    /** The page's wash to white below, over this copy only (source-atop on a layer holding just it). */
    const wash = (g: CanvasRenderingContext2D, c: Copy, box: { y0: number; y1: number }) => {
      g.globalCompositeOperation = "source-atop";
      const top = (c.y + FADE_FROM - TOP) * s;
      const fade = g.createLinearGradient(0, top, 0, top + FADE_LEN * s);
      fade.addColorStop(0, "rgba(255,255,255,0)");
      fade.addColorStop(1, "#fff");
      g.fillStyle = fade;
      g.fillRect(0, (box.y0 - TOP) * s, W * s, (box.y1 - box.y0) * s);
      g.globalCompositeOperation = "source-over";
    };

    /** A crisp copy, straight onto the canvas (drawn before any dithered one, so its wash touches only it). */
    const paintCrisp = (c: Copy, bottom: number) => {
      const box = extent(c, bottom);
      if (!box) return;
      rings(ctx, c);
      wash(ctx, c, box);
    };

    /** A dithering copy: on its own layer, masked cell by cell, with its #ff7700 front. */
    const paintDither = (c: Copy, bottom: number) => {
      const box = extent(c, bottom);
      if (!box || !c.alpha) return;
      const h = open();
      h.g.clearRect(0, 0, h.buf.width, h.buf.height);
      rings(h.g, c);
      wash(h.g, c, box);
      // Only the cells the copy covers: a cell shows while its visibility clears its Bayer
      // threshold; cells just under it light up #ff7700, the shimmering front.
      const cx0 = Math.floor(box.x0 / cell);
      const cx1 = Math.min(cw, Math.ceil(box.x1 / cell));
      const cy0 = Math.floor((box.y0 - TOP) / cell);
      const cy1 = Math.min(ch, Math.ceil((box.y1 - TOP) / cell));
      const m = h.mask.data;
      const fr = h.front.data;
      for (let y = cy0; y < cy1; y++) {
        m.fill(0, (y * cw + cx0) * 4, (y * cw + cx1) * 4);
        fr.fill(0, (y * cw + cx0) * 4, (y * cw + cx1) * 4);
        for (let x = cx0; x < cx1; x++) {
          const a = c.alpha((x + 0.5) * cell, TOP + (y + 0.5) * cell);
          const t = BAYER[(y & 15) * 16 + (x & 15)];
          const j = (y * cw + x) * 4;
          if (a > t) m[j + 3] = 255;
          else if (a > t - 0.16) {
            fr[j] = 255;
            fr[j + 1] = 119;
            fr[j + 2] = 0;
            fr[j + 3] = 220;
          }
        }
      }
      h.maskG.clearRect(0, 0, cw, ch);
      h.frontG.clearRect(0, 0, cw, ch);
      h.maskG.putImageData(h.mask, 0, 0, cx0, cy0, cx1 - cx0, cy1 - cy0);
      h.frontG.putImageData(h.front, 0, 0, cx0, cy0, cx1 - cx0, cy1 - cy0);
      h.g.imageSmoothingEnabled = false;
      // The front first (over the rings, so it only lands where they are), then the mask,
      // with the front's cells merged into it so they survive.
      h.g.globalCompositeOperation = "source-atop";
      h.g.drawImage(h.frontC, 0, 0, cw * cell * s, ch * cell * s);
      h.maskG.drawImage(h.frontC, 0, 0);
      h.g.globalCompositeOperation = "destination-in";
      h.g.drawImage(h.maskC, 0, 0, cw * cell * s, ch * cell * s);
      h.g.globalCompositeOperation = "source-over";
      h.g.imageSmoothingEnabled = true;
      ctx.drawImage(h.buf, 0, 0);
    };

    // Only the rings' tops ever reach the stage (both centres sit below it), so a
    // collapsing copy drops out of view by ~3/4 and a forming one shows from ~1/3:
    // the two overlap through the middle, as one hands over to the other.
    const left = (out: number): Copy => {
      const e = easeIn(out);
      return {
        // Collapses (outer rings first) and is pulled down and to the left, dithering out from the top right.
        x: LEFT.x - 90 * e,
        y: LEFT.y + 140 * e,
        collapse: (i) => easeIn(clamp(out * 1.15 - (i / 14) * 0.15)),
        alpha:
          out === 0
            ? null
            : (x, y) => {
                const u = (x / W + (BOTTOM - y) / H) / 2;
                return clamp((1 - out) * 1.35 - 0.35 * u);
              },
      };
    };
    const centre = (into: number): Copy => ({
      // Forms from its core (outer rings last) and rises from the bottom, dithering in from the bottom.
      x: CENTRE.x,
      y: CENTRE.y + 150 * (1 - easeOut(into)),
      collapse: (i) => 1 - easeOut(clamp((into - ((14 - i) / 14) * 0.25) / 0.75)),
      alpha: into === 1 ? null : (_x, y) => clamp(into * 1.35 - 0.35 * ((BOTTOM - y) / H)),
    });

    // From 0.8 the left copy is out of view and the centre one whole: the picture is final.
    const FINAL = 0.8;
    let drewFinal = false;
    const draw = () => {
      const p = swap.get();
      const moving = p > 0 && p < 1;
      if (p >= FINAL && drewFinal) {
        if (!moving) close();
        return;
      }
      drewFinal = p >= FINAL;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // While it hands over the camera is unzoomed, so nothing below the stage's foot shows;
      // the final picture (drawn once) covers the whole band, for the close-up's zoom.
      const bottom = moving && p < FINAL ? 675 : BOTTOM;
      const into = clamp(p / FINAL);
      const out = p;
      if (into === 1 || into === 0) {
        if (into === 1) paintCrisp(centre(1), bottom);
        else paintCrisp(left(0), bottom);
        if (out > 0 && out < 1) paintDither(left(out), bottom);
      } else {
        if (out < 1) paintDither(left(out), bottom);
        paintDither(centre(into), bottom);
      }
      if (!moving) close();
    };

    draw();
    const off = swap.on("change", draw);
    return () => {
      off();
      close();
      release(sprites.glow, sprites.peach);
    };
  }, [s, cell, swap]);

  return (
    <canvas
      ref={ref}
      data-look="icon"
      aria-hidden
      className="pointer-events-none absolute left-0"
      style={{ top: TOP, width: W, height: H }}
    />
  );
}
