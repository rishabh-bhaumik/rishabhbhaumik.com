"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Routes that never play sound effects (and hide the mute toggle). */
const SILENT_ROUTES = ["/logo"];

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

export function SfxProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const silent = useSilentRoute();

  const toggle = useCallback(() => setMuted((m) => !m), []);

  const play = useCallback(
    (src: string, volume = 0.4) => {
      if (muted || silent) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    },
    [muted, silent],
  );

  return (
    <SfxContext value={{ muted, toggle, play }}>
      {children}
    </SfxContext>
  );
}
