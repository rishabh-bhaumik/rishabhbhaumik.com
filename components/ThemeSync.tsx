"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { applyTheme, refreshTheme } from "@/lib/theme";
import { THEME_KEY } from "@/lib/theme-script";

/**
 * Keeps <html data-theme> right after the first paint (which the inline
 * THEME_SCRIPT handles): on client-side navigation into or out of a dark-only
 * route, when another tab changes the choice, and in auto mode as the local
 * clock passes sunrise or sunset (checked each minute and on returning to the tab).
 */
export default function ThemeSync() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    applyTheme(pathname);
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) applyTheme(pathname);
    };
    const tick = () => refreshTheme(pathname);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    const id = window.setInterval(tick, 60_000);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
