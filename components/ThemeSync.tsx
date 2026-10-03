"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { applyTheme } from "@/lib/theme";
import { THEME_KEY } from "@/lib/theme-script";

/**
 * Keeps <html data-theme> right after the first paint (which the inline
 * THEME_SCRIPT handles): on client-side navigation into or out of a dark-only
 * route, and when another tab changes the choice.
 */
export default function ThemeSync() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    applyTheme(pathname);
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) applyTheme(pathname);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  return null;
}
