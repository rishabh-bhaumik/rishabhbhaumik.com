"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import Controls from "./Controls";
import Library from "./Library";
import { buildGlyphAtlas, buildLogoField, type LogoField } from "./logoField";
import { MATERIALS, materialByKey } from "./materials";
import { stateFor, transmuteState } from "./frames";
import { easeInOutCubic, motionAngles } from "./motion";
import { recordWebm, savePng, type RECORD_LENGTHS } from "./record";
import { LogoRenderer, materialSource, rotationMatrix, type RenderState } from "./renderer";
import { hashString, loadThumbs, saveThumb } from "./thumbCache";
import { DEFAULTS, decodeSettings, encodeSettings, type Settings, type Slot } from "./settings";
import { FILTERS, type LogoMaterial } from "./types";

/** Library thumbnails show at 48 px; render at 2x for sharp screens. */
const THUMB_SIZE = 96;
const THUMB_ROT = rotationMatrix(0.32, 0.16, 0);
/** Bump to invalidate every cached thumbnail. */
const THUMB_VERSION = "2";
/**
 * Longest side of the scene pass in pixels; the blit upscales to the canvas.
 * High enough that a full-width preview on a retina screen renders 1:1; the
 * frame-time scaling below still drops it while a heavy material animates.
 */
const MAX_SCENE_PX = 2560;
/** Once the picture has held still this long, a reduced-resolution frame is redrawn sharp. */
const SETTLE_MS = 180;
/** Compiled programs kept resident (the selected and transmuting ones always stay). */
const MAX_PROGRAMS = 10;

/**
 * New each time this module runs. Fast Refresh re-runs it whenever it or
 * anything it imports changes (a material, the shaders, the renderer); the
 * frame loop restarts on it, so an edit shows without a full reload.
 */
const MODULE_RUN = Math.random();

// The logo field is a CPU distance transform: build it once per page load.
let fieldPromise: Promise<LogoField> | null = null;
const logoField = () => (fieldPromise ??= buildLogoField());

// ── URL hash: every look is shareable ─────────────────────────────────────────
// Read once per page load: React runs mount effects twice in development, and the
// second pass must not see the hash the first pass already rewrote.
let initialHash: Partial<Settings> | null = null;
function readHash(): Partial<Settings> {
  if (typeof window === "undefined") return {};
  if (!initialHash) initialHash = parseHash();
  return initialHash;
}

function parseHash(): Partial<Settings> {
  return decodeSettings(window.location.hash.slice(1));
}

function writeHash(s: Settings) {
  window.history.replaceState(null, "", `#${encodeSettings(s)}`);
}

const thumbState = (m: LogoMaterial, time = m.heroTime ?? 1): RenderState => ({
  ...stateFor(m, DEFAULTS, THUMB_ROT, time, [0, 0]),
  filters: [],
});

/** Everything that changes a thumbnail, so an edited material misses the cache. */
const thumbHash = (m: LogoMaterial) =>
  hashString(`${THUMB_VERSION}|${THUMB_SIZE}|${m.relief}|${m.heroTime ?? 1}|${m.light ?? 135}|${materialSource(m)}`);

/**
 * /logo — the mark remade in materials, always as a coin. Library carousel
 * above the preview (left); motion, loop, relief, light, filters and transmute
 * (right). One WebGL2 renderer draws both.
 */
