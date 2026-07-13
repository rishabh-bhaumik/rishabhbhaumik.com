"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Header from "@/components/Header";
import { EASE } from "@/lib/motion";
import AsciiDither from "@/components/bk/AsciiDither";

const ScrollRootCtx = createContext<React.RefObject<HTMLDivElement | null>>({
  current: null,
});
const ScrollDirCtx = createContext<React.RefObject<number>>({ current: 1 });
/** Per-section sequence: hands each StaggerItem the next reveal index. */
const StaggerSeqCtx = createContext<{ next: () => number }>({ next: () => 0 });

const HERO_IMG = "/media/bk-branding/composition-hero.png";
const MC = "/media/bk-branding/main-content";
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Delay between consecutive reveals. Small because sections are now broken
 *  down into many atomic items — keeps dense cards from running minutes long. */
const STEP = 0.09;

/* ─── primitives ─── */

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="w-fit rounded-full bg-surface px-3 py-1 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border">
      {children}
    </span>
  );
}

function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[32px] leading-[1.3] text-ink">{children}</h2>
  );
}

function Body({
  children,
  large,
  className = "",
}: {
  children: ReactNode;
  large?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`leading-relaxed ${
        large
          ? "text-[32px] leading-[1.3] text-white"
          : "text-[15px] text-muted"
      } ${className}`}
    >
      {children}
    </p>
  );
}

function Media({
  name,
  w,
  h,
  alt,
  className = "",
}: {
  name: string;
  w: number;
  h: number;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={`${MC}/${name}.png`}
      alt={alt}
      width={w}
      height={h}
      sizes="(max-width: 768px) 92vw, 60vw"
      className={`h-auto w-full ${className}`}
    />
  );
}

/**
 * Shell — centers a section's content column and provides the stagger sequence.
 * By default each direct child is auto-wrapped in a StaggerItem (good for flat
 * sections). Pass `manual` to place StaggerItems yourself for finer, per-atom
 * breakdown (cards, meta grids, side-by-side elements).
 */
function Shell({
  children,
  width = 1100,
  gap,
  className = "",
  manual = false,
}: {
  children: ReactNode;
  width?: number;
  gap?: number;
  className?: string;
  manual?: boolean;
}) {
  // Fresh per-render sequence: each StaggerItem pulls its reveal index in
  // render order at mount. Recreated each render (a plain object, not a ref) so
  // React StrictMode's double render re-numbers from zero rather than doubling.
  const counter = { n: 0 };
  const seq: { next: () => number } = { next: () => counter.n++ };
  return (
    <StaggerSeqCtx.Provider value={seq}>
      <div
        className={`mx-auto flex h-full w-[90vw] flex-col justify-center px-2 sm:px-6 ${className}`}
        style={{
          maxWidth: width,
          gap: gap != null ? `${gap * 0.25}rem` : undefined,
        }}
      >
        {manual
          ? children
          : React.Children.toArray(children).map((child, i) => (
              <StaggerItem key={i} index={i}>
                {child}
              </StaggerItem>
            ))}
      </div>
    </StaggerSeqCtx.Provider>
  );
}

/**
 * A single reveal unit: direction-aware translateX + blur + fade, driven by an
 * IntersectionObserver against the horizontal scroll stage. Its reveal index
 * (and therefore its delay) is either passed explicitly or drawn from the
 * section's StaggerSeqCtx in render order.
 */
