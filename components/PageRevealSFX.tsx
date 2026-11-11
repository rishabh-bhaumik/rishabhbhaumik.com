"use client";

import { useEffect } from "react";
import { SPLASH_ENTER } from "@/lib/enter";
import { useSilentRoute } from "@/lib/sfx";

const KEY = "rb-tab-count";

export default function PageRevealSFX() {
  const silent = useSilentRoute();
  useEffect(() => {
    if (silent) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let counted = false;
    const reveal = () => {
      counted = true;
      const prev = parseInt(localStorage.getItem(KEY) || "0", 10);
      localStorage.setItem(KEY, String(prev + 1));

      if (prev === 0) {
        const audio = new Audio("/media/page-reveal.mp3");
        audio.volume = 0.16;
        audio.play().catch(() => {});
      }
    };

    const decrement = () => {
      if (!counted) return;
      const n = parseInt(localStorage.getItem(KEY) || "1", 10);
      localStorage.setItem(KEY, String(Math.max(0, n - 1)));
    };

    // Held back while a splash is up (/enter, the 404: no sound before a click); it
    // plays on Enter, as home arrives.
    const held = document.querySelector('[data-splash="on"]') !== null;
    if (held) window.addEventListener(SPLASH_ENTER, reveal, { once: true });
    else reveal();

    window.addEventListener("beforeunload", decrement);
    return () => {
      window.removeEventListener(SPLASH_ENTER, reveal);
      window.removeEventListener("beforeunload", decrement);
      decrement();
      counted = false;
    };
  }, [silent]);

  return null;
}
