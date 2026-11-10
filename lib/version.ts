import { SITE } from "@/data/site";

/**
 * The home hero pill: "shipped ’96 • v30.9", the year I was born, then my age as a
 * version, years.months (from SITE.born: February 1996). The months tick over on the
 * 1st, so it reads v30.10 in December and v31.0 each February. Worked out when the
 * page renders; the pages that show it rebuild daily, so it keeps up on its own.
 */
export function versionLabel(now = new Date()) {
  const { year, month } = SITE.born;
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return `shipped ’${String(year).slice(-2)} • v${Math.floor(months / 12)}.${months % 12}`;
}
