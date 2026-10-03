/**
 * Frame states shared by the lab and the small coin embedded elsewhere (the
 * site header): a material's render state, and one transmute frame. Kept free
 * of the material library so an embed can load just the materials it uses.
 */

import { easeInOutCubic } from "./motion";
import { lightDirection, rotationMatrix, type RenderState } from "./renderer";
import type { Look, Slot } from "./settings";
import { transitionIndex, type LogoMaterial } from "./types";

export const stateFor = (material: LogoMaterial, s: Look, rot: Float32Array, time: number, pointer: [number, number]): RenderState => ({
  material,
  time,
  rot,
  relief: material.relief * s.relief,
  light: lightDirection(s.light ?? material.light ?? 135),
  filters: s.filters,
  pointer,
  seed: 0,
});

const FLIP_STYLE = transitionIndex("flip");

/** Coin flip: one and a half turns (cubic in-out), with a small settle wobble as it lands. */
const flipTurn = (p: number) => {
  const e = easeInOutCubic(p);
  const settle = p > 0.85 ? 0.12 * Math.sin(((p - 0.85) / 0.15) * Math.PI * 2) * ((1 - p) / 0.15) : 0;
  return e * 3 * Math.PI + settle;
};

/**
 * One transmute frame: step `from` giving way to `to` at progress p (0..1) in
 * its transition style. `angles` is the coin's yaw, pitch and roll; `lookup`
 * finds a material by key. With `flipSync` the coin makes one full turn over
 * the morph (Flip motion), so the material changes while it is in the air and
 * it lands face-on.
 */
export function transmuteState(
  from: Slot,
  to: Slot,
  p: number,
  angles: [number, number, number],
  time: number,
  pointer: [number, number],
  fallback: LogoMaterial,
  lookup: (key: string) => LogoMaterial | undefined,
  flipSync = false
): RenderState {
  const a = lookup(from.key) ?? fallback;
  const b = lookup(to.key) ?? fallback;
  const style = transitionIndex(from.transition);
  const [yaw, basePitch, roll] = angles;
  // The Coin flip transition already turns the coin; otherwise Flip motion adds its own turn.
  const pitch = flipSync && style !== FLIP_STYLE ? basePitch + easeInOutCubic(p) * 2 * Math.PI : basePitch;
  if (style === FLIP_STYLE) {
    // The real coin turns over: A until it passes edge-on for the last time, then B, landing face on.
    const turn = flipTurn(p);
    const showB = turn >= 1.5 * Math.PI;
    const rot = rotationMatrix(yaw, pitch + (showB ? turn - 3 * Math.PI : turn), roll);
    return stateFor(showB ? b : a, showB ? to : from, rot, time, pointer);
  }
  const rot = rotationMatrix(yaw, pitch, roll);
  // Each step keeps its own relief, light and filters.
  const target = stateFor(b, to, rot, time, pointer);
  return {
    ...stateFor(a, from, rot, time, pointer),
    morphTo: { material: b, relief: target.relief, light: target.light, filters: target.filters },
    morph: p * p * (3 - 2 * p),
    morphStyle: style,
  };
}
