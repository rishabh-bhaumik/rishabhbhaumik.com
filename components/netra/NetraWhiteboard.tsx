"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import Magnet from "../Magnet";

/*
 * The whiteboarding frame (Figma 8913:30316, "container-research"): the whiteboard photo
 * (8913:30359), centred, over the room it was drawn in (8913:30343), the room's left half
 * mirrored onto the right. Both layers are Figma's own 2x renders with their lens and dither
 * shaders baked in; the room is then taken to black and white and dithered coarser
 * (scripts/netra-room-dither.py). Laid out on Figma's 1200 × 675 frame and scaled to cover the
 * GrowMedia frame. Light in either theme, as the design is. While the pointer is over the
 * frame, the photo is drawn toward it on a spring (React Bits' Magnet), and settles back when
 * it leaves; still under reduced motion. Pressing and holding the photo crumples it like paper
 * (React Bits' Paper Crumple, three.js, loaded once the frame is near the screen): it follows
 * the pointer while held and smooths back out on release; the magnet holds still meanwhile.
 * The photo itself shows whenever the sheet is at rest, so the page looks the same until a
 * press. Keyboard: Tab to the photo, hold Space or Enter. With a mouse or trackpad only
 * (hover + fine pointer): on a phone a finger on the photo must still scroll the page.
 */

const W = 1200;
const H = 675;

/** The photo's box in the frame (container-img's size and radius 8), centred both ways. */
const PW = 505.112;
const PH = 631.352;
const PHOTO = { left: (W - PW) / 2, top: (H - PH) / 2, width: PW, height: PH };
/** The crumple scene covers the frame plus this on each side (it keeps 24px clear of its
    edges, so the sheet comes out at the photo's own size), centred on the photo. */
const M = 24;
const SCENE = { left: -(PHOTO.left + M), top: -(PHOTO.top + M), width: W + 2 * M, height: H + 2 * M };

/** Loaded on demand; if three.js can't be fetched the photo just stays a photo. */
const PaperCrumple = dynamic<ComponentProps<typeof import("../PaperCrumple").default>>(
  () => import("../PaperCrumple").catch(() => ({ default: () => null })),
  { ssr: false },
);

export default function NetraWhiteboard({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [near, setNear] = useState(false);
  const [held, setHeld] = useState(false);

  // The crumple scene (three.js and a WebGL context) only with a mouse or trackpad, and only
  // once the frame is near the screen.
  useEffect(() => {
    const el = root.current;
    if (!el || near || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(Math.max((e.contentRect.width + 2) / W, (e.contentRect.height + 2) / H)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={root}
      className="absolute inset-0 overflow-hidden text-[#141210]"
      onPointerEnter={(e) => e.pointerType !== "touch" && setOver(true)}
      onPointerLeave={() => setOver(false)}
      style={{ background: "linear-gradient(to bottom, #fff 80%, #f4f5f6)" }}
    >
      <div
        className="absolute left-1/2 top-1/2 select-none"
        style={{
          width: W,
          height: H,
          transform: `translate(-50%, -50%) scale(${k ?? 1})`,
          visibility: k ? undefined : "hidden",
        }}
      >
        {/* The room's left half, then the same half mirrored onto the right, so the room is
            symmetrical about the photo. Each is clipped to its own left half before the flip. */}
        {["", "-scale-x-100"].map((flip) => (
          // eslint-disable-next-line @next/next/no-img-element -- a fixed 2x render, laid out in frame px
          <img
            key={flip}
            src="/media/netra/whiteboard-room.webp"
            alt=""
            className={`absolute inset-0 size-full object-cover [clip-path:inset(0_50%_0_0)] ${flip}`}
          />
        ))}
        {/* Pulls from anywhere in the frame (padding past its far side), only while the pointer is in it. */}
        <Magnet
          disabled={!over}
          frozen={held}
          padding={W}
          magnetStrength={7}
          maxOffset={56}
          tilt={4}
          scale={1.02}
          style={{ position: "absolute", ...PHOTO }}
          innerClassName="size-full"
        >
          <div className={`size-full overflow-hidden rounded-[8px] ${held ? "invisible" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 2x render, laid out in frame px */}
            <img src="/media/netra/whiteboard.webp" alt={label} className="size-full object-cover" />
          </div>
          {/* The sheet: only its button takes the pointer (over the photo); its canvas shows only
              while held or settling, and its own loading still is hidden (the photo is above). */}
          {near && (
            <PaperCrumple
              src="/media/netra/whiteboard.webp"
              alt="Crumple the whiteboard photo"
              width={PW}
              height={PH}
              onActiveChange={setHeld}
              className={`pointer-events-none [&>button]:pointer-events-auto [&>img]:hidden ${held ? "" : "[&>canvas]:!invisible"}`}
              style={{ position: "absolute", ...SCENE }}
            />
          )}
        </Magnet>
      </div>
    </div>
  );
}
