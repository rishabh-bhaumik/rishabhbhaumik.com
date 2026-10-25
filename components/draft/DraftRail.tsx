"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; label: string; level: number };

/**
 * The draft's section rail, after Saathi's SectionNav. It has no list of its own:
 * on mount it reads every `[data-rail]` element on the page (see `rail()` in
 * ./ui), in order, so the rail always matches the content as sections are added,
 * removed or renumbered. Scroll-spies the same elements.
 *
 * It is a drawer over the page (DraftShell): 320px, sliding in from the left
 * when the 24px edge strip is hovered (or the rail is tabbed into), and out
 * when the pointer leaves it. The page underneath never moves.
 */
export default function DraftRail({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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

  // Each level-1 entry with the level-2 entries that follow it.
  const groups = entries.reduce<{ head: Entry; subs: Entry[] }[]>((acc, e) => {
    if (e.level > 1 && acc.length) acc[acc.length - 1].subs.push(e);
    else acc.push({ head: e, subs: [] });
    return acc;
  }, []);

  const link = (e: Entry) => (
    <a
      key={e.id}
      href={`#${e.id}`}
      aria-current={active === e.id ? "true" : undefined}
      className={`text-12 leading-tight transition-colors ${
        active === e.id ? "text-ink" : "text-faint/50 hover:text-faint"
      }`}
    >
      {e.label}
    </a>
  );

  return (
    // A drawer over the page: it never takes layout space, so the content stays put.
    <aside
      onMouseLeave={() => onOpenChange(false)}
      onFocus={() => onOpenChange(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onOpenChange(false);
      }}
      className={`fixed bottom-0 left-0 top-16 z-40 hidden w-[320px] transition-[translate,opacity] duration-300 ease-out md:block ${
        open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-full opacity-0"
      }`}
    >
      {/* 320px; long entries wrap. Each section and its sub-points form one group,
          24px apart; the sub-points stack 16px apart with 16px above, none below. */}
      <nav
        aria-label="Case study sections"
        className="flex h-full w-full flex-col items-start gap-6 overflow-y-auto border-r-[0.5px] border-ink/10 bg-bg/95 pb-6 pl-6 pr-6 pt-[60px] backdrop-blur-sm"
      >
        {groups.map((g) => (
          <div key={g.head.id} className="flex flex-col items-start">
            {link(g.head)}
            {g.subs.length > 0 && (
              <div className="flex flex-col items-start gap-4 pb-0 pl-3 pt-4">{g.subs.map(link)}</div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
