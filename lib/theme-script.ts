/**
 * The parts of the theme that the server layout needs too, kept apart from the
 * client hook in lib/theme.ts (a server component can't import that file).
 */

export const THEME_KEY = "theme";
/** When a dark or light pick lapses back to auto: the next sunrise or sunset after it was made. */
export const THEME_UNTIL_KEY = "theme-until";

/** What's showing. */
export type Theme = "dark" | "light";
/** What the visitor picked: a theme, or auto (light from sunrise to sunset, dark otherwise). */
export type ThemeMode = Theme | "auto";

/** The mode before a visitor picks one: auto, following the sun. */
export const DEFAULT_MODE: ThemeMode = "auto";

/**
 * Today's sunrise and sunset where the visitor is (ms since the epoch). Where comes from the
 * browser's time zone: a table of rough coordinates for common zones, else the zone's region
 * for the latitude and its standard offset for the longitude. When comes from the usual
 * solar formulas (declination, equation of time, the sun 0.833° below the horizon), good to a
 * few minutes. Self-contained (no imports, no helpers), because THEME_SCRIPT inlines
 * its source to run before the first paint.
 */
export function sunTimes(now: Date): [number, number] {
  const ZONES: Record<string, number[]> = {
    "Asia/Kolkata": [21, 78.5],
    "Asia/Calcutta": [21, 78.5],
    "Asia/Dubai": [25.2, 55.3],
    "Asia/Singapore": [1.35, 103.8],
    "Asia/Tokyo": [35.7, 139.7],
    "Asia/Shanghai": [31.2, 121.5],
    "Asia/Hong_Kong": [22.3, 114.2],
    "Asia/Karachi": [24.9, 67],
    "Asia/Dhaka": [23.8, 90.4],
    "Asia/Kathmandu": [27.7, 85.3],
    "Asia/Colombo": [6.9, 79.9],
    "Europe/London": [51.5, -0.1],
    "Europe/Paris": [48.9, 2.35],
    "Europe/Berlin": [52.5, 13.4],
    "Europe/Amsterdam": [52.4, 4.9],
    "Europe/Madrid": [40.4, -3.7],
    "Europe/Rome": [41.9, 12.5],
    "America/New_York": [40.7, -74],
    "America/Chicago": [41.9, -87.6],
    "America/Denver": [39.7, -105],
    "America/Los_Angeles": [34.1, -118.2],
    "America/Toronto": [43.7, -79.4],
    "America/Sao_Paulo": [-23.5, -46.6],
    "America/Argentina/Buenos_Aires": [-34.6, -58.4],
    "America/Mexico_City": [19.4, -99.1],
    "Australia/Sydney": [-33.9, 151.2],
    "Australia/Melbourne": [-37.8, 145],
    "Africa/Johannesburg": [-26.2, 28],
    "Africa/Lagos": [6.5, 3.4],
    "Africa/Nairobi": [-1.3, 36.8],
    "Pacific/Auckland": [-36.8, 174.8],
  };
  const REGIONS: Record<string, number> = { Europe: 50, America: 38, Asia: 25, Africa: 5, Australia: -30, Pacific: -15, Atlantic: 35, Indian: -10 };
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {}
  const y = now.getFullYear();
  // Minutes west of UTC in standard time (the larger of January's and July's offsets).
  const std = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
  const region = tz.split("/")[0];
  const at = ZONES[tz] || [region in REGIONS ? REGIONS[region] : 25, -std / 4];
  const r = Math.PI / 180;
  const lat = at[0] * r;
  // The local date's midnight, as UTC; solar noon falls on the same local day from it.
  const day = Date.UTC(y, now.getMonth(), now.getDate());
  const d = (day - Date.UTC(2000, 0, 1, 12)) / 864e5 + 0.5;
  const g = (357.529 + 0.98560028 * d) * r;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * r;
  const e = (23.439 - 3.6e-7 * d) * r;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / r / 15;
  let eqt = q / 15 - ra;
  eqt -= 24 * Math.round(eqt / 24);
  const noon = 12 - at[1] / 15 - eqt;
  const c = (Math.sin(-0.833 * r) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
  // Polar night (no sunrise) or midnight sun (no sunset).
  const h = c >= 1 ? 0 : c <= -1 ? 12 : Math.acos(c) / r / 15;
  return [day + (noon - h) * 36e5, day + (noon + h) * 36e5];
}

/** Whether the sun is up where the visitor is. */
export function isDaytime(now = new Date()) {
  const [rise, set] = sunTimes(now);
  const t = now.getTime();
  return t >= rise && t < set;
}

/** The next sunrise or sunset after `now` (ms): when a dark or light pick lapses to auto. */
export function nextSunChange(now = new Date()) {
  const [rise, set] = sunTimes(now);
  const t = now.getTime();
  if (t < rise) return rise;
  if (t < set) return set;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return sunTimes(tomorrow)[0];
}

/** Routes that always render dark, whatever the visitor picked. */
const DARK_ONLY_ROUTES = ["/logo"];

export function isDarkOnlyRoute(pathname: string) {
  return DARK_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/**
 * A stored value as a mode. A dark or light pick holds until the next sunrise or sunset
 * after it was made (`until`), then auto takes over again; a pick without one (saved before
 * picks lapsed) counts as lapsed. Anything unknown is the default.
 */
export function parseMode(value: string | null, until = 0, now = new Date()): ThemeMode {
  if (value === "auto") return "auto";
  if (value === "dark" || value === "light") return until > now.getTime() ? value : "auto";
  return DEFAULT_MODE;
}

/** The theme a mode shows right now (auto follows the sun). */
export function resolveMode(mode: ThemeMode, now = new Date()): Theme {
  if (mode !== "auto") return mode;
  return isDaytime(now) ? "light" : "dark";
}

/**
 * Runs inline in <head>, before first paint, so a light-mode visitor never sees
 * a dark flash. Kept as a string because it executes before any bundle loads;
 * it repeats parseMode and resolveMode above, and carries sunTimes' own source.
 */
export const THEME_SCRIPT = `(function(){try{var S=${sunTimes.toString()};var n=new Date();var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});var u=+localStorage.getItem(${JSON.stringify(THEME_UNTIL_KEY)})||0;if(t==="dark"||t==="light"){if(!(u>n.getTime()))t="auto"}else if(t!=="auto")t=${JSON.stringify(
  DEFAULT_MODE,
)};if(t==="auto"){var s=S(n);t=(n.getTime()>=s[0]&&n.getTime()<s[1])?"light":"dark"}var p=location.pathname;var lock=${JSON.stringify(
  DARK_ONLY_ROUTES,
)}.some(function(r){return p===r||p.indexOf(r+"/")===0});document.documentElement.dataset.theme=(t==="light"&&!lock)?"light":"dark"}catch(e){}})()`;
