"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  DEFAULT_MODE,
  isDarkOnlyRoute,
  nextSunChange,
  parseMode,
  resolveMode,
  THEME_KEY as KEY,
  THEME_UNTIL_KEY as UNTIL,
  type Theme,
  type ThemeMode,
} from "./theme-script";

/**
 * Light / dark theme. The mode is auto by default (light from local sunrise to sunset,
 * dark otherwise; see sunTimes). The dock's mode control (components/Dock) switches
 * dark/light, and that pick holds until the next sunrise or sunset, when auto takes over
 * again; both are kept in localStorage. The theme it resolves to is written to
 * <html data-theme>, which the light tokens in globals.css key off; ThemeSync keeps it in
 * step with the sun and with lapsing picks.
 *
 * Some routes are designed only in dark and ignore the choice: the theme there
 * stays dark and the switch is disabled.
 */
export type { Theme, ThemeMode } from "./theme-script";

const EVENT = "themechange";

export { isDarkOnlyRoute } from "./theme-script";

/** The saved mode, read fresh (the hooks lag a click while the cross-fade runs). */
export function readMode(): ThemeMode {
  try {
    return parseMode(localStorage.getItem(KEY), Number(localStorage.getItem(UNTIL)) || 0);
  } catch {
    return DEFAULT_MODE;
  }
}

/** Writes the effective theme for the current route onto <html>. */
export function applyTheme(pathname: string) {
  const theme = isDarkOnlyRoute(pathname) ? "dark" : resolveMode(readMode());
  document.documentElement.dataset.theme = theme;
}

/** Re-applies and tells the hooks: for auto crossing sunrise or sunset, or a pick lapsing. */
export function refreshTheme(pathname: string) {
  applyTheme(pathname);
  window.dispatchEvent(new Event(EVENT));
}

/** Saves the mode and repaints, cross-fading the whole page where supported. */
export function setTheme(next: ThemeMode, pathname: string) {
  try {
    localStorage.setItem(KEY, next);
    // A dark or light pick lasts until the next sunrise or sunset; auto needs no end.
    if (next === "auto") localStorage.removeItem(UNTIL);
    else localStorage.setItem(UNTIL, String(nextSunChange()));
  } catch {
    // Private mode etc.: the switch still works for this page view.
  }
  const swap = () => refreshTheme(pathname);
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

/** The visitor's mode. The default on the server and during hydration. */
export function useThemePreference(): ThemeMode {
  return useSyncExternalStore(subscribe, readMode, () => DEFAULT_MODE);
}

/** The theme actually showing on this route (dark on dark-only routes). */
export function useTheme(): Theme {
  const pathname = usePathname() ?? "/";
  const theme = useSyncExternalStore(
    subscribe,
    () => resolveMode(readMode()),
    () => "dark" as const,
  );
  return isDarkOnlyRoute(pathname) ? "dark" : theme;
}
