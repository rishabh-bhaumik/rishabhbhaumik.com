"use client";

import Image from "next/image";
import { Fragment, useRef, useState } from "react";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { getLenis } from "@/components/SmoothScroll";
import { EASE } from "@/lib/motion";
import { CARD } from "./ui";

export type PivotStep = {
  /** Month the step happened, as "MM.YY" (shown on the card and the ruler). */
  date: string;
  title: string;
  /** Paragraphs on the step, under the title (optional while copy is in progress). */
  body?: string[];
  /** What changed, one ticked line each. */
  points: string[];
  /** The homepage at that point, shown in the phone. A blank screen until it's in.
      The shot fills the screen's width from just under the status bar; `bg` fills
      the status bar and anything below a short shot. */
  screen?: { src: string; alt: string; width: number; height: number; bg: string };
};

/** The ruler runs one tick per month across these years. */
const FIRST_YEAR = 2023;
const YEARS = 4;

/** "03.25" -> month index on the ruler (0 = Jan of FIRST_YEAR). */
function monthIndex(date: string) {
  const [mm, yy] = date.split(".").map(Number);
  return (2000 + yy - FIRST_YEAR) * 12 + (mm - 1);
}

/**
 * 002's before-and-after as a stepper: a phone showing the homepage of the
 * moment on the left, the step's title and what changed on the right, and a
 * month ruler along the foot whose markers jump between steps.
 *
 * The card pins under the header for a screen of scrolling per step, and the
 * scroll position picks the step (each gets an equal stretch): scrolling down
 * walks 03.23 → 06.26, scrolling up walks back, and past the last step it lets
 * go. Previous, Next and the ruler scroll to a step rather than set it, so the
 * two never disagree.
 */
