"use client";

import Image from "next/image";
import { createContext, useContext, useRef } from "react";
import { m, motionValue, useScroll, useTransform, type MotionValue } from "framer-motion";
import LazyVideo from "../LazyVideo";

/** How far the frame has grown: 0 at its smallest, 1 at full size. */
const GrowContext = createContext<MotionValue<number>>(motionValue(1));
/** For content inside a GrowMedia frame that moves in step with its growth. */
export const useGrow = () => useContext(GrowContext);

/** What a frame shows: `label` until there's a file, then `src` (an image, or an .mp4 with its `poster`). */
export type Media = {
  readonly label: string;
  readonly src?: string;
  readonly poster?: string;
  readonly alt?: string;
  /** The frame's width over height, when it isn't 16:9 (an image shown at its own shape). */
  readonly aspect?: number;
  /** "contain" for cut-outs on transparent backgrounds; otherwise the media fills the frame. */
  readonly fit?: "cover" | "contain";
};

/** The frame at its smallest (Figma 8818:33296): 1000×526 inside the 1200×675 container. */
const FROM_W = 1000 / 1200;
const FROM_H = 526 / 675;

/**
 * A project page's media frame: a 1200×675 container (the sheet's full width) whose
 * media starts at 1000×526, grows to fill it as the frame comes into view (full size
 * once the whole frame is on screen) and shrinks back as it scrolls away above.
 * - The frame is clipped, and the media inside scaled, in step: together that equals
 *   the media covering a box of the clipped size, without laying anything out again.
 * - `still` keeps it full size throughout (no frame uses it at present; every frame,
 *   the opening one included, grows).
 * - Under reduced motion every frame stays full size (globals.css).
 * - Until a file is added it shows its label on the empty frame.
 * - `children` take the media's place (a scene of their own, like Netra's splash) and
 *   can read the growth with `useGrow()`.
 */
export default function GrowMedia({
  media,
  still = false,
  children,
}: {
  media: Media;
  still?: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Arriving: 0 when the frame's top meets the bottom of the screen, 1 when it's all in.
  const { scrollYProgress: arrive } = useScroll({ target: ref, offset: ["start end", "end end"] });
  // Leaving: 0 when its top reaches the top of the screen, 1 when it's gone.
  const { scrollYProgress: leave } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const grow = useTransform([arrive, leave], ([a, l]: number[]) => a * (1 - l));
  const clipPath = useTransform(grow, (g) => {
    const x = ((1 - FROM_W) / 2) * (1 - g) * 100;
    const y = ((1 - FROM_H) / 2) * (1 - g) * 100;
    return `inset(${y}% ${x}%)`;
  });
  const scale = useTransform(grow, (g) => FROM_W + (1 - FROM_W) * g);

  return (
    <div ref={ref} style={{ aspectRatio: media.aspect ?? 1200 / 675 }} className="relative w-full overflow-hidden">
      {/* The surface fill backs placeholders and contained images; a scene paints its own
          (a fill under it would blend into its edges where they fall on a fractional pixel). */}
      <m.div data-grow style={still ? undefined : { clipPath }} className={`absolute inset-0 ${children ? "" : "bg-surface"}`}>
        {children && (
          <m.div data-grow-scale style={still ? undefined : { scale }} className="absolute inset-0 will-change-transform">
            <GrowContext.Provider value={grow}>{children}</GrowContext.Provider>
          </m.div>
        )}
        {!children && media.src && (
          <m.div data-grow-scale style={still ? undefined : { scale }} className="absolute inset-0 will-change-transform">
            {media.src.endsWith(".mp4") ? (
              <LazyVideo src={media.src} poster={media.poster ?? ""} className="h-full w-full object-cover" />
            ) : (
              <Image
                src={media.src}
                alt={media.alt ?? ""}
                fill
                sizes="(min-width: 1200px) 1200px, 100vw"
                className={media.fit === "contain" ? "object-contain" : "object-cover"}
              />
            )}
          </m.div>
        )}
        {!children && !media.src && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-12 uppercase leading-[1.4] tracking-[0.01em] text-subtle">
            {media.label}
          </p>
        )}
      </m.div>
    </div>
  );
}
