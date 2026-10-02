"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

/**
 * Fade + rise (+ a soft blur on text) on scroll entry: the site's calm, staged
 * reveal. `media` drops the blur for blocks holding video, images or canvases,
 * where blurring a large layer is expensive. The blur ends on `none`, so no
 * filter is left on the element afterwards. Reduced motion is handled by the
 * MotionConfig in the root layout (the rise is skipped; it only fades).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
  margin = "0px 0px -12% 0px",
  media = false,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "p";
  /** IntersectionObserver rootMargin. Use "0px" for content pinned to the page bottom, which can never scroll past the default inset. */
  margin?: string;
  /** The block holds media: fade and rise only, no blur. */
  media?: boolean;
}) {
  const MotionTag = m[as];

  return (
    <MotionTag
      className={className}
      initial={media ? { opacity: 0, y } : { opacity: 0, y, filter: "blur(8px)" }}
      whileInView={media ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      viewport={{ once: true, margin }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}
