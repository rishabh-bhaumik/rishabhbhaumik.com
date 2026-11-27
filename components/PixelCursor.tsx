"use client";

import { useEffect, useRef, useState } from "react";

/*
 * The site's pointer on wide screens with a mouse (1024px and up, hover + fine pointer):
 * the system cursor is hidden and a 6px square pixel in the ink colour stands in for it
 * (white in dark, ink in light), with a 1px ring in the page colour so it still shows over a
 * surface of its own colour, such as a white panel in dark mode. Narrower screens and touch
 * keep the system cursor; so does the page until this has mounted, and so do high-contrast
 * mode (forced colours), where the square could vanish, and the OS's increased contrast. A
 * pen hovering on a desktop moves the square too (the system cursor is hidden for it as
 * well). The square hides when the pointer leaves the window or goes into an iframe (Play's
 * embeds). `data-pixel-cursor` on <html> is what hides the system cursor (the rule rides
 * with the component, below), so it's back the moment this unmounts.
 */

const QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
/** High contrast or increased contrast: the system cursor, as the OS draws it. */
const CONTRAST = ["(forced-colors: active)", "(prefers-contrast: more)"];
/** The pointer's size. */
const SIZE = 6;

/** Hides the system cursor while this runs; !important beats the cursor utilities; text fields keep their caret. */
const HIDE =
  "html[data-pixel-cursor],html[data-pixel-cursor] *{cursor:none!important}" +
  'html[data-pixel-cursor] :is(input,textarea,[contenteditable="true"]){cursor:text!important}';

export default function PixelCursor() {
  const [on, setOn] = useState(false);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const contrast = CONTRAST.map((q) => window.matchMedia(q));
    const all = [mq, ...contrast];
    const sync = () => setOn(mq.matches && !contrast.some((q) => q.matches));
    sync();
    for (const q of all) q.addEventListener("change", sync);
    return () => {
      for (const q of all) q.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!on) return;
    const html = document.documentElement;
    html.setAttribute("data-pixel-cursor", "");
    const el = dot.current;

    const show = (v: boolean) => {
      if (el) el.style.opacity = v ? "1" : "0";
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (el) el.style.transform = `translate3d(${e.clientX - SIZE / 2}px, ${e.clientY - SIZE / 2}px, 0)`;
      show(true);
    };
    // Hidden when the pointer leaves the page, or goes over an iframe (which takes its events
    // with it, so the square would stick at the edge). Any move brings it back.
    const onLeave = () => show(false);
    const onOver = (e: PointerEvent) => {
      if (e.target instanceof HTMLIFrameElement) show(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    html.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerover", onOver);
    window.addEventListener("blur", onLeave);
    return () => {
      html.removeAttribute("data-pixel-cursor");
      window.removeEventListener("pointermove", onMove);
      html.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("blur", onLeave);
    };
  }, [on]);

  if (!on) return null;

  return (
    <>
      <style>{HIDE}</style>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] bg-ink opacity-0 ring-1 ring-bg"
        style={{ width: SIZE, height: SIZE }}
      />
    </>
  );
}
