"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CURTAIN_RISE_EVENT, CURTAIN_START_EVENT } from "@/components/home/SheetGutters";
import { stateFor } from "@/components/logo-lab/frames";
import { buildGlyphAtlas, buildLogoField } from "@/components/logo-lab/logoField";
import { LogoRenderer, rotationMatrix } from "@/components/logo-lab/renderer";
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
const HOLD_ENTRANCE = `[data-curtain="on"] :is(.rise, .rise-text) { animation: none; opacity: 0; }`;

/**
 * The curtain's surface: neutral greys only, cinematic. Dark: a soft charcoal (#121212) at the top easing
 * to pure black by 65% of the way down (black from there to the foot, so the coin sits on
 * near-black), the faintest glow along the top edge and a vignette. Light: the same fall in pale
 * greys (off-white at the top to a soft grey). Fine grain keeps it from banding.
 * --curtain-mid is the gradient's colour at mid-height, where the coin sits (50/65 of the
 * way from top to foot); the coin's backdrop is drawn in it.
 */
const SURFACE = `
.page-curtain {
  --curtain-top: #121212; --curtain-mid: #040404; --curtain-foot: #000;
  --curtain-glow: rgb(255 255 255 / 0.02); --curtain-vignette: rgb(0 0 0 / 0.45);
  background:
    radial-gradient(90% 40% at 50% -6%, var(--curtain-glow), transparent 70%),
    radial-gradient(130% 110% at 50% 50%, transparent 55%, var(--curtain-vignette)),
    linear-gradient(to bottom, var(--curtain-top) 0%, var(--curtain-foot) 65%);
}
:root[data-theme="light"] .page-curtain {
  --curtain-top: #fbfbfa; --curtain-mid: #dddddb; --curtain-foot: #d4d4d1;
  --curtain-glow: rgb(255 255 255 / 0.8); --curtain-vignette: rgb(0 0 0 / 0.07);
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
const IN = 700; // the curtain comes down from the top to cover the screen; the coin makes a full flip
const HOLD = 80; // covered at least this long, and until the new page has rendered
const OUT = 700; // the curtain carries on down and off the bottom; the coin flips again
/** The coin trails the curtain by this much each way: it lands just after the screen is covered and flips out just after the curtain sets off, two motions overlapping. */
const LAG = 120;
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

type Run = { to: string; start: number; covered: number; leave: number };

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
 * - Off under reduced motion: links just navigate.
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
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle
      ? window.requestIdleCallback(() => void warm(), { timeout: 3000 })
      : window.setTimeout(() => void warm(), 1200);

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.round(view.getBoundingClientRect().width * dpr) || 400;
      if (view.width !== px) {
        view.width = px;
        view.height = px;
      }
    };

    /** The coin at time `now` of a run: a full flip on the way in, at rest, a full flip on the way out. */
    const draw = (run: Run, now: number) => {
      // The coin's own clock trails the curtain's by LAG.
      const inP = clamp((now - run.start - LAG) / IN);
      const outing = run.leave && now >= run.leave + LAG;
      const outP = outing ? clamp((now - run.leave - LAG) / OUT) : 0;
      // As the lab's Flip motion: one whole turn about the horizontal axis, eased in and out.
      const turn = outing ? easeInOut(outP) * 2 * Math.PI : (easeInOut(inP) - 1) * 2 * Math.PI;
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
      const inP = clamp((now - run.start) / IN);

      // Covered: change the page underneath.
      if (!run.covered && inP >= 1) {
        run.covered = now;
        // Hold the new page's entrance until the curtain lifts (HOLD_ENTRANCE).
        document.documentElement.dataset.curtain = "on";
        router.push(run.to);
      }
      // Rise once rested long enough and the new page is in (or after the give-up time).
      if (run.covered && !run.leave) {
        const arrived = pathRef.current === run.to;
        if ((arrived && now - run.covered >= HOLD) || now - run.start > GIVE_UP) {
          run.leave = now;
          window.setTimeout(() => delete document.documentElement.dataset.curtain, OUT * REVEAL_AT);
          // The gutters fill with stars and rush them in toward the sheet as it clears (SheetGutters).
          window.dispatchEvent(new CustomEvent(CURTAIN_RISE_EVENT, { detail: { duration: OUT } }));
        }
      }
      const outP = run.leave ? clamp((now - run.leave) / OUT) : 0;
      // In from the top (-100% -> 0), out through the bottom (0 -> 100%).
      const y = run.leave ? easeInOut(outP) * 100 : -(1 - easeInOut(inP)) * 100;
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

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick, true);
      cancelAnimationFrame(raf);
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      renderer?.dispose();
    };
  }, [router]);

  return (
    <>
      <style>{HOLD_ENTRANCE + SURFACE}</style>
      <div
        ref={rootRef}
        aria-hidden
        style={{ visibility: "hidden", transform: "translate3d(0, -100%, 0)" }}
        className="page-curtain fixed inset-0 z-[100] grid place-items-center will-change-transform"
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
    </>
  );
}
