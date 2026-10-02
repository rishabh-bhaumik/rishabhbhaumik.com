"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The coin (renderer, shaders, a few materials) is a separate chunk, loaded once the hero has painted.
const CoinMark = dynamic(() => import("@/components/logo-lab/CoinMark"), { ssr: false });

/**
 * The About hero's picture: the mark as a coin that flips through a few
 * materials, on pure black. The coin is a quarter of the banner's height,
 * centred. It is drawn in a square 36% of the banner's height (the coin fills
 * 70% of that square), which leaves it room to flip. The plain mark shows
 * until the first frame is drawn, and stays with reduced motion or without
 * WebGL2.
 */
export default function HeroCoin() {
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const id = window.setTimeout(() => setArmed(true), 250);
    return () => window.clearTimeout(id);
  }, [reduce]);

  return (
    <div className="absolute inset-0">
      {/* The plain mark, until the coin is drawing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/logo-mark.svg"
        alt=""
        className={`absolute left-1/2 top-1/2 aspect-square h-[22%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {armed && (
        <div
          className={`absolute left-1/2 top-1/2 aspect-square h-[36%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        >
          <CoinMark variant="hero" onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}
