"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";

// Building blocks for vertical case studies laid out like Bima Saathi
// (components/saathi/SaathiContent.tsx keeps its own copies for now).

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const STEP = 0.09; // seconds per stagger step

const StaggerSeqCtx = createContext<{ next: () => number }>({ next: () => 0 });

/** Staggered reveal item: fades and slides in once, with a per-item delay. */
export function StaggerItem({
  children,
  index,
  className = "",
  style,
}: {
  children?: ReactNode;
  index?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useContext(StaggerSeqCtx);
  const [i] = useState(() => index ?? seq.next());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Once in, it stays in: no exit replay while scrolling back and forth.
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        obs.disconnect();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const delay = i * STEP;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(20px)",
        transition: `opacity 1.1s cubic-bezier(${EASE_OUT.join(",")}) ${delay}s, transform 1.2s cubic-bezier(${EASE_OUT.join(",")}) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Section wrapper: a scroll-target id + a staggered fade-in reveal. */
export function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const counter = { n: 0 };
  const seq: { next: () => number } = { next: () => counter.n++ };

  return (
    <StaggerSeqCtx.Provider value={seq}>
      <section id={id} className={`scroll-mt-24 ${className}`}>
        <StaggerItem className="flex flex-col gap-4">{children}</StaggerItem>
      </section>
    </StaggerSeqCtx.Provider>
  );
}

/** The small section tag pill. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-surface px-2 py-1 font-mono text-10 tracking-wide text-faint ring-1 ring-border">
      {children}
    </span>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-24 leading-tight text-ink sm:text-32">{children}</h2>;
}

export function Body({ children }: { children: ReactNode }) {
  return <p className="max-w-[46rem] text-16 leading-relaxed text-muted">{children}</p>;
}

/**
 * A media block with a hairline edge. Without `src` it is a placeholder; with
 * one, the image fills the block (`fit` contain by default).
 */
export function Media({
  className = "aspect-[800/544]",
  src,
  alt = "",
  fit = "contain",
  priority = false,
}: {
  className?: string;
  src?: string;
  alt?: string;
  fit?: "contain" | "cover";
  priority?: boolean;
}) {
  if (src) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-white ring-[0.5px] ring-border ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 700px) 100vw, 700px"
          className={fit === "cover" ? "object-cover object-top" : "object-contain object-center"}
        />
      </div>
    );
  }
  return (
    <div
      className={`grid w-full place-items-center overflow-hidden rounded-xl bg-surface ring-[0.5px] ring-border ${className}`}
    >
      <span className="font-mono text-10 uppercase tracking-[0.2em] text-ink/30">media</span>
    </div>
  );
}