export default function LogoLab() {
  const reduced = useReducedMotion() ?? false;
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [compiling, setCompiling] = useState(false);
  /** Per material: whether the Relief and Light controls change anything. */
  const [supports, setSupports] = useState<Record<string, { relief: boolean; light: boolean }>>({});
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState<(typeof RECORD_LENGTHS)[number]>(10);
  /** Seconds left in the take, while recording. */
  const [recordLeft, setRecordLeft] = useState(0);
  const stopRecordingRef = useRef<AbortController | null>(null);
  /** Bumped when the GPU context comes back after a loss, to rebuild the renderer. */
  const [glEpoch, setGlEpoch] = useState(0);
  /** The transmute step being fine-tuned in Controls (the morph pauses on it), or null. */
  const [editing, setEditing] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Bumped when React attaches a different canvas element, so the renderer follows it.
  const [canvasVersion, setCanvasVersion] = useState(0);
  const attachCanvas = useCallback((el: HTMLCanvasElement | null) => {
    if (!el || el === canvasRef.current) return;
    // The first canvas is in place before effects run; only a replacement needs a restart.
    const replacing = canvasRef.current !== null;
    canvasRef.current = el;
    if (replacing) setCanvasVersion((n) => n + 1);
  }, []);
  const moduleRun = MODULE_RUN;
  const settingsRef = useRef(settings);
  const reducedRef = useRef(reduced);
  const recordingRef = useRef(false);
  const timeRef = useRef(0);
  const dragRef = useRef({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, down: false, x: 0, y: 0 });
  const pointerRef = useRef<[number, number]>([0, 0]);
  const visibleRef = useRef<Set<string>>(new Set());
  const pngRef = useRef(false);
  /** Materials whose thumbnail exists (or failed), with the GLSL it was made from; survives a renderer rebuild. */
  const doneRef = useRef<Map<string, string>>(new Map());
  const editingRef = useRef(editing);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  // Restore a shared look from the hash once on mount.
  useEffect(() => {
    const fromHash = readHash();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Object.keys(fromHash).length) setSettings((s) => ({ ...s, ...fromHash }));
  }, []);
  // A pasted or followed link that only changes the hash doesn't remount the page; apply it.
  // (Our own replaceState writes never fire hashchange.)
  useEffect(() => {
    const onHash = () => {
      setEditing(null);
      editingRef.current = null;
      setSettings({ ...DEFAULTS, ...decodeSettings(window.location.hash.slice(1)) });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  // Sliders fire on every pixel; browsers throttle (Safari throws on) rapid replaceState calls.
  useEffect(() => {
    const id = setTimeout(() => writeHash(settings), 250);
    return () => clearTimeout(id);
  }, [settings]);

  // While a transmute step is being edited, its look follows every change to the current one.
  const set = useCallback(
    (patch: Partial<Settings>) =>
      setSettings((s) => {
        const next = { ...s, ...patch };
        const i = editingRef.current;
        if (i === null || !next.transmute[i]) return next;
        const transmute = [...next.transmute];
        transmute[i] = { ...transmute[i], key: next.material, relief: next.relief, light: next.light, filters: next.filters };
        return { ...next, transmute };
      }),
    []
  );
  const edit = useCallback((i: number | null) => {
    setEditing(i);
    editingRef.current = i;
    if (i === null) return;
    setSettings((s) => {
      const slot = s.transmute[i];
      return slot ? { ...s, material: slot.key, relief: slot.relief, light: slot.light, filters: slot.filters } : s;
    });
  }, []);
  const onVisible = useCallback((keys: Set<string>) => {
    visibleRef.current = keys;
  }, []);

  // Start each material on its hero frame.
  useEffect(() => {
    timeRef.current = materialByKey(settings.material)?.heroTime ?? 1;
  }, [settings.material]);

  // ── Renderer and frame loop ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: LogoRenderer;
    try {
      renderer = new LogoRenderer(canvas);
    } catch (e) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    let cancelled = false;
    let lost = false;
    let raf = 0;
    let last = performance.now();
    let scale = 1;
    let frameMs = 16.7;
    let goodFrames = 0;
    let lastSig = "";
    // When the last frame was drawn below full resolution, and when it changed.
    let soft = false;
    let changedAt = 0;
    let shown = false;
    let waiting = false;
    let onScreen = true;
    let cacheLoaded = false;
    let thumbsInFlight = 0;
    let transmuteClock = 0;
    let frameNo = 0;
    const probed = new Set<string>();
    const doneMap = doneRef.current;
    // Done means done for the material as it is now: an edited one is drawn again.
    const done = {
      has: (key: string) => doneMap.get(key) === materialByKey(key)?.glsl,
      add: (key: string) => doneMap.set(key, materialByKey(key)?.glsl ?? ""),
    };
    const hashes: Record<string, string> = {};
    const pendingThumbs: Record<string, string> = {};
    let flushAt = 0;

    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
    };
    const onRestored = () => setGlEpoch((n) => n + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      lastSig = "";
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    // Nothing to draw while the preview is scrolled away (the library is below it).
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
    });
    io.observe(canvas);

    // Cached thumbnails first, so their shaders never need compiling.
    const loadCache = async () => {
      for (const m of MATERIALS) hashes[m.key] = thumbHash(m);
      const cached = await loadThumbs(hashes);
      if (cancelled) return;
      const urls: Record<string, string> = {};
      for (const [key, blob] of Object.entries(cached)) {
        if (done.has(key)) continue;
        urls[key] = URL.createObjectURL(blob);
        done.add(key);
      }
      if (Object.keys(urls).length) setThumbs((t) => ({ ...t, ...urls }));
      cacheLoaded = true;
    };

    const makeThumb = (m: LogoMaterial) => {
      const job = renderer.thumbnail(thumbState(m), THUMB_SIZE);
      if (!job) return false;
      done.add(m.key);
      thumbsInFlight++;
      job.then((blob) => {
        thumbsInFlight--;
        if (!blob || cancelled) return;
        pendingThumbs[m.key] = URL.createObjectURL(blob);
        setFailed((f) => {
          if (!f.has(m.key)) return f;
          const next = new Set(f);
          next.delete(m.key);
          return next;
        });
        saveThumb(m.key, hashes[m.key] ?? thumbHash(m), blob);
      });
      return true;
    };

    const ensureReady = async (keys: (string | LogoMaterial)[]) => {
      for (const k of keys) {
        const m = typeof k === "string" ? materialByKey(k) : k;
        if (!m) continue;
        while (!lost && renderer.status(m.key) !== "ready" && renderer.status(m.key) !== "error") {
          renderer.request(m, true);
          renderer.pump(4);
          await new Promise((r) => setTimeout(r, 16));
        }
      }
    };

    // Dev tooling for writing materials: compile errors, timings and stills.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __logoLab?: unknown }).__logoLab = {
      errors: () => renderer.errors(),
      materials: MATERIALS,
      /** Debug: one transmute frame from material a to b at progress p (0..1) with a transition key, as a webp blob. */
      morph: async (a: string, b: string, p: number, transition = "stroke", size = 256, flipSync = false) => {
        const slot = (key: string): Slot => ({ key, relief: 1, light: null, filters: [], transition: transition as Slot["transition"] });
        const m = materialByKey(a)!;
        // Either program can be trimmed while the other compiles: retry until both are in hand.
        for (let i = 0; i < 20; i++) {
          await ensureReady([a, b]);
          const job = renderer.thumbnail(transmuteState(slot(a), slot(b), p, [0.32, 0.16, 0], m.heroTime ?? 1, [0, 0], m, materialByKey, flipSync), size);
          if (job) return job;
        }
        return null;
      },
      /** Debug: a still of any material (or an edited copy) as a webp blob. */
      thumb: async (m: LogoMaterial, size = 384, angles?: [number, number, number]) => {
        await ensureReady([m]);
        const state = thumbState(m);
        return renderer.thumbnail(angles ? { ...state, rot: rotationMatrix(...angles) } : state, size);
      },
      status: () => MATERIALS.map((m) => [m.key, renderer.status(m.key)]),
      /** Debug: GPU ms per frame at `size` px for each material, slowest first. */
      bench: async (keys: (string | LogoMaterial)[] = MATERIALS.map((m) => m.key), size = 1024) => {
        const out: [string, number | null][] = [];
        for (const k of keys) {
          await ensureReady([k]);
          const m = typeof k === "string" ? materialByKey(k)! : k;
          const key = m.key;
          const ms = renderer.bench({ ...thumbState(m), rot: rotationMatrix(0.5, 0.25, 0) }, size);
          out.push([key, ms === null ? null : Math.round(ms * 10) / 10]);
          renderer.trim(new Set([settingsRef.current.material]), MAX_PROGRAMS);
        }
        return out.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
      },
      /** Debug: an overlay contact sheet of large stills. */
      sheet: async (keys = MATERIALS.map((m) => m.key), size = 300, cols = 4, time?: number) => {
        document.getElementById("logo-sheet")?.remove();
        const sheet = document.createElement("div");
        sheet.id = "logo-sheet";
        sheet.style.cssText = `position:fixed;inset:0;z-index:9999;background:#000;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;overflow:auto;padding:4px`;
        sheet.onclick = () => sheet.remove();
        document.body.appendChild(sheet);
        for (const key of keys) {
          await ensureReady([key]);
          const m = materialByKey(key)!;
          const blob = await renderer.thumbnail(thumbState(m, time ?? m.heroTime ?? 1), size);
          renderer.trim(new Set([settingsRef.current.material]), MAX_PROGRAMS);
          const cell = document.createElement("div");
          cell.style.cssText = "position:relative;color:#fff;font:11px Arial";
          cell.innerHTML = `<img src="${blob ? URL.createObjectURL(blob) : ""}" style="width:100%;display:block"/><span style="position:absolute;left:6px;top:4px;background:#000a;padding:1px 4px">${m.label}</span>`;
          sheet.appendChild(cell);
        }
      },
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (lost) return;
      const rawDt = (now - last) / 1000;
      const dt = Math.min(0.1, rawDt);
      last = now;
      const s = settingsRef.current;
      const still = reducedRef.current;
      const material = materialByKey(s.material) ?? MATERIALS[0];
      // The morph pauses on the step being edited.
      const transmuting = s.transmuteOn && s.transmute.length >= 2 && !still && editingRef.current === null;

      // ── Compiles: the selected (and transmuting) materials first, then visible thumbnails.
      const pinned = new Set<string>([material.key]);
      renderer.request(material, true);
      // A sequence can be any length: keep the step on screen, the next and the one after compiled.
      if (transmuting) {
        const n = s.transmute.length;
        const seg = Math.floor(transmuteClock / (s.hold + s.morphTime)) % n;
        for (let d = 0; d < Math.min(3, n); d++) {
          const m = materialByKey(s.transmute[(seg + d) % n].key);
          if (m) {
            pinned.add(m.key);
            renderer.request(m, d < 2);
          }
        }
      }
      const selectedReady = renderer.ready(material.key);
      const selectedSettled = selectedReady || renderer.status(material.key) === "error";
      const wanted = new Set<string>();
      if (cacheLoaded && selectedSettled)
        for (const key of visibleRef.current)
          if (!done.has(key)) {
            wanted.add(key);
            renderer.request(materialByKey(key)!);
          }
      renderer.unqueue((k) => pinned.has(k) || wanted.has(k));
      // Keep compiles to a trickle while the preview is waiting on its own.
      renderer.pump(selectedSettled ? 2 : 1);

      // ── Clocks.
      if (s.loop && !still) timeRef.current += dt * s.speed;
      const time = still ? material.heroTime ?? 1 : timeRef.current;

      // Rotation: motion + hand drag with inertia.
      const drag = dragRef.current;
      if (!drag.down) {
        drag.yaw += drag.vYaw;
        drag.pitch += drag.vPitch;
        drag.vYaw = Math.abs(drag.vYaw) < 1e-4 ? 0 : drag.vYaw * 0.94;
        drag.vPitch = Math.abs(drag.vPitch) < 1e-4 ? 0 : drag.vPitch * 0.94;
      }
      // With a transmute running, Flip motion is driven by the morph itself (see transmuteState).
      const flipSync = transmuting && s.motion === "flip";
      const [yaw, pitch, roll] = still ? [0, 0, 0] : motionAngles(s.motion, now / 1000, pointerRef.current);
      const angles: [number, number, number] = [yaw + drag.yaw, (flipSync ? 0 : pitch) + drag.pitch, roll];
      let rot = rotationMatrix(...angles);

      let state = stateFor(material, s, rot, time, pointerRef.current);
      if (transmuting) {
        transmuteClock += dt;
        const span = s.hold + s.morphTime;
        const seg = Math.floor(transmuteClock / span) % s.transmute.length;
        const local = transmuteClock % span;
        const p = local < s.hold ? 0 : Math.min(1, (local - s.hold) / s.morphTime);
        state = transmuteState(s.transmute[seg], s.transmute[(seg + 1) % s.transmute.length], p, angles, time, pointerRef.current, material, materialByKey, flipSync);
        // The redraw check needs the turn the morph adds.
        if (flipSync) rot = rotationMatrix(angles[0], angles[1] + easeInOutCubic(p) * 2 * Math.PI, angles[2]);
      }

      // ── Preview: only when it is on screen and something changed.
      const cw = canvas.width;
      const ch = canvas.height;
      const fit = Math.min(1, MAX_SCENE_PX / Math.max(cw, ch));
      const sw = Math.max(1, Math.round(cw * fit * scale));
      const sh = Math.max(1, Math.round(ch * fit * scale));
      const png = pngRef.current;
      if (onScreen || png || recordingRef.current) {
        const sig = [
          state.material.key,
          JSON.stringify(state.morphTo ? [state.morphTo.material.key, state.morphTo.relief, state.morphTo.light, state.morphTo.filters] : null),
          state.morph?.toFixed(4),
          state.morphStyle,
          time.toFixed(4),
          Array.from(rot, (v) => v.toFixed(4)).join(","),
          state.relief,
          state.light.join(","),
          state.pointer.join(","),
          JSON.stringify(state.filters),
          sw,
          sh,
        ].join("|");
        if (sig !== lastSig || png) {
          const drew = renderer.render(state, cw, ch, sw, sh);
          if (drew) {
            lastSig = sig;
            soft = sw < cw || sh < ch;
            changedAt = now;
            if (png) {
              pngRef.current = false;
              savePng(canvas, `logo-${s.material}`);
            }
            if (!shown) {
              shown = true;
              setReady(true);
            }
            // Resolution follows the frame time; throttled background frames don't count.
            if (rawDt < 0.1) {
              frameMs = frameMs * 0.9 + rawDt * 1000 * 0.1;
              if (frameMs > 21 && scale > 0.45) {
                scale = Math.max(0.45, scale * 0.92);
                frameMs = 16.7;
                goodFrames = 0;
              } else if (frameMs < 17.8 && scale < 1 && ++goodFrames > 45) {
                scale = Math.min(1, scale * 1.06);
                goodFrames = 0;
              }
            }
          }
        } else if (soft && now - changedAt > SETTLE_MS) {
          // Held still: redraw the same picture once at full resolution, so a resting coin is crisp.
          if (renderer.render(state, cw, ch, cw, ch)) soft = false;
        }
      }
      const isWaiting = !renderer.ready(state.material.key) || (!!state.morphTo && !renderer.ready(state.morphTo.material.key));
      if (isWaiting !== waiting && renderer.status(state.material.key) !== "error") {
        waiting = isWaiting;
        setCompiling(isWaiting);
      }

      // ── Controls that do nothing for this material are disabled: probe it once.
      if (selectedReady && !probed.has(material.key)) {
        const result = renderer.probe(thumbState(material));
        if (result) {
          probed.add(material.key);
          setSupports((x) => ({ ...x, [material.key]: result }));
        }
      }

      // ── Thumbnails: one visible, compiled material every other frame.
      if (thumbsInFlight < 2 && ++frameNo % 2 === 0)
        for (const key of wanted) {
          const st = renderer.status(key);
          if (st === "error") {
            done.add(key);
            setFailed((f) => new Set(f).add(key));
            continue;
          }
          if (st === "ready" && makeThumb(materialByKey(key)!)) break;
        }
      for (const key of wanted) pinned.add(key);
      renderer.trim(pinned, MAX_PROGRAMS);

      if (Object.keys(pendingThumbs).length && now > flushAt) {
        const batch = { ...pendingThumbs };
        for (const k of Object.keys(pendingThumbs)) delete pendingThumbs[k];
        setThumbs((t) => ({ ...t, ...batch }));
        flushAt = now + 250;
      }
    };

    loadCache();
    logoField()
      .then((field) => {
        if (cancelled) return;
        renderer.setField(field);
        renderer.setGlyphs(buildGlyphAtlas());
        raf = requestAnimationFrame(frame);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (!lost) renderer.dispose();
      // A canvas React threw away keeps its context until GC; browsers cap live contexts, so let it go now.
      if (!canvas.isConnected) renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // The loop reads everything live through refs; it restarts for a new canvas, a restored
    // GPU context, or new code after a hot reload.
  }, [canvasVersion, glEpoch, moduleRun]);

  // ── Pointer: drag to turn, and the pointer position for "Follow pointer" ──
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointerRef.current = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
      const drag = dragRef.current;
      if (drag.down) {
        const dx = (e.clientX - drag.x) * 0.01;
        const dy = (e.clientY - drag.y) * 0.01;
        drag.yaw += dx;
        drag.pitch += dy;
        drag.vYaw = dx;
        drag.vPitch = dy;
        drag.x = e.clientX;
        drag.y = e.clientY;
      }
    };
    const onUp = () => {
      dragRef.current.down = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const material = materialByKey(settings.material) ?? MATERIALS[0];

  // A new look: material, relief, light and filters. Motion is left as it is.
  const surprise = () => {
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
    const others = MATERIALS.filter((m) => m.key !== settings.material);
    set({
      material: pick(others).key,
      relief: pick([1, 1, 1.5, -1]),
      light: null,
      filters: Math.random() < 0.4 ? [{ key: pick(FILTERS.slice(1)).key, amount: 0.6 + Math.random() * 0.4 }] : [],
    });
  };

  // Record starts a take; pressing it again ends the take early (and still saves it).
  const record = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (recording) {
      stopRecordingRef.current?.abort();
      return;
    }
    const stop = new AbortController();
    stopRecordingRef.current = stop;
    const started = performance.now();
    setRecording(true);
    setRecordLeft(recordSeconds);
    const tick = setInterval(() => setRecordLeft(Math.max(0, Math.ceil(recordSeconds - (performance.now() - started) / 1000))), 250);
    try {
      await recordWebm(canvas, `logo-${settings.material}`, recordSeconds, stop.signal);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      clearInterval(tick);
      stopRecordingRef.current = null;
      setRecording(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-6 sm:px-6">

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
            <Library
              materials={MATERIALS}
              thumbs={thumbs}
              failed={failed}
              selected={settings.material}
              onSelect={(key) => set({ material: key, light: null })}
              onVisible={onVisible}
            />
          </div>
          <div className="relative aspect-square max-h-[72vh] w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
            <canvas
              ref={attachCanvas}
              className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={(e) => {
                const d = dragRef.current;
                d.down = true;
                d.x = e.clientX;
                d.y = e.clientY;
                d.vYaw = 0;
                d.vPitch = 0;
              }}
              onDoubleClick={() => Object.assign(dragRef.current, { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0 })}
            />
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-[13px] text-white/45">Preparing the mark…</div>
            )}
            {ready && compiling && !error && (
              <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[12px] text-white/65">
                Compiling…
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[13px] text-white">{error}</div>
            )}
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)] lg:self-start lg:overflow-y-auto" data-lenis-prevent>
          <Controls
            settings={settings}
            set={set}
            material={material}
            materials={MATERIALS}
            thumbs={thumbs}
            supports={supports[material.key]}
            reduced={reduced}
            recording={recording}
            recordSeconds={recordSeconds}
            onRecordSeconds={setRecordSeconds}
            recordLeft={recordLeft}
            onSurprise={surprise}
            onPng={() => {
              pngRef.current = true;
            }}
            onRecord={record}
            onApply={(look) => {
              edit(null);
              setSettings({ ...DEFAULTS, ...decodeSettings(look) });
            }}
            editing={editing !== null && settings.transmute[editing] ? editing : null}
            onEdit={edit}
          />
        </aside>
      </div>

      <footer className="mt-10 flex flex-col gap-1 border-t border-white/10 pt-5 text-[14px] leading-[1.5] sm:flex-row sm:items-baseline sm:gap-6">
        <h1 className="shrink-0 text-white">Logo lab</h1>
        <p className="text-white/65">
          The mark, remade in clay, metal, light and signal. Pick a material from the library, turn it by hand, let it loop, or morph
          between a few.
        </p>
      </footer>
    </main>
  );
}
