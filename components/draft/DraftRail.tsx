"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; label: string; level: number };

/**
 * The draft's section rail, after Saathi's SectionNav. It has no list of its own:
 * on mount it reads every `[data-rail]` element on the page (see `rail()` in
 * ./ui), in order, so the rail always matches the content as sections are added,
 * removed or renumbered. Scroll-spies the same elements.
 *
 * It stays out of the layout so the page keeps its full width: hovering the 24px
 * left gutter (or tabbing into it) slides it in over the page. From md up.
 */
export default function DraftRail() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (items) => {
        items.forEach((item) => {
          if (item.isIntersecting) setActive(item.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    // Read the page's rail entries (next tick, once the page has mounted), and again
    // whenever the content changes.
    let last = "";
    const read = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rail]"));
      // Slides swapping in and out also mutate the page; only rebuild when the entries change.
      const key = els.map((el) => `${el.id}|${el.dataset.rail}|${el.dataset.railLevel}`).join(",");
      if (key === last) return;
      last = key;
      observer.disconnect();
      els.forEach((el) => observer.observe(el));
      setEntries(
        els.map((el) => ({
          id: el.id,
          label: el.dataset.rail ?? "",
          level: Number(el.dataset.railLevel ?? 1),
        })),
      );
    };
    const tick = setTimeout(read, 0);
    const main = document.querySelector("main");
    const mutations = new MutationObserver(read);
    if (main) {
      mutations.observe(main, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-rail"],
      });
    }
    return () => {
      clearTimeout(tick);
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    // The aside is the hover target: the gutter strip, widening to the rail while open.
    <aside className="group fixed bottom-0 left-0 top-16 z-40 hidden w-6 focus-within:w-52 hover:w-52 md:block">
      <nav
        aria-label="Case study sections"
        className="flex h-full w-52 -translate-x-full flex-col items-start gap-2 overflow-y-auto border-r-[0.5px] border-ink/10 bg-bg/95 pb-6 pl-6 pr-4 pt-[60px] opacity-0 backdrop-blur-sm transition duration-300 ease-out group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100"
      >
        {entries.map((e) => (
          <a
            key={e.id}
            href={`#${e.id}`}
            aria-current={active === e.id ? "true" : undefined}
            className={`text-12 leading-tight transition-colors ${e.level > 1 ? "pl-3" : ""} ${
              active === e.id ? "text-ink" : "text-faint/50 hover:text-faint"
            }`}
          >
            {e.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
