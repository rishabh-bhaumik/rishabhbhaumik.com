"use client";

import { useEffect, useRef } from "react";
import { stateFor, transmuteState } from "./frames";
import { buildGlyphAtlas, buildLogoField } from "./logoField";
import { motionAngles } from "./motion";
import { LogoRenderer, rotationMatrix } from "./renderer";
import type { Look, Slot } from "./settings";
import type { LogoMaterial } from "./types";

export type CoinVariant = "header";

interface Config {
  /** Each step flips over into the next, and the last back into the first. */
  sequence: Slot[];
  hold: number;
  morph: number;
  /** Distance field resolution in texels: a small coin does not need a big one. */
  fieldSize: number;
  /** The picture is drawn at no more than this on its long side. */
  maxPx: number;
  /** Where the clock starts each time the coin wakes from a pause (the header's flip begins at once). */
  wakeAt: number;
  /** What the coin does while `paused`: float in place with this look, material and all. Without it, a paused coin sleeps. */
  rest?: { material: string; look: Look };
}

const slot = (key: string, relief: number, filters: Slot["filters"], transition: Slot["transition"] = "stroke"): Slot => ({ key, relief, light: null, filters, transition });

const CONFIGS: Record<CoinVariant, Config> = {
  // The header logo on hover: the Default coin, dithering as it flips over.
  header: {
    sequence: [
      slot("default", 2.5, [{ key: "dither", amount: 0.18 }, { key: "chroma", amount: 1 }], "dither"),
      slot("default", 2.5, [{ key: "dither", amount: 0.72 }, { key: "chroma", amount: 1 }], "dither"),
    ],
    hold: 1.2,
    morph: 1.8,
    fieldSize: 256,
    maxPx: 256,
    wakeAt: 1.2,
    // At rest the logo is the Default coin floating, with a touch of dither and chroma.
    rest: { material: "default", look: { relief: 1, light: null, filters: [{ key: "dither", amount: 0.22 }, { key: "chroma", amount: 0.32 }] } },
  },
};

const FRAME_MS = 1000 / 60;

/** Only the materials a sequence uses, so the rest of the library is never loaded. */
async function loadMaterials(sequence: Slot[]) {
  const need = new Set(sequence.map((s) => s.key));
  const pool: LogoMaterial[] = [...(await import("./materials/default")).DEFAULT];
  if ([...need].some((k) => !pool.some((m) => m.key === k))) {
    const [{ BENGAL }, { INDIA }] = await Promise.all([import("./materials/bengal"), import("./materials/india")]);
    pool.push(...BENGAL, ...INDIA);
  }
  return new Map<string, LogoMaterial>(pool.filter((m) => need.has(m.key)).map((m) => [m.key, m]));
}

/**
 * One coin per variant. A header is mounted again on every page, so a
 * variant's canvas, renderer and clock live here and the canvas simply moves
 * into whichever header is on screen: no shader is compiled twice.
 */
interface Shared {
  canvas: HTMLCanvasElement | null;
  renderer: LogoRenderer | null;
  materials: Map<string, LogoMaterial> | null;
  loading: Promise<void> | null;
  clock: number;
  shown: boolean;
  broken: boolean;
}
const instances = new Map<CoinVariant, Shared>();

function start(variant: CoinVariant): Shared {
  let shared = instances.get(variant);
  if (!shared) {
    shared = { canvas: null, renderer: null, materials: null, loading: null, clock: 0, shown: false, broken: false };
    instances.set(variant, shared);
  }
  if (shared.loading || shared.broken) return shared;
  const cfg = CONFIGS[variant];
  const canvas = document.createElement("canvas");
  canvas.className = "block h-full w-full";
  canvas.setAttribute("aria-hidden", "true");
  try {
    // Transparent: the header bar is see-through, so the coin's black background is keyed out.
    shared.renderer = new LogoRenderer(canvas, { transparent: true });
  } catch {
    shared.broken = true;
    return shared;
  }
  shared.canvas = canvas;
  const s = shared;
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    s.broken = true;
    s.shown = false;
  });
  shared.loading = (async () => {
    try {
      const [materials, field] = await Promise.all([loadMaterials(cfg.sequence), buildLogoField(cfg.fieldSize)]);
      s.renderer!.setField(field);
      s.renderer!.setGlyphs(buildGlyphAtlas());
      s.materials = materials;
    } catch {
      s.broken = true;
    }
  })();
  return shared;
}

/**
 * Fills its container with the live coin of a variant. While `paused`, a
 * variant with a rest look floats in place; one without only compiles its
 * shaders, ready for the moment it wakes. The animation loop stops while the
 * coin is off screen or the tab is hidden. `onReady` fires once, when a frame has been drawn; if WebGL2 or
 * anything else is missing it never fires, so the caller keeps its static
 * mark. `onLost` fires if the GPU context is lost later.
 */
