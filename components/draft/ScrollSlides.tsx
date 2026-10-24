"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { EASE } from "@/lib/motion";
import { BODY, CARD, Tag, rail } from "./ui";

export type ScrollSlide = {
  tag: string;
  src: string;
  alt: string;
  /** Intrinsic size of the image. */
  width: number;
  height: number;
  copy: React.ReactNode;
  /** Row layout only: sit the copy at the media's foot instead of its top. */
  bottom?: boolean;
};

/**
 * Sub-points (005.1…, 006.1…) that swap in place while you scroll: the block pins
 * under the header for one screen of scrolling per slide, and the scroll position
 * picks which slide shows. Each change runs a short parallax stagger: the media
 * travels furthest, the tag and copy follow a beat later over shorter distances,
 * in the scroll's direction. An invisible screen-tall marker per slide gives the
 * rail a target and scroll-spy.
 *
 * `stack`: media, then the tag and a centred caption under it.
 * `row`: media left, tag and copy in a 478px column on the right.
 */
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

  // The media is sized to fit the pinned screen (leaving room for the copy in a stack).
  const ratio = `${s.width} / ${s.height}`;
  const media = (
    <m.div
      {...layer(96, 0)}
      className={layout === "stack" ? CARD : "overflow-hidden rounded-[12px]"}
      style={{
        aspectRatio: ratio,
        width:
          layout === "stack"
            ? `min(100%, calc((100svh - 4rem - 11rem) * ${s.width} / ${s.height}))`
            : "100%",
      }}
    >
      <Image
        src={s.src}
        alt={s.alt}
        width={s.width}
        height={s.height}
        sizes={layout === "stack" ? "(min-width: 1512px) 1464px, 100vw" : "(min-width: 1024px) 60vw, 100vw"}
        className="block h-full w-full"
      />
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
                <m.div {...layer(28, 0.16)} className={`max-w-[60rem] text-center ${BODY}`}>
                  {s.copy}
                </m.div>
              </div>
            ) : (
              <div
                key={s.tag}
                className={`col-start-1 row-start-1 flex w-full flex-col gap-6 lg:flex-row lg:gap-20 ${
                  s.bottom ? "lg:items-end" : "lg:items-start"
                }`}
              >
                {/* Capped so the row's height fits the pinned screen. */}
                <div
                  className="min-w-0 flex-1"
                  style={{ maxWidth: `calc((100svh - 4rem - 4rem) * ${s.width} / ${s.height})` }}
                >
                  {media}
                </div>
                <div className="flex shrink-0 flex-col justify-center gap-6 lg:w-[478px]">
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
