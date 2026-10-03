"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { isDarkOnlyRoute, THEME_KEY as KEY } from "./theme-script";

/**
 * Light / dark theme. Dark is the site's default; the visitor's choice is kept
 * in localStorage and written to <html data-theme>, which the light tokens in
 * globals.css key off. The header clock is the switch (components/LocalClock).
 *
 * Some routes are designed only in dark and ignore the choice: the theme there
 * stays dark and the clock is not a switch.
 */
export type Theme = "dark" | "light";

const EVENT = "themechange";

export { isDarkOnlyRoute } from "./theme-script";

function readPreference(): Theme {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** Writes the effective theme for the current route onto <html>. */
export function applyTheme(pathname: string) {
  const theme = isDarkOnlyRoute(pathname) ? "dark" : readPreference();
  document.documentElement.dataset.theme = theme;
}

/** Saves the choice and repaints, cross-fading the whole page where supported. */
export function setTheme(next: Theme, pathname: string) {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Private mode etc.: the switch still works for this page view.
  }
  const swap = () => {
    applyTheme(pathname);
    window.dispatchEvent(new Event(EVENT));
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && document.startViewTransition) {
    // A skipped transition (e.g. the tab is hidden) still runs swap; it only
    // rejects `ready`, which needs no handling.
    document.startViewTransition(swap).ready.catch(() => {});
  } else swap();
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // Another tab changed it.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The visitor's saved choice. Dark on the server and during hydration. */
export function useThemePreference(): Theme {
  return useSyncExternalStore(subscribe, readPreference, () => "dark");
}

/** The theme actually showing on this route (dark on dark-only routes). */
export function useTheme(): Theme {
  const pathname = usePathname() ?? "/";
  const preference = useThemePreference();
  return isDarkOnlyRoute(pathname) ? "dark" : preference;
}
