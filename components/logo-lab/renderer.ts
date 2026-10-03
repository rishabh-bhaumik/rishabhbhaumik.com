/**
 * The logo lab's WebGL2 renderer. One context serves the live preview and the
 * library thumbnails. Each material is its own program (PRELUDE + material +
 * SCENE), compiled lazily and in parallel where the browser supports
 * KHR_parallel_shader_compile. Programs are big, so only a handful stay
 * resident: `trim()` frees the least recently used ones that are not pinned.
 *
 * A frame: scene pass for material A (and B when transmuting) into offscreen
 * targets at a scaled resolution -> each side's filter passes -> morph pass ->
 * blit to the canvas (or to a thumbnail target that is read back).
 */

import { FILTERS, transitionIndex, type FilterKey, type LogoMaterial } from "./types";
import { FIELD_EXTENT, type LogoField } from "./logoField";
import { PRELUDE } from "./glsl/prelude";
import { SCENE } from "./glsl/scene";
import { BLIT_FRAG, FILTER_FRAG, MORPH_FRAG, QUAD_VERT } from "./glsl/filters";

export interface FilterLayer {
  key: FilterKey;
  amount: number;
}

/** What a transmute morphs into: a material with its own relief, light and filters. */
export interface MorphTarget {
  material: LogoMaterial;
  relief: number;
  light: [number, number, number];
  filters: FilterLayer[];
}

export interface RenderState {
  material: LogoMaterial;
  /** Transmute target, with its own look, and progress 0..1 (0 = all A). */
  morphTo?: MorphTarget | null;
  morph?: number;
  /** Transmute style: the TRANSITIONS index (0 stroke dissolve, 1 dither dissolve). */
  morphStyle?: number;
  time: number;
  /** Column-major 3x3 rotation, object -> world. */
  rot: Float32Array;
  relief: number;
  light: [number, number, number];
  filters: FilterLayer[];
  pointer: [number, number];
  seed: number;
}

type Status = "pending" | "ready" | "error";

interface Program {
  key: string;
  program: WebGLProgram;
  shaders: WebGLShader[];
  status: Status;
  log: string;
  uniforms: Map<string, WebGLUniformLocation | null>;
  /** Last frame this program was drawn or requested; for eviction. */
  used: number;
  /** The material defines surface(), which is baked into a texture each frame. */
  surface: boolean;
}

interface Target {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
}

/** Part by part needs the scene to key the dissolve by part of the mark. */
const PART_STYLE = transitionIndex("part");

/** The full fragment source for a material. */
export const materialSource = (material: LogoMaterial) => PRELUDE + "\n" + material.glsl + "\n" + SCENE;

export class LogoRenderer {
  readonly gl: WebGL2RenderingContext;
  private parallel: { COMPLETION_STATUS_KHR: number } | null;
  private programs = new Map<string, Program>();
  /** Compile failures are remembered so they are never retried. */
  private failures = new Map<string, string>();
  private queue: LogoMaterial[] = [];
  private fieldTex: WebGLTexture | null = null;
  private glyphTex: WebGLTexture | null = null;
  private filterProgram: Program;
  private morphProgram: Program;
  private blitProgram: Program;
  private targets: Record<string, Target> = {};
  private clock = 0;
  private quad: WebGLVertexArrayObject;
  private quadBuffer: WebGLBuffer;
  private readCanvas: HTMLCanvasElement | null = null;
  /** Half-float render targets, needed for the surface bake. */
  private halfFloat: boolean;
  /** What each surface target last baked, so a still loop clock skips the bake. */
  private baked: Record<string, string> = {};

  constructor(readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is not available in this browser.");
    this.gl = gl;
    this.parallel = gl.getExtension("KHR_parallel_shader_compile");
    this.halfFloat = !!gl.getExtension("EXT_color_buffer_float");

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.quad = vao;
    this.quadBuffer = buf;

    // With parallel compiling these link in the background (no long task at
    // start-up); `render` waits for them. Without it, linking blocks anyway.
    const sync = !this.parallel;
    this.filterProgram = this.build(FILTER_FRAG, sync);
    this.morphProgram = this.build(MORPH_FRAG, sync);
    this.blitProgram = this.build(BLIT_FRAG, sync);
  }

