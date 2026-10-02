/**
 * Logo lab types. A material is a small GLSL program fragment (see
 * glsl/prelude.ts for the API it can use) plus the metadata the library and
 * controls need. Everything else — the coin, motion, filters, morphing — is
 * shared by every material.
 */

export const CATEGORIES = [
  { key: "default", label: "Default" },
  { key: "bengal", label: "Bengal" },
  { key: "india", label: "India" },
  { key: "design", label: "Design" },
  { key: "tech", label: "Tech" },
  { key: "earth", label: "Earth" },
  { key: "living", label: "Living" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export interface LogoMaterial {
  key: string;
  label: string;
  category: CategoryKey;
  /** Relief height in logo units (the logo's radius is 1). Negative engraves. */
  relief: number;
  /** One line on what the loop does. */
  loop: string;
  /** GLSL: must define `vec3 shade(Hit h)`; may opt into hooks (see prelude). */
  glsl: string;
  /** Loop time used for thumbnails and as the starting frame. */
  heroTime?: number;
  /** Default light azimuth in degrees (0 = from the right, 90 = from above). */
  light?: number;
}

export const FILTERS = [
  { key: "none", label: "None" },
  { key: "lens", label: "Lens" },
  { key: "thermal", label: "Thermal" },
  { key: "dither", label: "1-bit dither" },
  { key: "crt", label: "CRT" },
  { key: "vhs", label: "VHS" },
  { key: "halftone", label: "Halftone" },
  { key: "riso", label: "Risograph" },
  { key: "anamorphic", label: "Anamorphic flare" },
  { key: "grain", label: "Film grain" },
  { key: "chroma", label: "Chromatic aberration" },
] as const;

export type FilterKey = (typeof FILTERS)[number]["key"];

/**
 * How one transmute step gives way to the next. The index is the morph
 * shader's `uStyle` (glsl/filters.ts), so only ever append; saved looks store
 * the key. `group` sorts the picker.
 */
export const TRANSITIONS = [
  { key: "stroke", label: "Stroke dissolve", group: "Mark" },
  { key: "dither", label: "Dither dissolve", group: "Signal" },
  { key: "none", label: "None", group: "Basic" },
  { key: "crossfade", label: "Crossfade", group: "Basic" },
  { key: "part", label: "Part by part", group: "Mark" },
  { key: "pixelate", label: "Pixelate", group: "Graphic" },
  { key: "glitch", label: "Glitch", group: "Signal" },
  { key: "halftone", label: "Halftone", group: "Graphic" },
  { key: "blinds", label: "Blinds", group: "Graphic" },
  { key: "tiles", label: "Tile flip", group: "Graphic" },
  { key: "roll", label: "TV roll", group: "Signal" },
  { key: "liquid", label: "Liquid", group: "Graphic" },
  { key: "channels", label: "Channel shift", group: "Signal" },
  { key: "thermal", label: "Heat", group: "Signal" },
  { key: "posterize", label: "Posterize", group: "Graphic" },
  { key: "static", label: "Static", group: "Signal" },
  { key: "flash", label: "Flash", group: "Basic" },
  { key: "smear", label: "Motion smear", group: "Graphic" },
  { key: "flip", label: "Coin flip", group: "Coin" },
] as const;

export const TRANSITION_GROUPS = ["Basic", "Mark", "Graphic", "Signal", "Coin"] as const;
/** The style index of a transition key (0 = stroke dissolve for anything unknown). */
export const transitionIndex = (key: string) => Math.max(0, TRANSITIONS.findIndex((t) => t.key === key));

export type TransitionKey = (typeof TRANSITIONS)[number]["key"];

export const MOTIONS = [
  { key: "still", label: "Still" },
  { key: "spin", label: "Coin spin" },
  { key: "flip", label: "Flip" },
  { key: "float", label: "Float" },
  { key: "follow", label: "Follow pointer" },
] as const;

export type MotionKey = (typeof MOTIONS)[number]["key"];
