"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/data/site";
import HeroVideo from "../HeroVideo";

/**
 * The contact block's orbit: the hero clip (dark or light with the theme) resting on
 * its still. While a mouse or pen is over the contact block, this cell or the
 * greeting beside it, the clip plays; moving away holds the frame it reached. Touch
 * screens keep the still. It shares the hero's files, so nothing extra downloads.
 */
export default function ContactOrbit() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const block = ref.current?.closest("section");
    if (!block) return;
    const enter = (e: PointerEvent) => {
      if (e.pointerType !== "touch") setActive(true);
    };
    const leave = () => setActive(false);
    block.addEventListener("pointerenter", enter);
    block.addEventListener("pointerleave", leave);
    return () => {
      block.removeEventListener("pointerenter", enter);
      block.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ref} className="relative min-h-[220px] overflow-hidden bg-black light:bg-bg md:min-h-[320px]">
      <HeroVideo dark={SITE.heroVideo.dark} light={SITE.heroVideo.light} active={active} />
    </div>
  );
}