  /** Are the shared filter, morph and blit programs linked? */
  private coreReady() {
    return [this.filterProgram, this.morphProgram, this.blitProgram].every((e) => this.isDone(e) && e.status === "ready");
  }

  /**
   * Free everything this renderer made on the GPU. The context stays usable, so
   * a fresh renderer can take over the same canvas (after a hot reload).
   */
  dispose() {
    const gl = this.gl;
    for (const e of this.programs.values()) gl.deleteProgram(e.program);
    for (const e of [this.filterProgram, this.morphProgram, this.blitProgram]) gl.deleteProgram(e.program);
    for (const t of Object.values(this.targets)) {
      gl.deleteFramebuffer(t.fbo);
      gl.deleteTexture(t.tex);
    }
    gl.deleteTexture(this.fieldTex);
    gl.deleteTexture(this.glyphTex);
    gl.deleteVertexArray(this.quad);
    gl.deleteBuffer(this.quadBuffer);
    this.programs.clear();
    this.targets = {};
    this.queue = [];
  }

  setField(field: LogoField) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, field.size, field.size, 0, gl.RGBA, gl.FLOAT, field.data);
    this.texParams(gl.LINEAR);
    this.fieldTex = tex;
  }

  setGlyphs(atlas: HTMLCanvasElement) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    this.texParams(gl.LINEAR);
    this.glyphTex = tex;
  }

  private texParams(filter: number) {
    const gl = this.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // ── Programs ────────────────────────────────────────────────────────────────
  private build(frag: string, sync = false, key = "", surface = false): Program {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, QUAD_VERT);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, frag);
    gl.compileShader(fs);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    const entry: Program = { key, program, shaders: [vs, fs], status: "pending", log: "", uniforms: new Map(), used: this.clock, surface };
    if (sync) this.finish(entry);
    return entry;
  }

  private finish(entry: Program) {
    const gl = this.gl;
    const [vs, fs] = entry.shaders;
    if (gl.getProgramParameter(entry.program, gl.LINK_STATUS)) {
      entry.status = "ready";
    } else {
      entry.status = "error";
      entry.log = (gl.getShaderInfoLog(fs) || "") + (gl.getShaderInfoLog(vs) || "") + (gl.getProgramInfoLog(entry.program) || "");
      if (!gl.isContextLost()) console.error(`[logo-lab] shader failed\n${entry.log}`);
    }
    // The linked program keeps what it needs; the shader objects are dead weight.
    for (const s of entry.shaders) {
      gl.detachShader(entry.program, s);
      gl.deleteShader(s);
    }
    entry.shaders = [];
  }

  private isDone(entry: Program) {
    if (entry.status !== "pending") return true;
    if (this.parallel && !this.gl.getProgramParameter(entry.program, this.parallel.COMPLETION_STATUS_KHR)) return false;
    this.finish(entry);
    return true;
  }

  /** Queue a material for compiling; `priority` jumps the queue (the selected one). */
  request(material: LogoMaterial, priority = false) {
    const entry = this.programs.get(material.key);
    if (entry) {
      entry.used = this.clock;
      return;
    }
    if (this.failures.has(material.key)) return;
    const queued = this.queue.findIndex((m) => m.key === material.key);
    if (queued >= 0) {
      if (priority && queued > 0) this.queue.unshift(...this.queue.splice(queued, 1));
      return;
    }
    if (priority) this.queue.unshift(material);
    else this.queue.push(material);
  }

  /** Drop queued compiles that are no longer wanted. */
  unqueue(keep: (key: string) => boolean) {
    this.queue = this.queue.filter((m) => keep(m.key));
  }

  /**
   * Start queued compiles and settle finished ones. Call once a frame.
   * `maxPending` caps compiles in flight; the head of the queue (the selected
   * material) always starts.
   */
  pump(maxPending = 2) {
    this.clock++;
    let pending = 0;
    for (const [key, entry] of this.programs) {
      if (!this.isDone(entry)) pending++;
      else if (entry.status === "error") {
        this.failures.set(key, entry.log);
        this.gl.deleteProgram(entry.program);
        this.programs.delete(key);
      }
    }
    while (this.queue.length && (pending === 0 || pending < maxPending)) {
      const material = this.queue.shift()!;
      const entry = this.build(materialSource(material), false, material.key, /#define\s+HAS_SURFACE\b/.test(material.glsl));
      this.programs.set(material.key, entry);
      // Without the parallel extension, finishing here blocks; do one per frame.
      if (!this.parallel) {
        this.finish(entry);
        break;
      }
      pending++;
    }
  }

  /** Free the least recently used programs beyond `max`, never the pinned ones. */
  trim(pinned: Set<string>, max = 10) {
    const ready = [...this.programs.entries()].filter(([key, e]) => e.status !== "pending" && !pinned.has(key));
    const excess = this.programs.size - max;
    if (excess <= 0) return;
    ready.sort((a, b) => a[1].used - b[1].used);
    for (const [key, entry] of ready.slice(0, excess)) {
      this.gl.deleteProgram(entry.program);
      this.programs.delete(key);
    }
  }

  status(key: string): Status | "queued" | "none" {
    if (this.failures.has(key)) return "error";
    const entry = this.programs.get(key);
    if (entry) return this.isDone(entry) ? entry.status : "pending";
    return this.queue.some((m) => m.key === key) ? "queued" : "none";
  }

  errors() {
    return [...this.failures.entries()].map(([key, log]) => ({ key, log }));
  }

  private loc(p: Program, name: string) {
    let l = p.uniforms.get(name);
    if (l === undefined) {
      l = this.gl.getUniformLocation(p.program, name);
      p.uniforms.set(name, l);
    }
    return l;
  }

  // ── Targets ─────────────────────────────────────────────────────────────────
  private target(name: string, w: number, h: number, half = false): Target {
    const gl = this.gl;
    const existing = this.targets[name];
    if (existing && existing.w === w && existing.h === h) return existing;
    if (existing) {
      gl.deleteFramebuffer(existing.fbo);
      gl.deleteTexture(existing.tex);
      delete this.baked[name];
    }
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (half) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, w, h, 0, gl.RED, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.texParams(gl.LINEAR);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const t = { fbo, tex, w, h };
    this.targets[name] = t;
    return t;
  }

  private bindTex(unit: number, tex: WebGLTexture | null) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  private drawScene(entry: Program, state: RenderState, out: Target, slot: string) {
    const gl = this.gl;
    entry.used = this.clock;
    gl.useProgram(entry.program);
    this.bindTex(0, this.fieldTex);
    this.bindTex(1, this.glyphTex);
    // Unit 2 may still hold a surface bake that is about to be a render target.
    this.bindTex(2, null);
    gl.uniform1i(this.loc(entry, "uField"), 0);
    gl.uniform1i(this.loc(entry, "uGlyphs"), 1);
    gl.uniform1i(this.loc(entry, "uSurf"), 2);
    gl.uniform1f(this.loc(entry, "uFieldExtent"), FIELD_EXTENT);
    gl.uniform1f(this.loc(entry, "uTime"), state.time);
    gl.uniformMatrix3fv(this.loc(entry, "uRot"), false, state.rot);
    gl.uniform1f(this.loc(entry, "uRelief"), state.relief);
    gl.uniform3f(this.loc(entry, "uLight"), ...state.light);
    gl.uniform2f(this.loc(entry, "uPointer"), ...state.pointer);
    gl.uniform1f(this.loc(entry, "uSeed"), state.seed);
    gl.uniform1i(this.loc(entry, "uKeyMode"), state.morphTo && state.morphStyle === PART_STYLE ? 1 : 0);

    let surf: Target | null = null;
    if (entry.surface && this.halfFloat) {
      // About one texel per output pixel of the face.
      const n = Math.max(128, Math.min(1024, Math.round(Math.max(out.w, out.h) * 0.8)));
      surf = this.target(slot, n, n, true);
      const key = `${entry.key}|${state.time}|${state.relief}|${state.seed}`;
      if (this.baked[slot] !== key) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, surf.fbo);
        gl.viewport(0, 0, n, n);
        gl.uniform1i(this.loc(entry, "uPass"), 1);
        gl.uniform1f(this.loc(entry, "uSurfOn"), 0);
        gl.uniform2f(this.loc(entry, "uRes"), n, n);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        this.baked[slot] = key;
      }
      this.bindTex(2, surf.tex);
    }
    gl.uniform1i(this.loc(entry, "uPass"), 0);
    gl.uniform1f(this.loc(entry, "uSurfOn"), surf ? 1 : 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo);
    gl.viewport(0, 0, out.w, out.h);
    gl.uniform2f(this.loc(entry, "uRes"), out.w, out.h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private pass(p: Program, src: Target, out: Target | null, w: number, h: number, set?: (p: Program) => void) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(p.program);
    this.bindTex(0, src.tex);
    gl.uniform1i(this.loc(p, "uSrc"), 0);
    gl.uniform2f(this.loc(p, "uRes"), src.w, src.h);
    set?.(p);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Is this material's program compiled and usable? */
  ready(key: string) {
    const e = this.programs.get(key);
    return !!e && this.isDone(e) && e.status === "ready";
  }

  /**
   * Draw a frame. `w`/`h` are output pixels; the scene renders at `sw`x`sh`.
   * With `into` the result goes to a named offscreen target instead of the
   * canvas. Returns false when a needed program is not ready yet.
   */
  render(state: RenderState, w: number, h: number, sw = w, sh = h, into?: string): boolean {
    if (!this.fieldTex || !this.coreReady() || !this.ready(state.material.key)) return false;
    const a = this.programs.get(state.material.key)!;
    // While transmuting the morph pass always runs (even at 0), so the background stays the same black throughout.
    const to = state.morphTo && this.ready(state.morphTo.material.key) ? state.morphTo : null;
    const tag = into ? `${into}:` : "";

    // Each side is filtered with its own layers before the two are dissolved together.
    const sceneA = this.target(`${tag}a`, sw, sh);
    this.drawScene(a, state, sceneA, `${tag}sa`);
    let current = this.filterChain(sceneA, state.filters, state.time, `${tag}fa`);
    if (to) {
      const b = this.programs.get(to.material.key)!;
      const sceneB = this.target(`${tag}b`, sw, sh);
      this.drawScene(b, { ...state, material: to.material, relief: to.relief, light: to.light }, sceneB, `${tag}sb`);
      const filteredB = this.filterChain(sceneB, to.filters, state.time, `${tag}fb`);
      const out = this.target(`${tag}m`, sw, sh);
      this.pass(this.morphProgram, current, out, sw, sh, (p) => {
        this.bindTex(1, filteredB.tex);
        this.gl.uniform1i(this.loc(p, "uB"), 1);
        this.gl.uniform1f(this.loc(p, "uMix"), state.morph ?? 0);
        this.gl.uniform1i(this.loc(p, "uStyle"), state.morphStyle ?? 0);
        this.gl.uniform1f(this.loc(p, "uTime"), state.time);
      });
      current = out;
    }
    const final = into ? this.target(into, w, h) : null;
    this.pass(this.blitProgram, current, final, w, h);
    return true;
  }

  /** Run a scene target through filter layers (ping-ponging between two `name` targets). */
  private filterChain(src: Target, filters: FilterLayer[], time: number, name: string): Target {
    let current = src;
    let flip = 0;
    for (const layer of filters) {
      const index = FILTERS.findIndex((f) => f.key === layer.key);
      if (index <= 0 || layer.amount <= 0) continue;
      const out = this.target(`${name}${flip}`, src.w, src.h);
      this.pass(this.filterProgram, current, out, src.w, src.h, (p) => {
        this.gl.uniform1i(this.loc(p, "uFilter"), index);
        this.gl.uniform1f(this.loc(p, "uAmount"), layer.amount);
        this.gl.uniform1f(this.loc(p, "uTime"), time);
      });
      current = out;
      flip ^= 1;
    }
    return current;
  }

  /** Render a material into a small image (webp). Null until its program is ready. */
  thumbnail(state: RenderState, size: number): Promise<Blob | null> | null {
    if (!this.render(state, size, size, size, size, "thumb")) return null;
    const gl = this.gl;
    const t = this.targets["thumb"];
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    const pixels = new Uint8ClampedArray(size * size * 4);
    gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // GL rows run bottom-up.
    const flipped = new Uint8ClampedArray(pixels.length);
    const row = size * 4;
    for (let y = 0; y < size; y++) flipped.set(pixels.subarray((size - 1 - y) * row, (size - y) * row), y * row);
    const canvas = (this.readCanvas ??= document.createElement("canvas"));
    canvas.width = size;
    canvas.height = size;
    canvas.getContext("2d")!.putImageData(new ImageData(flipped, size, size), 0, 0);
    // Encoding is async, off the frame.
    return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  }

  /**
   * Which controls change this material's picture at all: renders small stills
   * with the relief doubled and with the light swung round, and compares them
   * with the base. Null until the program is ready.
   */
  probe(state: RenderState, size = 64): { relief: boolean; light: boolean } | null {
    const gl = this.gl;
    const read = (s: RenderState) => {
      if (!this.render(s, size, size, size, size, "probe")) return null;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.targets["probe"].fbo);
      const px = new Uint8Array(size * size * 4);
      gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return px;
    };
    const differs = (a: Uint8Array, b: Uint8Array | null) => {
      if (!b) return true;
      let sum = 0;
      for (let i = 0; i < a.length; i += 4) sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      return sum / ((a.length / 4) * 3) > 0.5;
    };
    const base = read(state);
    if (!base) return null;
    const [x, y, z] = state.light;
    return {
      relief: differs(base, read({ ...state, relief: state.relief * 2 })),
      light: differs(base, read({ ...state, light: [-x, -y, z] })),
    };
  }

  /** Debug: average GPU milliseconds per frame for a state at a size (blocks while it runs). */
  bench(state: RenderState, size: number, frames = 6): number | null {
    const gl = this.gl;
    const px = new Uint8Array(4);
    const sync = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.targets["bench"].fbo);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    };
    if (!this.render(state, size, size, size, size, "bench")) return null;
    sync();
    const t0 = performance.now();
    for (let i = 0; i < frames; i++) {
      this.render({ ...state, time: state.time + i * 0.05 }, size, size, size, size, "bench");
      sync();
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return (performance.now() - t0) / frames;
  }
}

/** Rotation object -> world from yaw (about y), pitch (about x) and roll (about z), radians; column-major. */
export function rotationMatrix(yaw: number, pitch: number, roll: number): Float32Array {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  const cz = Math.cos(roll), sz = Math.sin(roll);
  // R = Rx(pitch) * Ry(yaw) * Rz(roll)
  const ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
  const rx = [1, 0, 0, 0, cx, sx, 0, -sx, cx];
  const rz = [cz, sz, 0, -sz, cz, 0, 0, 0, 1];
  const mul = (a: number[], b: number[]) => {
    const o = new Array(9).fill(0);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) o[c * 3 + r] += a[k * 3 + r] * b[c * 3 + k];
    return o;
  };
  return new Float32Array(mul(rx, mul(ry, rz)));
}

/** World direction to the light for an azimuth in degrees (0 right, 90 above), always somewhat in front. */
export function lightDirection(azimuthDeg: number): [number, number, number] {
  const a = (azimuthDeg * Math.PI) / 180;
  const v = [Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.7];
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}
