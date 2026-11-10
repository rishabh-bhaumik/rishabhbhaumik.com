/**
 * The parts of the theme that the server layout needs too, kept apart from the
 * client hook in lib/theme.ts (a server component can't import that file).
 */

export const THEME_KEY = "theme";

/** What's showing. */
export type Theme = "dark" | "light";
/** What the visitor picked: a theme, or auto (light by day, dark by night). */
export type ThemeMode = Theme | "auto";

/** The mode before a visitor picks one. Auto is ready; the site starts dark for now. */
export const DEFAULT_MODE: ThemeMode = "dark";

/** Auto's day: local sunrise to sunset, taken as the standard 06:00 to 18:00. */
const SUNRISE_HOUR = 6;
const SUNSET_HOUR = 18;

/** Routes that always render dark, whatever the visitor picked. */
const DARK_ONLY_ROUTES = ["/logo"];

export function isDarkOnlyRoute(pathname: string) {
  return DARK_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** A stored value as a mode; anything unknown is the default. */
export function parseMode(value: string | null): ThemeMode {
  return value === "dark" || value === "light" || value === "auto" ? value : DEFAULT_MODE;
}

/** The theme a mode shows right now (auto reads the local clock). */
export function resolveMode(mode: ThemeMode, now = new Date()): Theme {
  if (mode !== "auto") return mode;
  const h = now.getHours();
  return h >= SUNRISE_HOUR && h < SUNSET_HOUR ? "light" : "dark";
}

/**
 * Runs inline in <head>, before first paint, so a light-mode visitor never sees
 * a dark flash. Kept as a string because it executes before any bundle loads;
 * it repeats parseMode and resolveMode above.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t!=="dark"&&t!=="light"&&t!=="auto")t=${JSON.stringify(
  DEFAULT_MODE,
)};if(t==="auto"){var h=new Date().getHours();t=(h>=${SUNRISE_HOUR}&&h<${SUNSET_HOUR})?"light":"dark"}var p=location.pathname;var lock=${JSON.stringify(
  DARK_ONLY_ROUTES,
)}.some(function(r){return p===r||p.indexOf(r+"/")===0});document.documentElement.dataset.theme=(t==="light"&&!lock)?"light":"dark"}catch(e){}})()`;
