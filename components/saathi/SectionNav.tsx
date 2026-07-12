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
 * Fixed left table-of-contents for the case study (the Figma sidebar).
 * Scroll-spies the sections and highlights the active one. Only shown on wide
 * screens where there's room beside the centered content; hidden below xl.
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
    <nav
      aria-label="Case study sections"
      className="fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 xl:flex"
    >
      {SAATHI_SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={active === s.id ? "true" : undefined}
          className={`text-[13px] leading-tight transition-colors ${
            active === s.id ? "text-ink" : "text-faint/50 hover:text-faint"
          }`}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
