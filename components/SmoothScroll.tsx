"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cancelFrame, frame } from "framer-motion";
import Lenis from "lenis";

/** Pages that scroll on their own (the lab's panels, Identity's horizontal stage): no Lenis there. */
const NATIVE_ROUTES = ["/logo", "/bimakavach-identity"];

/**
 * Site-wide smooth scroll (Lenis). Mirrors the buttery feel of the reference
 * portfolio. Disabled automatically under prefers-reduced-motion so the page
 * falls back to native scrolling. It runs on Framer Motion's frame loop, so
 * scrolling and every Framer animation share one requestAnimationFrame.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const native = NATIVE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (native) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    const update = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp);
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [native]);

  // A new page starts at the top at once, never easing down from the last
  // page's scroll. (Not on the first load, where the browser may restore it.)
  const firstPath = useRef(pathname);
  useEffect(() => {
    if (pathname === firstPath.current) return;
    firstPath.current = "";
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return <>{children}</>;
}
