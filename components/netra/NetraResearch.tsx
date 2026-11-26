"use client";

import { AnimatePresence, m } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { RESEARCH_PAPERS } from "@/data/bima-netra";

/*
 * The research behind BimaNetra (Figma 8927:30390, "container-research"): five papers, one
 * at a time. The paper's first page stands on the left, rising from the frame's foot; on the
 * right, its title, authors and venue, a line on what it shaped in Netra, and three findings,
 * each with Figma's ticker. "Next" moves to the next paper (wrapping round), and the page
 * opens the paper itself. The old page sinks as the new one rises, and the text fades across.
 * Laid out on Figma's 1200 × 675 frame and scaled to cover the GrowMedia frame. Follows the
 * theme through the --rs-* variables: Figma's light composition in light, and in dark the
 * thesis frame's palette (#1c1d1f down to black, white title, grey type, the ticker inverted);
 * the paper itself stays white in both. Copy in data/bima-netra.ts (RESEARCH_PAPERS); first
 * pages in public/media/netra/papers/.
 */

const W = 1200;
const H = 675;
const EASE = [0.22, 1, 0.36, 1] as const;

/** The palette per theme, as CSS variables on the root: dark first, then light (Figma's). */
const THEME = [
  "[--rs-top:#1c1d1f] [--rs-foot:#000] [--rs-stop:19.729%] [--rs-title:#fff] [--rs-body:#a9acb1] [--rs-faint:#6f7378] [--rs-hover:#fff] [--rs-edge:rgba(255,255,255,0.1)]",
  "light:[--rs-top:#fff] light:[--rs-foot:#f4f5f6] light:[--rs-stop:38.218%] light:[--rs-title:#1c1c1c] light:[--rs-body:#6f7378] light:[--rs-faint:#a9acb1] light:[--rs-hover:#1c1c1c] light:[--rs-edge:#e6e8ea]",
].join(" ");

export default function NetraResearch({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const paper = RESEARCH_PAPERS[i];
  const count = RESEARCH_PAPERS.length;

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(Math.max((e.contentRect.width + 2) / W, (e.contentRect.height + 2) / H)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section
      ref={root}
      aria-label={label}
      className={`absolute inset-0 overflow-hidden ${THEME}`}
      style={{ background: "linear-gradient(to bottom, var(--rs-top) var(--rs-stop), var(--rs-foot))" }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: W,
          height: H,
          transform: `translate(-50%, -50%) scale(${k ?? 1})`,
          visibility: k ? undefined : "hidden",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* The paper's first page, standing on the frame's foot; it opens the paper. */}
        <div className="absolute bottom-0 overflow-hidden" style={{ left: 54.17, width: 545.826, height: 617.5 }}>
          <AnimatePresence initial={false}>
            <m.a
              key={paper.key}
              href={paper.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Read ${paper.title} (PDF)`}
              className="absolute inset-0 block border-[1.103px] border-[var(--rs-edge)] bg-white shadow-[0_0_80px_rgba(0,0,0,0.04)]"
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } }}
              exit={{ y: 60, opacity: 0, transition: { duration: 0.4, ease: EASE } }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 2x render, laid out in frame px */}
              <img src={`/media/netra/papers/${paper.key}.webp`} alt="" className="size-full object-cover object-top" />
            </m.a>
          </AnimatePresence>
        </div>

        <div className="absolute flex flex-col gap-8" style={{ left: 630, top: 57.5, width: 492 }}>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setI((n) => (n + 1) % count)}
              aria-label={`Next paper (${((i + 1) % count) + 1} of ${count})`}
              className="text-[12px] leading-[normal] text-[var(--rs-faint)] transition-colors hover:text-[var(--rs-hover)]"
            >
              Next
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={paper.key}
              aria-live="polite"
              className="flex flex-col gap-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } }}
            >
              <div className="flex flex-col gap-2 leading-[normal]">
                <h3 className="text-[28px] leading-[1.15] text-[var(--rs-title)]">{paper.title}</h3>
                <p className="text-[12px] uppercase text-[var(--rs-faint)]">{paper.authors}</p>
              </div>
              <p className="text-[14px] leading-[1.4] text-[var(--rs-body)]">{paper.why}</p>
              <ul className="flex flex-col gap-4">
                {paper.insights.map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Figma's icon/ticker, at 12px */}
                    <img src="/media/netra/papers/tick.svg" alt="" width={12} height={12} className="size-3 shrink-0 invert light:invert-0" />
                    <span className="min-w-px flex-1 text-[14px] leading-[1.4] text-[var(--rs-body)]">{t}</span>
                  </li>
                ))}
              </ul>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
