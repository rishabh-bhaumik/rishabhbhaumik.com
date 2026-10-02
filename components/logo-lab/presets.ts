/**
 * Presets: named looks (a material, motion, filters or a whole transmute
 * sequence). Permanent ones ship with the site in public/logo-presets.json:
 * every visitor sees them, and in development they are edited in the lab and
 * written back to that file. A viewer's own are kept in their browser.
 */

export interface Preset {
  id: string;
  name: string;
  /** The look, in the settings encoding (see settings.ts). */
  look: string;
}

/** Permanent presets can be edited only while developing the site. */
export const CAN_EDIT_PERMANENT = process.env.NODE_ENV === "development";

const isPreset = (p: unknown): p is Preset =>
  !!p && typeof (p as Preset).id === "string" && typeof (p as Preset).name === "string" && typeof (p as Preset).look === "string";

/** The presets that ship with the site. */
export async function loadPermanent(): Promise<Preset[]> {
  try {
    const res = await fetch("/logo-presets.json", { cache: "no-store" });
    const list = (await res.json()) as unknown;
    return Array.isArray(list) ? list.filter(isPreset) : [];
  } catch {
    return [];
  }
}

/** Dev only: write the permanent presets back to public/logo-presets.json. */
export async function savePermanent(list: Preset[]): Promise<boolean> {
  if (!CAN_EDIT_PERMANENT) return false;
  try {
    const res = await fetch("/logo/presets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(list) });
    return res.ok;
  } catch {
    return false;
  }
}

const KEY = "logo-lab:presets";

export function loadPresets(): Preset[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Preset[]) : [];
    return Array.isArray(list) ? list.filter(isPreset) : [];
  } catch {
    return [];
  }
}

export function savePresets(list: Preset[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage blocked or full: the presets just don't outlive the page.
  }
}
