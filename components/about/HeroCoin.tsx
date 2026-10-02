"use client";

import LazyVideo from "@/components/LazyVideo";

/**
 * The About hero's picture: the mark as a coin flipping through a few
 * materials, on pure black. A pre-rendered loop from the logo lab (no WebGL
 * on this page): its poster paints at once, and the clip plays only while on
 * screen. The coin fills 70% of the clip's height, and the clip is 36% of the
 * banner's height, so the coin is a quarter of the banner, centred.
 */
export default function HeroCoin() {
  return (
    <div className="absolute inset-0">
      <LazyVideo
        src="/media/about/hero-coin.mp4"
        poster="/media/about/hero-coin.webp"
        warm
        className="absolute left-1/2 top-1/2 aspect-[624/400] h-[36%] w-auto -translate-x-1/2 -translate-y-1/2 object-contain"
      />
    </div>
  );
}
