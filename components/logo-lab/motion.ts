import type { MotionKey } from "./types";

/** Cubic ease in-out, 0..1. */
export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/** Yaw, pitch and roll (radians) for a motion mode at time t (s). `pointer` is -1..1. */
export function motionAngles(mode: MotionKey, t: number, pointer: [number, number]): [number, number, number] {
  switch (mode) {
    case "spin":
      return [t * 0.9, 0.12 * Math.sin(t * 0.5), 0];
    case "flip": {
      // A toss every 3.6s: a full turn about x with an ease, then rest.
      const period = 3.6;
      const phase = (t % period) / period;
      const p = Math.min(1, phase / 0.42);
      const eased = easeInOutCubic(p);
      return [0.18 * Math.sin(t * 0.7), eased * Math.PI * 2, 0.06 * Math.sin(t)];
    }
    case "float":
      return [0.32 * Math.sin(t * 0.55), 0.18 * Math.sin(t * 0.8 + 1.0), 0.05 * Math.sin(t * 0.45 + 2.0)];
    case "follow":
      return [pointer[0] * 0.65, -pointer[1] * 0.45, 0];
    default:
      return [0, 0, 0];
  }
}
