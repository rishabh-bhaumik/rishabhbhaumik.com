"use client";

import { useEffect } from "react";

export default function PageRevealSFX() {
  useEffect(() => {
    if (sessionStorage.getItem("page-reveal-played")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sessionStorage.setItem("page-reveal-played", "1");
    const audio = new Audio("/media/page-reveal.wav");
    audio.volume = 0.35;
    audio.play().catch(() => {});
  }, []);

  return null;
}
