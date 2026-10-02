"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Routes that never play sound effects (and hide the mute toggle). */
const SILENT_ROUTES = ["/logo"];

/** Sounds worth having decoded before they are first needed. */
const WARM = ["/media/Click01.mp3", "/media/Click02.mp3"];

/** True on a route that should stay silent. */
export function useSilentRoute() {
  const pathname = usePathname() ?? "";
  return SILENT_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

type SfxContextValue = {
  muted: boolean;
  toggle: () => void;
  play: (src: string, volume?: number) => void;
};

const SfxContext = createContext<SfxContextValue>({
  muted: false,
  toggle: () => {},
  play: () => {},
});

export function useSfx() {
  return useContext(SfxContext);
}

/**
 * One shared AudioContext and a cache of decoded sounds: each file is fetched
 * and decoded once, and every play after that is instant (no new <audio>
 * element and decode per click). The context is made on the first gesture.
 */
let ctx: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function load(src: string): Promise<AudioBuffer | null> {
  let job = buffers.get(src);
  if (!job) {
    const c = audioContext();
    if (!c) return Promise.resolve(null);
    job = fetch(src)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((data) => c.decodeAudioData(data))
      .catch(() => null);
    buffers.set(src, job);
  }
  return job;
}

export function SfxProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const silent = useSilentRoute();

  // On the first gesture, start the audio context and decode the common sounds while idle.
  useEffect(() => {
    const first = () => {
      if (!audioContext()) return;
      const warm = () => WARM.forEach(load);
      if (window.requestIdleCallback) window.requestIdleCallback(warm, { timeout: 1500 });
      else window.setTimeout(warm, 200);
    };
    window.addEventListener("pointerdown", first, { once: true, capture: true });
    window.addEventListener("keydown", first, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", first, { capture: true });
      window.removeEventListener("keydown", first, { capture: true });
    };
  }, []);

  const toggle = useCallback(() => setMuted((m) => !m), []);

  const play = useCallback(
    (src: string, volume = 0.4) => {
      // Silent calls fetch nothing.
      if (volume <= 0 || muted || silent) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const c = audioContext();
      if (!c) return;
      if (c.state === "suspended") c.resume().catch(() => {});
      load(src).then((buffer) => {
        if (!buffer) return;
        const source = c.createBufferSource();
        const gain = c.createGain();
        source.buffer = buffer;
        gain.gain.value = volume;
        source.connect(gain).connect(c.destination);
        source.start();
      });
    },
    [muted, silent],
  );

  const value = useMemo(() => ({ muted, toggle, play }), [muted, toggle, play]);

  return <SfxContext value={value}>{children}</SfxContext>;
}
