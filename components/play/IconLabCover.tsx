"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { stateFor } from "@/components/logo-lab/frames";
import { buildGlyphAtlas, buildLogoField } from "@/components/logo-lab/logoField";
import { motionAngles } from "@/components/logo-lab/motion";
import { LogoRenderer, rotationMatrix } from "@/components/logo-lab/renderer";
import type { Look } from "@/components/logo-lab/settings";
import type { LogoMaterial } from "@/components/logo-lab/types";

/** At rest: Bishnupur Terracotta, VHS at 100%, the material's own relief and light, floating. */
const REST_KEY = "bishnupur-terracotta";
const REST_LOOK: Look = { relief: 1, light: null, filters: [{ key: "vhs", amount: 1 }] };
/** On hover: every material as a still, cut to the next every CUT_MS. No motion, no blending. */
const CUT_MS = 70;
const STILL_SIZE = 320;
const STILL_LOOK: Look = { relief: 1, light: null, filters: [] };
const STILL_ROT = rotationMatrix(0.32, 0.16, 0);
const FRAME_MS = 1000 / 60;

/** Stills outlive the card (it remounts when the gallery switches view), so each is made once per visit. */
const STILLS = new Map<string, ImageBitmap>();

/**
 * The Icon Lab card's cover. A live coin floats on black; while the card is
 * hovered (or focused) the cover cuts through every material in the lab, one
 * still after another. Shaders compile and the stills bake in the background
 * once the card is on screen. Without WebGL2, or with reduced motion, it is
 * the plain mark.
 */
export default function IconLabCover() {
  const reduce = useReducedMotion();
  const glRef = useRef<HTMLCanvasElement>(null);
  const cutRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    const canvas = glRef.current;
    const cut = cutRef.current;
    const scope = root?.closest<HTMLElement>("[data-card]") ?? root;
    const cutCtx = cut?.getContext("2d");
    if (!root || !canvas || !cut || !cutCtx || !scope) return;

    let cancelled = false;
    let raf = 0;
    let visible = false;
    let hovering = false;
    let hoverStart = 0;
    let last = 0;
    let drew = false;
    let renderer: LogoRenderer | null = null;
    let materials: LogoMaterial[] = [];
    let rest: LogoMaterial | undefined;
    let nextBake = 0;
    let baking = false;
    let started = false;
    let cutList: ImageBitmap[] = [];
    let cutSize = -1;
    let shown = -1;

    const start = async () => {
      if (started) return;
      started = true;
      try {
        renderer = new LogoRenderer(canvas);
        const [{ MATERIALS, materialByKey }, field] = await Promise.all([import("@/components/logo-lab/materials"), buildLogoField(384)]);
        if (cancelled) return;
        renderer.setField(field);
        renderer.setGlyphs(buildGlyphAtlas());
        materials = MATERIALS;
        rest = materialByKey(REST_KEY);
      } catch {
        renderer = null;
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const size = Math.min(640, Math.max(1, Math.round(rect.width * dpr)));
      canvas.width = size;
      canvas.height = size;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(root);

    const enter = () => {
      hovering = true;
      hoverStart = performance.now();
      shown = -1;
    };
    const leave = () => {
      hovering = false;
      cut.style.visibility = "hidden";
    };
    scope.addEventListener("pointerenter", enter);
    scope.addEventListener("pointerleave", leave);
    scope.addEventListener("focusin", enter);
    scope.addEventListener("focusout", leave);

    /** Compile what is next, and turn each compiled material into a still. */
    const bake = (r: LogoRenderer) => {
      while (nextBake < materials.length && STILLS.has(materials[nextBake].key)) nextBake++;
      for (let i = nextBake; i < Math.min(materials.length, nextBake + 2); i++) {
        if (!STILLS.has(materials[i].key)) r.request(materials[i]);
      }
      if (baking || nextBake >= materials.length) return;
      const m = materials[nextBake];
      const status = r.status(m.key);
      if (status === "error") {
        nextBake++;
        return;
      }
      if (status !== "ready") return;
      const job = r.thumbnail(stateFor(m, STILL_LOOK, STILL_ROT, m.heroTime ?? 1, [0, 0]), STILL_SIZE);
      if (!job) return;
      baking = true;
      nextBake++;
      job.then(async (blob) => {
        if (blob && !cancelled) {
          const bitmap = await createImageBitmap(blob).catch(() => null);
          if (bitmap) STILLS.set(m.key, bitmap);
        }
        baking = false;
      });
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const r = renderer;
      if (!r || !rest || !visible || document.hidden) return;

      r.request(rest, true);
      bake(r);
      r.pump(2);
      r.trim(new Set([rest.key, ...materials.slice(nextBake, nextBake + 2).map((m) => m.key)]), 10);

      if (hovering && STILLS.size) {
        // Hard cuts through every still, in library order.
        if (STILLS.size !== cutSize) {
          cutList = materials.filter((m) => STILLS.has(m.key)).map((m) => STILLS.get(m.key)!);
          cutSize = STILLS.size;
        }
        const index = Math.floor((now - hoverStart) / CUT_MS) % cutList.length;
        if (index !== shown) {
          shown = index;
          cutCtx.drawImage(cutList[index], 0, 0, cut.width, cut.height);
          cut.style.visibility = "visible";
        }
        return;
      }

      if (cut.style.visibility !== "hidden") cut.style.visibility = "hidden";
      // A little under the interval, so a 60 or 120 Hz screen lands on the same beat.
      if (now - last < FRAME_MS - 2) return;
      last = now;
      if (!r.ready(rest.key)) return;
      const [yaw, pitch, roll] = motionAngles("float", now / 1000, [0, 0]);
      const state = stateFor(rest, REST_LOOK, rotationMatrix(yaw, pitch, roll), now / 1000, [0, 0]);
      if (r.render(state, canvas.width, canvas.height) && !drew) {
        drew = true;
        setLive(true);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scope.removeEventListener("pointerenter", enter);
      scope.removeEventListener("pointerleave", leave);
      scope.removeEventListener("focusin", enter);
      scope.removeEventListener("focusout", leave);
      renderer?.dispose();
    };
  }, [reduce]);

  return (
    <div ref={rootRef} className="relative aspect-square h-[78%]">
      <Image
        src="/media/logo-mark.svg"
        alt=""
        width={96}
        height={96}
        className={`absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${live ? "opacity-0" : "opacity-100"}`}
      />
      <canvas ref={glRef} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />
      <canvas ref={cutRef} width={STILL_SIZE} height={STILL_SIZE} aria-hidden="true" className="invisible absolute inset-0 h-full w-full" />
    </div>
  );
}
