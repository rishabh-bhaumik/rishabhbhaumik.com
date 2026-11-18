"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { getLenis } from "@/components/SmoothScroll";
import { EASE } from "@/lib/motion";
import CheckoutFlow from "./CheckoutFlow";
import FormDemo from "./FormDemo";
import TokenRamps from "./TokenRamps";
import TypeSpecimen from "./TypeSpecimen";
import { BlankFrame, BrandingFrame, CoverFrame, QuotePhoneFrame } from "./frames";
import { FootShade, LIGHT } from "./ui";

type Slide = { id: string; label: string; ratio: string; render: () => ReactNode };

/**
 * Every media container on /draft, in page order. `id` matches the container's
 * `media(id)`; `render` draws a live copy for the lightbox, filling the slot's width.
 */
const SLIDES: Slide[] = [
  { id: "cover", label: "Cover", ratio: "1512 / 850", render: () => <CoverFrame /> },
  { id: "ramps", label: "003. Design Systems", ratio: "1464 / 823.5", render: () => <TokenRamps /> },
  { id: "type", label: "004. Typography", ratio: "720 / 405", render: () => <TypeSpecimen /> },
  { id: "branding", label: "005. Branding", ratio: "696 / 392", render: () => <BrandingFrame /> },
  { id: "quote", label: "006. Quote Generation", ratio: "1400 / 810", render: () => <QuotePhoneFrame fluid /> },
  {
    id: "forms-1",
    label: "006.1",
    ratio: "16 / 9",
    render: () => (
      <div {...LIGHT} className="relative aspect-video w-full overflow-hidden bg-white">
        <FormDemo />
        <FootShade />
      </div>
    ),
  },
  { id: "forms-2", label: "006.2", ratio: "16 / 9", render: () => <BlankFrame id="forms-2" ratio="16 / 9" /> },
  { id: "forms-3", label: "006.3", ratio: "16 / 9", render: () => <BlankFrame id="forms-3" ratio="16 / 9" /> },
  { id: "flow", label: "007. Immediate Purchase", ratio: "960.3027 / 331.252", render: () => <CheckoutFlow /> },
  ...[1, 2, 3, 4].map((n) => ({
    id: `flows-${n}`,
    label: `007.${n}`,
    ratio: "1464 / 850",
    render: () => <BlankFrame id={`flows-${n}`} ratio="1464 / 850" />,
  })),
];

const noop = () => () => {};

/**
 * Wraps the page: clicking a media container (or Enter / Space on it) opens a lightbox
 * of only the media, at that one. Chevrons 16px in from either side (and the arrow
 * keys) step through, wrapping round; the close top right, Escape or a click on the
 * backdrop shuts it and hands focus back.
 */
export default function MediaLightbox({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<{ index: number; dir: number } | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const show = (el: HTMLElement) => {
    const index = SLIDES.findIndex((s) => s.id === el.dataset.media);
    if (index < 0) return;
    opener.current = el;
    setOpen({ index, dir: 1 });
  };
  const step = useCallback(
    (d: number) => setOpen((o) => o && { index: (o.index + d + SLIDES.length) % SLIDES.length, dir: d }),
    [],
  );
  const close = useCallback(() => setOpen(null), []);

  const isOpen = open !== null;
  useEffect(() => {
    if (!isOpen) return;
    const lenis = getLenis();
    lenis?.stop();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = overflow;
      lenis?.start();
      opener.current?.focus({ preventScroll: true });
    };
  }, [isOpen, close, step]);

  const slide = open ? SLIDES[open.index] : null;

  return (
    <div
      className="contents"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("[data-lightbox]")) return;
        const el = t.closest<HTMLElement>("[data-media]");
        if (el) show(el);
      }}
      onKeyDown={(e) => {
        const t = e.target as HTMLElement;
        if ((e.key === "Enter" || e.key === " ") && t.dataset.media && !t.closest("[data-lightbox]")) {
          e.preventDefault();
          show(t);
        }
      }}
    >
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && slide && (
              <m.div
                key="lightbox"
                data-lightbox
                role="dialog"
                aria-modal="true"
                aria-label="Media"
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                onClick={(e) => e.target === e.currentTarget && close()}
              >
                {/* The slot: as wide as the screen allows (clear of the chevrons from sm up)
                    and short enough to leave room for the caption. */}
                <div
                  className="relative w-[min(calc(100vw-32px),calc((100svh-160px)*var(--r)))] sm:w-[min(calc(100vw-144px),calc((100svh-160px)*var(--r)))]"
                  style={{ aspectRatio: slide.ratio, ["--r" as string]: slide.ratio.replace(" / ", "/") }}
                >
                  <AnimatePresence initial={false} custom={open.dir}>
                    <m.div
                      key={slide.id}
                      custom={open.dir}
                      variants={{
                        enter: (d: number) => ({ opacity: 0, x: d * 48 }),
                        center: { opacity: 1, x: 0 },
                        exit: (d: number) => ({ opacity: 0, x: -d * 48 }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.35, ease: EASE }}
                      className="absolute inset-0 [&>*]:!max-w-none [&>*]:!w-full"
                    >
                      {slide.render()}
                    </m.div>
                  </AnimatePresence>
                </div>

                <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-12 tabular-nums text-white/60">
                  {slide.label} · {open.index + 1} / {SLIDES.length}
                </p>

                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => step(-1)}
                  className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <Chevron dir="left" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => step(1)}
                  className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <Chevron dir="right" />
                </button>
                <button
                  ref={closeBtn}
                  type="button"
                  aria-label="Close"
                  onClick={close}
                  className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </m.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}
