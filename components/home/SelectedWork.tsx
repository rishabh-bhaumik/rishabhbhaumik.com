"use client";

import Image from "next/image";
import Link from "next/link";
import { LayoutGroup, m } from "framer-motion";
import { SELECTED_WORK, type SelectedWork as Work } from "@/data/site";
import { revealMedia, staggerContainer } from "@/lib/motion";

/**
 * Home's Selected Work (Figma 8785:37079): a heading, the grid/list switch, then one
 * card per project, stacked full width (the list, as in Figma). Home has no grid/list
 * switch; WorkCard's `compact` (the two-up grid card) is kept for later. A card with a page opens it wherever it's clicked; projects without one yet
 * say "Work in progress" instead.
 */
export default function SelectedWork() {
  return (
    <section aria-labelledby="selected-work" className="flex flex-col">
      <div className="flex flex-col border-t border-rule px-4 pb-6 pt-10 sm:px-6">
        <p className="text-12 uppercase leading-none tracking-[-0.01em] text-subtle">Selected Work</p>
        <h2 id="selected-work" className="pt-4 text-28 leading-none tracking-[-0.015em] text-ink sm:text-36">
          Made with intent
        </h2>
      </div>

      <LayoutGroup>
        <m.ul
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          className="flex flex-col"
        >
          {SELECTED_WORK.map((w) => (
            <m.li key={w.slug} layout variants={revealMedia} transition={{ layout: { duration: 0.4 } }}>
              <WorkCard work={w} compact={false} />
            </m.li>
          ))}
        </m.ul>
      </LayoutGroup>
    </section>
  );
}

function WorkCard({ work, compact }: { work: Work; compact: boolean }) {
  return (
    // With a page, the whole card opens it: the heading's link stretches over the card
    // (its ::after), and Overview is the cue that reacts while the card is pointed at.
    <article className="group relative flex flex-col gap-8 pb-12 pt-4 sm:pb-20">
      <div className="relative aspect-[1200/675.5] overflow-hidden bg-gradient-to-br from-surface to-bg">
        {work.media &&
          (work.whole ? (
            // All of it, at full height (the image's own shape, 1400x952), centred; its sides,
            // where the photo is cut, fade into the card so the shirt doesn't stop at a hard edge.
            <div
              className="absolute inset-y-0 left-1/2 aspect-[1400/952] h-full -translate-x-1/2"
              style={{
                maskImage: "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent)",
              }}
            >
              <Image src={work.media} alt="" fill sizes="(min-width: 1200px) 1000px, 85vw" className="object-cover" />
            </div>
          ) : (
            <Image src={work.media} alt="" fill sizes="(min-width: 1200px) 1200px, 100vw" className="object-cover" />
          ))}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          {work.href ? (
            <span
              aria-hidden
              className="flex h-8 items-center gap-2 rounded-[8px] border-[0.5px] border-rule bg-bg pl-3 pr-1 text-12 leading-none text-ink transition-colors group-hover:border-faint/40"
            >
              Overview
              <span className="flex h-[18px] items-center border-l border-rule pl-[5px] pr-2">
                <Image
                  src="/media/home/add.svg"
                  alt=""
                  width={12}
                  height={12}
                  className="transition-transform duration-300 group-hover:rotate-90 light:invert"
                />
              </span>
            </span>
          ) : (
            <span className="flex h-8 items-center rounded-[8px] border-[0.5px] border-rule bg-bg px-3 text-12 uppercase leading-none tracking-[0.005em] text-ink">
              Work in progress
            </span>
          )}
        </div>
      </div>

      <div className={`flex gap-4 px-4 pb-6 pt-5 sm:px-6 ${compact ? "flex-col" : "flex-col md:flex-row md:items-start"}`}>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3
            className={`pt-3 leading-[1.4] tracking-[-0.015em] text-ink ${compact ? "text-20" : "text-20 sm:text-28"}`}
          >
            {work.href ? (
              <Link
                href={work.href}
                className="outline-none after:absolute after:inset-0 focus-visible:after:outline focus-visible:after:outline-1 focus-visible:after:-outline-offset-1 focus-visible:after:outline-ink/40"
              >
                <Lines work={work} compact={compact} />
              </Link>
            ) : (
              <Lines work={work} compact={compact} />
            )}
          </h3>
          <p className="max-w-[560px] pt-2 text-12 leading-[1.8] tracking-[-0.015em] text-subtle">{work.body}</p>
        </div>
        <ul className="flex items-center gap-6 md:py-3">
          {[work.year, work.kind].map((t) => (
            <li
              key={t}
              className="rounded-[24px] border border-rule bg-surface px-3 py-2.5 text-12 lowercase leading-none text-faint"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/** A card's heading lines: broken as in Figma on wide list cards, running text otherwise. */
function Lines({ work, compact }: { work: Work; compact: boolean }) {
  return work.heading.map((line, i) => (
    <span key={i} className={compact ? "" : "lg:block"}>
      {line}
      {i < work.heading.length - 1 && " "}
    </span>
  ));
}
