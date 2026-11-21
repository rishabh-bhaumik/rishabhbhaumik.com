"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CURTAIN_RISE_EVENT, CURTAIN_START_EVENT } from "@/components/home/SheetGutters";
import { stateFor } from "@/components/logo-lab/frames";
import { buildGlyphAtlas, buildLogoField } from "@/components/logo-lab/logoField";
import { LogoRenderer, rotationMatrix } from "@/components/logo-lab/renderer";
import { BAYER, BAYER_SIZE } from "@/lib/netrabot/bayer";
import { getLenis } from "@/components/SmoothScroll";
import type { Look } from "@/components/logo-lab/settings";
import type { LogoMaterial } from "@/components/logo-lab/types";

/**
 * The logo lab's look for the curtain (/logo#m=default&mo=flip&lp=1&f=dither:1.00): the
 * Default coin at its own relief and light, 1-bit dither at full strength, turning as
 * the lab's Flip motion does (a full turn end over end, eased in and out, a slight sway
 * at rest). Written out here so the curtain doesn't load the lab's material library.
 */
const LOOK: Look = { relief: 1, light: null, filters: [{ key: "dither", amount: 1 }] };

/**
 * While the curtain covers the screen the new page mounts, so its .rise entrance (see
 * globals.css) is held back; dropping the attribute replays it, stagger and all, as the
 * curtain lifts. Unlayered, so it outranks .rise (a utility).
 */
const HOLD_ENTRANCE = `[data-curtain="on"] :is(.rise, .rise-text) { animation: none; opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  html:has(.page-curtain[data-intro]) :is(.rise, .rise-text) { animation: none; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .page-curtain[data-intro] { visibility: hidden !important; } }`;

/**
 * The intro's safety net, run straight from the server HTML: if the app never takes over
 * (a script failed to load), the curtain clears itself and the page shows anyway. The app
 * cancels it when it takes over (window.__curtainFS), and it skips a curtain the app has
 * marked live (data-intro="live"), so it can never cut a running intro short.
 */
const INTRO_FAILSAFE = `window.__curtainFS=setTimeout(function(){var c=document.querySelector('.page-curtain[data-intro=""]');if(c){c.removeAttribute("data-intro");c.style.visibility="hidden";}},6000);`;
/** Without JavaScript: no curtain, and the entrances simply show. */
const NO_SCRIPT = `.page-curtain{display:none!important}:is(.rise,.rise-text){animation:none!important;opacity:1!important;transform:none!important;filter:none!important}`;
/** On a fresh load the coin waits this long at most for WebGL before flipping in as the flat mark. */
const INTRO_WAIT = 900;

/**
 * Dither dissolve: the curtain is a band taller than the screen at each end, and in those
 * bands it breaks up in ordered (Bayer) dither, square cells dropping out more and more
 * toward the edge, so the page shows through scattered cells as an edge passes rather
 * than behind a hard line. Both bands sit off screen while it covers the screen. BAND is
 * each band's height (share of the screen), CELL a dither cell (CSS px).
 */
const BAND = 0.55;
const CELL = 4;

/**
 * The dissolve masks, drawn once per screen height: a tile 64 cells wide and a band tall,
 * opaque where the curtain stays. The top band is empty at its top edge and whole where it
 * meets the curtain; the bottom band is that exact tile upside down, cell for cell, so the
 * leading edge coming in mirrors the trailing edge going out.
 */
