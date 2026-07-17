"use client";

import { useEffect, useState } from "react";

/** Chapters of the resume — ids must match the section ids in ResumeContent. */
const CHAPTERS = [
  { id: "overview", label: "overview" },
  { id: "about", label: "about" },
  { id: "contact", label: "contact" },
  { id: "experience", label: "experience" },
  { id: "education", label: "education" },
  // NOTE: the Figma sidebar (8408:7477) stops at education, even though the
  // page has a Certifications section below it. Listed here so the rail covers
  // the whole page — drop it if the design's five chapters are deliberate.
  { id: "certifications", label: "certifications" },
] as const;

/**
 * Fixed left chapter rail for the resume (Figma 8408:7477) — the same idea as
 * the Bima Saathi SectionNav, but with this design's own type: lowercase 14px,
 * active in white and the rest in the same #363636 the header uses for the
 * page you are already on.
 *
 * Only shown on wide screens where there is room beside the 700px column.
 */
export default function ResumeNav() {
  const [active, setActive] = useState<string>(CHAPTERS[0].id);

  useEffect(() => {
    // Active chapter = the last one whose top has crossed a line just below the
    // sticky header. The line sits high deliberately: the masthead is only
    // ~110px tall, so a line a third of the way down the viewport would hand
    // "overview" straight to "about" and it would never light up.
    const LINE = 140;
    const spy = () => {
      // Annotated: CHAPTERS is `as const`, so this would otherwise narrow to
      // the literal "overview" and reject every other id.
      let current: string = CHAPTERS[0].id;
      for (const c of CHAPTERS) {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= LINE) current = c.id;
      }
      // The final chapter starts below the last scrollable position, so it can
      // never reach the line on its own — pin it once the page bottoms out.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = CHAPTERS[CHAPTERS.length - 1].id;
      setActive(current);
    };
    spy();
    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", spy);
    return () => {
      window.removeEventListener("scroll", spy);
      window.removeEventListener("resize", spy);
    };
  }, []);

  return (
    <nav
      aria-label="Resume chapters"
      className="fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 xl:flex"
    >
      {CHAPTERS.map((c) => (
        <a
          key={c.id}
          href={`#${c.id}`}
          aria-current={active === c.id ? "true" : undefined}
          className={`py-1 text-[14px] lowercase leading-[1.5] transition-colors ${
            active === c.id
              ? "text-ink"
              : "text-nav-current hover:text-faint"
          }`}
        >
          {c.label}
        </a>
      ))}
    </nav>
  );
}
