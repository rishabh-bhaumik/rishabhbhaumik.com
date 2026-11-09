import { useSyncExternalStore } from "react";
import { SITE } from "@/data/site";
import { audioContext } from "./sfx";

/**
 * The dock's background music, shared by every dock on the page (the floating one
 * and the phone header's): one looping track through the shared audio context, so
 * the fades work on iOS too (it ignores `audio.volume`). Call these from click
 * handlers, where browsers allow playback to begin.
 */
const FADE = 0.8;

let on = false;
let node: { audio: HTMLAudioElement; gain: GainNode } | null = null;
let pauseTimer = 0;
const listeners = new Set<() => void>();

function setOn(next: boolean) {
  if (on === next) return;
  on = next;
  listeners.forEach((l) => l());
}

function ramp(gain: GainNode, to: number) {
  const t = gain.context.currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(to, t + FADE);
}

function start() {
  const c = audioContext();
  if (!c) return setOn(false);
  if (!node) {
    const audio = new Audio(SITE.bgm.src);
    audio.loop = true;
    // A missing or unplayable file turns the switch back off.
    audio.addEventListener("error", () => setOn(false));
    const gain = c.createGain();
    gain.gain.value = 0;
    c.createMediaElementSource(audio).connect(gain).connect(c.destination);
    node = { audio, gain };
  }
  const { audio, gain } = node;
  window.clearTimeout(pauseTimer);
  if (c.state === "suspended") c.resume().catch(() => {});
  audio.play().then(
    () => ramp(gain, SITE.bgm.volume),
    () => setOn(false),
  );
}

function stop() {
  if (!node) return;
  const { audio, gain } = node;
  ramp(gain, 0);
  window.clearTimeout(pauseTimer);
  pauseTimer = window.setTimeout(() => audio.pause(), FADE * 1000);
}

/** Turns the music on or off. While `muted` (the speaker), it's remembered but silent. */
export function setBgm(next: boolean, muted: boolean) {
  setOn(next);
  if (next && !muted) start();
  else stop();
}

/** The speaker changed to `muted`: silence the music, or bring it back if it's on. */
export function followMute(muted: boolean) {
  if (!on) return;
  if (muted) stop();
  else start();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Whether the music is switched on (off on the server and during hydration). */
export function useBgm() {
  return useSyncExternalStore(subscribe, () => on, () => false);
}
