import type { MotionKey } from "./types";

/** Cubic ease in-out, 0..1. */
export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/** A toss every 3.6s: a full turn (radians) with an ease, then rest. */
function toss(t: number) {
  const period = 3.6;
  const phase = (t % period) / period;
  return easeInOutCubic(Math.min(1, phase / 0.42)) * Math.PI * 2;
}

/** Yaw, pitch and roll (radians) for a motion mode at time t (s). `pointer` is -1..1. */
export function motionAngles(mode: MotionKey, t: number, pointer: [number, number]): [number, number, number] {
  switch (mode) {
    // Spin and flip are the same toss, one turned on its side: every 3.6s a
    // full eased turn, then rest. Spin turns about the vertical axis
    // (sideways), flip about the horizontal one (end over end).
    case "spin": {
      const turn = toss(t);
      return [turn, 0.18 * Math.sin(t * 0.7), 0.06 * Math.sin(t)];
    }
    case "flip": {
      const turn = toss(t);
      return [0.18 * Math.sin(t * 0.7), turn, 0.06 * Math.sin(t)];
    }
    case "float":
      return [0.32 * Math.sin(t * 0.55), 0.18 * Math.sin(t * 0.8 + 1.0), 0.05 * Math.sin(t * 0.45 + 2.0)];
    case "follow":
      return [pointer[0] * 0.65, -pointer[1] * 0.45, 0];
    default:
      return [0, 0, 0];
  }
}
