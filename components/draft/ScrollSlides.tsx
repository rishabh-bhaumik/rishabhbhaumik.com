"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { EASE } from "@/lib/motion";
import { BODY, FootShade, LoopBar, Tag, rail } from "./ui";

export type ScrollSlide = {
  tag: string;
  /** The image. Row slides may leave it out for a blank frame while media is to come;
      stack slides need one. */
  src?: string;
  alt?: string;
  /** Intrinsic size of the image. */
  width?: number;
  height?: number;
  copy: React.ReactNode;
  /** Row layout only: sit the copy at the media's foot instead of its top. */
  bottom?: boolean;
  /**
   * Row layout only: where the image sits in the white 960 × 540 frame, in Figma px
   * (its height follows its ratio). Without it, the image is fitted and centred.
   */
  place?: { left: number; top: number; width: number };
  /** Row layout only: live content for the white frame (positioned inside it) in place of an image. */
  media?: React.ReactNode;
};

/**
 * Sub-points (005.1…, 006.1…) that swap in place while you scroll: the block pins
 * under the header for one screen of scrolling per slide, and the scroll position
 * picks which slide shows. Each change runs a short parallax stagger: the media
 * travels furthest, the tag and copy follow a beat later over shorter distances,
 * in the scroll's direction. An invisible screen-tall marker per slide gives the
 * rail a target and scroll-spy.
 *
 * `stack`: media (square, shaded at the foot like the row's frame), then the tag and a
 * centred caption under it.
 * `row` (Figma 8701:27836): the tag and copy in a 424px column on the left, 80px clear
 *   of the media on the right: a white 960 × 540 frame, square and shaded at the foot
 *   like 003 and 004's art, with the image fitted or placed inside it.
 */
/** A placeholder frame's loop, until its media is in. */
const PLACEHOLDER_LOOP = 6;

export default function ScrollSlides({
  slides,
  idPrefix,
  layout,
}: {
  slides: ScrollSlide[];
  idPrefix: string;
  layout: "stack" | "row";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ index: 0, dir: 1 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(slides.length - 1, Math.max(0, Math.round(p * (slides.length - 1))));
    setState((s) => (s.index === next ? s : { index: next, dir: next > s.index ? 1 : -1 }));
  });

  const { index, dir } = state;
  const s = slides[index];
  // Enter from the scroll direction, leave the other way; nearer layers move less.
  // Variants take the direction through AnimatePresence's `custom`, so the leaving
  // slide also exits the way you are scrolling now.
  const layer = (travel: number, delay: number) => ({
    custom: dir,
    initial: "enter",
    animate: "center",
    exit: "exit",
    variants: {
      enter: (d: number) => ({ opacity: 0, y: d * travel }),
      center: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
      exit: (d: number) => ({
        opacity: 0,
        y: -d * travel * 0.6,
        transition: { duration: 0.35, ease: EASE },
      }),
    },
  });

  // Stack (006): the media sized to fit the pinned screen with room for the caption,
  // capped at 904px wide.
  const w = s.width ?? 16;
  const h = s.height ?? 9;
  const ratio = `${w} / ${h}`;
  // Row: the image in a white 16:9 frame, placed (as a share of 960 × 540) or fitted.
  const frame = (
    <m.div
      {...layer(96, 0)}
      // Live media (005.1's form) sits on white; a placeholder takes the surface (dark) or
      // white (light), like 003 and 004's art.
      className={`relative aspect-video w-full overflow-hidden ${s.media ? "bg-white" : "bg-surface light:bg-white"}`}
    >
      {s.media}
      {!s.media && s.src && (
        <Image
          src={s.src}
          alt={s.alt ?? ""}
          width={w}
          height={h}
          sizes="(min-width: 1512px) 960px, (min-width: 1024px) 64vw, 100vw"
          className={s.place ? "absolute h-auto" : "absolute inset-0 h-full w-full object-contain"}
          style={
            s.place
              ? {
                  left: `${(s.place.left / 960) * 100}%`,
                  top: `${(s.place.top / 540) * 100}%`,
                  width: `${(s.place.width / 960) * 100}%`,
                }
              : undefined
          }
        />
      )}
      <FootShade />
      {/* Live media brings its own bar, in step with it; a placeholder loops one. */}
      {!s.media && <LoopBar seconds={PLACEHOLDER_LOOP} />}
    </m.div>
  );
  const media = (
    <m.div
      {...layer(96, 0)}
      className={`relative overflow-hidden ${s.src ? "" : "bg-surface light:bg-white"}`}
      style={{
        aspectRatio: ratio,
        width: `min(100%, 904px, calc((100svh - 4rem - 11rem) * ${w} / ${h}))`,
      }}
    >
      {s.src && (
        <Image
          src={s.src}
          alt={s.alt ?? ""}
          width={w}
          height={h}
          sizes="(min-width: 1512px) 1464px, 100vw"
          className="block h-full w-full"
        />
      )}
      <FootShade />
      {!s.src && <LoopBar seconds={PLACEHOLDER_LOOP} />}
    </m.div>
  );

  return (
    <div ref={ref} className="relative" style={{ height: `${slides.length * 100}svh` }}>
      {slides.map((sl, i) => (
        <div
          key={sl.tag}
          {...rail(`${idPrefix}-${i + 1}`, sl.tag, 2)}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 h-svh w-full scroll-mt-16"
          style={{ top: `${i * 100}svh` }}
        />
      ))}

      <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-6">
        <div className="grid w-full place-items-center">
          <AnimatePresence initial={false} custom={dir}>
            {layout === "stack" ? (
              <div key={s.tag} className="col-start-1 row-start-1 flex w-full flex-col items-center gap-6">
                {media}
                <m.div {...layer(48, 0.08)}>
                  <Tag>{s.tag}</Tag>
                </m.div>
                <m.div {...layer(28, 0.16)} className={`max-w-[560px] text-center text-balance ${BODY}`}>
                  {s.copy}
                </m.div>
              </div>
            ) : (
              <div
                key={s.tag}
                className={`col-start-1 row-start-1 grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,424px)_minmax(0,960px)] lg:justify-between lg:gap-20 ${
                  s.bottom ? "lg:items-end" : "lg:items-start"
                }`}
              >
                {/* Up to 960 wide, and capped so the frame's height fits the pinned screen. */}
                <div
                  className="min-w-0 lg:order-2 lg:justify-self-end"
                  style={{ width: "min(100%, calc((100svh - 4rem - 4rem) * 16 / 9))" }}
                >
                  {frame}
                </div>
                <div className="flex min-w-0 flex-col justify-center gap-6 lg:order-1">
                  <m.div {...layer(48, 0.08)}>
                    <Tag>{s.tag}</Tag>
                  </m.div>
                  <m.div {...layer(28, 0.16)} className={`flex flex-col gap-[1.7em] ${BODY}`}>
                    {s.copy}
                  </m.div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
