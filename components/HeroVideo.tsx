"use client";

import { useEffect, useRef, useState } from "react";
import { VIDEO_FEATHER } from "./videoFeather";

type Clip = { src: string; poster: string };

/** How far (s) the hidden clip may drift before it is snapped back in step. */
const MAX_DRIFT = 0.1;


/**
 * The home showreel: the "orbitting" clip in a dark and a light version that
 * share framing and timing frame for frame. Both are stacked and CSS shows the
 * one for the current theme, so switching theme is just the page's own
 * cross-fade. The hidden clip plays along on the same frame, so the swap never
 * jumps.
 *
 * Posters paint straight from the server HTML. The files only load once the
 * page has loaded and gone idle, the visible one first, and play only while
 * on screen. Under reduced motion the posters stay.
 */
export default function HeroVideo({ dark, light }: { dark: Clip; light: Clip }) {
  const darkRef = useRef<HTMLVideoElement>(null);
  const lightRef = useRef<HTMLVideoElement>(null);
  const [mount, setMount] = useState<"none" | "lead" | "both">("none");

  // Load after the page has settled; the clip on show first, then its partner.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let idle = 0;
    let timer = 0;
    const go = () => {
      const ric = window.requestIdleCallback;
      if (ric) idle = ric(() => setMount("lead"), { timeout: 2500 });
      else timer = window.setTimeout(() => setMount("lead"), 400);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const d = darkRef.current;
    const l = lightRef.current;
    if (mount === "none" || !d || !l) return;
    const isLight = () => document.documentElement.dataset.theme === "light";
    const lead = () => (isLight() ? l : d);
    const follow = () => (isLight() ? d : l);

    // Once the visible clip is playing, bring in the other one.
    const onPlaying = () => setMount("both");
    if (mount === "lead") lead().addEventListener("playing", onPlaying, { once: true });

    let onScreen = true;
    const sync = () => {
      const run = onScreen && !document.hidden;
      for (const v of [d, l]) {
        if (!v.src) continue;
        if (run) v.play().catch(() => {});
        else v.pause();
      }
    };
    // Keep the hidden clip on the visible one's frame.
    const align = () => {
      const a = lead();
      const b = follow();
      if (b.readyState >= 2 && Math.abs(b.currentTime - a.currentTime) > MAX_DRIFT) {
        b.currentTime = a.currentTime;
      }
    };

    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      sync();
    });
    io.observe(d);
    document.addEventListener("visibilitychange", sync);
    d.addEventListener("timeupdate", align);
    l.addEventListener("timeupdate", align);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      d.removeEventListener("timeupdate", align);
      l.removeEventListener("timeupdate", align);
      lead().removeEventListener("playing", onPlaying);
    };
  }, [mount]);

  // Which file each <video> gets: the visible one at "lead", both at "both".
  // Theme is read here (client only, after mount), never during the server render.
  const want = (which: "dark" | "light") => {
    if (mount === "both") return true;
    if (mount !== "lead") return false;
    const shown = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    return which === shown;
  };

  const video = "pointer-events-none absolute inset-0 h-full w-full object-cover";
  return (
    <>
      <video
        ref={darkRef}
        src={want("dark") ? dark.src : undefined}
        poster={dark.poster}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`${video} light:opacity-0`}
      />
      <video
        ref={lightRef}
        src={want("light") ? light.src : undefined}
        poster={light.poster}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        style={VIDEO_FEATHER}
        className={`${video} opacity-0 light:opacity-100`}
      />
    </>
  );
}
