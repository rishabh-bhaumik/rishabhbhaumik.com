"use client";

import type { Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE },
  },
};

export const staggerContainer = (
  stagger = 0.09,
  delayChildren = 0,
): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});
