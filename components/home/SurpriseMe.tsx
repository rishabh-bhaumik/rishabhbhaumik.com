"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SELECTED_WORK } from "@/data/site";

/** The case studies with a page, in Selected Work's order. */
const PAGES = SELECTED_WORK.flatMap((w) => (w.href ? [w.href] : []));

/**
 * "Surprise me": opens one of the case studies at random (the 404's way out). Styled as
 * Selected Work's Overview button: the label, then a trailing icon behind a hairline.
 * The pick happens on click, so server and client render the same link; without
 * JavaScript, or opened in a new tab, it goes to /work.
 */
export default function SurpriseMe() {
  const router = useRouter();
  return (
    <Link
      href="/work"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || !PAGES.length) return;
        e.preventDefault();
        router.push(PAGES[Math.floor(Math.random() * PAGES.length)]);
      }}
      className="group flex h-8 items-center gap-2 rounded-[8px] border-[0.5px] border-rule bg-bg pl-3 pr-1 text-12 leading-none text-ink transition-colors hover:border-faint/40"
    >
      Surprise me
      <span className="flex h-[18px] items-center border-l border-rule pl-[5px] pr-2">
        {/* Peetal's "Suprise Me" interface icon (Figma 2EDDHIZGAlRvGgPbX3x0a8, 3742:105), white
            here and inverted in light mode, as Overview's plus is. */}
        <Image
          src="/media/home/surprise.svg"
          alt=""
          width={12}
          height={12}
          className="transition-transform duration-300 group-hover:rotate-90 light:invert"
        />
      </span>
    </Link>
  );
}
