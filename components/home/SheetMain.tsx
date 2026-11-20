"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * The sheet's main column, which stops as its end reaches the bottom of the screen so
 * the footer, scrolling on, slides up over it rather than the two moving together.
 * Sticky with a top of (screen height - its own height): it scrolls normally until its
 * foot is on screen, then holds there. Its height is measured (and re-measured as it
 * changes), since a sticky offset can't refer to the element's own size in CSS.
 * It ends in room the footer's height, so the footer lands in that room as the page
 * holds, rather than covering its last lines (home's email link, say).
 */
export default function SheetMain({
  children,
  gap = false,
}: {
  children: React.ReactNode;
  /** The page's usual 80px gap before the footer (pages whose footer opens on the contact card). */
  gap?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const foot = el.nextElementSibling as HTMLElement | null;
    const set = () => {
      // A pixel short, so the footer's top rule lands on the last rule above it, not under it.
      el.style.setProperty("--foot-h", `${Math.max(0, (foot?.offsetHeight ?? 0) - 1)}px`);
      el.style.setProperty("--main-h", `${el.offsetHeight}px`);
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    if (foot) ro.observe(foot);
    return () => ro.disconnect();
  }, []);

  return (
    <main
      ref={ref}
      className={`sticky top-[min(0px,calc(100svh_-_var(--main-h,100svh)))] z-0 flex flex-1 flex-col gap-20 ${gap ? "pb-[calc(var(--foot-h,0px)_+_5rem)]" : "pb-[var(--foot-h,0px)]"}`}
    >
      {children}
    </main>
  );
}
