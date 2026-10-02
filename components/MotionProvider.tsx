"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** The animation engine arrives as its own chunk; every component uses the slim `m` element. */
const loadFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

/**
 * Framer Motion for the whole site.
 * - Reduced motion is decided on the client after hydration: with the OS
 *   setting on, transforms are skipped and only opacity fades. Components
 *   never branch on it while rendering, so server and client HTML match.
 * - LazyMotion keeps the engine out of the first bundle; above-the-fold
 *   entrances are CSS, so nothing visible waits for it.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
