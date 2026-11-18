"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { HOME } from "@/data/site";

/** One greeting. `font` is a family in hello.css; without one it's the site's sans (Arial). */
type Word = { text: string; lang: string; font?: string; rtl?: boolean };
const WORDS: readonly Word[] = HOME.greetings;

/** Time from one roll to the next (ms), the roll included. The first, Bangla, stays longest. */
const HOLD_FIRST = 3600;
const HOLD = 1800;
/** When to start fetching the other scripts' fonts (~35 KB), once the entrance has played. */
const FONTS_AFTER = 1200;
/** The roll: eased in and out, so both words travel together, like a drum turning over. */
const ROLL = { duration: 0.7, ease: [0.65, 0, 0.35, 1] } as const;
/** Room above and below the line for marks that reach past it (Kannada, Sinhala, Georgian),
 *  and the soft edge at the far side of that room. */
const PAD = 0.4;
const FADE = 0.15;
/**
 * Each font's own metrics sit its word a little higher or lower in the line. These
 * nudges (em, measured) put every word on the Bangla word's baseline; Chinese,
 * Japanese and Korean, whose characters fill the whole square, are centred on it instead
 * (which their fonts already do). `SANS` is the site's own Arial, for the Latin words.
 */
const SANS = -0.035;
const NUDGE: Record<string, number> = {
  "Hello Devanagari": 0.155,
  "Hello Kannada": 0.135,
  "Hello Greek Cyrillic": -0.075,
  "Hello Hebrew": -0.075,
  "Hello Sinhala": -0.045,
  "Hello Ethiopic": -0.075,
  "Hello Georgian": -0.075,
};

/** The home hero's greeting line: the roll in a paragraph (styled by the hero). */
export default function Greeting({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <p style={style} className={className}>
      <GreetingRoll />
    </p>
  );
}

/**
 * Hello in seventeen languages (HOME.greetings), one at a time, wherever a greeting
 * goes: the hero's line and the contact block's "Say …". Each word rolls up out of a
 * one-line window as the next rises in from below, softening as it goes. It takes its
 * size, weight and line height from where it's placed.
 * - The first word is server-rendered, so it paints before any JavaScript; the roll
 *   starts after hydration.
 * - Screen readers get a plain "Hello"; the rolling words are hidden from them.
 * - Under reduced motion it stays on the first word.
 * - It rests while scrolled out of view or the tab is hidden, so each instance starts
 *   from the Bangla word when it's first seen.
 * - Each word waits (briefly) for its own font, so none flashes in a fallback face.
 */
export function GreetingRoll() {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let idx = 0;
    let timer = 0;
    let alive = true;
    // Off screen until the observer says otherwise (its first report comes within a
    // frame), so a roll further down the page waits on its first word until it's seen.
    let onScreen = false;
    let resting = false;
    let fonts: Promise<unknown>[] | null = null;
    const loadFonts = () =>
      (fonts ??= WORDS.map((w) =>
        w.font ? document.fonts.load(`500 1em "${w.font}"`, w.text).catch(() => null) : Promise.resolve(),
      ));

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(advance, idx === 0 ? HOLD_FIRST : HOLD);
    };
    const advance = async () => {
      if (!onScreen || document.hidden) {
        resting = true;
        return;
      }
      const next = (idx + 1) % WORDS.length;
      await Promise.race([loadFonts()[next], new Promise((r) => setTimeout(r, 2000))]);
      if (!alive) return;
      idx = next;
      setI(next);
      schedule();
    };
    const wake = () => {
      if (resting && onScreen && !document.hidden) {
        resting = false;
        schedule();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    const fontTimer = window.setTimeout(loadFonts, FONTS_AFTER);
    schedule();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.clearTimeout(fontTimer);
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);

  const w = WORDS[i];
  return (
    <>
      <span className="sr-only">Hello</span>
      {/* The one-line window: padded so tall marks aren't cut, faded at the padded edges. */}
      <span
        ref={ref}
        aria-hidden
        className="grid justify-items-start overflow-hidden"
        style={{
          padding: `${PAD}em 0`,
          margin: `-${PAD}em 0`,
          maskImage: `linear-gradient(transparent, #000 ${FADE}em, #000 calc(100% - ${FADE}em), transparent)`,
        }}
      >
        <AnimatePresence initial={false}>
          <m.span
            key={i}
            lang={w.lang}
            dir={w.rtl ? "rtl" : undefined}
            className="relative whitespace-nowrap [grid-area:1/1]"
            style={{
              fontFamily: w.font ? `"${w.font}", var(--font-sans)` : undefined,
              top: `${w.font ? (NUDGE[w.font] ?? 0) : SANS}em`,
              // Arabic letters join; letter-spacing would pull them apart.
              letterSpacing: w.rtl ? 0 : undefined,
            }}
            initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
            transition={ROLL}
          >
            {w.text}
          </m.span>
        </AnimatePresence>
      </span>
    </>
  );
}
