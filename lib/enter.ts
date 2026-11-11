/**
 * The /enter splash. A visit that loads the home page fresh is sent there first,
 * once per browser session, so its Enter click can start the music: browsers only
 * allow sound after an interaction. Server-safe (the layout's <head> uses it).
 */
export const ENTER_KEY = "entered";
export const ENTER_ROUTE = "/enter";
/** Fired on window when a splash's Enter is clicked (/enter or the 404). */
export const SPLASH_ENTER = "splash:enter";

/**
 * Runs inline in <head>, before first paint: on home, if this session hasn't
 * entered yet and it isn't a crawler (they index home itself), go to /enter. On
 * /enter itself, a reload mustn't restore a scroll position: the splash has to sit
 * exactly where home's hero does (the Enter click turns restoration back on).
 */
export const ENTER_SCRIPT = `(function(){try{if(location.pathname===${JSON.stringify(
  ENTER_ROUTE,
)})history.scrollRestoration="manual";if(location.pathname==="/"&&!sessionStorage.getItem(${JSON.stringify(
  ENTER_KEY,
)})&&!/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(navigator.userAgent))location.replace(${JSON.stringify(
  ENTER_ROUTE,
)})}catch(e){}})()`;
