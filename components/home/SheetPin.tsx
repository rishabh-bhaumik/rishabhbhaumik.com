"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * A page's opening, held in place while the rest of the page scrolls up over it
 * (Sheet's `hero`: home, Work, Play). It pins under the nav (61px); when it's taller
 * than the room under the nav it pins lower instead, top = screen height - its own
 * height, so its foot (the marquee) stays in view. Its height is measured, since a
 * sticky offset can't refer to the element's own size in CSS.
 */
export default function SheetPin({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => el.style.setProperty("--pin-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // 61px: SheetNav's height.
    <div ref={ref} className="sticky top-[min(61px,calc(100svh_-_var(--pin-h,0px)))]">
      {children}
    </div>
  );
}
