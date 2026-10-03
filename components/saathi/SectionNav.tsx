"use client";

import { useEffect, useState } from "react";

/** Sections in the case study — shared with SaathiContent (ids must match). */
export const SAATHI_SECTIONS = [
  { id: "details", label: "Details" },
  { id: "overview", label: "Overview" },
  { id: "solution", label: "Solution" },
  { id: "outcomes", label: "Outcomes" },
  { id: "observations", label: "Observations" },
  { id: "pain-points", label: "Pain Points" },
  { id: "research", label: "Market Research" },
  { id: "competitors", label: "Competitors" },
  { id: "process", label: "Design Process" },
  { id: "final", label: "Final Designs" },
  { id: "reflection", label: "Reflection" },
] as const;

/**
 * The case study's table of contents: the left column of the page's grid
 * (see SaathiContent), sticking under the header as you scroll. Scroll-spies
 * the sections and highlights the active one. From md up; phones skip it.
 */
export default function SectionNav() {
  const [active, setActive] = useState<string>(SAATHI_SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    SAATHI_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="hidden md:block">
      <nav
        aria-label="Case study sections"
        className="sticky top-16 flex flex-col items-start gap-2 pt-16 sm:pt-24"
      >
        {SAATHI_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={active === s.id ? "true" : undefined}
            className={`text-14 leading-tight transition-colors ${
              active === s.id ? "text-ink" : "text-faint/50 hover:text-faint"
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
