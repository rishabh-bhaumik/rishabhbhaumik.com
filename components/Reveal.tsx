"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

/**
 * Blur-in + fade + rise on scroll entry (the k95-style reveal). Used to give
 * sections the same calm, staged reveal. Honors reduced-motion (renders static).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
  margin = "0px 0px -12% 0px",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "p";
  /** IntersectionObserver rootMargin. Use "0px" for content pinned to the page bottom, which can never scroll past the default inset. */
  margin?: string;
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}
