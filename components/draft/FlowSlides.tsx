"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { EASE } from "@/lib/motion";
import { CARD, Tag, rail } from "./ui";

export type FlowSlide = { tag: string; src: string; alt: string; caption: string };

/**
 * Slides that swap in place while you scroll: the block pins under the header for
 * one screen of scrolling per slide, and the scroll position picks which slide shows.
 * Each change runs a short parallax stagger: the card travels furthest, the tag and
 * caption follow a beat later over shorter distances, in the scroll's direction.
 * An invisible screen-tall marker per slide gives the rail a target and scroll-spy.
 */
export default function FlowSlides({ slides, idPrefix }: { slides: FlowSlide[]; idPrefix: string }) {
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
            <div
              key={s.tag}
              className="col-start-1 row-start-1 flex w-full flex-col items-center gap-6"
            >
              <m.div
                {...layer(96, 0)}
                className={`aspect-[1464/850] ${CARD}`}
                // Fit the card to the screen height, leaving room for the tag and caption.
                style={{ width: "min(100%, calc((100svh - 4rem - 11rem) * 1464 / 850))" }}
              >
                <Image
                  src={s.src}
                  alt={s.alt}
                  width={1464}
                  height={850}
                  sizes="(min-width: 1512px) 1464px, 100vw"
                  className="block h-full w-full"
                />
              </m.div>
              <m.div {...layer(48, 0.08)}>
                <Tag>{s.tag}</Tag>
              </m.div>
              <m.p
                {...layer(28, 0.16)}
                className="max-w-[60rem] text-center text-14 leading-[1.7] text-muted"
              >
                {s.caption}
              </m.p>
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
