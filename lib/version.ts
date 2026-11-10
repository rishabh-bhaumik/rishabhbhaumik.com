import { SITE } from "@/data/site";

/**
 * The home hero pill: "shipped ’96 • v30.8", the year I was born, then my age as a
 * version, years.months, from my birthday (SITE.born: 28 February 1996). Each month
 * ticks over on the 28th, so it reads v30.11 until 27 February and v31.0 from the
 * 28th. The date is taken in Indian time (where the birthday is), whatever zone the
 * server runs in. Worked out when the page renders; the pages that show it rebuild
 * hourly, so the flip lands within the hour.
 */
export function versionLabel(now = new Date()) {
  const { year, month, day, timeZone } = SITE.born;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  let months = (get("year") - year) * 12 + (get("month") - month);
  // Before the 28th, this month's step hasn't come yet.
  if (get("day") < day) months -= 1;
  return `shipped ’${String(year).slice(-2)} • v${Math.floor(months / 12)}.${months % 12}`;
}
