"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionNav, { type NavSection } from "@/components/saathi/SectionNav";
import SaathiHero from "@/components/saathi/SaathiHero";
import { Body, Heading, Media, Section, Tag } from "@/components/case-study/parts";

/**
 * Peetal: the design-system deep-dive linked from section 004 of /draft. Laid
 * out like the Bima Saathi case study. Copy is a first draft built from the
 * two Figma files (v0.0.3, v0.0.4), their variable exports, the peetal-ds
 * Storybook repo and the Netra prototype. "x" marks figures still to come.
 */

const SECTIONS: readonly NavSection[] = [
  { id: "context", label: "Context" },
  { id: "principles", label: "Approach" },
  { id: "foundations", label: "Foundations" },
  { id: "components", label: "Components" },
  { id: "code", label: "Handoff" },
  { id: "tooling", label: "Tooling & AI" },
  { id: "governance", label: "Governance" },
  { id: "impact", label: "Impact" },
  { id: "next", label: "What's next" },
];

const META = [
  { label: "Role", values: ["Owner & maintainer"] },
  { label: "Versions", values: ["4"] },
  { label: "Tools", values: ["Figma", "Claude", "Storybook"] },
  { label: "Status", values: ["Live"] },
];

const PRINCIPLES = [
  {
    title: "Figma documentation is the source of truth.",
    body: "Code follows the documented spec, not the other way round. When a build and its doc disagree, the build is the one that changes.",
  },
  {
    title: "One scale, ten scripts.",
    body: "Every size, line height and weight comes from the Anek Latin scale. Switching to Bangla, Devanagari or Tamil changes only the font family.",
  },
  {
    title: "Written for developers and agents.",
    body: "Captions read as key = value (size = XSmall, state = Hover), the same shape as component props, so a person or an agent can lift the API straight off the page.",
  },
  {
    title: "One token, one job.",
    body: "Primitives are hidden from publishing and semantic tokens are scoped to where they may be used, so the wrong value can't be picked in the first place.",
  },
];

const BUTTON_RULES = [
  "Fill: the most important action, not more than once on a page.",
  "Stroke: always beside a primary action, and never more than twice.",
  "Ghost: everything else; no limit, but not overused.",
  "Never a leading and a trailing icon together, and loading states carry no label.",
  "Corner smoothing at 60%, at every size.",
];

const DONE_STAGES = [
  {
    title: "Design-ready",
    body: "Real masters, properties in the naming grammar, every value bound to a token, a full documentation frame, and an AA contrast check.",
  },
  {
    title: "Code-ready",
    body: "Props mirror Figma one to one, tokens only, a story for every variant and state with a play test, and keyboard and screen-reader checks.",
  },
  {
    title: "Handoff-ready",
    body: "Figma node IDs cited in code, the documentation linked, and a changelog entry with a version bump.",
  },
];

const NEXT = [
  "Elevation as tokens, not just a table",
  "Cards, Modals and Navigation",
  "The 16 intent boards for Buttons turned into components",
  "Code Connect between Figma and Storybook",
  "Git history and a changelog on the code side",
];

