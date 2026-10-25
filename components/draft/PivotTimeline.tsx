"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { EASE } from "@/lib/motion";
import { CARD } from "./ui";

export type PivotStep = {
  /** Month the step happened, as "MM.YY" (shown on the card and the ruler). */
  date: string;
  title: string;
  /** One line of what changed, comma separated. */
  summary: string;
  /** The homepage at that point, shown in the phone. A blank screen until it's in. */
  screen?: { src: string; alt: string };
};

/** The ruler runs one tick per month across these years. */
const FIRST_YEAR = 2023;
const YEARS = 4;
const MONTHS = YEARS * 12;

/** "03.25" -> month index on the ruler (0 = Jan of FIRST_YEAR). */
function monthIndex(date: string) {
  const [mm, yy] = date.split(".").map(Number);
  return (2000 + yy - FIRST_YEAR) * 12 + (mm - 1);
}

const at = (index: number) => `${(index / (MONTHS - 1)) * 100}%`;

/**
 * 002's before-and-after as a stepper: a phone showing the homepage of the
 * moment on the left, the step's title and what changed on the right, and a
 * month ruler along the foot whose markers jump between steps.
 */
export default function PivotTimeline({ steps }: { steps: PivotStep[] }) {
  const [active, setActive] = useState(0);
  const step = steps[active];
  const last = active === steps.length - 1;

  return (
    <div className={`${CARD} grid lg:aspect-[1000/548] lg:grid-cols-2`}>
      {/* Phone, cropped at the card's foot */}
      <div className="relative h-[320px] overflow-hidden sm:h-[420px] lg:h-auto">
        <div className="absolute left-1/2 top-[3%] aspect-[2360/4652] w-[min(72%,360px)] -translate-x-1/2 lg:left-[9%] lg:w-[73%] lg:translate-x-0">
          {/* Screen, sitting under the frame's transparent cutout (measured from the PNG). */}
          <div className="absolute left-[8.47%] top-[4.3%] h-[91.36%] w-[83.05%] overflow-hidden rounded-[13%/6.2%] bg-white">
            <AnimatePresence initial={false}>
              {step.screen && (
                <m.div
                  key={step.date}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <Image
                    src={step.screen.src}
                    alt={step.screen.alt}
                    fill
                    sizes="360px"
                    className="object-cover object-top"
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

      {/* Step copy and the ruler */}
      <div className="flex flex-col gap-10 px-6 pb-6 pt-8 lg:gap-0 lg:pb-[5%] lg:pl-[12%] lg:pr-[14%] lg:pt-[15%]">
        <div className="flex items-baseline justify-between text-12 text-faint">
          <span className="tabular-nums">{step.date}</span>
          <button
            type="button"
            onClick={() => setActive(last ? 0 : active + 1)}
            className="text-12 text-faint transition-colors hover:text-ink"
          >
            {last ? "Back" : "Next"}
          </button>
        </div>

        <div className="lg:mt-[22%] lg:flex-1" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={step.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex flex-col gap-3"
            >
              <h3 className="text-[32px] font-normal leading-[1.1] text-ink">{step.title}</h3>
              <p className="text-14 leading-[1.5] text-muted">{step.summary}</p>
            </m.div>
          </AnimatePresence>
        </div>

        <Ruler steps={steps} active={active} onSelect={setActive} />
      </div>
    </div>
  );
}

function Ruler({
  steps,
  active,
  onSelect,
}: {
  steps: PivotStep[];
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="relative h-[52px] w-full" role="group" aria-label="Timeline">
      {/* Month ticks */}
      <div className="absolute inset-x-0 bottom-0 flex h-[28px] items-end justify-between">
        {Array.from({ length: MONTHS }, (_, i) => (
          <span key={i} className="h-full w-px bg-ink/25" />
        ))}
      </div>
      {/* Year boundaries */}
      {Array.from({ length: YEARS - 1 }, (_, y) => (
        <span
          key={y}
          className="absolute bottom-0 h-full border-l border-dashed border-ink/15"
          style={{ left: at((y + 1) * 12 - 0.5) }}
        />
      ))}
      {/* Step markers */}
      {steps.map((s, i) => {
        const on = i === active;
        return (
          <button
            key={s.date}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`${s.date}: ${s.title}`}
            aria-current={on ? "step" : undefined}
            className="group absolute bottom-0 flex h-full w-10 -translate-x-1/2 flex-col items-center"
            style={{ left: at(monthIndex(s.date)) }}
          >
            <span
              className={`text-12 leading-none tabular-nums transition-colors ${
                on ? "text-ink" : "text-faint group-hover:text-ink"
              }`}
            >
              {s.date}
            </span>
            <span
              className={`mt-[6px] size-[9px] rounded-full transition-colors ${
                on ? "bg-ink" : "bg-faint/70 group-hover:bg-ink"
              }`}
            />
            <span
              className={`w-[1.5px] flex-1 transition-colors ${
                on ? "bg-ink" : "bg-faint/70 group-hover:bg-ink"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
