import type { LogoMaterial } from "../types";
import { BENGAL } from "./bengal";
import { DESIGN } from "./design";
import { EARTH } from "./earth";
import { INDIA } from "./india";
import { LIVING } from "./living";
import { SIGNAL } from "./signal";
import { TECH } from "./tech";

/** Every material, in library order. */
export const MATERIALS: LogoMaterial[] = [...BENGAL, ...INDIA, ...DESIGN, ...TECH, ...SIGNAL, ...EARTH, ...LIVING];

const BY_KEY = new Map(MATERIALS.map((m) => [m.key, m]));
export const materialByKey = (key: string) => BY_KEY.get(key);
