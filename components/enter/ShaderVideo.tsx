"use client";

import { useEffect, useRef, useState } from "react";
import * as refraction from "@/lib/custom-effects/CodeComponentId_8b149d5270f8d80ad8281db6fa72c4f467bb4ab2_417";
import * as dither from "@/lib/custom-effects/CodeComponentId_55a4ca852373c81b69803326c5af7aa5f1af580b_412";

/**
 * Not mounted at the moment: Figma's shaders are hidden on the /enter frame, which
 * is now the home page held back (components/enter/Splash). Kept, with the shader
 * modules, for when they come back.
 *
 * The /enter backdrop: the orbit clip with Figma's effect stack on node 8713:24307,
 * in order: a "Pattern refraction" shader, a "Dither" shader, a layer blur (24) and
 * a monotone noise (black at 20%, finest grain).
 *
 * The two shaders are currently hidden in Figma, so `visible: false` here and
 * nothing runs on the GPU; flip a flag to bring one back. Their modules in
 * lib/custom-effects are Figma's, unedited; this component is the host that feeds
 * them: each decoded video frame goes into a texture and through the visible
 * shaders on WebGPU (Figma's own runtime captures DOM through HTML-in-Canvas, which
 * a video doesn't need). They render at Figma's 1440 x 810 frame, since their
 * parameters are in pixels. Without WebGPU the plain clip shows.
 *
 * It fills its box at the clip's own 16:9 (the /enter page sizes that box to match
 * the home hero exactly); nothing is cropped.
 */
const W = 1440;
const H = 810;

/** Figma's shader effects, in order, with their parameters and visibility. */
const SHADERS = [
  {
    effect: refraction,
    visible: false,
    params: {
      iorDispersion: 100,
      frost: 35,
      centerHandle: { x: 50, y: 50, radius: 8, angle: -150 },
      amount: -100,
      patternType: 0,
      seamlessness: 34,
      pixelWrapMode: 2,
    },
  },
  {
    effect: dither,
    visible: false,
    params: {
      algorithm: "Bayer 16x16",
      monoColor: { r: 1, g: 1, b: 1, a: 1 },
      contrast: 1.3799999952316284,
      levels: 5,
      mono: true,
      brightness: 100,
      pixelSize: 1,
    },
  },
].filter((s) => s.visible);

/**
 * Figma's layer blur of 24 is a CSS blur of 12px on its 594px-wide clip: kept in that
 * proportion to the clip's width, whatever size it renders at (cqw = 1% of the box).
 */
const BLUR = "blur(2.0202cqw)";
/** Figma's monotone noise: black at 20%. */
const NOISE_ALPHA = 0.2;

// The slice of WebGPU this host touches (the project has no WebGPU typings).
type Texture = { width: number; height: number; format: string; createView(): unknown; destroy(): void };
type Device = {
  createTexture(desc: { size: number[]; format: string; usage: number }): Texture;
  queue: {
    copyExternalImageToTexture(
      source: { source: HTMLCanvasElement },
      destination: { texture: Texture },
      size: number[],
    ): void;
  };
  destroy(): void;
};
type Gpu = {
  requestAdapter(): Promise<{ requestDevice(): Promise<Device> } | null>;
  getPreferredCanvasFormat(): string;
};
type GpuCanvas = {
  configure(config: { device: Device; format: string; alphaMode: string }): void;
  getCurrentTexture(): Texture;
};
type Frame = { state: Record<string, unknown>; params: object; input: Texture | null; output: Texture | null };
type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

/** A tile of per-pixel black noise, drawn once (Figma's noise is static). */
function noiseTile() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(size, size);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = Math.random() * NOISE_ALPHA * 255;
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

export default function ShaderVideo({
  src,
  poster,
  className = "",
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gpu, setGpu] = useState(false);
  const [noise, setNoise] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current as FrameVideo | null;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    let dead = false;
    let device: Device | null = null;
    let vfc = 0;
    let raf = 0;

    setNoise(noiseTile());

    // Reduced motion: hold the first frame instead of looping.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) video.pause();
    else video.play().catch(() => {});

    // With every shader hidden there's nothing for the GPU to do.
    if (!SHADERS.length) return;

    (async () => {
      const api = (navigator as unknown as { gpu?: Gpu }).gpu;
      const adapter = api ? await api.requestAdapter().catch(() => null) : null;
      const ctx = canvas.getContext("webgpu") as unknown as GpuCanvas | null;
      if (!api || !adapter || !ctx || dead) return;
      const dev = await adapter.requestDevice();
      if (dead) {
        dev.destroy();
        return;
      }
      device = dev;
      canvas.width = W;
      canvas.height = H;
      const format = api.getPreferredCanvasFormat();
      ctx.configure({ device: dev, format, alphaMode: "premultiplied" });

      const U = (globalThis as unknown as { GPUTextureUsage: Record<string, number> }).GPUTextureUsage;
      const usage = U.TEXTURE_BINDING | U.RENDER_ATTACHMENT | U.COPY_DST;
      const input = dev.createTexture({ size: [W, H], format: "rgba8unorm", usage });
      // Ping-pong between two textures when more than one shader runs.
      const temps = [0, 1].map(() => dev.createTexture({ size: [W, H], format, usage }));
      const frames: Frame[] = SHADERS.map((s) => ({ state: {}, params: s.params, input: null, output: null }));
      SHADERS.forEach((s, i) => s.effect.setup(dev, frames[i]));

      // The clip is cover-cropped into Figma's frame on a 2D canvas, then uploaded.
      const stage = document.createElement("canvas");
      stage.width = W;
      stage.height = H;
      const s2d = stage.getContext("2d");

      const draw = () => {
        if (dead || !s2d || !video.videoWidth) return;
        const k = Math.max(W / video.videoWidth, H / video.videoHeight);
        const dw = video.videoWidth * k;
        const dh = video.videoHeight * k;
        s2d.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
        dev.queue.copyExternalImageToTexture({ source: stage }, { texture: input }, [W, H]);
        let source = input;
        SHADERS.forEach((s, i) => {
          const last = i === SHADERS.length - 1;
          const target = last ? ctx.getCurrentTexture() : temps[i % 2];
          frames[i].input = source;
          frames[i].output = target;
          s.effect.render(dev, frames[i]);
          source = target;
        });
      };

      setGpu(true);
      // One pass per decoded frame (the clip is 12 fps), not per screen refresh.
      if (video.requestVideoFrameCallback) {
        const tick = () => {
          draw();
          vfc = video.requestVideoFrameCallback!(tick);
        };
        vfc = video.requestVideoFrameCallback(tick);
      } else {
        const loop = () => {
          draw();
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      }
      if (video.readyState >= 2) draw();
      else video.addEventListener("loadeddata", draw, { once: true });
    })();

    return () => {
      dead = true;
      if (vfc && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(vfc);
      cancelAnimationFrame(raf);
      device?.destroy();
    };
  }, []);

  return (
    <div className={`@container relative aspect-[1440/810] w-full ${className}`} aria-hidden>
      {/* Clip (or its shaded canvas), then Figma's layer blur over it. */}
      <div className="absolute inset-0" style={{ filter: BLUR }}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full object-cover ${gpu ? "" : "hidden"}`}
        />
      </div>
      {/* Figma's noise sits on the clip, unblurred: one tile pixel per device pixel on retina. */}
      {noise && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: `url(${noise})`, backgroundSize: "128px 128px" }}
        />
      )}
    </div>
  );
}
