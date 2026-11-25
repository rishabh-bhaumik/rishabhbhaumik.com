"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Magnet from "../Magnet";

/*
 * The whiteboarding frame (Figma 8913:30316, "container-research"): the whiteboard photo
 * (8913:30359), centred, over the room it was drawn in (8913:30343), the room's left half
 * mirrored onto the right. Both layers are Figma's own 2x renders with their lens and dither
 * shaders baked in. Laid out on Figma's 1200 × 675 frame and scaled to cover the GrowMedia
 * frame. Light in either theme, as the design is. While the pointer is over the frame, the photo is drawn toward it on a spring
 * (React Bits' Magnet), and settles back when it leaves; still under reduced motion.
 */

const W = 1200;
const H = 675;

/** The photo's box in the frame (container-img's size and radius 8), centred both ways. */
const PW = 505.112;
const PH = 631.352;
const PHOTO = { left: (W - PW) / 2, top: (H - PH) / 2, width: PW, height: PH };

export default function NetraWhiteboard({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<number | null>(null);
  const [over, setOver] = useState(false);

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
      role="img"
      aria-label={label}
      className="absolute inset-0 overflow-hidden"
      onPointerEnter={(e) => e.pointerType !== "touch" && setOver(true)}
      onPointerLeave={() => setOver(false)}
      style={{ background: "linear-gradient(to bottom, #fff 80%, #f4f5f6)" }}
    >
      <div
        aria-hidden
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
          padding={W}
          magnetStrength={7}
          maxOffset={56}
          tilt={4}
          scale={1.02}
          style={{ position: "absolute", ...PHOTO }}
          innerClassName="size-full overflow-hidden rounded-[8px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 2x render, laid out in frame px */}
          <img src="/media/netra/whiteboard.webp" alt="" className="size-full object-cover" />
        </Magnet>
      </div>
    </div>
  );
}
