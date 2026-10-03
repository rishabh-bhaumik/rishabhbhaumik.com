"use client";

import { useEffect, useRef } from "react";
import LazyVideo from "@/components/LazyVideo";

/**
 * The light clip is a small box mid-card, and browsers draw video a level or two
 * off CSS colour, so its edge would show. An oval fade (solid over the coin,
 * which fills 70% of the clip's height) melts it into the card instead.
 */
const OVAL = "radial-gradient(ellipse 50% 50% at 50% 50%, #000 74%, transparent 100%)";
const COIN_FADE: React.CSSProperties = { maskImage: OVAL, WebkitMaskImage: OVAL };

/**
 * The About hero's picture: the mark as a coin flipping through a few
 * materials. A pre-rendered loop from the logo lab (no WebGL on this page): its
 * poster paints at once, and the clip plays only while on screen. The coin
 * fills 70% of the clip's height, and the clip is 36% of the banner's height,
 * so the coin is a quarter of the banner, centred.
 *
 * Two versions of the same loop: on black, and keyed onto the light page
 * colour. CSS shows the one for the theme; the hidden one is kept on the same
 * frame so switching never jumps.
 */
export default function HeroCoin() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [dark, light] = Array.from(root.current?.querySelectorAll("video") ?? []);
    if (!dark || !light) return;
    const align = () => {
      const shown = document.documentElement.dataset.theme === "light" ? light : dark;
      const other = shown === dark ? light : dark;
      if (other.readyState >= 2 && Math.abs(other.currentTime - shown.currentTime) > 0.1) other.currentTime = shown.currentTime;
    };
    dark.addEventListener("timeupdate", align);
    light.addEventListener("timeupdate", align);
    return () => {
      dark.removeEventListener("timeupdate", align);
      light.removeEventListener("timeupdate", align);
    };
  }, []);

  const clip = "absolute left-1/2 top-1/2 aspect-[624/400] h-[36%] w-auto -translate-x-1/2 -translate-y-1/2 object-contain";
  return (
    <div ref={root} className="absolute inset-0">
      <LazyVideo src="/media/about/hero-coin.mp4" poster="/media/about/hero-coin.webp" warm className={`${clip} light:opacity-0`} />
      <LazyVideo
        src="/media/about/hero-coin-light.mp4"
        poster="/media/about/hero-coin-light.webp"
        warm
        style={COIN_FADE}
        className={`${clip} opacity-0 light:opacity-100`}
      />
    </div>
  );
}
