"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CURTAIN_RISE_EVENT, CURTAIN_START_EVENT } from "@/components/home/SheetGutters";
import { stateFor } from "@/components/logo-lab/frames";
import { buildGlyphAtlas, buildLogoField } from "@/components/logo-lab/logoField";
import { LogoRenderer, rotationMatrix } from "@/components/logo-lab/renderer";
import { BAYER, BAYER_SIZE } from "@/lib/netrabot/bayer";
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
 * (a script failed to load), the curtain clears itself and the page shows anyway.
 */
const INTRO_FAILSAFE = `setTimeout(function(){var c=document.querySelector(".page-curtain[data-intro]");if(c){c.removeAttribute("data-intro");c.style.visibility="hidden";}},6000);`;
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
 * opaque where the curtain stays. `solidAtBottom`: the top band (empty at its top edge,
 * whole where it meets the curtain); otherwise the bottom band, the other way up.
 */
function ditherBand(heightPx: number, solidAtBottom: boolean): string {
  const cols = 64;
  const rows = Math.max(1, Math.round(heightPx / CELL));
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(cols, rows);
  for (let y = 0; y < rows; y++) {
    // How solid this row is, 0 at the outer edge to 1 where it meets the curtain: an ease
    // in (a long sparse tail of scattered cells at the edge, filling in toward the curtain),
    // so the dissolve reads as it passes rather than flashing by.
    const t = solidAtBottom ? (y + 0.5) / rows : 1 - (y + 0.5) / rows;
    const level = Math.pow(t, 1.6);
    for (let x = 0; x < cols; x++) {
      const on = level > BAYER[(y % BAYER_SIZE) * BAYER_SIZE + (x % BAYER_SIZE)] + 0.5;
      img.data[(y * cols + x) * 4 + 3] = on ? 255 : 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
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
  --curtain-band: ${BAND * 100}vh;
  top: calc(-1 * var(--curtain-band));
  height: calc(100vh + 2 * var(--curtain-band));
  --curtain-top: #0c0c0c; --curtain-mid: #030303; --curtain-foot: #000;
  --curtain-glow: transparent; --curtain-vignette: rgb(0 0 0 / 0.3);
  background:
    radial-gradient(90% 40% at 50% -6%, var(--curtain-glow), transparent 70%),
    radial-gradient(130% 110% at 50% 50%, transparent 55%, var(--curtain-vignette)),
    linear-gradient(to bottom, var(--curtain-top) var(--curtain-band), var(--curtain-foot) calc(var(--curtain-band) + 65vh));
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
const HOLD = 650; // covered at least this long, and until the new page has rendered
const OUT = 950; // the curtain carries on down and off the bottom; the coin flips again
/** The coin lands this long after the screen is covered, two motions overlapping. */
const LAG = 120;
/** The coin starts its way-out flip this long before the curtain sets off (when the page is ready), so the whole turn is seen. */
const WIND_UP = 150;
const GIVE_UP = 4000; // never hold the screen longer than this
/** The new page's .rise entrance (staggered) is released this far into the curtain's way out. */
const REVEAL_AT = 0.3; // the curtain leaves downward, so the top (where the openings sit) clears first

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
type Run = { to: string; start: number; covered: number; leave: number; flipOut?: number; intro?: boolean; readyBy?: number };

/**
 * The page curtain: moving between the front pages (home, Work, About, Play), a
 * curtain (a neutral cinematic gradient, SURFACE) comes down from the top with the logo
 * coin making a full flip on it, a beat behind (LAG), landing face on just after the
 * curtain covers the screen (the page changes underneath). After a moment, the curtain
 * carries on down and off the bottom, the coin flipping again a beat after it sets off.
 * - It takes over plain left-clicks on links to those pages; new-tab clicks, back and
 *   forward, and every other route navigate as usual.
 * - The coin is the lab's renderer, warmed up while the browser is idle after load;
 *   if WebGL2 isn't there (or isn't ready yet) the mark turns over in CSS instead.
 * - A fresh load of one of those pages (typed address, a link from elsewhere, a reload)
 *   opens on the curtain, drawn in the server HTML so the page never flashes first: the
 *   coin flips in, then it leaves as above. A script-free failsafe clears it after 6s.
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
  const go = useRef<(to: string) => void>(() => {});
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

    // Warm the coin while the browser is idle: build the renderer, compile the one material.
    const warm = async () => {
      try {
        renderer = new LogoRenderer(view);
        const [{ DEFAULT }, field] = await Promise.all([import("@/components/logo-lab/materials/default"), buildLogoField(512)]);
        if (cancelled) return;
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
    // On a fresh load the coin is needed now; otherwise it warms while the browser is idle.
    const hasIdle = typeof window.requestIdleCallback === "function" && !intro;
    const idle = hasIdle
      ? window.requestIdleCallback(() => void warm(), { timeout: 3000 })
      : window.setTimeout(() => void warm(), intro ? 0 : 1200);

    // The dissolving edges: two dither bands and the solid curtain between, as one mask.
    // Each mask pixel is one dither cell; drawn up CELL times, pixelated, so the cells stay square.
    const masks = () => {
      const band = Math.round(window.innerHeight * BAND);
      const top = ditherBand(band, true);
      const bottom = ditherBand(band, false);
      const tile = `${64 * CELL}px ${band}px`;
      const m = root.style as CSSStyleDeclaration & { webkitMaskImage: string; webkitMaskSize: string; webkitMaskPosition: string; webkitMaskRepeat: string };
      const image = `url(${top}), linear-gradient(#000, #000), url(${bottom})`;
      const size = `${tile}, 100% calc(100% - ${2 * band}px), ${tile}`;
      const position = `0 0, 0 ${band}px, 0 100%`;
      const repeat = "repeat-x, no-repeat, repeat-x";
      m.maskImage = m.webkitMaskImage = image;
      m.maskSize = m.webkitMaskSize = size;
      m.maskPosition = m.webkitMaskPosition = position;
      m.maskRepeat = m.webkitMaskRepeat = repeat;
    };
    masks();
    window.addEventListener("resize", masks);

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.round(view.getBoundingClientRect().width * dpr) || 400;
      if (view.width !== px) {
        view.width = px;
        view.height = px;
      }
    };

    /**
     * When the coin is on screen, as shares of the curtain's way in and out. The curtain
     * is taller than the screen (the dither bands), so it carries the coin across fast: on
     * the way in the coin only shows up partway through, on the way out it's gone well
     * before the curtain is. Worked out from the real sizes at the start of each run.
     */
    const seen = { in: 0.45, out: 0.5 };
    const measure = () => {
      const H = root.offsetHeight;
      const vh = window.innerHeight;
      const r = (view.getBoundingClientRect().width || 192) * 0.36; // the coin fills ~72% of its canvas
      const edge = Math.min(1, (vh / 2 + r) / H); // curtain offset (share of H) at which the coin crosses a screen edge
      // Invert the ease by bisection: the progress p at which easeInOut(p) reaches a value.
      const at = (v: number) => {
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2;
          if (easeInOut(mid) < v) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      };
      seen.in = at(1 - edge); // in: offset -(1 - e(p)) * H crosses -edge
      seen.out = at(edge); // out: offset e(p) * H crosses edge
    };

    /** The coin at time `now` of a run: a full flip on the way in, at rest, a full flip on the way out. */
    const draw = (run: Run, now: number) => {
      // A fresh load, waiting for the coin: just the curtain.
      if (run.intro && !run.start) {
        view.style.opacity = "0";
        mark.style.opacity = "0";
        return;
      }
      // Each flip runs while the coin is actually on screen (seen.in / seen.out, from the
      // curtain's real size): in, from when it comes into view until LAG after the screen is
      // covered; out, from the moment the curtain sets off until just before the coin is
      // carried off the bottom.
      const inFrom = seen.in * IN;
      const inP = run.intro ? clamp((now - run.start - LAG) / IN) : clamp((now - run.start - inFrom) / (IN + LAG - inFrom));
      const outFrom = run.flipOut || run.leave;
      const outEnd = run.leave ? run.leave + seen.out * OUT * 0.92 : outFrom + WIND_UP + seen.out * OUT * 0.92;
      const outP = outFrom ? clamp((now - outFrom) / (outEnd - outFrom)) : 0;
      // As the lab's Flip motion: one whole turn about the horizontal axis, eased in and out.
      const turn = outFrom ? easeInOut(outP) * 2 * Math.PI : (easeInOut(inP) - 1) * 2 * Math.PI;
      // Its sway (as in the lab), always on.
      const t = now / 1000;
      const angles: [number, number, number] = [0.18 * Math.sin(t * 0.7), turn, 0.06 * Math.sin(t)];

      if (renderer && material && renderer.ready(material.key)) {
        size();
        renderer.background = bg;
        const state = stateFor(material, LOOK, rotationMatrix(...angles), t, [0, 0]);
        if (renderer.render(state, view.width, view.height)) {
          view.style.opacity = "1";
          mark.style.opacity = "0";
          return;
        }
      }
      // Fallback: the flat mark, turning over in CSS.
      view.style.opacity = "0";
      mark.style.opacity = "1";
      mark.style.transform = `rotateX(${angles[1]}rad)`;
    };

    const frame = (now: number) => {
      raf = 0;
      const run = runRef.current;
      if (!run) return;
      raf = requestAnimationFrame(frame);
      // A fresh load: the coin flips in (already covered) once WebGL is ready, or soon anyway.
      if (run.intro && !run.start) {
        const ready = !!renderer && !!material && renderer.ready(material.key);
        if (ready || now >= (run.readyBy ?? 0)) run.start = now - LAG;
      }
      const inP = run.start ? clamp((now - run.start) / IN) : 0;

      // A fresh load is covered once its coin has landed; there's no page to change.
      if (run.intro && run.start && !run.covered && now >= run.start + IN + LAG) run.covered = now;
      // Covered: change the page underneath.
      if (!run.intro && !run.covered && inP >= 1) {
        run.covered = now;
        // Hold the new page's entrance until the curtain lifts (HOLD_ENTRANCE).
        document.documentElement.dataset.curtain = "on";
        router.push(run.to);
      }
      // Rise once rested long enough and the new page is in (or after the give-up time).
      if (run.covered && !run.leave) {
        const arrived = pathRef.current === run.to;
        // Wind up: the coin starts turning just before the curtain sets off.
        if (arrived && !run.flipOut && now - run.covered >= HOLD - WIND_UP) run.flipOut = now;
        if ((arrived && now - run.covered >= HOLD) || now - run.start > GIVE_UP) {
          run.leave = now;
          window.setTimeout(() => {
            delete document.documentElement.dataset.curtain;
            root.removeAttribute("data-intro");
          }, OUT * REVEAL_AT);
          // The gutters fill with stars and rush them in toward the sheet as it clears (SheetGutters).
          window.dispatchEvent(new CustomEvent(CURTAIN_RISE_EVENT, { detail: { duration: OUT } }));
        }
      }
      const outP = run.leave ? clamp((now - run.leave) / OUT) : 0;
      // In from the top (-100% -> 0), out through the bottom (0 -> 100%).
      const y = run.leave ? easeInOut(outP) * 100 : run.intro ? 0 : -(1 - easeInOut(inP)) * 100;
      root.style.transform = `translate3d(0, ${y}%, 0)`;
      draw(run, now);

      if (run.leave && outP >= 1) {
        runRef.current = null;
        root.style.visibility = "hidden";
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    go.current = (to: string) => {
      if (runRef.current) return;
      bg = rgb(getComputedStyle(root).getPropertyValue("--curtain-mid"));
      measure();
      runRef.current = { to, start: performance.now(), covered: 0, leave: 0 };
      root.style.transform = "translate3d(0, -100%, 0)";
      root.style.visibility = "visible";
      // Fetch the page now, while the curtain comes up, so it's ready by the time it's covered.
      router.prefetch(to);
      // The gutters' stars burst outward as the curtain comes up (SheetGutters).
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
      if (!PAGES.has(to) || to === pathRef.current) return;
      e.preventDefault();
      go.current(to);
    };
    document.addEventListener("click", onClick, true);

    // A fresh load: the curtain is already up (server HTML); play the coin, then leave.
    if (intro && root.hasAttribute("data-intro")) {
      if (reduce.matches) {
        root.removeAttribute("data-intro");
        root.style.visibility = "hidden";
      } else {
        bg = rgb(getComputedStyle(root).getPropertyValue("--curtain-mid"));
        const now = performance.now();
        measure();
        runRef.current = { to: pathRef.current, start: 0, covered: 0, leave: 0, intro: true, readyBy: now + INTRO_WAIT };
        raf = requestAnimationFrame(frame);
      }
    }

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", masks);
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
        style={intro ? { visibility: "visible", transform: "translate3d(0, 0, 0)" } : { visibility: "hidden", transform: "translate3d(0, -100%, 0)" }}
        className="page-curtain fixed inset-x-0 z-[100] grid place-items-center will-change-transform [image-rendering:pixelated]"
      >
        <div className="relative size-40 [perspective:600px] sm:size-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={markRef}
            src="/media/logo-mark.svg"
            alt=""
            className="absolute inset-[22%] size-[56%] opacity-0 light:invert"
          />
          {/* The filters shift the backdrop a shade off the page colour; an oval fade (solid over
              the coin) melts the canvas's square edge into the curtain, as HeroCoin does. */}
          <canvas ref={canvasRef} style={COIN_FADE} className="absolute inset-0 h-full w-full opacity-0" />
        </div>
      </div>
      {intro && <script dangerouslySetInnerHTML={{ __html: INTRO_FAILSAFE }} />}
    </>
  );
}