export default function CoinMark({
  variant,
  paused = false,
  onReady,
  onLost,
}: {
  variant: CoinVariant;
  paused?: boolean;
  onReady: () => void;
  onLost?: () => void;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(onReady);
  const lostRef = useRef(onLost);
  const pausedRef = useRef(paused);
  const wakeRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    readyRef.current = onReady;
    lostRef.current = onLost;
    pausedRef.current = paused;
    wakeRef.current?.();
  }, [onReady, onLost, paused]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const cfg = CONFIGS[variant];
    const shared = start(variant);
    const canvas = shared.canvas;
    const renderer = shared.renderer;
    if (!canvas || !renderer || shared.broken) return;
    el.appendChild(canvas);
    const view: HTMLCanvasElement = canvas;
    const gpu: LogoRenderer = renderer;

    const { sequence, hold: HOLD, morph: MORPH } = cfg;
    let raf = 0;
    let visible = true;
    let last = 0;
    let asleep = true;
    let notified = false;
    let lostNotified = false;

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const drawn = () => {
      shared.shown = true;
      if (!notified) {
        notified = true;
        readyRef.current();
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const fit = Math.min(1, cfg.maxPx / (Math.max(rect.width, rect.height) * dpr));
      const w = Math.max(1, Math.round(rect.width * dpr * fit));
      const h = Math.max(1, Math.round(rect.height * dpr * fit));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      wake();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
    });
    io.observe(canvas);
    const onVisibility = () => {
      if (!document.hidden) wake();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // A function declaration, so the observers set up above can wake it before this line runs.
    function frame(now: number) {
      raf = 0;
      if (shared.broken) {
        if (!lostNotified) {
          lostNotified = true;
          lostRef.current?.();
        }
        return;
      }
      const materials = shared.materials;
      // Still loading: look again next frame.
      if (!materials) return wake();
      // Off screen or in a background tab: stop; the observers wake it again.
      if (!visible || document.hidden) return;
      const lookup = (key: string) => materials.get(key);
      const span = HOLD + MORPH;

      if (pausedRef.current && cfg.rest) {
        // At rest: the coin floats in place (the loop stops while off screen or in a background tab).
        asleep = true;
        wake();
        const rm = lookup(cfg.rest.material);
        if (!rm) return;
        gpu.request(rm, true);
        gpu.pump(1);
        if (!gpu.ready(rm.key)) return;
        // Warm the hover sequence too, so the flip starts at once.
        for (const s of sequence.slice(0, 2)) {
          const m = lookup(s.key);
          if (m && !gpu.ready(m.key)) gpu.request(m);
        }
        if (now - last < FRAME_MS - 2) return;
        last = now;
        const [yaw, pitch, roll] = motionAngles("float", now / 1000, [0, 0]);
        const state = stateFor(rm, cfg.rest.look, rotationMatrix(yaw, pitch, roll), now / 1000, [0, 0]);
        if (gpu.render(state, view.width, view.height)) drawn();
        return;
      }
      if (pausedRef.current) {
        // Asleep: only compile the first steps, so waking is instant; then stop.
        asleep = true;
        let pending = false;
        for (const s of sequence.slice(0, 2)) {
          const m = lookup(s.key);
          if (m && !gpu.ready(m.key)) {
            gpu.request(m, true);
            pending = true;
          }
        }
        gpu.pump(1);
        if (pending) wake();
        return;
      }
      wake();
      if (asleep) {
        asleep = false;
        shared.clock = cfg.wakeAt;
        last = 0;
      }
      // A little under the interval, so a 60 or 120 Hz screen always lands on the same beat.
      if (now - last < FRAME_MS - 2) return;
      const dt = Math.min(0.1, (now - (last || now)) / 1000);
      last = now;

      // Compile the step on screen and the next one, a program at a time.
      const seg = Math.floor(shared.clock / span) % sequence.length;
      for (let d = 0; d < 2; d++) {
        const m = lookup(sequence[(seg + d) % sequence.length].key);
        if (m) gpu.request(m, d === 0);
      }
      gpu.pump(1);

      const from = sequence[seg];
      const to = sequence[(seg + 1) % sequence.length];
      const fallback = lookup(from.key);
      // Draw as soon as the step on screen is compiled; the next one is only needed once its morph begins.
      if (!fallback || !gpu.ready(from.key)) return;
      if (shared.clock % span >= HOLD && !gpu.ready(to.key)) {
        // Hold at the start of the morph until the next material is ready.
        shared.clock = Math.floor(shared.clock / span) * span + HOLD;
      } else {
        shared.clock += dt;
      }
      const local = shared.clock % span;
      const p = local < HOLD ? 0 : Math.min(1, (local - HOLD) / MORPH);
      // Flip motion: a little drift, and one full turn over each morph.
      const [yaw, , roll] = motionAngles("flip", now / 1000, [0, 0]);
      const state = transmuteState(from, to, p, [yaw, 0, roll], shared.clock, [0, 0], fallback, lookup, true);
      if (gpu.render(state, view.width, view.height)) drawn();
    }
    wakeRef.current = wake;
    // A coin already drawn on an earlier page is shown straight away.
    if (shared.shown) drawn();
    wake();

    return () => {
      wakeRef.current = null;
      cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      // Detach only: the canvas and renderer live on for the next page.
      canvas.remove();
    };
  }, [variant]);

  return <span ref={host} className="block h-full w-full" />;
}