function StaggerItem({
  children,
  index,
  className = "",
  wrapperClassName = "",
  style,
}: {
  children?: ReactNode;
  index?: number;
  className?: string;
  wrapperClassName?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRoot = useContext(ScrollRootCtx);
  const dirRef = useContext(ScrollDirCtx);
  const seq = useContext(StaggerSeqCtx);
  const [i] = useState(() => index ?? seq.next());
  const [visible, setVisible] = useState(false);
  // Direction captured when visibility flips, kept in state (not a ref) so it's
  // safe to read during render for the direction-aware entry offset.
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const el = ref.current;
    const root = scrollRoot.current;
    if (!el || !root) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setDir(dirRef.current);
        setVisible(entry.isIntersecting);
      },
      { root, threshold: 0.05, rootMargin: "0px -25% 0px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollRoot, dirRef]);

  const delay = i * STEP;
  const tx = visible ? 0 : dir > 0 ? 120 : -120;

  // The OUTER wrapper is the observer target — it stays at its resting layout
  // position (no transform), so the 75%-viewport trigger reads the true spot
  // even for right-edge elements. The INNER element carries the slide/blur/fade.
  return (
    <div ref={ref} className={wrapperClassName}>
      <div
        className={className}
        style={{
          opacity: visible ? 1 : 0,
          filter: visible ? "blur(0px)" : "blur(16px)",
          transform: `translateX(${tx}px)`,
          transition: visible
            ? `opacity 1.1s ${EASE_OUT} ${delay}s, filter 1s ${EASE_OUT} ${delay}s, transform 1.2s ${EASE_OUT} ${delay}s`
            : `opacity 0.5s ease ${delay * 0.2}s, filter 0.5s ease ${delay * 0.2}s, transform 0.5s ease ${delay * 0.2}s`,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Card — a surface whose background reveals as its own stagger step (an
 * absolutely-positioned layer), with the content revealing on top afterwards.
 */
function Card({
  children,
  width = 480,
}: {
  children: ReactNode;
  width?: number;
}) {
  return (
    <div
      className="relative mx-auto w-full rounded-3xl p-8"
      style={{ maxWidth: width }}
    >
      <StaggerItem
        wrapperClassName="absolute inset-0"
        className="h-full w-full rounded-3xl bg-gradient-to-b from-surface/60 to-black ring-1 ring-white/10"
      />
      <div className="relative z-10 flex flex-col gap-6">{children}</div>
    </div>
  );
}

/** A meta label + value where each reveals as a separate step. */
function MetaPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <StaggerItem>
        <dt className="text-[13px] text-faint">{label}</dt>
      </StaggerItem>
      <StaggerItem>
        <dd className="text-[15px] leading-snug text-ink">{value}</dd>
      </StaggerItem>
    </div>
  );
}

/* ─── section-work-0: ASCII video field ─── */

const FILTER_COLORS = [
  "#f4f1ff",
  "#e8e2ff",
  "#d1c6ff",
  "#ac9cff",
  "#4100cf",
  "#3800b4",
  "#2c0091",
  "#21006d",
  "#160049",
] as const;

function WorkVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRoot = useContext(ScrollRootCtx);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const root = scrollRoot.current;
    if (!el || !root) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root, threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollRoot]);

  return (
    <div ref={ref} className="absolute inset-0">
      <AsciiDither
        active={inView}
        colors={FILTER_COLORS}
        videoSrc={`${MC}/section-work-0-ascii-video.mp4`}
      />
    </div>
  );
}

function SolutionsHead() {
  return (
    <>
      <StaggerItem>
        <Tag>solutions</Tag>
      </StaggerItem>
      <StaggerItem>
        <H>Forms &amp; Modals for Discovery &amp; Quote Generation</H>
      </StaggerItem>
    </>
  );
}

/* ─── section-work-5: variable width typeface ─── */

const SCRIPTS = [
  { text: "வருக, வளர்ந்து வரும் இந்தியா!", lang: "ta", font: "Anek Tamil" },
  { text: "ಉದಯೋನ್ಮುಖ ಭಾರತಕ್ಕೆ ಸ್ವಾಗತ!", lang: "kn", font: "Anek Kannada" },
  { text: "સ્વાગત છે, ઉભરતા ભારત!", lang: "gu", font: "Anek Gujarati" },
  { text: "স্বাগতম, উদীয়মান ভারত!", lang: "bn", font: "Anek Bangla" },
  { text: "Welcome, Emerging India!", lang: "en", font: "Anek Latin" },
  { text: "उभरते भारत का स्वागत है!", lang: "hi", font: "Anek Devanagari" },
  { text: "ସ୍ୱାଗତ, ଉଦୀୟମାନ ଭାରତ!", lang: "or", font: "Anek Odia" },
  { text: "ਜੀ ਆਇਆਂ ਨੂੰ, ਉੱਭਰ ਰਹੇ ਭਾਰਤ!", lang: "pa", font: "Anek Gurmukhi" },
  { text: "സ്വാഗതം, വളർന്നുവരുന്ന ഇന്ത്യ!", lang: "ml", font: "Anek Malayalam" },
  { text: "అభివృద్ధి చెందుతున్న భారతదేశానికి స్వాగతం!", lang: "te", font: "Anek Telugu" },
] as const;

