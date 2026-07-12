"use client";

import { useEffect, useRef } from "react";
import { useSfx } from "@/lib/sfx";

const SOUNDS = ["/media/Click01.wav", "/media/Click02.wav"];

const INTERACTIVE = "a, button, [role='button'], input[type='submit'], [data-clickable]";

export default function ClickSFX() {
  const lastRef = useRef(-1);
  const { play } = useSfx();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handler = (e: Event) => {
      const t = e.target as HTMLElement;
      if (!t.closest(INTERACTIVE)) return;
      if (t.closest("[data-no-click-sfx]")) return;

      let idx = Math.floor(Math.random() * SOUNDS.length);
      if (idx === lastRef.current) idx = (idx + 1) % SOUNDS.length;
      lastRef.current = idx;
      play(SOUNDS[idx], 0.4);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [play]);

  return null;
}