export default function PivotTimeline({ steps }: { steps: PivotStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(p * steps.length))));
  });

  /** Scrolls to the middle of step `i`'s stretch. */
  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const range = el.offsetHeight - window.innerHeight;
    const y = el.getBoundingClientRect().top + window.scrollY + range * ((i + 0.5) / steps.length);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y }); // no Lenis: native routes or reduced motion, so no easing
  };

  const step = steps[active];
  const last = active === steps.length - 1;

  return (
    <div ref={ref} className="relative" style={{ height: `${steps.length * 100}svh` }}>
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center">
        {/* Capped so the card's height fits the pinned screen. Stacked (below lg) it fills
            the screen and the phone takes whatever height the copy leaves. */}
        <div
          className={`${CARD} mx-auto grid w-full max-lg:h-[calc(100svh-6rem)] max-lg:grid-rows-[minmax(0,1fr)_auto] max-lg:[container:pivot-card/size] lg:aspect-[1000/548] lg:grid-cols-2`}
          style={{ maxWidth: "calc((100svh - 4rem - 3rem) * 1000 / 548)" }}
        >
          {/* Phone, cropped at the card's foot. A size container, so on a short phone
              where the copy leaves under 96px it steps aside rather than show a sliver of bezel. */}
          <div className="relative overflow-clip [container-type:size]">
            <div className="absolute left-1/2 top-6 aspect-[2360/4652] w-[min(72%,360px)] -translate-x-1/2 lg:left-[9%] lg:w-[73%] lg:translate-x-0 [@container(max-height:96px)]:hidden">
              {/* Screen, sitting under the frame's transparent cutout (measured from the PNG). */}
              <div className="absolute left-[8.47%] top-[4.3%] h-[91.36%] w-[83.05%] overflow-hidden rounded-[13%/6.2%] bg-white">
                <AnimatePresence initial={false}>
                  {step.screen && (
                    <m.div
                      key={step.date}
                      className="absolute inset-0"
                      style={{ backgroundColor: step.screen.bg }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      <Image
                        src={step.screen.src}
                        alt={step.screen.alt}
                        width={step.screen.width}
                        height={step.screen.height}
                        sizes="(min-width: 1024px) 380px, 300px"
                        className="absolute inset-x-0 top-[5.5%] h-auto w-full"
                      />
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
              <Image
                src="/media/iphone-15-pro.png"
                alt=""
                fill
                sizes="(min-width: 1024px) 420px, 360px"
                className="pointer-events-none select-none"
              />
            </div>
          </div>

          {/* Step copy and the ruler (Figma 8719:24722). From lg the copy sizes against
              this column (cqw: 624 units wide in Figma), capped at Figma's px, so the
              pinned card never overflows on shorter screens. */}
          <div className="@container flex flex-col gap-6 px-6 pb-6 pt-8 lg:gap-0 lg:pb-[6.5%] lg:pl-[6%] lg:pr-[8.75%] lg:pt-[16%] [@container_pivot-card_(max-height:560px)]:gap-4 [@container_pivot-card_(max-height:560px)]:pt-6">
            <div className="flex items-baseline justify-between text-12 text-faint">
              <span className="tabular-nums">{step.date}</span>
              {/* Previous joins after the first step; the last step restarts. */}
              <div className="flex items-baseline gap-4">
                {active > 0 && (
                  <button
                    type="button"
                    onClick={() => go(active - 1)}
                    className="text-12 text-faint transition-colors hover:text-ink"
                  >
                    Previous
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => go(last ? 0 : active + 1)}
                  className="text-12 text-faint transition-colors hover:text-ink"
                >
                  {last ? "Restart" : "Next"}
                </button>
              </div>
            </div>

            <div className="lg:mt-[min(32px,5.128cqw)] lg:flex-1" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={step.date}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex flex-col gap-3 lg:gap-[min(20px,3.205cqw)]"
                >
                  <h3 className="text-[28px] font-normal leading-[1.15] text-ink lg:text-[length:min(48px,7.692cqw)]">
                    {step.title}
                  </h3>
                  {step.body && (
                    // Paragraphs a blank line apart, as in Figma (one line of 1.3).
                    <div className="flex flex-col gap-[1.3em] text-14 leading-[1.3] text-muted lg:text-[length:max(14px,min(18px,2.885cqw))]">
                      {step.body.map((para) => (
                        <p key={para} className="text-pretty">
                          {/* Last two words held together: no paragraph ends on a lone word
                              (Chrome's `pretty` lets a longish one through). */}
                          {para.replace(/ (\S+)$/, "\u00A0$1")}
                        </p>
                      ))}
                    </div>
                  )}
                  <ul className="flex flex-col gap-2 lg:gap-[min(16px,2.564cqw)]">
                    {step.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-16 leading-[1.15] text-muted lg:text-[length:max(16px,min(24px,3.846cqw))]"
                      >
                        {/* Figma's icon/ticker, drawn in ink: dark in the file, flipped for dark
                            mode. Centred on the first line, so a point that wraps keeps it there. */}
                        <span className="flex h-[1.15em] shrink-0 items-center">
                          <Image
                            src="/media/draft/pivot/tick.svg"
                            alt=""
                            width={16}
                            height={16}
                            className="size-[14px] invert light:invert-0 lg:size-[max(14px,min(16px,2.564cqw))]"
                          />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </m.div>
              </AnimatePresence>
            </div>

            {/* A short phone (the stacked card under 560px, e.g. an iPhone SE with Safari's bars)
                hasn't room for every step's copy and the ruler: the ruler steps aside, and the date,
                Previous / Next and scrolling still move between steps. */}
            <div className="[@container_pivot-card_(max-height:560px)]:hidden">
              <Ruler steps={steps} active={active} onSelect={go} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The month ruler (Figma 8731:40836): a block of twelve ticks per year with a dashed
 * rule between years, and a dated marker in place of the tick for each step. Months
 * before the first step are fainter. Blocks are 132 of Figma's 624 units wide, so the
 * ruler scales with its column and the four 16-unit gaps either side of a rule fall out
 * of justify-between.
 */
function Ruler({
  steps,
  active,
  onSelect,
}: {
  steps: PivotStep[];
  active: number;
  onSelect: (i: number) => void;
}) {
  const start = monthIndex(steps[0].date);
  return (
    <div className="flex h-[54px] w-full items-end justify-between" role="group" aria-label="Timeline">
      {Array.from({ length: YEARS }, (_, y) => (
        <Fragment key={y}>
          {y > 0 && (
            <span
              aria-hidden
              className="h-full w-px bg-[repeating-linear-gradient(to_bottom,currentColor_0_4px,transparent_4px_8px)] text-ink/15"
            />
          )}
          <div className="flex h-full w-[21.154%] items-end justify-between">
            {Array.from({ length: 12 }, (_, m) => {
              const month = y * 12 + m;
              const i = steps.findIndex((s) => monthIndex(s.date) === month);
              return (
                <span key={m} className="relative h-full w-0">
                  {i < 0 ? (
                    <span
                      className={`absolute bottom-0 left-0 h-5 w-0.5 -translate-x-1/2 rounded-full ${
                        month < start ? "bg-ink/12" : "bg-ink/25"
                      }`}
                    />
                  ) : (
                    <Marker step={steps[i]} on={i === active} onClick={() => onSelect(i)} />
                  )}
                </span>
              );
            })}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/** A step on the ruler: its date over a pin (a dot on a 32px line, Figma's Line 396). */
function Marker({ step, on, onClick }: { step: PivotStep; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${step.date}: ${step.title}`}
      aria-current={on ? "step" : undefined}
      className="group absolute bottom-0 left-0 flex h-full w-9 -translate-x-1/2 flex-col items-center"
    >
      <span
        className={`whitespace-nowrap text-12 leading-[14px] tabular-nums transition-colors ${
          on ? "text-ink" : "text-faint group-hover:text-ink"
        }`}
      >
        {step.date}
      </span>
      <span
        className={`relative mt-2 w-0.5 flex-1 rounded-full transition-colors ${
          on ? "bg-ink" : "bg-faint/70 group-hover:bg-ink"
        }`}
      >
        <span className="absolute left-1/2 top-0 size-[10.67px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-inherit" />
      </span>
    </button>
  );
}