/** Big-number figures, as on /draft. "x" marks numbers still to come. */
function Figures({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-6 border-t-[0.5px] border-ink/10 pt-6 sm:grid-cols-4">
      {items.map((f) => (
        <div key={f.label} className="flex flex-col gap-2">
          <dd className="text-[28px] leading-none tracking-[-0.02em] text-ink tabular-nums">
            {f.value}
          </dd>
          <dt className="text-12 leading-[1.4] text-muted">{f.label}</dt>
        </div>
      ))}
    </dl>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex max-w-[46rem] flex-col gap-2 text-16 leading-relaxed text-muted">
      {items.map((i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden="true" className="text-faint">
            ·
          </span>
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

const linkClass =
  "text-ink underline decoration-ink/60 underline-offset-[2px] transition-colors hover:decoration-ink";

export default function PeetalContent() {
  return (
    <>
      <Header />
      {/* Same grid as Saathi: the section rail, the reading column, and an empty
          column that mirrors the rail so the reading column stays centred. */}
      <div className="w-full px-4 sm:px-6 md:grid md:grid-cols-[minmax(10rem,1fr)_minmax(0,var(--reading-max))_1fr] md:gap-8">
        <SectionNav sections={SECTIONS} />
        <main className="flex w-full min-w-0 flex-col gap-24 pb-20 pt-16 sm:pt-24">
          <SaathiHero>
            {/* Cover media to come (the Figma cover is saved at /media/peetal/cover.png). */}
            <div className="relative aspect-[1400/788] w-full overflow-hidden rounded-xl bg-surface ring-[0.5px] ring-border">
              <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-12 leading-[normal] text-faint">
                MEDIA PENDING...
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="self-start rounded-full bg-surface px-2 py-1 font-mono text-10 tracking-wide text-faint ring-1 ring-border">
                live 2024
              </span>
              <h1 className="font-display text-32 leading-tight text-ink sm:text-44">
                One source of truth for designers, developers and the agents that build with
                them.
              </h1>
            </div>
          </SaathiHero>

          {/* Details */}
          <Section id="details">
            <div className="flex flex-col gap-8 rounded-xl bg-surface/30 p-6 ring-[0.5px] ring-border">
              <Body>
                Peetal is BimaKavach&rsquo;s in-house design system library: the tokens,
                components and documentation behind its web journeys, its POS app
                &ldquo;Saathi&rdquo;, and the base for handing work to developers and to AI agents.
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

          {/* Context */}
          <Section id="context">
            <Tag>Context</Tag>
            <Heading>Developers couldn&rsquo;t keep up, and journeys were shipping old parts.</Heading>
            <Body>
              Web development demand at BimaKavach grew faster than developers could cope with,
              and parts of the purchase journey were still carrying deprecated assets.
            </Body>
            <Body>
              Peetal (i.e. brass) was traditionally used in the Indian subcontinent to make
              shields (i.e. kavach).
            </Body>
            {/* TODO: link Blade and UX4G to their Figma pages once the URLs are in. */}
            <Body>
              Built on borrowed scaffolding, starter kits from Blade and UX4G exude whiffs of the
              documentation and scaling principles that make both of these inspirations stand out.
            </Body>
          </Section>

          {/* Principles */}
          <Section id="principles">
            <Tag>Approach</Tag>
            <Heading>First Principles in Fours</Heading>
            <div className="mt-2 grid gap-8 sm:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="flex flex-col gap-3">
                  <h3 className="text-20 leading-snug text-ink">{p.title}</h3>
                  <Body>{p.body}</Body>
                </div>
              ))}
            </div>
          </Section>

          {/* Foundations */}
          <Section id="foundations">
            <Tag>Foundations</Tag>
            <Heading>A Lean, Clean, Peetal Machine</Heading>
            <Body>
              v0.0.4 drops styles entirely for variables in three tiers: hidden primitives,
              semantic colours, and component tokens on top. The brand moved from navy and yellow
              to ojas violet (#4100CF) and agni orange (#FF7700).
            </Body>
            <Figures
              items={[
                { value: "680", label: "Tokens, 6 Collections" },
                { value: "333", label: "Base Primitive Tokens" },
                { value: "100%", label: "Tokens Scoped" },
                { value: "10", label: "Unified Indian Scripts" },
              ]}
            />
            <Media
              className="mt-2 aspect-[700/463]"
              src="/media/peetal/colour-ramps-crop.png"
              alt="Peetal colour ramps: primary, secondary, success and error, each with steps 50 to 900 and alpha steps"
            />
            <Body>Eight hues, each with a branded name and a job:</Body>
            <Bullets
              items={[
                "Ojas (Primary, Brand Purple)",
                "Agni (Secondary, Brand Orange)",
                "Vaayu (Tertiary, Info Blue)",
                "Sukkha (Tertiary, Success Green)",
                "Dukkha (Tertiary, Error Red)",
                "Seva (Tertiary, Caution Yellow)",
                "Maaya (Tertiary, Special Teal)",
                "Prakash (Neutral)",
              ]}
            />
            <Body>
              The ramps were built in OKLCH with manual HSB and LCH adjustments, weighing the
              9-step Tailwind / Refactoring UI method against the 7-step data and accordion method
              for testing and iterations.
            </Body>
            <Body>Every ramp step has a stated role: 500 is the base, 600 hover, 700 active.</Body>
            <Media
              className="mt-2 aspect-[2592/4988]"
              src="/media/peetal/type-scale-responsive.ref.png"
              alt="Peetal responsive type styles: display, heading and body sizes on small and large screens"
            />
            <Body>
              Type runs on Anek across ten scripts, with Instrument Serif for display. Font sizes
              switch through Web and Mobile modes: display runs 80 to 48 on large screens and 48
              to 34 on small, body 10 to 18 and 10 to 16.
            </Body>
            <Media
              className="mt-2 aspect-[1216/759]"
              src="/media/peetal/elevation.png"
              alt="Peetal elevation tokens: low, mid and high raised shadows"
            />
          </Section>

          {/* Components */}
          <Section id="components">
            <Tag>Components</Tag>
            <Heading>The Button, documented end to end.</Heading>
            <Body>
              One component carries the system&rsquo;s whole grammar. The built set has 160
              variants: 4 layouts × 5 sizes × 2 padding types × 4 states, with every padding, gap,
              stroke, fill and radius bound to a token.
            </Body>
            <Media
              className="mt-2 aspect-[2856/11152]"
              src="/media/peetal/documentaion.png"
              alt="Button documentation: anatomy, sizes, padding, corner smoothing, container types, states, colours, icon buttons and links, with key = value captions"
            />
            <Bullets items={BUTTON_RULES} />
            <Media
              className="mt-2 aspect-[1400/941]"
              src="/media/peetal/button-primary-board.png"
              alt="Button brand primary fill: 160 variants across size, padding, layout and state"
            />
            <Body>
              Every colour intent repeats the same structure and swaps only its tokens, so the
              next intent is a token set, not a redesign.
            </Body>
          </Section>

          {/* Handoff */}
          <Section id="code">
            <Tag>Handoff</Tag>
            <Heading>Migrating to Storybook</Heading>
            <Body>
              The Storybook pilot runs on React and Storybook 10: four components (Alert,
              InteractiveInput, Scrollbar, Ticker), 32 stories and 122 tokens pulled from the
              Figma variables through the Figma MCP.
            </Body>
            <Bullets
              items={[
                "Props mirror Figma properties one to one, and comments cite the Figma node each part came from.",
                "Designer decisions live in the code with their dates, such as “The Alert is on for 8 seconds.”",
                "Play tests check rendered colours against token values.",
                "Accessibility is built in: errors announce at once, countdowns pause on hover, and an icon always backs up colour.",
              ]}
            />
            <Media className="mt-2 aspect-[800/440]" />
          </Section>

          {/* Tooling & AI */}
          <Section id="tooling">
            <Tag>Tooling &amp; AI</Tag>
            <Heading>Prototypes that developers build from.</Heading>
            <Body>
              Netra, a coded prototype of the purchase journey, is the UI/UX source of truth at
              handoff: 127 commits, every one co-authored with Claude, and 99 files that cite 167
              Figma node IDs. Peetal&rsquo;s inputs, checkboxes and selects were rebuilt there
              straight from their Figma nodes.
            </Body>
            <Body>
              The Figma file speaks to agents too: handover labels are marked to be skipped when
              an agent reads the design context, so only the real spec is read.
            </Body>
            <Body>
              NetraBot studio grew out of the same work: a parametric mascot tool with 78
              expressions, 56 animations, a timeline and JSON export.
            </Body>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Netra: D&O journey",
                  meta: "Live prototype ↗",
                  href: "https://netra-checkout-concepts.vercel.app/directors-and-officers-insurance",
                },
                {
                  title: "BimaKavach website",
                  meta: "Live website ↗",
                  href: "https://www.bimakavach.com",
                },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col gap-2 rounded-xl p-5 ring-[0.5px] ring-border transition-colors hover:bg-surface/40"
                >
                  <span className="text-12 uppercase tracking-[0.6px] text-faint">{l.meta}</span>
                  <span className="text-18 text-ink">{l.title}</span>
                </a>
              ))}
            </div>
          </Section>

          {/* Governance */}
          <Section id="governance">
            <Tag>Governance</Tag>
            <Heading>How it&rsquo;s made, changed and checked.</Heading>
            <Body>
              I oversee how Peetal is made and updated, handle the change logs, and use Claude for
              AI-assisted work.
            </Body>
            <Body>
              Every component page follows one documentation template written for engineers:
              anatomy, states, a token reference and notes for engineers, with real values, such
              as a 240px tooltip and a 300ms show, 100ms hide.
            </Body>
            <div className="mt-2 grid gap-6 sm:grid-cols-3">
              {DONE_STAGES.map((d, i) => (
                <div key={d.title} className="flex flex-col gap-2">
                  <span className="font-mono text-10 tracking-wide text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-18 leading-snug text-ink">{d.title}</h3>
                  <p className="text-14 leading-relaxed text-muted">{d.body}</p>
                </div>
              ))}
            </div>
            <Body>
              A page only turns 🟢 when all three stages pass. Being honest about the gaps is part
              of it: a few docs still describe sizes and states the components don&rsquo;t have
              yet, and closing that drift is the current pass.
            </Body>
          </Section>

          {/* Impact */}
          <Section id="impact">
            <Tag>Impact</Tag>
            <Heading>Weeks became days.</Heading>
            <Body>
              A first version on dev used to take about 6 weeks. With Netra prototypes as the
              UI/UX source of truth at handoff, it now takes days.
            </Body>
            <Figures
              items={[
                { value: "6 wks → x days", label: "to a first version on dev" },
                { value: "x", label: "screens built on Peetal" },
                { value: "x%", label: "fewer UI fixes after handoff" },
                { value: "x", label: "designers and developers using it" },
              ]}
            />
          </Section>

          {/* What's next */}
          <Section id="next">
            <Tag>What&rsquo;s next</Tag>
            <Heading>Still building.</Heading>
            <Bullets items={NEXT} />
            <Body>
              Back to the case study:{" "}
              <Link href="/draft" className={linkClass}>
                BimaKavach, 2023 - present
              </Link>
              .
            </Body>
          </Section>
        </main>
      </div>
      <Footer elsewhereLabel />
    </>
  );
}
