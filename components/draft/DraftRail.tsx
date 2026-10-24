"use client";

import { useEffect, useState } from "react";

type RailItem = { label: string; ids?: string[]; children?: RailItem[] };

/**
 * Contents for the draft case study. `ids` are the sections an entry covers
 * (the first is the link target); entries without ids aren't built yet and show
 * as plain, dimmer text.
 */
const RAIL: RailItem[] = [
  { label: "Context", ids: ["context", "story"] },
  { label: "The Problem", ids: ["problem"] },
  {
    label: "Solutions",
    children: [
      { label: "Typography", ids: ["typography"] },
      { label: "Design Systems", ids: ["design-systems"] },
      { label: "Forms & Modals for Discovery & Quote Generation", ids: ["forms", "forms-detail"] },
    ],
  },
  { label: "Interface Design", children: [{ label: "Home & Product Page" }] },
  { label: "Flows", children: [{ label: "Checkout & Payment", ids: ["flows"] }] },
  {
    label: "Visual Design",
    children: [
      { label: "Graphic Elements & Visual Motifs" },
      { label: "Implementation & Application Examples" },
    ],
  },
  { label: "End" },
];

const flat = (items: RailItem[]): RailItem[] =>
  items.flatMap((i) => [i, ...(i.children ? flat(i.children) : [])]);

/**
 * The draft's section rail, after Saathi's SectionNav, scroll-spying the
 * sections. It stays out of the layout so the page keeps its full width: hovering
 * the 24px left gutter (or tabbing into it) slides it in over the page. From md
 * up; phones skip it.
 */
export default function DraftRail() {
  const [active, setActive] = useState("Context");

  useEffect(() => {
    const owner = new Map<string, string>();
    flat(RAIL).forEach((i) => i.ids?.forEach((id) => owner.set(id, i.label)));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const label = owner.get(entry.target.id);
          if (entry.isIntersecting && label) setActive(label);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    owner.forEach((_, id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const entry = (i: RailItem) =>
    i.ids ? (
      <a
        href={`#${i.ids[0]}`}
        aria-current={active === i.label ? "true" : undefined}
        className={`text-12 leading-tight transition-colors ${
          active === i.label ? "text-ink" : "text-faint/50 hover:text-faint"
        }`}
      >
        {i.label}
      </a>
    ) : (
      <span className="text-12 leading-tight text-faint/25">{i.label}</span>
    );

  return (
    // The aside is the hover target: the gutter strip, widening to the rail while open.
    <aside className="group fixed bottom-0 left-0 top-16 z-40 hidden w-6 focus-within:w-52 hover:w-52 md:block">
      <nav
        aria-label="Case study sections"
        className="flex h-full w-52 -translate-x-full flex-col items-start gap-2 overflow-y-auto border-r-[0.5px] border-ink/10 bg-bg/95 pb-6 pl-6 pr-4 pt-[60px] opacity-0 backdrop-blur-sm transition duration-300 ease-out group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100"
      >
        {RAIL.map((i) => (
          <div key={i.label} className="flex flex-col items-start gap-2">
            {entry(i)}
            {i.children && (
              <div className="flex flex-col items-start gap-2 pl-3">
                {i.children.map((c) => (
                  <div key={c.label}>{entry(c)}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
