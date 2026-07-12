"use client";

import { createContext, useRef, useState, useEffect, useContext, ReactNode, CSSProperties } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionNav from "@/components/saathi/SectionNav";
import SaathiHero from "@/components/saathi/SaathiHero";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const STEP = 0.09; // seconds per stagger step

const StaggerSeqCtx = createContext<{ next: () => number }>({ next: () => 0 });

/**
 * Bima Saathi case study. Composition is final; images + most copy are WIP, so
 * media are violet placeholder blocks and body text is lorem. Real content
 * drops into this structure later (and into /public/media/saathi/).
 */

const LOREM =
  "Cras mattis consectetur purus sit amet fermentum. Nullam quis risus eget urna mollis ornare vel eu leo. Aenean lacinia bibendum nulla sed consectetur, vestibulum id ligula porta felis euismod semper.";
const LOREM_SHORT =
  "Nullam quis risus eget urna mollis ornare vel eu leo. Donec ullamcorper nulla non metus auctor.";

/** WIP media placeholder — a violet gradient block matching the card look. */
function Media({ className = "aspect-[800/544]" }: { className?: string }) {
  return (
    <div
      className={`grid w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-brand to-brand-bold ${className}`}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
        media
      </span>
    </div>
  );
}

/** The little uppercase-ish section tag pill. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-surface px-3 py-1.5 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border">
      {children}
    </span>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] leading-tight text-ink">
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[46rem] text-[15px] leading-relaxed text-muted">{children}</p>
  );
}

/** Staggered reveal item: fades/blurs/slides in with a per-item delay. */
function StaggerItem({
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
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
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
        filter: visible ? "blur(0px)" : "blur(16px)",
        transform: `translateY(${visible ? 0 : 20}px)`,
        transition: visible
          ? `opacity 1.1s ${EASE_OUT} ${delay}s, filter 1s ${EASE_OUT} ${delay}s, transform 1.2s ${EASE_OUT} ${delay}s`
          : `opacity 0.5s ease ${delay * 0.2}s, filter 0.5s ease ${delay * 0.2}s, transform 0.5s ease ${delay * 0.2}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Section wrapper: a scroll-target id + a staggered fade-in reveal. */
function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  // Fresh per-render sequence for this section's stagger item.
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

const META = [
  { label: "Role", values: ["Product Designer"] },
  { label: "Timeline", values: ["Oct – Dec 2024"] },
  { label: "Team", values: ["1 PM", "1 Engineer", "1 Designer (me!)"] },
  { label: "Skills", values: ["Product Design", "User Research"] },
];

const SOLUTION_ROWS = [
  "Set your coverage in a single, guided flow.",
  "Ask questions and get structured, plain-language answers.",
  "Log activity with a fast, template-driven form.",
];

export default function SaathiContent() {
  return (
    <>
      <Header />
      <SectionNav />
      <main className="mx-auto flex w-full max-w-[var(--reading-max)] flex-col gap-24 px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
        {/* Hero */}
        <SaathiHero>
          <Media className="aspect-[800/544]" />
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[12px] tracking-wide text-faint">
              bima saathi — shipped 2025
            </p>
            <h1 className="font-display text-[clamp(1.75rem,4.5vw,2.75rem)] leading-tight text-ink">
              Designing the product that turned 1,000 agents into
              BimaKavach&rsquo;s second-largest revenue channel.
            </h1>
          </div>
        </SaathiHero>

        {/* Details + meta grid */}
        <Section id="details">
          <Tag>details</Tag>
          <div className="flex flex-col gap-8 rounded-2xl border border-border bg-surface/30 p-6 sm:p-8">
            <Body>{LOREM}</Body>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {META.map((m) => (
                <div key={m.label} className="flex flex-col gap-2">
                  <dt className="text-[14px] font-medium text-ink">{m.label}</dt>
                  <dd className="flex flex-col gap-1 text-[14px] text-muted">
                    {m.values.map((v) => (
                      <span key={v}>{v}</span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

        {/* Overview */}
        <Section id="overview">
          <Tag>Overview</Tag>
          <Heading>A short, sharp framing of the problem worth solving.</Heading>
          <Body>{LOREM}</Body>
        </Section>

        {/* Solution — alternating media rows */}
        <Section id="solution">
          <Tag>Solution</Tag>
          <Heading>One product, three moments that made it stick.</Heading>
          <div className="mt-4 flex flex-col gap-10">
            {SOLUTION_ROWS.map((caption, i) => (
              <div
                key={i}
                className="grid items-center gap-6 sm:grid-cols-[1fr_1.4fr]"
              >
                <p className="text-[16px] leading-relaxed text-ink">{caption}</p>
                <Media className="aspect-[520/354]" />
              </div>
            ))}
          </div>
        </Section>

        {/* Outcomes */}
        <Section id="outcomes">
          <Tag>Outcomes</Tag>
          <Body>{LOREM_SHORT}</Body>
          <Media className="mt-2 aspect-[800/376]" />
        </Section>

        {/* Initial Observations */}
        <Section id="observations">
          <Tag>Initial Observations</Tag>
          <Heading>What we noticed before we designed anything.</Heading>
          <Body>{LOREM}</Body>
        </Section>

        {/* Pain Points — 2 columns + key insight */}
        <Section id="pain-points">
          <Tag>Pain Points</Tag>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              "Agents didn't know commercial insurance was something they could sell.",
              "Lead agents had no way to track their sub-agents.",
            ].map((h, i) => (
              <div key={i} className="flex flex-col gap-3">
                <h3 className="text-[18px] font-medium leading-snug text-ink">{h}</h3>
                <Body>{LOREM_SHORT}</Body>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-surface/40 p-6 sm:p-8">
            <h3 className="text-[20px] leading-snug text-ink">
              Key insight: the fastest path to trust was making the next action
              obvious.
            </h3>
          </div>
          <Body>{LOREM_SHORT}</Body>
        </Section>

        {/* Market Research + sub-sections */}
        <Section id="research">
          <Tag>Market Research</Tag>
          <Media className="aspect-[800/440]" />
          <div className="mt-4 flex flex-col gap-8">
            {["Channel one", "Channel two", "Channel three"].map((label) => (
              <div key={label} className="flex flex-col gap-3">
                <Tag>{label}</Tag>
                <Body>{LOREM_SHORT}</Body>
              </div>
            ))}
            <div className="mt-2 rounded-2xl bg-surface/40 p-6 sm:p-8">
              <h3 className="text-[20px] leading-snug text-ink">
                How might we make buying business insurance feel intuitive,
                convenient, and worth the agent&rsquo;s time?
              </h3>
            </div>
          </div>
        </Section>

        {/* Competitor Research */}
        <Section id="competitors">
          <Tag>Competitor Research</Tag>
          <Heading>Existing interfaces were complex and not built for agents.</Heading>
          <Media className="aspect-[800/536]" />
          <Body>{LOREM}</Body>
        </Section>

        {/* Design Process */}
        <Section id="process">
          <Tag>Design Process</Tag>
          <Heading>A familiar, uncluttered surface with bespoke moments.</Heading>
          <Body>{LOREM}</Body>
          <Media className="mt-2 aspect-[800/364]" />
          <Body>{LOREM_SHORT}</Body>
          <Media className="mt-2 aspect-[800/560]" />
          <h3 className="mt-4 text-[20px] leading-snug text-ink">
            What if we brought in a guided simulation?
          </h3>
          <Body>{LOREM}</Body>
          <Media className="mt-2 aspect-[800/620]" />
          <Body>{LOREM_SHORT}</Body>
        </Section>

        {/* Final Designs */}
        <Section id="final">
          <Tag>Final Designs</Tag>
          <Heading>A simple, familiar, and clean interface.</Heading>
          <Body>{LOREM_SHORT}</Body>
          <Media className="mt-2 aspect-[800/540]" />
        </Section>

        {/* Reflection */}
        <Section id="reflection">
          <Tag>Reflection</Tag>
          <Heading>What I learned</Heading>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              "Keep cutting it down to the MLP.",
              "User research is not enough.",
            ].map((h, i) => (
              <div key={i} className="flex flex-col gap-3">
                <h3 className="text-[18px] font-medium leading-snug text-ink">{h}</h3>
                <Body>{LOREM}</Body>
              </div>
            ))}
          </div>
        </Section>

        <Footer />
      </main>
    </>
  );
}
