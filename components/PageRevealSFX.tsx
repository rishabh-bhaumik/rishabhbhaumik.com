"use client";

import { useEffect } from "react";

const KEY = "rb-tab-count";

export default function PageRevealSFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const prev = parseInt(localStorage.getItem(KEY) || "0", 10);
    localStorage.setItem(KEY, String(prev + 1));

    if (prev === 0) {
      const audio = new Audio("/media/page-reveal.wav");
      audio.volume = 0.35;
      audio.play().catch(() => {});
    }

    const decrement = () => {
      const n = parseInt(localStorage.getItem(KEY) || "1", 10);
      localStorage.setItem(KEY, String(Math.max(0, n - 1)));
    };

    window.addEventListener("beforeunload", decrement);
    return () => {
      window.removeEventListener("beforeunload", decrement);
      decrement();
    };
  }, []);

  return null;
}