function ditherBands(heightPx: number): { top: string; bottom: string } {
  const cols = 64;
  const rows = Math.max(1, Math.round(heightPx / CELL));
  const top = document.createElement("canvas");
  top.width = cols;
  top.height = rows;
  const ctx = top.getContext("2d")!;
  const img = ctx.createImageData(cols, rows);
  for (let y = 0; y < rows; y++) {
    // How solid this row is, 0 at the outer edge to 1 where it meets the curtain: an ease
    // in (a long sparse tail of scattered cells at the edge, filling in toward the curtain),
    // so the dissolve reads as it passes rather than flashing by.
    const level = Math.pow((y + 0.5) / rows, 1.6);
    for (let x = 0; x < cols; x++) {
      const on = level > BAYER[(y % BAYER_SIZE) * BAYER_SIZE + (x % BAYER_SIZE)] + 0.5;
      img.data[(y * cols + x) * 4 + 3] = on ? 255 : 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  const bottom = document.createElement("canvas");
  bottom.width = cols;
  bottom.height = rows;
  const b = bottom.getContext("2d")!;
  b.translate(0, rows);
  b.scale(1, -1);
  b.drawImage(top, 0, 0);
  return { top: top.toDataURL("image/png"), bottom: bottom.toDataURL("image/png") };
}

/**
 * The curtain's surface: neutral greys only, and barely a gradient. Each theme settles into
 * its extreme by 65% of the way down: dark eases from a whisper of charcoal (#0c0c0c) at
 * the top to pure black, with a light vignette; light mirrors it, from a pale grey
 * (#ededec) at the top to near-white, with no vignette (it read as sunken). Fine grain
 * keeps it from banding. --curtain-mid is the gradient's colour at mid-height, where the
 * coin sits (50/65 of the way); the coin's backdrop is drawn in it.
 */
const SURFACE = `
.page-curtain {
  /* One height for the CSS and the script: window.innerHeight (set by masks()), 100vh until then. */
  --curtain-band: calc(var(--curtain-vh, 100vh) * ${BAND});
  top: calc(-1 * var(--curtain-band));
  height: calc(var(--curtain-vh, 100vh) + 2 * var(--curtain-band));
  --curtain-top: #0c0c0c; --curtain-mid: #030303; --curtain-foot: #000;
  --curtain-glow: transparent; --curtain-vignette: rgb(0 0 0 / 0.3);
  background:
    radial-gradient(90% 40% at 50% -6%, var(--curtain-glow), transparent 70%),
    radial-gradient(130% 110% at 50% 50%, transparent 55%, var(--curtain-vignette)),
    linear-gradient(to bottom, var(--curtain-top) var(--curtain-band), var(--curtain-foot) calc(var(--curtain-band) + var(--curtain-vh, 100vh) * 0.65));
}
:root[data-theme="light"] .page-curtain {
  --curtain-top: #ededec; --curtain-mid: #f8f8f8; --curtain-foot: #fcfcfc;
  --curtain-glow: transparent; --curtain-vignette: transparent;
}
.page-curtain::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.07; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}`;

const OVAL = "radial-gradient(ellipse 50% 50% at 50% 50%, #000 74%, transparent 98%)";
const COIN_FADE: React.CSSProperties = { maskImage: OVAL, WebkitMaskImage: OVAL };

/** Pages the curtain plays between: the sitemap's front pages. */
const PAGES = new Set(["/", "/work", "/about", "/play"]);

/** Timing (ms). */
const IN = 950; // the curtain comes down from the top to cover the screen; the coin makes a full flip
const HOLD = 1000; // covered at least this long, and until the new page has rendered
const OUT = 950; // the curtain carries on down and off the bottom; the coin flips again
/**
 * How far the curtain travels, as a share of its height: just enough that its leading
 * edge enters the screen at the very start and its trailing band clears it at the very
 * end (it is a band taller than the screen at each end), so no time is spent off screen.
 */
const TRAVEL = (1 + BAND) / (1 + 2 * BAND);
/**
 * The nods, as damped springs rather than eases. Landing, the coin overshoots face on by
 * WIND_TILT and springs back and forth, settling (a caught coin); winding up is the same
 * spring played backwards, swings growing until it launches into the turn. Each lasts
 * NOD; NOD_FREQ is its swing rate, NOD_DECAY how quickly it settles.
 */
const NOD = 420;
const WIND_TILT = 0.35; // radians
const NOD_FREQ = 2.6; // Hz
const NOD_DECAY = 0.15; // s
/**
 * The spring at `ms` into a nod: 1 at the start, swinging through 0 and settling to exactly
 * 0 at NOD. It sets off from rest (zero speed, the sine term), as the flip arrives at rest,
 * so there's no jolt as the flip hands over to the nod (or, reversed, the nod to the flip).
 */
const spring = (ms: number) => {
  const t = Math.max(0, ms) / 1000;
  const w = 2 * Math.PI * NOD_FREQ;
  const fade = 1 - Math.pow(clamp(ms / NOD), 4);
  return Math.exp(-t / NOD_DECAY) * (Math.cos(w * t) + Math.sin(w * t) / (w * NOD_DECAY)) * fade;
};
/**
 * Between the landing nod and the wind-up the coin floats, as the About coin does between
 * flips: a slow turn to one side and back, with a slight tilt, starting and ending at rest
 * and symmetric about the transition's midpoint.
 */
const FLOAT_YAW = 0.24; // radians
const FLOAT_PITCH = 0.09;
const GIVE_UP = 4000; // never hold the screen longer than this
/** The new page's .rise entrance (staggered) is released no earlier than this far into the way out (and not before the coin has gone). */
const REVEAL_AT = 0.3;

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const clamp = (p: number) => Math.min(1, Math.max(0, p));

/** A CSS colour (#rgb or #rrggbb) as 0..1 RGB. */
function rgb(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h.slice(0, 6), 16);
  return Number.isNaN(n) ? [0, 0, 0] : [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * One pass of the curtain. `intro`: a fresh load, which starts already covered (no page
 * to change); `start` stays 0 until the coin is ready to flip in (or `readyBy` passes).
 */
type Run = {
  to: string;
  /** The page the run left from (back/forward detection). */
  from: string;
  start: number;
  covered: number;
  leave: number;
  /** When the coin starts winding up for the way out. */
  flipOut?: number;
  /** Frames seen since the new page arrived (the turn waits out its heavy first frames). */
  settle?: number;
  /** The coin is the live WebGL coin this run (fixed at the start, upgraded only while at rest, never mid-turn). */
  canvas?: boolean;
  /** Back or forward was pressed during the run: no push, and it leaves on whatever page the browser went to. */
  popped?: boolean;
  /** The new page has been asked for (once the landing nod is done). */
  pushed?: boolean;
  intro?: boolean;
  readyBy?: number;
};

/**
 * The page curtain: moving between the front pages (home, Work, About, Play), a curtain
 * (a neutral cinematic gradient, SURFACE, its edges dissolving in dither) comes down from
 * the top with the logo coin on it. The coin turns as it is carried onto the screen and
 * lands face on as the curtain covers it (the page changes underneath). It rests, winds
 * up, and as the curtain carries on down and off the bottom it turns once more, the turn
 * keyed to its own travel so it is always seen, whatever the frame rate.
 * - It takes over plain left-clicks on links to those pages; new-tab clicks and every
 *   other route navigate as usual. A click while it is leaving runs next; back/forward
 *   mid-run is honoured (no push over it). The page behind can't scroll while covered.
 * - The coin is the lab's renderer (low-power GPU), warmed while the browser is idle; if
 *   WebGL2 isn't there, isn't ready when a run starts, or is lost, the mark turns over in
 *   CSS instead (a run never swaps between the two mid-turn).
 * - A fresh load of one of those pages (typed address, a link from elsewhere, a reload)
 *   opens on the curtain, drawn in the server HTML so the page never flashes first: the
 *   coin fades in and flips, then it leaves as above. A script-free failsafe clears it
 *   after 6s if the app never takes over; without JavaScript it isn't shown at all.
 * - Off under reduced motion: links just navigate, and a fresh load shows the page.
 */
export default function PageCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markRef = useRef<HTMLImageElement>(null);
  const runRef = useRef<Run | null>(null);
  const pathRef = useRef(pathname);
  // A fresh load of a front page opens on the curtain (the same on server and client).
  const [intro] = useState(() => PAGES.has(pathname ?? ""));

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const mark = markRef.current;
    if (!root || !canvas || !mark) return;
    const view: HTMLCanvasElement = canvas;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let renderer: LogoRenderer | null = null;
    let material: LogoMaterial | undefined;
    let raf = 0;
    let cancelled = false;
    let bg: [number, number, number] = [0, 0, 0];
    /** A front-page link clicked while the curtain was leaving: run it next. */
    let queued: string | null = null;
    const ready = () => !!renderer && !!material && renderer.ready(material.key) && !renderer.gl.isContextLost();

    // Build the renderer and compile the one material: now on a fresh load, otherwise while idle.
    const warm = async () => {
      try {
        renderer = new LogoRenderer(view, { powerPreference: "low-power" });
        const [{ DEFAULT }, field] = await Promise.all([import("@/components/logo-lab/materials/default"), buildLogoField(512)]);
        if (cancelled || !renderer) return;
        renderer.setField(field);
        renderer.setGlyphs(buildGlyphAtlas());
        material = DEFAULT[0];
        const pump = () => {
          if (cancelled || !renderer || !material) return;
          renderer.request(material, true);
          renderer.pump(2);
          if (!renderer.ready(material.key) && renderer.status(material.key) !== "error") window.setTimeout(pump, 50);
        };
        pump();
      } catch {
        renderer = null;
      }
    };
    const hasIdle = typeof window.requestIdleCallback === "function" && !intro;
    const idle = hasIdle
      ? window.requestIdleCallback(() => void warm(), { timeout: 3000 })
      : window.setTimeout(() => void warm(), intro ? 0 : 1200);
    // A lost GPU context falls back to the CSS mark, and the coin is rebuilt when it returns.
    const onLost = (e: Event) => {
      e.preventDefault();
      renderer = null;
      material = undefined;
    };
    const onRestored = () => void warm();
    view.addEventListener("webglcontextlost", onLost);
    view.addEventListener("webglcontextrestored", onRestored);

    /** The canvas's pixel size, kept in step with its CSS size (not measured every frame). */
    let canvasPx = 0;
    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasPx = Math.round((view.getBoundingClientRect().width || 192) * dpr);
      if (view.width !== canvasPx) {
        view.width = canvasPx;
        view.height = canvasPx;
      }
    };

    // The dissolving edges: two dither bands and the solid curtain between, as one mask.
    // Each mask pixel is one dither cell, drawn up CELL times, pixelated, so the cells stay square.
    let maskedFor = 0;
    const masks = () => {
      const vh = window.innerHeight;
      root.style.setProperty("--curtain-vh", `${vh}px`);
      sizeCanvas();
      if (vh === maskedFor) return;
      maskedFor = vh;
      const band = Math.round(vh * BAND);
      const { top, bottom } = ditherBands(band);
      const tile = `${64 * CELL}px ${band}px`;
      const m = root.style as CSSStyleDeclaration & { webkitMaskImage: string; webkitMaskSize: string; webkitMaskPosition: string; webkitMaskRepeat: string };
      m.maskImage = m.webkitMaskImage = `url(${top}), linear-gradient(#000, #000), url(${bottom})`;
      m.maskSize = m.webkitMaskSize = `${tile}, 100% calc(100% - ${2 * band}px), ${tile}`;
      m.maskPosition = m.webkitMaskPosition = `0 0, 0 ${band}px, 0 100%`;
      m.maskRepeat = m.webkitMaskRepeat = "repeat-x, no-repeat, repeat-x";
    };
    masks();
    window.addEventListener("resize", masks);

    /**
     * Where the coin crosses a screen edge, as the curtain's offset (share of its height):
     * the coin sits at the curtain's middle, so it is on screen while |offset| < edge. Both
     * flips are driven by this, so the coin turns exactly while it is seen moving.
     */
    let edge = 0.3;
    /** When the coin leaves the screen on the way out, as a share of OUT (for the reveal). */
    let seenOut = 0.5;
    const measure = () => {
      masks();
      const H = root.offsetHeight;
      const vh = window.innerHeight;
      const r = (view.getBoundingClientRect().width || 192) * 0.36; // the coin fills ~72% of its canvas
      edge = Math.min(TRAVEL, (vh / 2 + r) / H);
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (TRAVEL * easeInOut(mid) < edge) lo = mid;
        else hi = mid;
      }
      seenOut = (lo + hi) / 2;
    };

    /** The coin at time `now` of a run: a full flip as it comes in, at rest, a wind-up, a full flip as it goes. */
    const draw = (run: Run, now: number) => {
      // A fresh load, waiting for the coin: just the curtain.
      if (run.intro && !run.start) {
        view.style.opacity = "0";
        mark.style.opacity = "0";
        return;
      }
      let turn: number;
      let alpha = 1;
      if (run.leave) {
        // Out: the turn follows the coin's own travel, one whole turn by the time it leaves the screen.
        const k = clamp((TRAVEL * easeInOut(clamp((now - run.leave) / OUT))) / edge);
        turn = -WIND_TILT * (1 - k) + 2 * Math.PI * k;
      } else if (run.flipOut) {
        // The wind-up: the landing spring played backwards, swings growing to a tip back as the curtain sets off.
        turn = -WIND_TILT * spring(run.flipOut + NOD - now);
      } else if (run.covered) {
        // The landing nod: just past face on, then springing back and forth into place.
        turn = WIND_TILT * spring(now - run.covered);
      } else if (run.intro) {
        // A fresh load (the curtain still): fades in as it flips over, just past face on.
        const e = easeInOut(clamp((now - run.start) / IN));
        turn = -2 * Math.PI * (1 - e) + WIND_TILT * e;
        alpha = clamp((now - run.start) / 180);
      } else {
        // In: the turn follows the coin's travel onto the screen, ending just past face on as it covers.
        const inP = clamp((now - run.start) / IN);
        const k = clamp((TRAVEL * (1 - easeInOut(inP))) / edge);
        turn = -2 * Math.PI * k + WIND_TILT * (1 - k);
      }
      // The float, under the whole rest (the nods spring on top of it), from still to still.
      let floatYaw = 0;
      if (run.covered && !run.leave) {
        const from = run.covered;
        const to = run.covered + HOLD;
        const u = clamp((now - from) / Math.max(1, to - from));
        floatYaw = FLOAT_YAW * Math.sin(Math.PI * u);
        turn += FLOAT_PITCH * Math.sin(2 * Math.PI * u);
      }
      // Its sway (as in the lab), always on, timed from the transition's midpoint so it mirrors too.
      const t = now / 1000;
      const m = (now - (run.start + IN + HOLD / 2)) / 1000;
      const angles: [number, number, number] = [0.18 * Math.sin(m * 0.7) + floatYaw, turn, 0.06 * Math.sin(m)];

      if (run.canvas && renderer && material && ready()) {
        renderer.background = bg;
        const state = stateFor(material, LOOK, rotationMatrix(...angles), t, [0, 0]);
        if (renderer.render(state, canvasPx, canvasPx)) {
          view.style.opacity = String(alpha);
          mark.style.opacity = "0";
          return;
        }
      }
      // The flat mark, turning over in CSS (no WebGL, or not ready when the run began).
      view.style.opacity = "0";
      mark.style.opacity = String(alpha);
      mark.style.transform = `rotateX(${angles[1]}rad)`;
    };

    const release = () => {
      delete document.documentElement.dataset.curtain;
      root.removeAttribute("data-intro");
    };

    const frame = (now: number) => {
      raf = 0;
      const run = runRef.current;
      if (!run) return;
      raf = requestAnimationFrame(frame);
      // A fresh load: the coin flips in (the curtain already covering) once WebGL is ready, or soon anyway.
      if (run.intro && !run.start && (ready() || now >= (run.readyBy ?? 0))) {
        run.start = now;
        run.canvas = ready();
      }
      const inP = run.start ? clamp((now - run.start) / IN) : 0;

      if (!run.covered && run.start && inP >= 1) {
        run.covered = now;
        // Covered: hold the new page's entrance (HOLD_ENTRANCE) from here.
        if (!run.intro) document.documentElement.dataset.curtain = "on";
      }
      // Change the page underneath once the landing nod is done, so building the new page (its
      // heaviest frames) falls in the gentle float, not the nod; unless back/forward already
      // took the browser somewhere.
      if (run.covered && !run.intro && !run.pushed && now >= run.covered + NOD) {
        run.pushed = true;
        if (!run.popped) router.push(run.to);
      }
      if (run.covered && !run.leave) {
        // While at rest the coin may become the live WebGL coin (never mid-turn).
        if (!run.canvas && !run.flipOut && ready()) run.canvas = true;
        const here = pathRef.current;
        const arrived = run.intro || (run.popped ? here !== run.from : here === run.to);
        if (arrived && !run.flipOut) {
          // Let the new page get through its first, heaviest frames before the coin moves.
          run.settle = (run.settle ?? 0) + 1;
          if (run.settle > 2) run.flipOut = Math.max(now, run.covered + HOLD - NOD);
        }
        const gaveUp = now - run.start > GIVE_UP;
        if ((run.flipOut && now >= run.flipOut + NOD) || gaveUp) {
          run.leave = now;
          run.flipOut ??= now;
          getLenis()?.start();
          // The entrance plays once the coin has gone (and the top of the page is clear).
          window.setTimeout(release, Math.max(REVEAL_AT, seenOut) * OUT);
          // The gutters fill with stars and rush them in toward the sheet as it clears (SheetGutters).
          window.dispatchEvent(new CustomEvent(CURTAIN_RISE_EVENT, { detail: { duration: OUT } }));
        }
      }
      const outP = run.leave ? clamp((now - run.leave) / OUT) : 0;
      // In from the top, out through the bottom, just far enough to clear the screen each way.
      const y = run.leave ? TRAVEL * easeInOut(outP) * 100 : run.intro ? 0 : -TRAVEL * (1 - easeInOut(inP)) * 100;
      root.style.transform = `translate3d(0, ${y}%, 0)`;
      draw(run, now);

      if (run.leave && outP >= 1) {
        runRef.current = null;
        root.style.visibility = "hidden";
        cancelAnimationFrame(raf);
        raf = 0;
        // A link clicked while it was leaving runs now.
        const next = queued;
        queued = null;
        if (next && next !== pathRef.current) start(next);
      }
    };

    const start = (to: string) => {
      bg = rgb(getComputedStyle(root).getPropertyValue("--curtain-mid"));
      measure();
      runRef.current = { to, from: pathRef.current, start: performance.now(), covered: 0, leave: 0, canvas: ready() };
      root.style.transform = `translate3d(0, ${-TRAVEL * 100}%, 0)`;
      root.style.visibility = "visible";
      // No scrolling the page behind the curtain.
      getLenis()?.stop();
      // Fetch the page now, while the curtain comes down, so it's ready by the time it's covered.
      router.prefetch(to);
      // The gutters' stars burst outward as the curtain comes down (SheetGutters).
      window.dispatchEvent(new CustomEvent(CURTAIN_START_EVENT, { detail: { duration: IN } }));
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // Plain left-clicks on links to the front pages run the curtain instead of navigating at once.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduce.matches) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.hash || url.search) return;
      const to = url.pathname.replace(/\/$/, "") || "/";
      if (!PAGES.has(to)) return;
      const run = runRef.current;
      if (run) {
        // Mid-run: a link the leaving curtain has already uncovered goes next; nothing is lost.
        e.preventDefault();
        if (run.leave) queued = to;
        return;
      }
      if (to === pathRef.current) return;
      e.preventDefault();
      start(to);
    };
    document.addEventListener("click", onClick, true);

    // Back or forward mid-run: don't push over it; leave on wherever the browser went.
    const onPop = () => {
      const run = runRef.current;
      if (run && !run.intro && !run.leave) run.popped = true;
    };
    window.addEventListener("popstate", onPop);

    // No scrolling the covered page by wheel or touch either (Lenis may be off on some routes).
    const block = (e: Event) => {
      if (runRef.current && !runRef.current.leave) e.preventDefault();
    };
    root.addEventListener("wheel", block, { passive: false });
    root.addEventListener("touchmove", block, { passive: false });
    // ...or by keyboard (space, arrows, page keys).
    const SCROLL_KEYS = new Set([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"]);
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) block(e);
    };
    window.addEventListener("keydown", onKey);

    // A fresh load: the curtain is already up (server HTML); play the coin, then leave.
    if (intro && root.hasAttribute("data-intro")) {
      // The app has taken over: the failsafe stands down.
      window.clearTimeout((window as unknown as { __curtainFS?: number }).__curtainFS);
      if (reduce.matches) {
        root.removeAttribute("data-intro");
        root.style.visibility = "hidden";
      } else {
        root.dataset.intro = "live";
        bg = rgb(getComputedStyle(root).getPropertyValue("--curtain-mid"));
        measure();
        getLenis()?.stop();
        const here = pathRef.current ?? "/";
        runRef.current = { to: here, from: here, start: 0, covered: 0, leave: 0, intro: true, readyBy: performance.now() + INTRO_WAIT };
        raf = requestAnimationFrame(frame);
      }
    }

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("resize", masks);
      root.removeEventListener("wheel", block);
      root.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", onKey);
      view.removeEventListener("webglcontextlost", onLost);
      view.removeEventListener("webglcontextrestored", onRestored);
      cancelAnimationFrame(raf);
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      renderer?.dispose();
    };
  }, [router, intro]);

  return (
    <>
      <style>{HOLD_ENTRANCE + SURFACE}</style>
      <div
        ref={rootRef}
        aria-hidden
        data-intro={intro ? "" : undefined}
        style={intro ? { visibility: "visible", transform: "translate3d(0, 0, 0)" } : { visibility: "hidden", transform: `translate3d(0, ${-TRAVEL * 100}%, 0)` }}
        className="page-curtain fixed inset-x-0 z-[100] grid place-items-center will-change-transform [image-rendering:pixelated]"
      >
        <div className="relative size-40 [perspective:600px] sm:size-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={markRef}
            src="/media/logo-mark.svg"
            alt=""
            className="absolute inset-[14%] size-[72%] opacity-0 light:invert"
          />
          {/* The filters shift the backdrop a shade off the page colour; an oval fade (solid over
              the coin) melts the canvas's square edge into the curtain, as HeroCoin does. */}
          <canvas ref={canvasRef} style={COIN_FADE} className="absolute inset-0 h-full w-full opacity-0" />
        </div>
      </div>
      {intro && <script dangerouslySetInnerHTML={{ __html: INTRO_FAILSAFE }} />}
      {intro && (
        <noscript>
          <style>{NO_SCRIPT}</style>
        </noscript>
      )}
    </>
  );
}
