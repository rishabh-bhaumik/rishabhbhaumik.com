import { useSyncExternalStore } from "react";
import { SITE } from "@/data/site";
import { audioContext } from "./sfx";

/**
 * The dock's background music, shared by every dock on the page (the floating one
 * and the phone header's): one looping track through the shared audio context, so
 * the fades work on iOS too (it ignores `audio.volume`). Independent of the sound
 * effects mute.
 *
 * A visit that lands on home starts with it on and tries to play at once (see
 * armOnLanding); a visitor who turns it off is remembered, so it stays off on their
 * next visit.
 */
const FADE = 0.8;
const KEY = "bgm";
/**
 * The /enter morph, in seconds: the music fades in muffled and opens up to full
 * clarity while the clip pulls into focus (the splash uses the same length).
 */
export const MORPH = 1.6;
/** Where the morph's low-pass starts (muffled, as if through a wall) and ends (open). */
const MUFFLED_HZ = 280;
const OPEN_HZ = 20000;

let on = false;
let playing = false;
let decided = false;
let node: { audio: HTMLAudioElement; tone: BiquadFilterNode; gain: GainNode } | null = null;
let pauseTimer = 0;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

function setOn(next: boolean) {
  if (on === next) return;
  on = next;
  notify();
}

function setPlaying(next: boolean) {
  if (playing === next) return;
  playing = next;
  notify();
}

function ramp(gain: GainNode, to: number, seconds = FADE) {
  const t = gain.context.currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(to, t + seconds);
}

/** Opens the low-pass: at once, or swept from muffled over the morph. */
function openTone(tone: BiquadFilterNode, morph: boolean) {
  const t = tone.context.currentTime;
  tone.frequency.cancelScheduledValues(t);
  if (!morph) return tone.frequency.setValueAtTime(OPEN_HZ, t);
  tone.frequency.setValueAtTime(MUFFLED_HZ, t);
  tone.frequency.exponentialRampToValueAtTime(OPEN_HZ, t + MORPH);
}

/**
 * Starts (or resumes) the track. Browsers decide whether sound may start: on a
 * gesture always; on page load only where they allow it (the visitor has used the
 * site before, arrived by clicking through it, or allowed sound for it). When it's
 * refused, `onBlocked` runs (or, without one, the switch goes back off).
 */
function start(onBlocked?: () => void, morph = false) {
  const c = audioContext();
  if (!c) return setOn(false);
  if (!node) {
    const audio = new Audio(SITE.bgm.src);
    audio.loop = true;
    // A missing or unplayable file turns the switch back off.
    audio.addEventListener("error", () => setOn(false));
    audio.addEventListener("playing", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    const tone = c.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = OPEN_HZ;
    const gain = c.createGain();
    gain.gain.value = 0;
    c.createMediaElementSource(audio).connect(tone).connect(gain).connect(c.destination);
    node = { audio, tone, gain };
  }
  const { audio, tone, gain } = node;
  window.clearTimeout(pauseTimer);
  const blocked = () => (onBlocked ? onBlocked() : setOn(false));
  // The audio context must be running too; a locked one never settles its resume(),
  // so give it a moment and then look at its state.
  const unlock =
    c.state === "running"
      ? Promise.resolve()
      : Promise.race([c.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
  Promise.all([audio.play(), unlock]).then(
    () => {
      if (c.state !== "running") {
        audio.pause();
        return blocked();
      }
      // Switched off while it was starting: let it go quiet.
      if (!on) return stop();
      openTone(tone, morph);
      ramp(gain, SITE.bgm.volume, morph ? MORPH : FADE);
    },
    (err: DOMException) => (err?.name === "NotAllowedError" ? blocked() : setOn(false)),
  );
}

function stop() {
  if (!node) return;
  const { audio, gain } = node;
  ramp(gain, 0);
  window.clearTimeout(pauseTimer);
  pauseTimer = window.setTimeout(() => audio.pause(), FADE * 1000);
}

/** Turns the music on or off, and remembers the choice. */
export function setBgm(next: boolean) {
  try {
    localStorage.setItem(KEY, next ? "on" : "off");
  } catch {
    // Private mode: it still switches for this visit.
  }
  setOn(next);
  if (next) start();
  else stop();
}

/**
 * Called with the page a visit lands on (only the first call counts). On home, the
 * music is on unless the visitor turned it off before, and it tries to start right
 * away. Where the browser holds sound back until the visitor interacts, it starts
 * on their first click, tap or key press instead.
 */
export function armOnLanding(pathname: string) {
  if (decided) return;
  decided = true;
  if (pathname !== "/") return;
  try {
    if (localStorage.getItem(KEY) === "off") return;
  } catch {
    // No storage: use the default.
  }
  setOn(true);
  const events = ["pointerdown", "pointerup", "keydown"] as const;
  const arm = () => events.forEach((t) => window.addEventListener(t, go, true));
  function go() {
    events.forEach((t) => window.removeEventListener(t, go, true));
    // Refused (no gesture yet, or one the browser doesn't count): wait for the next.
    if (on) start(arm);
  }
  go();
}

/**
 * The /enter click: an interaction, so the music can start in every browser (unless
 * the visitor turned it off before), and it morphs in: muffled to clear over MORPH.
 * Settles the landing decision too.
 */
export function startOnEnter() {
  decided = true;
  try {
    if (localStorage.getItem(KEY) === "off") return;
  } catch {
    // No storage: use the default.
  }
  setOn(true);
  start(undefined, true);
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

/** Whether it's actually sounding (on, the visitor has interacted, the track loaded). */
export function useBgmPlaying() {
  return useSyncExternalStore(subscribe, () => playing, () => false);
}
