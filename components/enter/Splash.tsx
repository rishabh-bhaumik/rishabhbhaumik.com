"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getLenis } from "@/components/SmoothScroll";
import { MORPH, startOnEnter } from "@/lib/bgm";
import { ENTER_KEY } from "@/lib/enter";

/**
 * The /enter splash (Figma 8713:24303): the real home page, held back. Its hero clip
 * plays blurred and grained exactly where home shows it, with nothing else on
 * screen but Enter (8713:24285), centred on the clip. Enter morphs it into home in place, with no page
 * change: the same clip pulls into focus while the page rises in around it, the
 * music fades in from muffled to clear (lib/bgm), and the address quietly becomes
 * "/". The click also marks this browser session as entered.
 *
 * With a mouse, the clip starts to come into focus as the pointer nears Enter: the
 * blur eases from 100% to 75%, reaching 75% on the button itself, so the click
 * finishes a pull that has already begun. Touch screens go from full to clear.
 */
type Stage = "on" | "leaving" | "off";

/** The share of the full blur left while the pointer is on Enter. */
const HOVER_BLUR = 0.75;
/** How far from Enter (px, at least) the pointer starts to pull focus: half the clip's width. */
const MIN_REACH = 240;

/**
 * A tile of per-pixel noise, 0-20% opacity per pixel (Figma's monotone noise). It's
 * used as a mask over the page colour (globals.css), so the grain suits either theme.
 */
function noiseTile() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "none";
  const img = ctx.createImageData(size, size);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = Math.random() * 0.2 * 255;
  ctx.putImageData(img, 0, 0);
  return `url(${c.toDataURL("image/png")})`;
}

export default function Splash({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("on");
  /** The hero card, where Enter sits (centred on the clip). */
  const [card, setCard] = useState<HTMLElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Once mounted: draw the grain and find the card.
  const attach = useCallback((el: HTMLDivElement | null) => {
    wrap.current = el;
    if (!el) return;
    el.style.setProperty("--splash-noise", noiseTile());
    setCard(el.querySelector<HTMLElement>(".hero-card"));
  }, []);

  // Mouse only: the nearer the pointer to Enter, the less blur (100% far away, 75%
  // on the button), eased so it gathers pace as you close in. One update per frame.
  useEffect(() => {
    if (stage !== "on" || !card) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      const r = button.current?.getBoundingClientRect();
      if (!r) return;
      // Distance to the button's edge: 0 anywhere over it.
      const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      const t = Math.min(d / Math.max(card.clientWidth / 2, MIN_REACH), 1);
      const eased = t * t * (3 - 2 * t);
      el.style.setProperty("--splash-blur", (HOVER_BLUR + (1 - HOVER_BLUR) * eased).toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => el.style.setProperty("--splash-blur", "1");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [stage, card]);

  // Nothing to scroll to until Enter, and always from the top (a reload can restore
  // a scroll position), so the clip is exactly where home shows it.
  useEffect(() => {
    if (stage !== "on") return;
    const html = document.documentElement;
    const top = () => {
      if (window.scrollY) window.scrollTo(0, 0);
    };
    top();
    getLenis()?.scrollTo(0, { immediate: true });
    html.style.overflow = "hidden";
    getLenis()?.stop();
    // The browser restores a reload's scroll position after this runs: undo it too.
    window.addEventListener("scroll", top);
    return () => {
      window.removeEventListener("scroll", top);
      html.style.overflow = "";
      getLenis()?.start();
    };
  }, [stage]);

  const enter = () => {
    try {
      sessionStorage.setItem(ENTER_KEY, "1");
    } catch {
      // No storage: home may show the splash again on a reload, nothing worse.
    }
    startOnEnter();
    setStage("leaving");
    // Home, in place: the address changes without a reload, so the clip never stops.
    window.history.replaceState(null, "", "/");
    window.history.scrollRestoration = "auto";
    window.setTimeout(() => setStage("off"), 400);
  };

  return (
    <div
      ref={attach}
      data-splash={stage === "on" ? "on" : "off"}
      style={{ "--morph": `${MORPH}s` } as React.CSSProperties}
    >
      {children}
      {card &&
        stage !== "off" &&
        createPortal(
          // Above the card's grain (its ::after), centred on the clip both ways.
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <button
              ref={button}
              type="button"
              onClick={enter}
              disabled={stage !== "on"}
              className={`pointer-events-auto flex h-[42px] items-center gap-2 rounded-full bg-[#262c38] py-[6px] pl-4 pr-1 text-[20px] leading-[1.5] text-white transition-[background-color,opacity,transform] duration-300 ease-out hover:bg-[#2f3645] ${
                stage === "on" ? "" : "scale-95 opacity-0"
              }`}
            >
              Enter
              <span className="flex h-8 items-center border-l border-[#303745] pl-[5px] pr-2">
                <Image src="/media/enter/arrow-right.svg" alt="" width={16} height={16} />
              </span>
            </button>
          </div>,
          card,
        )}
    </div>
  );
}
