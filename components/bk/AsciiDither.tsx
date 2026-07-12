"use client";

import { useEffect, useRef } from "react";

/**
 * section-work-0 — the ASCII "BIMAKAVACH" field.
 *
 * Renders the source video through a WebGL2 fragment shader that reproduces the
 * Figma composition (node 8262-149012): a Bayer-16×16, 2-level, mono-white
 * ordered dither, sliced into 9 horizontal bands. Each band is tinted by one of
 * the 9 filter colours — 8 with Figma "Plus Darker" (linear burn), the middle
 * band (index 4, #4100cf) with "Plus Lighter" (additive) so it reads as a bright
 * violet strip with white dots. The whole composite is produced in-shader, so no
 * CSS blend modes are involved and it looks identical across browsers.
 */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  // vUv: (0,0) top-left → (1,1) bottom-right
  vUv = vec2(aPos.x * 0.5 + 0.5, 1.0 - (aPos.y * 0.5 + 0.5));
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVideo;   // the ascii source video
uniform sampler2D uBayer;   // 16×16 ordered-dither threshold map (R channel, 0..1)
uniform vec3  uColors[9];   // the 9 band filter colours
uniform float uBrightness;  // Figma Brightness (1.01)
uniform float uContrast;    // Figma Contrast (1.0)
uniform float uCell;        // dither cell size in device px (Figma "Size")
uniform float uReveal;      // 0..1 staggered entry progress
uniform float uBandStagger; // normalised delay between consecutive bands
uniform float uBandDur;     // normalised per-band reveal duration

