/**
 * The lab's settings and their text form. One encoding serves the URL hash
 * (every look is shareable) and saved presets.
 */

import { MATERIALS, materialByKey } from "./materials";
import { FILTERS, MOTIONS, TRANSITIONS, type FilterKey, type MotionKey, type TransitionKey } from "./types";

export interface FilterLayer {
  key: FilterKey;
  amount: number;
}

/** The per-material part of a look: what a transmute slot can tune on its own. */
export interface Look {
  /** Multiplier on the material's relief; negative flips raised <-> engraved. */
  relief: number;
  /** null = the material's own light angle. */
  light: number | null;
  filters: FilterLayer[];
}

/** One step of a transmute sequence: a material, its own look, and how it gives way to the next. */
export interface Slot extends Look {
  key: string;
  transition: TransitionKey;
}

export interface Settings extends Look {
  material: string;
  motion: MotionKey;
  loop: boolean;
  speed: number;
  transmute: Slot[];
  transmuteOn: boolean;
  /** Seconds each material holds before morphing to the next. */
  hold: number;
  /** Seconds each morph takes. */
  morphTime: number;
}


export const DEFAULTS: Settings = {
  material: MATERIALS[0].key,
  motion: "float",
  loop: true,
  speed: 1,
  relief: 1,
  light: null,
  filters: [],
  transmute: [],
  transmuteOn: false,
  hold: 2,
  morphTime: 1.6,
};

const encodeFilters = (filters: FilterLayer[]) =>
  filters
    .filter((l) => l.key !== "none")
    .map((l) => `${l.key}:${l.amount.toFixed(2)}`)
    .join("+");

const decodeFilters = (text: string): FilterLayer[] =>
  text
    .split("+")
    .filter(Boolean)
    .map((s) => {
      const [key, amount] = s.split(":");
      return { key: (FILTERS.some((x) => x.key === key) ? key : "none") as FilterKey, amount: Number(amount) || 1 };
    });

/**
 * A slot as `key*relief*light*filters*transition`, trailing defaults dropped:
 * `lava`, `lava*1.5`, `lava**120*thermal:0.80`, `lava****dither`.
 */
const encodeSlot = (slot: Slot) => {
  const parts = [
    slot.key,
    slot.relief !== 1 ? String(slot.relief) : "",
    slot.light !== null ? String(Math.round(slot.light)) : "",
    encodeFilters(slot.filters),
    slot.transition !== "stroke" ? slot.transition : "",
  ];
  while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();
  return parts.join("*");
};

const decodeSlot = (text: string): Slot | null => {
  const [key, relief, light, filters, transition] = text.split("*");
  if (!materialByKey(key)) return null;
  return {
    key,
    relief: relief ? Number(relief) || 1 : 1,
    light: light ? Number(light) : null,
    filters: filters ? decodeFilters(filters) : [],
    transition: TRANSITIONS.find((t) => t.key === transition)?.key ?? "stroke",
  };
};

/** A slot holding the current look. */
export const slotFrom = (s: Settings): Slot => ({ key: s.material, relief: s.relief, light: s.light, filters: s.filters, transition: "stroke" });

/** Settings as a query string; defaults are left out. */
export function encodeSettings(s: Settings): string {
  const q = new URLSearchParams();
  q.set("m", s.material);
  q.set("mo", s.motion);
  q.set("lp", s.loop ? "1" : "0");
  if (s.speed !== DEFAULTS.speed) q.set("sp", String(s.speed));
  if (s.relief !== DEFAULTS.relief) q.set("re", String(s.relief));
  if (s.light !== null) q.set("li", String(Math.round(s.light)));
  const f = encodeFilters(s.filters);
  if (f) q.set("f", f);
  if (s.transmute.length) q.set("tx", s.transmute.map(encodeSlot).join(","));
  if (s.transmuteOn) q.set("tn", "1");
  if (s.hold !== DEFAULTS.hold) q.set("ho", String(s.hold));
  if (s.morphTime !== DEFAULTS.morphTime) q.set("mt", String(s.morphTime));
  return q.toString();
}

/** The settings a query string names; unknown materials, motions and filters are dropped. */
export function decodeSettings(text: string): Partial<Settings> {
  const q = new URLSearchParams(text);
  const out: Partial<Settings> = {};
  const m = q.get("m");
  if (m && materialByKey(m)) out.material = m;
  const mo = q.get("mo");
  if (mo && MOTIONS.some((x) => x.key === mo)) out.motion = mo as MotionKey;
  if (q.has("lp")) out.loop = q.get("lp") === "1";
  if (q.has("sp")) out.speed = Number(q.get("sp")) || DEFAULTS.speed;
  if (q.has("re")) out.relief = Number(q.get("re"));
  if (q.has("li")) out.light = Number(q.get("li"));
  // Filters were once comma-separated; both read.
  const f = q.get("f");
  if (f) out.filters = decodeFilters(f.replace(/,/g, "+"));
  const tx = q.get("tx");
  if (tx)
    out.transmute = tx
      .split(",")
      .map(decodeSlot)
      .filter((x): x is Slot => !!x);
  if (q.has("tn")) out.transmuteOn = q.get("tn") === "1" && (out.transmute?.length ?? 0) >= 2;
  if (q.has("ho")) out.hold = Number(q.get("ho")) || DEFAULTS.hold;
  if (q.has("mt")) out.morphTime = Number(q.get("mt")) || DEFAULTS.morphTime;
  return out;
}
