"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SELECTED_WORK, SITE } from "@/data/site";
import HeroVideo from "../HeroVideo";

/**
 * The banner at a project's foot that opens the next one (Figma 8818:33454): the
 * orbit clip resting on its still behind the next project's title, its top fading
 * into the page. "Next" follows home's Selected Work, skipping projects without a
 * page and wrapping round; a page that isn't in the list (Draft, project 999) gets the
 * first. Pointing at the banner (or tabbing to it) plays the clip,
 * as on home's contact block; leaving holds the frame it reached. Touch keeps the still.
 */
export default function NextProject({ after }: { after: string }) {
  const [active, setActive] = useState(false);
  const i = SELECTED_WORK.findIndex((w) => w.slug === after);
  const next = [...SELECTED_WORK.slice(i + 1), ...SELECTED_WORK.slice(0, i)].find((w) => w.href);
  if (!next?.href) return null;

  return (
    <Link
      href={next.href}
      onPointerEnter={(e) => e.pointerType !== "touch" && setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className="group relative isolate flex flex-col overflow-hidden px-4 pb-[152px] pt-16 sm:px-6"
    >
      {/* The clip sits at the top, as wide as the sheet; the banner shows its upper part,
          down to the planet's middle. On narrow screens it grows to cover the banner,
          centred, so the planet stays in the middle. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-black light:bg-bg">
        <div className="absolute left-1/2 top-0 aspect-video min-h-full w-full -translate-x-1/2">
          <HeroVideo dark={SITE.heroVideo.dark} light={SITE.heroVideo.light} active={active} />
        </div>
        <div className="absolute inset-x-0 top-0 h-[195px] bg-gradient-to-b from-bg from-25% to-transparent" />
      </div>

      <span className="flex justify-end">
        <span className="flex h-[31px] items-center gap-2 rounded-[8px] border-[0.5px] border-rule bg-bg pl-3 pr-1 text-12 leading-none text-ink transition-colors group-hover:border-faint/40">
          Next Project
          <span className="flex h-[18px] items-center border-l border-rule pl-[5px] pr-2">
            <Image
              src="/media/project/arrow-right.svg"
              alt=""
              width={12}
              height={12}
              className="transition-transform duration-300 group-hover:translate-x-0.5 light:invert"
            />
          </span>
        </span>
      </span>
      <h2 className="pt-4 text-28 leading-[1.3] tracking-[-0.015em] text-ink sm:text-40 lg:text-48">
        {next.heading.join(" ")}
      </h2>
    </Link>
  );
}
