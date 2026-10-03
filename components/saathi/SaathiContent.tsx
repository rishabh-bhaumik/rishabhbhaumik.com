"use client";

import {
  createContext,
  useRef,
  useState,
  useEffect,
  useContext,
  ReactNode,
  CSSProperties,
} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionNav from "@/components/saathi/SectionNav";
import SaathiHero from "@/components/saathi/SaathiHero";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const STEP = 0.09; // seconds per stagger step

const StaggerSeqCtx = createContext<{ next: () => number }>({ next: () => 0 });

/**
 * Bima Saathi case study. Composition is final; images + most copy are WIP, so
 * media are black placeholder blocks and body text is lorem. Real content
 * drops into this structure later (and into /public/media/saathi/).
 */

const LOREM =
  "Cras mattis consectetur purus sit amet fermentum. Nullam quis risus eget urna mollis ornare vel eu leo. Aenean lacinia bibendum nulla sed consectetur, vestibulum id ligula porta felis euismod semper.";
const LOREM_SHORT =
  "Nullam quis risus eget urna mollis ornare vel eu leo. Donec ullamcorper nulla non metus auctor.";

/** WIP media placeholder — a surface-coloured block with a hairline edge. */
function Media({ className = "aspect-[800/544]" }: { className?: string }) {
  return (
    <div
      className={`grid w-full place-items-center overflow-hidden rounded-2xl bg-surface ring-1 ring-border ${className}`}
    >
      <span className="font-mono text-10 uppercase tracking-[0.2em] text-ink/30">
        media
      </span>
    </div>
  );
}

/** The little uppercase-ish section tag pill. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-surface px-2 py-1 font-mono text-10 tracking-wide text-faint ring-1 ring-border">
      {children}
    </span>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-24 sm:text-32 leading-tight text-ink">
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[46rem] text-16 leading-relaxed text-muted">
      {children}
    </p>
  );
}

/** Staggered reveal item: fades and slides in once, with a per-item delay. */
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
        // Fade + rise only (transform and opacity run on the compositor; a blur would repaint every frame).
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(20px)",
        transition: `opacity 1.1s ${EASE_OUT} ${delay}s, transform 1.2s ${EASE_OUT} ${delay}s`,
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
  "Choose from a range of offerings beyond Motor, Life and Health.",
  "Onboard clients and manage their policy issuance, servicing, and renewal.",
  "Access payouts at all times with transparency.",
];

export default function SaathiContent() {
  return (
    <>
      <Header />
      {/* From md up, three columns: the section rail, the reading column, and an empty
          one that mirrors the rail so the reading column stays centred. Full width, so the
          rail sits at the left edge in line with the header. When the window
          is too narrow for both, the rail keeps its 10rem and the reading column narrows. */}
      <div className="w-full px-4 sm:px-6 md:grid md:grid-cols-[minmax(10rem,1fr)_minmax(0,var(--reading-max))_1fr] md:gap-8">
        <SectionNav />
        <main className="flex w-full min-w-0 flex-col gap-24 pb-20 pt-16 sm:pt-24">
          {/* Hero */}
          <SaathiHero>
            <Media className="aspect-[800/544]" />
            <div className="flex flex-col gap-3">
              {/* The same pill as the project card's tag. */}
              <span className="self-start rounded-full bg-surface px-2 py-1 font-mono text-10 tracking-wide text-faint ring-1 ring-border">
                bima saathi - shipped 2025
              </span>
              <h1 className="font-display text-32 leading-tight text-ink sm:text-44">
                Designing the product that turned 1,000 agents into
                BimaKavach&rsquo;s second-largest revenue channel.
              </h1>
            </div>
          </SaathiHero>

          {/* Details + meta grid */}
          <Section id="details">
            <Tag>details</Tag>
            <div className="flex flex-col gap-8 rounded-2xl border border-border bg-surface/30 p-6 sm:p-8">
              <Body>
                Saathi is India&rsquo;s smartest insurance partner app, allowing
                BimaKavach to offer Insurance Products beyond Life, Health, and
                Motor to agents, so that Business Insurance can reach places
                even we normally couldn&rsquo;t.
              </Body>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                {META.map((m) => (
                  <div key={m.label} className="flex flex-col gap-2">
                    <dt className="text-14 font-medium text-ink">{m.label}</dt>
                    <dd className="flex flex-col gap-1 text-14 text-muted">
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
            <Heading>
              What if we put business insurance in the hands of the agents
              India already trusts?
            </Heading>
            <Body>
              Across India, insurance agents sell Life, Health and Motor every
              day, but business insurance has always been out of their reach.
              It&rsquo;s complex to quote, slow to issue and hard to explain to a
              client. That gap is where Saathi started. The agents already had
              the relationships; they just didn&rsquo;t have the products.
            </Body>
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
                  <p className="text-16 leading-relaxed text-ink">{caption}</p>
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
                  <h3 className="text-20 leading-snug text-ink">{h}</h3>
                  <Body>{LOREM_SHORT}</Body>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-surface/40 p-6 sm:p-8">
              <h3 className="text-20 leading-snug text-ink">
                Key insight: the fastest path to trust was making the next
                action obvious.
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
                <h3 className="text-20 leading-snug text-ink">
                  How might we make buying business insurance feel intuitive,
                  convenient, and worth the agent&rsquo;s time?
                </h3>
              </div>
            </div>
          </Section>

          {/* Competitor Research */}
          <Section id="competitors">
            <Tag>Competitor Research</Tag>
            <Heading>
              Existing interfaces were complex and not built for agents.
            </Heading>
            <Media className="aspect-[800/536]" />
            <Body>{LOREM}</Body>
          </Section>

          {/* Design Process */}
          <Section id="process">
            <Tag>Design Process</Tag>
            <Heading>
              A familiar, uncluttered surface with bespoke moments.
            </Heading>
            <Body>{LOREM}</Body>
            <Media className="mt-2 aspect-[800/364]" />
            <Body>{LOREM_SHORT}</Body>
            <Media className="mt-2 aspect-[800/560]" />
            <h3 className="mt-4 text-20 leading-snug text-ink">
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
                  <h3 className="text-20 leading-snug text-ink">{h}</h3>
                  <Body>{LOREM}</Body>
                </div>
              ))}
            </div>
          </Section>
        </main>
      </div>
      <Footer />
    </>
  );
}