void main() {
  // Which of the 9 horizontal bands this fragment belongs to, and its local Y.
  float b = min(floor(vUv.y * 9.0), 8.0);
  int band = int(b);
  float localY = fract(vUv.y * 9.0);

  // Per-band entry: band 0 reveals first, each subsequent band a little later.
  float p = clamp((uReveal - b * uBandStagger) / uBandDur, 0.0, 1.0);
  p = p * p * (3.0 - 2.0 * p); // smoothstep ease

  // Slide the band's content in from the right as it reveals.
  vec2 uv = vec2(vUv.x + (1.0 - p) * 0.05, localY);

  // The video is cover-fit into each band (band & video aspect ≈ 14.1, so a
  // near-exact fill). Each band shows the full ascii strip.
  vec3 src = texture(uVideo, uv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));

  // Brightness / contrast (Figma dither controls).
  luma = clamp((luma - 0.5) * uContrast + 0.5, 0.0, 1.0) * uBrightness;

  // Ordered dither → 2 levels (mono white on black). uCell scales the pattern.
  ivec2 cell = ivec2(gl_FragCoord.xy / uCell);
  float threshold = texelFetch(uBayer, ivec2(cell.x % 16, cell.y % 16), 0).r;
  float mono = luma > threshold ? 1.0 : 0.0;

  // Band tint. Middle band = Plus Lighter (additive); others = Plus Darker
  // (linear burn). With a binary backdrop this yields: darker bands show the
  // colour only on the lit dots; the middle band shows a violet field with
  // white dots.
  vec3 c = uColors[band];
  vec3 outColor = (band == 4)
    ? clamp(vec3(mono) + c, 0.0, 1.0)          // plus-lighter
    : clamp(vec3(mono) + c - 1.0, 0.0, 1.0);   // plus-darker

  fragColor = vec4(outColor * p, 1.0); // fade the band up from black
}
`;

/** Recursive Bayer matrix, values 0..(n*n-1). */
function bayerMatrix(n: number): number[][] {
  if (n === 1) return [[0]];
  const half = bayerMatrix(n / 2);
  const h = n / 2;
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < h; x++) {
      const v = half[y][x];
      m[y][x] = 4 * v;
      m[y][x + h] = 4 * v + 2;
      m[y + h][x] = 4 * v + 3;
      m[y + h][x + h] = 4 * v + 1;
    }
  }
  return m;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("shader compile error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function AsciiDither({
  active,
  colors,
  videoSrc,
  cell = 2,
  brightness = 1.01,
  contrast = 1.0,
}: {
  active: boolean;
  colors: readonly string[];
  videoSrc: string;
  cell?: number;
  brightness?: number;
  contrast?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const drawRef = useRef<(() => void) | null>(null);
  const reduceRef = useRef(false);
  const revealRef = useRef(0); // 0..1 staggered band-entry progress

  // ── WebGL setup (re-runs only if the visual config changes) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
    });
    if (!gl) {
      console.warn("WebGL2 unavailable — ascii dither disabled");
      return;
    }

    reduceRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ── program ──
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("program link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // ── fullscreen triangle ──
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // ── bayer texture (16×16, R8) ──
    const N = 16;
    const mat = bayerMatrix(N);
    const bayerData = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        // +0.5 centres each threshold within its level
        bayerData[y * N + x] = Math.round(((mat[y][x] + 0.5) / (N * N)) * 255);
      }
    }
    const bayerTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bayerTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8,
      N,
      N,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      bayerData,
    );

    // ── video texture ──
    const videoTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // 1×1 black placeholder until the first frame is ready
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );

    // ── uniforms ──
    const uVideo = gl.getUniformLocation(prog, "uVideo");
    const uBayer = gl.getUniformLocation(prog, "uBayer");
    const uColors = gl.getUniformLocation(prog, "uColors");
    const uBrightness = gl.getUniformLocation(prog, "uBrightness");
    const uContrast = gl.getUniformLocation(prog, "uContrast");
    const uCell = gl.getUniformLocation(prog, "uCell");
    const uReveal = gl.getUniformLocation(prog, "uReveal");
    const uBandStagger = gl.getUniformLocation(prog, "uBandStagger");
    const uBandDur = gl.getUniformLocation(prog, "uBandDur");

    gl.uniform1i(uVideo, 0);
    gl.uniform1i(uBayer, 1);
    const colorData = new Float32Array(9 * 3);
    for (let i = 0; i < 9; i++) {
      const [r, g, b] = hexToRgb(colors[i] ?? "#000000");
      colorData.set([r, g, b], i * 3);
    }
    gl.uniform3fv(uColors, colorData);
    gl.uniform1f(uBrightness, brightness);
    gl.uniform1f(uContrast, contrast);
    // Band 0 leads; each later band is delayed by uBandStagger, over uBandDur.
    gl.uniform1f(uBandStagger, 0.06);
    gl.uniform1f(uBandDur, 0.5);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    gl.uniform1f(uCell, cell * dpr);

    // ── sizing ──
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── render ──
    let lastUpload = -1;
    const draw = () => {
      gl.uniform1f(uReveal, revealRef.current);
      // Upload the newest decoded frame (skip if the video hasn't advanced).
      if (video.readyState >= 2 && video.currentTime !== lastUpload) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTex);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          video,
        );
        lastUpload = video.currentTime;
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    drawRef.current = draw;

    return () => {
      drawRef.current = null;
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteTexture(videoTex);
      gl.deleteTexture(bayerTex);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
    };
  }, [colors, videoSrc, cell, brightness, contrast]);

  // ── play/pause the render loop with visibility, driving the band reveal ──
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    if (!active) {
      video.pause();
      stop();
      // Reset so the staggered entry replays next time it scrolls into view.
      revealRef.current = 0;
      canvas.style.filter = "blur(10px)";
      return;
    }

    if (reduceRef.current) {
      // Fully revealed, static — no animation.
      revealRef.current = 1;
      canvas.style.filter = "none";
      const once = () => drawRef.current?.();
      if (video.readyState >= 2) once();
      else video.addEventListener("loadeddata", once, { once: true });
      return () => video.removeEventListener("loadeddata", once);
    }

    video.play().catch(() => {});
    const REVEAL_MS = 1600;
    const start = performance.now();
    const loop = () => {
      const t = Math.min((performance.now() - start) / REVEAL_MS, 1);
      revealRef.current = t;
      // Overall blur clears as the bands settle in.
      canvas.style.filter = t < 1 ? `blur(${(1 - t) * 10}px)` : "none";
      drawRef.current?.();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return stop;
  }, [active]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="h-full w-full" />
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        loop
        playsInline
        crossOrigin="anonymous"
        className="hidden"
      />
    </div>
  );
}
