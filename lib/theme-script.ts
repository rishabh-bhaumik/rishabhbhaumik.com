/**
 * The parts of the theme that the server layout needs too, kept apart from the
 * client hook in lib/theme.ts (a server component can't import that file).
 */

export const THEME_KEY = "theme";

/** Routes that always render dark, whatever the visitor picked. */
const DARK_ONLY_ROUTES = ["/logo"];

export function isDarkOnlyRoute(pathname: string) {
  return DARK_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/**
 * Runs inline in <head>, before first paint, so a light-mode visitor never sees
 * a dark flash. Kept as a string because it executes before any bundle loads.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});var p=location.pathname;var lock=${JSON.stringify(
  DARK_ONLY_ROUTES,
)}.some(function(r){return p===r||p.indexOf(r+"/")===0});document.documentElement.dataset.theme=(t==="light"&&!lock)?"light":"dark"}catch(e){}})()`;
