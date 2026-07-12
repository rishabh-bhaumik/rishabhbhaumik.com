"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

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

export function SfxProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);

  const toggle = useCallback(() => setMuted((m) => !m), []);

  const play = useCallback(
    (src: string, volume = 0.4) => {
      if (muted) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    },
    [muted],
  );

  return (
    <SfxContext value={{ muted, toggle, play }}>
      {children}
    </SfxContext>
  );
}
