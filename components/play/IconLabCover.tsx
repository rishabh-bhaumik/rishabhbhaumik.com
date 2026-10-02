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
/** The float is slow; 30 frames a second is plenty and halves the cost. */
const FRAME_MS = 1000 / 30;
/**
 * On hover: a pre-rendered clip of the coin (made with the lab and finished
 * in ASCII Magic), so no visitor compiles a single extra shader for it.
 */
const HOVER_CLIP = "/media/iconlab/hover.mp4";

/**
 * The Icon Lab card's cover. A live coin floats on black; while the card is
 * hovered (or focused) the cover plays the hover clip from the start. The coin starts
 * once the card is on screen and the page is idle, and only draws while
 * visible. Without WebGL2, or with reduced motion, it is the plain mark.
 */
export default function IconLabCover() {
  const reduce = useReducedMotion();
  const glRef = useRef<HTMLCanvasElement>(null);
  const clipRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Hover and focus anywhere on the card play the hover clip.
  useEffect(() => {
    const root = rootRef.current;
    const video = clipRef.current;
    const scope = root?.closest<HTMLElement>("[data-card]") ?? root;
    if (!scope || !video) return;
    const enter = () => {
      if (video.preload !== "auto") video.preload = "auto";
      video.currentTime = 0;
      video.play().catch(() => {});
      setHovering(true);
    };
    const leave = () => {
      video.pause();
      setHovering(false);
    };
    // Fetch the clip ahead once the pointer is anywhere over the gallery.
    const warm = () => {
      if (video.preload === "none") video.preload = "auto";
    };
    const grid = scope.parentElement;
    grid?.addEventListener("pointerover", warm, { once: true });
    scope.addEventListener("pointerenter", enter);
    scope.addEventListener("pointerleave", leave);
    scope.addEventListener("focusin", enter);
    scope.addEventListener("focusout", leave);
    return () => {
      grid?.removeEventListener("pointerover", warm);
      scope.removeEventListener("pointerenter", enter);
      scope.removeEventListener("pointerleave", leave);
      scope.removeEventListener("focusin", enter);
      scope.removeEventListener("focusout", leave);
    };
  }, []);

  // The live coin at rest.
  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    const canvas = glRef.current;
    if (!root || !canvas) return;
    const view: HTMLCanvasElement = canvas;

    let cancelled = false;
    let raf = 0;
    let visible = false;
    let last = 0;
    let drew = false;
    let started = false;
    let renderer: LogoRenderer | null = null;
    let rest: LogoMaterial | undefined;

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (started) return;
      started = true;
      const go = async () => {
        try {
          renderer = new LogoRenderer(canvas);
          // Only the one material it shows, not the whole library.
          const [{ BENGAL }, field] = await Promise.all([import("@/components/logo-lab/materials/bengal"), buildLogoField(384)]);
          if (cancelled) return;
          renderer.setField(field);
          renderer.setGlyphs(buildGlyphAtlas());
          rest = BENGAL.find((m) => m.key === REST_KEY);
          wake();
        } catch {
          renderer = null;
        }
      };
      if (window.requestIdleCallback) window.requestIdleCallback(() => go(), { timeout: 2000 });
      else window.setTimeout(go, 200);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const size = Math.min(640, Math.max(1, Math.round(rect.width * dpr)));
      if (canvas.width === size && canvas.height === size) return;
      canvas.width = size;
      canvas.height = size;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        start();
        wake();
      }
    });
    io.observe(root);
    const onVisibility = () => wake();
    document.addEventListener("visibilitychange", onVisibility);

    // A function declaration, so the observers set up above can wake it before this line runs.
    function frame(now: number) {
      raf = 0;
      const r = renderer;
      // Off screen or in a background tab: stop; the observers wake it again.
      if (!r || !rest || !visible || document.hidden) return;
      wake();
      r.request(rest, true);
      r.pump(1);
      if (now - last < FRAME_MS - 2) return;
      last = now;
      if (!r.ready(rest.key)) return;
      const [yaw, pitch, roll] = motionAngles("float", now / 1000, [0, 0]);
      const state = stateFor(rest, REST_LOOK, rotationMatrix(yaw, pitch, roll), now / 1000, [0, 0]);
      if (r.render(state, view.width, view.height) && !drew) {
        drew = true;
        setLive(true);
      }
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      renderer?.dispose();
      // Unmounted for real (not a dev double-mount): give the GPU context back.
      if (renderer && !canvas.isConnected) canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
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
      <canvas
        ref={glRef}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`}
      />
      {/* Over the coin, so the coin shows through until the clip's first frame arrives. */}
      <video
        ref={clipRef}
        src={HOVER_CLIP}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full ${hovering ? "visible" : "invisible"}`}
      />
    </div>
  );
}
