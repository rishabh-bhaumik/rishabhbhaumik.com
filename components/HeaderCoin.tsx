"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The coin (renderer, shaders, the Default material) is a separate chunk that loads once the page is idle.
const CoinMark = dynamic(() => import("./logo-lab/CoinMark"), { ssr: false });

/**
 * The header's logo slot: the Default coin, floating, with a touch of dither
 * and chroma. Hovering (or focusing) the logo link makes it flip over as it
 * dithers. The plain mark stands in while the coin loads, and stays with
 * reduced motion or without WebGL2. The coin keeps the plain mark's size
 * (the slot is square, never more than 72px).
 */
export default function HeaderCoin() {
  const reduce = useReducedMotion();
  const slot = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState(false);

  // Warm the coin up once the page has settled.
  useEffect(() => {
    if (reduce) return;
    let id: number;
    const start = () => {
      id = window.setTimeout(() => setArmed(true), 300);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      window.clearTimeout(id);
    };
  }, [reduce]);

  // Hover and focus are read from the whole logo link, not just the slot.
  useEffect(() => {
    const link = slot.current?.closest("a");
    if (!link) return;
    const on = () => setHover(true);
    const off = () => setHover(false);
    link.addEventListener("pointerenter", on);
    link.addEventListener("pointerleave", off);
    link.addEventListener("focus", on);
    link.addEventListener("blur", off);
    return () => {
      link.removeEventListener("pointerenter", on);
      link.removeEventListener("pointerleave", off);
      link.removeEventListener("focus", on);
      link.removeEventListener("blur", off);
    };
  }, []);

  // The coin is the logo; the plain mark only stands in until it is drawing (and if it never can).
  const showCoin = ready;

  return (
    <span ref={slot} className="relative grid size-11 max-h-[72px] max-w-[72px] place-items-center">
      <Image
        src="/media/logo-mark.svg"
        alt=""
        width={32}
        height={32}
        className={`size-8 transition-opacity duration-200 ${showCoin ? "opacity-0" : "opacity-100"}`}
        priority
      />
      {armed && (
        // The coin is drawn with room around it to flip: in a front view the mark fills 65.7% of the canvas,
        // so a 48.7px canvas puts the mark at the plain logo's 32px, and the swap does not change its size.
        <span
          className={`absolute left-1/2 top-1/2 size-[48.7px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${showCoin ? "opacity-100" : "opacity-0"}`}
        >
          <CoinMark variant="header" paused={!hover} onReady={() => setReady(true)} />
        </span>
      )}
    </span>
  );
}
