"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, type CategoryKey, type LogoMaterial } from "./types";

/** How close (px) the pointer must come to an edge before its chevron shows. */
const EDGE = 96;

function Chevron({ dir, show, onClick }: { dir: "left" | "right"; show: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Scroll library left" : "Scroll library right"}
      tabIndex={show ? 0 : -1}
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black text-white transition-opacity duration-200 hover:border-white focus-visible:opacity-100 ${
        dir === "left" ? "left-2" : "right-2"
      } ${show ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d={dir === "left" ? "M8.5 2.5 4 7l4.5 4.5" : "M5.5 2.5 10 7l-4.5 4.5"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * The library above the preview: category chips, search, and a clipped
 * horizontal carousel of thumbnails rendered by the shared WebGL renderer
 * (skeletons until each is ready). Chevrons appear when the pointer nears an
 * edge; the caption below names whatever is hovered (or selected). It reports
 * which cards are on (or near) screen, so only those get drawn.
 */
export default function Library({
  materials,
  thumbs,
  failed,
  selected,
  onSelect,
  onVisible,
}: {
  materials: LogoMaterial[];
  thumbs: Record<string, string>;
  failed: Set<string>;
  selected: string;
  onSelect: (key: string) => void;
  /** The keys of the cards currently on or near screen. */
  onVisible: (keys: Set<string>) => void;
}) {
  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [near, setNear] = useState<"left" | "right" | null>(null);
  const [room, setRoom] = useState({ left: false, right: false });
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of materials) c[m.category] = (c[m.category] ?? 0) + 1;
    return c;
  }, [materials]);
  const shown = materials.filter(
    (m) =>
      (category === "all" || m.category === category) &&
      (!query || `${m.label} ${m.loop} ${m.category}`.toLowerCase().includes(query.toLowerCase()))
  );
  const shownKeys = shown.map((m) => m.key).join(",");
  const caption = materials.find((m) => m.key === (hovered ?? selected));

  const scrollerRef = useRef<HTMLUListElement>(null);

  // Which cards are on (or one screen either side of) the carousel.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const key = (e.target as HTMLElement).dataset.key!;
          if (e.isIntersecting) visible.add(key);
          else visible.delete(key);
        }
        onVisible(new Set(visible));
      },
      { root: scroller, rootMargin: "0px 50%" }
    );
    scroller.querySelectorAll("li[data-key]").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, [shownKeys, onVisible]);

  // Whether there is more to scroll to on each side.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () =>
      setRoom({
        left: scroller.scrollLeft > 4,
        right: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4,
      });
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [shownKeys]);

  // Keep the selected card in view (e.g. after "Surprise me").
  useEffect(() => {
    const li = scrollerRef.current?.querySelector<HTMLElement>(`li[data-key="${selected}"]`);
    const scroller = scrollerRef.current;
    if (!li || !scroller) return;
    const l = li.offsetLeft, r = l + li.offsetWidth;
    if (l < scroller.scrollLeft || r > scroller.scrollLeft + scroller.clientWidth)
      scroller.scrollTo({ left: l - scroller.clientWidth / 2 + li.offsetWidth / 2, behavior: "smooth" });
  }, [selected]);

  const page = (dir: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollBy({ left: dir * scroller.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start p-4 pb-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h2 className="flex h-8 items-center text-[14px] text-white">Library</h2>
          <div className="flex flex-wrap items-center gap-1.5">
          {[{ key: "all" as const, label: "All" }, ...CATEGORIES]
            .filter((c) => c.key === "all" || counts[c.key])
            .map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                  category === c.key ? "border-white bg-white text-black" : "border-white/10 text-white/65 hover:text-white"
                }`}
              >
                {c.label}
                {c.key !== "all" && <span className="ml-1 opacity-60">{counts[c.key]}</span>}
              </button>
            ))}
          </div>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${materials.length} materials`}
          aria-label="Search materials"
          className="h-8 w-[180px] shrink-0 rounded-xl border border-white/10 bg-black px-3 text-[13px] text-white placeholder:text-white/40 focus:border-white focus:outline-none"
        />
      </div>

      <div
        className="relative"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - r.left;
          setNear(x < EDGE ? "left" : x > r.width - EDGE ? "right" : null);
        }}
        onPointerLeave={() => setNear(null)}
      >
        <ul
          ref={scrollerRef}
          className="flex snap-x gap-1.5 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onPointerLeave={() => setHovered(null)}
        >
          {shown.map((m) => (
            <li key={m.key} data-key={m.key} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => onSelect(m.key)}
                onPointerEnter={() => setHovered(m.key)}
                onFocus={() => setHovered(m.key)}
                onBlur={() => setHovered(null)}
                aria-label={`${m.label}: ${m.loop}`}
                aria-pressed={selected === m.key}
                className={`block h-12 w-12 overflow-hidden rounded-lg border bg-black transition-colors ${
                  selected === m.key ? "border-white" : "border-white/10 hover:border-white/50"
                }`}
              >
                {thumbs[m.key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbs[m.key]} alt="" decoding="async" draggable={false} className="h-full w-full object-cover" />
                ) : failed.has(m.key) ? (
                  <span className="flex h-full items-center justify-center text-[9px] text-white/65">Error</span>
                ) : (
                  <span className="block h-full w-full animate-pulse bg-white/[0.06]" />
                )}
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="py-8 text-[13px] text-white/45">Nothing matches “{query}”.</li>}
        </ul>
        {/* The clipped edges fade into the card. */}
        <div className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black transition-opacity ${room.left ? "opacity-100" : "opacity-0"}`} />
        <div className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black transition-opacity ${room.right ? "opacity-100" : "opacity-0"}`} />
        <Chevron dir="left" show={near === "left" && room.left} onClick={() => page(-1)} />
        <Chevron dir="right" show={near === "right" && room.right} onClick={() => page(1)} />
      </div>

      <p className="flex min-h-[40px] items-baseline gap-2 truncate px-4 pb-3 pt-2 text-[12px]">
        {caption && (
          <>
            <span className="shrink-0 text-white">{caption.label}</span>
            <span className="truncate text-white/50">{caption.loop}</span>
          </>
        )}
      </p>
    </div>
  );
}