/** Split into grapheme clusters so Indic conjuncts stay intact per span. */
function toGraphemes(text: string): string[] {
  const Seg = (
    Intl as unknown as { Segmenter?: typeof Intl.Segmenter }
  ).Segmenter;
  if (Seg) {
    const seg = new Seg(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

// Variable-font axis targets (Anek: wght 100–800, wdth 75–125). Values are
// continuous with REST at the falloff edge, so glyphs far from the cursor sit
// exactly at the resting weight/width and only bulge as the pointer nears.
const REST = "'wght' 500, 'wdth' 100"; // resting / dimmed line
const RADIUS = 82; // px, linear proximity falloff (inikaj "Text Magnifier"-style)
const WGHT_REST = 500;
const WGHT_PEAK = 800;
const WDTH_REST = 100;
const WDTH_PEAK = 125;

/**
 * One multiscript line. Dimmed (20% opacity, medium/normal) at rest; on hover
 * it lights to 100% and each glyph's width + weight tracks the cursor —
 * thickest/widest under the pointer, tapering away (inikaj.com-style).
 */
/** Font-size + colour targets (per Figma 8341-5696): one line is always
 *  "active" (bigger, brighter), all others sit muted at half size. */
const SIZE_ACTIVE_PX = 32;
const SIZE_REST_PX = 16;
const COLOR_ACTIVE = "#FFFFFF";
const COLOR_REST = "#A7ADB8";
/** Custom spring for the swap (Figma: "smoother and more responsive, should
 *  not feel like there's a 'lag'"). Snappy stiffness, low mass. */
const SWAP_SPRING = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.9 };

/**
 * One typeface line inside the swap-composition. Its size / colour is driven
 * by `isActive` (owned by the parent). When active, per-glyph cursor-proximity
 * modulation runs on `pointermove`; when inactive, all spans reset to REST.
 */
function TypeLine({
  text,
  lang,
  font,
  isActive,
  onActivate,
}: {
  text: string;
  lang: string;
  font: string;
  isActive: boolean;
  onActivate: () => void;
}) {
  const pRef = useRef<HTMLParagraphElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const centersRef = useRef<number[]>([]);

  const graphemes = useMemo(() => toGraphemes(text), [text]);

  const measure = useCallback(() => {
    const p = pRef.current;
    if (!p) return;
    const base = p.getBoundingClientRect().left;
    centersRef.current = spansRef.current.map((sp) => {
      if (!sp) return 0;
      const r = sp.getBoundingClientRect();
      return r.left + r.width / 2 - base;
    });
  }, []);

  const paint = useCallback((cursorX: number | null) => {
    spansRef.current.forEach((sp, i) => {
      if (!sp) return;
      if (cursorX == null) {
        sp.style.fontVariationSettings = REST;
        return;
      }
      const d = Math.abs(centersRef.current[i] - cursorX);
      const g = Math.max(0, 1 - d / RADIUS); // linear falloff: 1 at cursor → 0 past radius
      const wght = Math.round(WGHT_REST + g * (WGHT_PEAK - WGHT_REST));
      const wdth = Math.round(WDTH_REST + g * (WDTH_PEAK - WDTH_REST));
      sp.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}`;
    });
  }, []);

  // When a line loses its "active" role, reset every glyph back to REST so it
  // doesn't freeze mid-bulge from the last cursor position.
  useEffect(() => {
    if (!isActive) paint(null);
    else measure();
  }, [isActive, measure, paint]);

  return (
    <p
      ref={pRef}
      lang={lang}
      className="cursor-default text-center leading-[1.35] tracking-[-0.29px]"
      style={{
        fontFamily: `"${font}", sans-serif`,
        fontOpticalSizing: "auto",
        color: isActive ? COLOR_ACTIVE : COLOR_REST,
        transition: "color 0.35s ease",
      }}
      onPointerEnter={() => {
        onActivate();
        measure();
      }}
      onPointerMove={(e) => {
        if (!isActive) return;
        const p = pRef.current;
        if (!p) return;
        // Re-measure every move: the layout FLIP spring is still resettling
        // the line's width from 16→32 px for a few hundred ms after activation,
        // so cached span centers are stale and the falloff misses on the far side.
        measure();
        paint(e.clientX - p.getBoundingClientRect().left);
      }}
    >
      {graphemes.map((g, i) => (
        <span
          key={i}
          ref={(el) => {
            spansRef.current[i] = el;
          }}
          style={{
            display: "inline",
            whiteSpace: "pre",
            fontVariationSettings: REST,
            transition: `font-variation-settings 0.2s ${EASE_OUT}`,
          }}
        >
          {g}
        </span>
      ))}
    </p>
  );
}

/**
 * Ten scripts stacked centered. Exactly one is always "active" — bigger and
 * brighter, receiving cursor-proximity glyph modulation. Default active is
 * Latin (index 4). Hovering another line makes IT the new active; the
 * previously-active line springs back to muted size / colour, and the whole
 * composition breathes via Framer Motion `layout` FLIP.
 */
function VariableWidthType() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [active, setActive] = useState<string>("en"); // Figma: Latin is default
  const reduce = useReducedMotion();

  // Per-glyph spans lose inter-cluster kerning and can run wider than the
  // shell at the 32 px active size; the active line drives overflow, so
  // re-measure whenever the active line changes.
  useEffect(() => {
    const el = wrapRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      let natural = 0;
      el.querySelectorAll("p").forEach((p) => {
        natural = Math.max(natural, p.scrollWidth);
      });
      const avail = el.clientWidth;
      setScale(natural > avail + 1 ? avail / natural : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready?.then(
      fit,
    );
    return () => ro.disconnect();
  }, [active]);

  return (
    <div
      ref={wrapRef}
      className="flex w-full flex-col items-center justify-center"
      style={{
        transform: scale < 1 ? `scale(${scale})` : undefined,
        transformOrigin: "center",
      }}
    >
      {SCRIPTS.map((script) => {
        const isActive = script.lang === active;
        return (
          <StaggerItem key={script.lang} className="w-full">
            <motion.div
              layout={reduce ? false : true}
              transition={reduce ? { duration: 0 } : SWAP_SPRING}
              style={{
                fontSize: isActive ? SIZE_ACTIVE_PX : SIZE_REST_PX,
                width: "100%",
              }}
            >
              <TypeLine
                text={script.text}
                lang={script.lang}
                font={script.font}
                isActive={isActive}
                onActivate={() => setActive(script.lang)}
              />
            </motion.div>
          </StaggerItem>
        );
      })}
    </div>
  );
}

/* ─── main ─── */

export default function IdentityContent() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef(1);
  const lastScrollLeft = useRef(0);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el || !stageRef.current) return;
    stageRef.current.scrollTo({
      left: el.offsetLeft,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (reduce) return;
    const el = stageRef.current;
    if (!el) return;

    const onScroll = () => {
      const cur = el.scrollLeft;
      if (cur > lastScrollLeft.current) dirRef.current = 1;
      else if (cur < lastScrollLeft.current) dirRef.current = -1;
      lastScrollLeft.current = cur;
    };

    // Panel-at-a-time snap: each wheel gesture advances exactly one full-width
    // section, animated smoothly (the pre-free-scroll feel). A short lock keeps
    // a single trackpad flick from skipping multiple panels.
    let locked = false;
    const onWheel = (e: WheelEvent) => {
      const delta =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      e.preventDefault();
      if (locked || Math.abs(delta) < 6) return;
      const w = el.clientWidth;
      const idx = Math.round(el.scrollLeft / w);
      const dir = delta > 0 ? 1 : -1;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const target = Math.max(0, Math.min((idx + dir) * w, maxScroll));
      if (Math.abs(target - el.scrollLeft) < 1) return;
      locked = true;
      dirRef.current = dir;
      el.scrollTo({ left: target, behavior: "smooth" });
      window.setTimeout(() => {
        locked = false;
      }, 720);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
    };
  }, [reduce]);

  return (
    <ScrollRootCtx.Provider value={stageRef}>
      <ScrollDirCtx.Provider value={dirRef}>
        <Header />
        <div
          ref={stageRef}
          data-lenis-prevent
          className="fixed inset-0 z-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden bg-black [&_section]:snap-start"
          style={{ scrollBehavior: "auto" }}
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, filter: "blur(12px)" }}
            animate={
              reduce ? undefined : { opacity: 1, filter: "blur(0px)" }
            }
            transition={{ duration: 1, ease: EASE }}
            className="flex h-full"
          >
            {/* 0 — HERO */}
            <section
              id="hero"
              className="relative flex h-full w-screen shrink-0 items-center justify-center"
            >
              <HeroPanel
                onStory={() => scrollToId("section-story-0")}
                onWork={() => scrollToId("section-work-0")}
              />
            </section>

            {/* 1 — section-story-0 (context card) */}
            <section
              id="section-story-0"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={560} gap={10}>
                <div className="mx-auto flex w-full max-w-[480px] items-center justify-between">
                  <StaggerItem>
                    <Tag>context</Tag>
                  </StaggerItem>
                  <StaggerItem>
                    <Tag>2024</Tag>
                  </StaggerItem>
                </div>
                <Card>
                  <StaggerItem>
                    <Body>
                      I was hired at BimaKavach in 2023 when the company was
                      nascent, and was still a simple recommendation engine.
                    </Body>
                  </StaggerItem>
                  <StaggerItem>
                    <Body>
                      Since then, the company has been able to display live
                      quotes, enabling user-product discovery, and has enabled
                      payments for immediate online purchase, and has grown
                      it&rsquo;s user base to 4.7&times;*
                    </Body>
                  </StaggerItem>
                  <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-7">
                    <MetaPair label="Role" value="Product Designer" />
                    <MetaPair label="Timeline" value="2024 - 2025" />
                    <MetaPair
                      label="Team"
                      value="Tejas Jain, Gopi Solia, Vishal Sharma, Vishnu Gupta"
                    />
                    <MetaPair
                      label="Approach"
                      value="UX/UI Design, Visual Communication"
                    />
                  </dl>
                </Card>
              </Shell>
            </section>

            {/* 2 — section-story-1 */}
            <section
              id="section-story-1"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell width={700} gap={5}>
                <Tag>pivots and challenges</Tag>
                <H>My Journey so far</H>
                <Body>
                  I started off as a Senior Designer - and had to tackle
                  challenges outside the Product Design - not only in the
                  Visual Language and Branding of the company.
                </Body>
                <Media
                  name="section-story-1"
                  w={700}
                  h={394}
                  alt="Journey bento"
                  className="rounded-2xl"
                />
                <Body>
                  Since then, the company has been able to display live
                  quotes, enabling user-product discovery, and has enabled
                  payments for immediate online purchase, and has grown
                  it&rsquo;s user base to 4.7&times;*
                </Body>
              </Shell>
            </section>

            {/* 3 — section-story-2 (32px body text) */}
            <section
              id="section-story-2"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1160}>
                <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.4fr]">
                  <StaggerItem>
                    <Body large>
                      This helped in pivoting BimaKavach from a Recommendation
                      Engine for urban startups to an SME Focused, Online
                      Insure-Tech Brokerage Platform.
                    </Body>
                  </StaggerItem>
                  <StaggerItem>
                    <Media
                      name="section-story-2"
                      w={810}
                      h={649}
                      alt="BimaKavach app — before and after"
                    />
                  </StaggerItem>
                </div>
              </Shell>
            </section>

            {/* 4 — section-story-3 */}
            <section
              id="section-story-3"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1100} gap={6}>
                <SolutionsHead />
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div className="flex flex-col gap-4">
                    <StaggerItem>
                      <Body>
                        Redesigning Forms &amp; Modals in order to boost
                        discovery, expedite Quote Generation, and build
                        intuitive journies towards Quote Generation was the
                        next task.
                      </Body>
                    </StaggerItem>
                    <StaggerItem>
                      <Body>
                        Based on Reports from Support &amp; Sales, Analytics,
                        we observed dropoffs after the initial form, and
                        attempted to simplify the UX.
                      </Body>
                    </StaggerItem>
                    <StaggerItem>
                      <Body>
                        Since our changes, we have observed faster completion
                        and consistent reduction in drop-offs.
                      </Body>
                    </StaggerItem>
                  </div>
                  <StaggerItem>
                    <Media
                      name="section-story-3"
                      w={700}
                      h={394}
                      alt="Redesigned quote form"
                    />
                  </StaggerItem>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  {[
                    { k: "Lead Conversion", v: "2% +" },
                    { k: "quote generation time", v: "- 180s" },
                    { k: "policy conversion", v: "0.5% +" },
                  ].map((s) => (
                    <StaggerItem key={s.k}>
                      <div className="flex flex-col gap-1">
                        <span className="text-[13px] text-faint">{s.k}</span>
                        <span className="text-[clamp(1.4rem,3vw,2rem)] text-ink">
                          {s.v}
                        </span>
                      </div>
                    </StaggerItem>
                  ))}
                </div>
              </Shell>
            </section>

            {/* 5 — section-story-4 */}
            <section
              id="section-story-4"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1100} gap={6}>
                <SolutionsHead />
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div className="flex flex-col gap-4">
                    <StaggerItem>
                      <Body>Two Example of Simplifying Forms:</Body>
                    </StaggerItem>
                    <StaggerItem>
                      <Body>
                        1. Using Data to showcase the most used options as
                        Suggestion Chips - and allowing single select only if
                        the user fits none of the most commonly used options
                        and
                      </Body>
                    </StaggerItem>
                    <StaggerItem>
                      <Body>
                        2. Using Visual Cues in Binary Fields in order to
                        increase the ability to scan the form without
                        increasing cognitive load.
                      </Body>
                    </StaggerItem>
                  </div>
                  <StaggerItem>
                    <Media
                      name="section-story-4"
                      w={700}
                      h={394}
                      alt="Share your business details"
                    />
                  </StaggerItem>
                </div>
              </Shell>
            </section>

            {/* 6 — section-story-5 */}
            <section
              id="section-story-5"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1100} gap={6}>
                <SolutionsHead />
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <StaggerItem>
                    <Body>
                      By showcasing a loading state of the Quote Page and
                      asking no brainer questions in the form of a modal - we
                      were able to reduce drop-offs, as the user is now more
                      incentivized to complete the process.
                    </Body>
                  </StaggerItem>
                  <StaggerItem>
                    <Media
                      name="section-story-5"
                      w={700}
                      h={394}
                      alt="Confirm last few details"
                    />
                  </StaggerItem>
                </div>
              </Shell>
            </section>

            {/* 7 — section-story-6 */}
            <section
              id="section-story-6"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1100} gap={6}>
                <SolutionsHead />
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <StaggerItem>
                    <Body>
                      Pushing a One Time User Verification to the end ensures
                      that once the lead enters the database, it is already
                      verified. This extra step also ensures that users get a
                      feeling of security.
                    </Body>
                  </StaggerItem>
                  <StaggerItem>
                    <Media
                      name="section-story-6"
                      w={700}
                      h={394}
                      alt="Verify your number"
                    />
                  </StaggerItem>
                </div>
              </Shell>
            </section>

            {/* 8 — section-story-7 */}
            <section
              id="section-story-7"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1200}>
                <div className="grid items-center gap-8 md:grid-cols-[0.6fr_1.6fr]">
                  <div className="flex flex-col gap-4">
                    <StaggerItem>
                      <Tag>checkout &amp; payment</Tag>
                    </StaggerItem>
                    <StaggerItem>
                      <Body>
                        Massive diversions and permutations from the quote
                        page exists and change per product - meaning that the
                        journey must seem consistent and concise for any user
                      </Body>
                    </StaggerItem>
                  </div>
                  <StaggerItem>
                    <Media
                      name="section-story-7"
                      w={1000}
                      h={623}
                      alt="Payment flow diagram"
                    />
                  </StaggerItem>
                </div>
              </Shell>
            </section>

            {/* 9 — section-story-8 */}
            <section
              id="section-story-8"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1160} gap={10}>
                <div className="grid items-center gap-8 md:grid-cols-[1.4fr_0.9fr]">
                  <StaggerItem>
                    <Media
                      name="section-story-8-top"
                      w={612}
                      h={344}
                      alt="Quote page feed"
                    />
                  </StaggerItem>
                  <div className="flex flex-col gap-3">
                    <StaggerItem>
                      <Tag>checkout &amp; payment</Tag>
                    </StaggerItem>
                    <StaggerItem>
                      <Body>
                        The Quote Page acts as a feed - filtering and sorting
                        coverage offerings based on the user&rsquo;s needs.
                        Each Card contains further details and available
                        quotes can be compared.
                      </Body>
                    </StaggerItem>
                  </div>
                </div>
                <div className="grid items-center gap-8 md:grid-cols-[0.9fr_1.4fr]">
                  <div className="flex flex-col gap-3">
                    <StaggerItem>
                      <Tag>checkout &amp; payment</Tag>
                    </StaggerItem>
                    <StaggerItem>
                      <Body>
                        Steppers help assess the user in how much or little
                        work is pending. The Price is always shown next to the
                        Button to encourage Further Movement and Constant
                        Action.
                      </Body>
                    </StaggerItem>
                  </div>
                  <StaggerItem>
                    <Media
                      name="section-story-8-bottom"
                      w={612}
                      h={344}
                      alt="Stepper / primary details"
                    />
                  </StaggerItem>
                </div>
              </Shell>
            </section>

            {/* 10 — section-story-9 */}
            <section
              id="section-story-9"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell width={1200} gap={6}>
                <Tag>checkout &amp; payment</Tag>
                <Body>
                  Contextual Cues via Smart Alerts help reduce action, and
                  thus increase movement in the flow.
                </Body>
                <Media
                  name="section-story-9"
                  w={1200}
                  h={670}
                  alt="KYC states"
                />
              </Shell>
            </section>

            {/* 11 — section-story-10 */}
            <section
              id="section-story-10"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1200} gap={6}>
                <StaggerItem>
                  <Tag>checkout &amp; payment</Tag>
                </StaggerItem>
                <div className="grid items-center gap-6 md:grid-cols-2">
                  <StaggerItem>
                    <Media
                      name="section-story-10-left"
                      w={573}
                      h={440}
                      alt="Personal assistance screen"
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <Media
                      name="section-story-10-right"
                      w={573}
                      h={440}
                      alt="Contingency loader"
                    />
                  </StaggerItem>
                </div>
                <StaggerItem>
                  <Body>
                    Insurance APIs are wonky - at any step should the API fail
                    in anticipation of or during payment - contingency loaders
                    and screens appear to bridge gaps.
                  </Body>
                </StaggerItem>
              </Shell>
            </section>

            {/* 12 — section-story-11 (brand positioning) */}
            <section
              id="section-story-11"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={520} gap={6}>
                <div className="flex flex-col gap-4">
                  <StaggerItem>
                    <Tag>brand positioning</Tag>
                  </StaggerItem>
                  <StaggerItem>
                    <H>
                      How do we capitalize on this first movers advantage?
                    </H>
                  </StaggerItem>
                  <StaggerItem>
                    <Body>
                      After receiving its IRDAI-approved ISMP Payment License
                      in 2025, BimaKavach recognized that users were likely to
                      face challenges in staying retained amongst rising
                      competition, and that retaining customers requires more
                      than an efficient product - it requires grasping the
                      intangible.
                    </Body>
                  </StaggerItem>
                </div>
                <StaggerItem>
                  <button
                    type="button"
                    onClick={() => scrollToId("section-work-0")}
                    className="grid w-full place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-bold py-4 font-mono text-[13px] uppercase tracking-[0.3em] text-white transition-transform hover:scale-[1.02]"
                  >
                    Show me the work
                  </button>
                </StaggerItem>
              </Shell>
            </section>

            {/* 13 — section-work-0 (ASCII video) */}
            <section
              id="section-work-0"
              className="relative flex h-full w-screen shrink-0 items-center justify-center"
            >
              <WorkVideo />
            </section>

            {/* 14 — section-work-1 (the brief) */}
            <section
              id="section-work-1"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={560} gap={10}>
                <div className="mx-auto flex w-full max-w-[480px] items-center justify-between">
                  <StaggerItem>
                    <Tag>the brief</Tag>
                  </StaggerItem>
                  <StaggerItem>
                    <Tag>2026</Tag>
                  </StaggerItem>
                </div>
                <Card>
                  <StaggerItem>
                    <Body>
                      Through my stint as at solving for product, BimaKavach
                      ended up realizing that the personality of the Brand was
                      now feeling out of touch.
                    </Body>
                  </StaggerItem>
                  <StaggerItem>
                    <Body>
                      Experimenting with phases like using a 3D Mascot made
                      before AI, having the &ldquo;famous face&rdquo; in
                      Collaboration, beginning with having to move from a
                      traditional brokerage house, and becoming India&rsquo;s
                      go-to online destination for commercial insurance
                      solutions,
                    </Body>
                  </StaggerItem>
                  <StaggerItem>
                    <Body>
                      Experiments had taught us a valuable insight: Product
                      solves for traction, Brand solves for retention.
                    </Body>
                  </StaggerItem>
                </Card>
              </Shell>
            </section>

            {/* 15 — section-work-2 (brand meta) */}
            <section
              id="section-work-2"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={420}>
                <dl className="flex flex-col gap-10">
                  <MetaPair label="Timeline" value="Mar - May 2026" />
                  <MetaPair label="Role" value="Brand Designer" />
                  <MetaPair
                    label="Team"
                    value={
                      <span>
                        Tejas Jain
                        <br />
                        Gopi Solia
                        <br />
                        Amog C Raju
                      </span>
                    }
                  />
                  <MetaPair
                    label="Skills"
                    value={
                      <span>
                        Identity Design
                        <br />
                        Visual Communication
                      </span>
                    }
                  />
                </dl>
              </Shell>
            </section>

            {/* 16 — section-work-3 (My Task at Hand) */}
            <section
              id="section-work-3"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell width={700} gap={5}>
                <Tag>pivots and challenges</Tag>
                <H>My Task at Hand</H>
                <Body>
                  While still maintaining the minimalism and sleek execution
                  of a Technology Company with{" "}
                  <span className="underline decoration-muted/50 underline-offset-2">
                    SAAS Enterprise Software Offerings
                  </span>
                  , BimaKavach is to be perceived as a Global Indian
                  Company.
                </Body>
                <Media
                  name="section-work-3"
                  w={700}
                  h={394}
                  alt="Directors & Officers Insurance brochure"
                  className="rounded-2xl"
                />
              </Shell>
            </section>

            {/* 17 — section-work-4 (Indian aesthetic) */}
            <section
              id="section-work-4"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell width={784} gap={5}>
                <Body>
                  We decided to go back and understand what makes the
                  &ldquo;Indian&rdquo; Aesthetic - what are the first
                  principles involved in the making of an Indian Brand.
                </Body>
                <Media
                  name="section-work-4"
                  w={783}
                  h={626}
                  alt="Indian aesthetic research"
                  className="rounded-2xl"
                />
              </Shell>
            </section>

            {/* 18 — section-work-5 (A Typeface for All India) */}
            <section
              id="section-work-5"
              className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
            >
              <Shell manual width={1032} gap={6} className="py-16 sm:py-24">
                {/* Typeface stack owns the upper portion — flex-1 makes it
                    fill the remaining height so the composition never looks
                    crammed against the metadata below. */}
                <div className="flex flex-1 items-center justify-center">
                  <VariableWidthType />
                </div>
                <StaggerItem>
                  <Tag>solutions</Tag>
                </StaggerItem>
                <StaggerItem>
                  <H>A Typeface for All India</H>
                </StaggerItem>
                <StaggerItem>
                  <Body>
                    In order to cater to the multicultural hyperlocal nature
                    of Tier 2 &amp; Tier 3 Businesses, we started with
                    Foundational Typography. We had decided that Anek Variable
                    would be the typeface of choice.
                  </Body>
                </StaggerItem>
              </Shell>
            </section>
          </motion.div>
        </div>
      </ScrollDirCtx.Provider>
    </ScrollRootCtx.Provider>
  );
}

/* ─── hero ─── */

function HeroPanel({
  onStory,
  onWork,
}: {
  onStory: () => void;
  onWork: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const [focus, setFocus] = useState<"none" | "story" | "work">("none");

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[7px]"
      onMouseEnter={() => setEntered(true)}
      onMouseLeave={() => {
        setEntered(false);
        setFocus("none");
      }}
    >
      <Image
        src={HERO_IMG}
        alt="BimaKavach rebranding billboard"
        fill
        priority
        sizes="100vw"
        className="object-cover transition-opacity duration-500"
        style={{ opacity: entered ? 0 : 1 }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-6 pb-14 pt-24 text-center transition-opacity duration-500"
        style={{ opacity: entered ? 0 : 1 }}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/50">
          bimakavach rebranding — shipped 2026
        </span>
        <p className="max-w-[46rem] text-[clamp(1.1rem,2.4vw,1.6rem)] leading-snug text-white">
          Pivoting to the perception of BimaKavach as an intelligence
          company that is rooted in India&rsquo;s rich history of
          Ornamentation, Beauty and Aesthetic Identity.
        </p>
      </div>

      <div
        className="absolute inset-0 flex transition-opacity duration-500"
        style={{
          opacity: entered ? 1 : 0,
          pointerEvents: entered ? "auto" : "none",
        }}
      >
        <button
          type="button"
          onClick={onStory}
          onMouseEnter={() => setFocus("story")}
          onMouseLeave={() => setFocus("none")}
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0a0a0c]"
        >
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              backgroundImage:
                "linear-gradient(147deg, #0e2b72 0%, transparent 25%, transparent 75%, #0e2b72 100%)",
              opacity:
                focus === "story" ? 1 : focus === "work" ? 0.3 : 0.6,
            }}
          />
          <span
            className="relative font-mono text-[16px] uppercase tracking-[0.3em] transition-colors duration-300"
            style={{ color: focus === "story" ? "#ffffff" : "#a3a3a3" }}
          >
            Tell me the story
          </span>
        </button>

        <button
          type="button"
          onClick={onWork}
          onMouseEnter={() => setFocus("work")}
          onMouseLeave={() => setFocus("none")}
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0a0a0c]"
        >
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              backgroundImage:
                "linear-gradient(147deg, #4100cf 0%, transparent 40.5%, transparent 63%, #4100cf 100%)",
              opacity:
                focus === "work" ? 1 : focus === "story" ? 0.3 : 0.6,
            }}
          />
          <span
            className="relative font-mono text-[16px] uppercase tracking-[0.3em] transition-colors duration-300"
            style={{ color: focus === "work" ? "#ffffff" : "#a3a3a3" }}
          >
            Show me the work
          </span>
        </button>
      </div>
    </div>
  );
}
