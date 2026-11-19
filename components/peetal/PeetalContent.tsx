import Link from "next/link";
import TagMarquee from "@/components/home/TagMarquee";
import GrowMedia from "@/components/project/GrowMedia";
import NextProject from "@/components/project/NextProject";
import {
  Bullets,
  Figure,
  Numbered,
  ProjectHero,
  ProjectSection,
  Prose,
  Stats,
} from "@/components/project/parts";
import { SELECTED_WORK } from "@/data/site";

/**
 * Peetal: the design-system deep-dive (also linked from section 004 of /draft), laid
 * out like the BimaNetra project on the ruled sheet. Copy is a first draft built from
 * the two Figma files (v0.0.3, v0.0.4), their variable exports, the peetal-ds
 * Storybook repo and the Netra prototype. "x" marks figures still to come.
 */

/** Its card on home: the tags come from there. */
const WORK = SELECTED_WORK.find((w) => w.slug === "peetal")!;

const MARQUEE = ["role", "owner & maintainer", "versions", "4", "tools", "figma, claude, storybook", "status", "live"];

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

const HUES = [
  "Ojas (Primary, Brand Purple)",
  "Agni (Secondary, Brand Orange)",
  "Vaayu (Tertiary, Info Blue)",
  "Sukkha (Tertiary, Success Green)",
  "Dukkha (Tertiary, Error Red)",
  "Seva (Tertiary, Caution Yellow)",
  "Maaya (Tertiary, Special Teal)",
  "Prakash (Neutral)",
];

const BUTTON_RULES = [
  "Fill: the most important action, not more than once on a page.",
  "Stroke: always beside a primary action, and never more than twice.",
  "Ghost: everything else; no limit, but not overused.",
  "Never a leading and a trailing icon together, and loading states carry no label.",
  "Corner smoothing at 60%, at every size.",
];

const STORYBOOK = [
  "Props mirror Figma properties one to one, and comments cite the Figma node each part came from.",
  "Designer decisions live in the code with their dates, such as “The Alert is on for 8 seconds.”",
  "Play tests check rendered colours against token values.",
  "Accessibility is built in: errors announce at once, countdowns pause on hover, and an icon always backs up colour.",
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

const LIVE = [
  {
    title: "Netra: D&O journey",
    meta: "Live prototype ↗",
    href: "https://netra-checkout-concepts.vercel.app/directors-and-officers-insurance",
  },
  { title: "BimaKavach website", meta: "Live website ↗", href: "https://www.bimakavach.com" },
];

const NEXT = [
  "Elevation as tokens, not just a table",
  "Cards, Modals and Navigation",
  "The 16 intent boards for Buttons turned into components",
  "Code Connect between Figma and Storybook",
  "Git history and a changelog on the code side",
];

export default function PeetalContent() {
  return (
    <article className="flex flex-col">
      <ProjectHero
        tags={[WORK.year, WORK.kind]}
        title={["One source of truth for designers, developers and the agents that build with them."]}
        intro="Peetal is BimaKavach’s in-house design system library: the tokens, components and documentation behind its web journeys, its POS app “Saathi”, and the base for handing work to developers and to AI agents."
      />
      <TagMarquee items={MARQUEE} />
      {/* Cover to come (the Figma cover is saved at /media/peetal/cover.png). */}
      <div className="pt-20">
        <GrowMedia media={{ label: "Media pending..." }} />
      </div>

      <ProjectSection
        id="context"
        tag="context"
        heading="Developers couldn’t keep up, and journeys were shipping old parts."
      >
        <Prose>
          <p>
            Web development demand at BimaKavach grew faster than developers could cope with, and parts of the
            purchase journey were still carrying deprecated assets.
          </p>
          <p>Peetal (i.e. brass) was traditionally used in the Indian subcontinent to make shields (i.e. kavach).</p>
          {/* TODO: link Blade and UX4G to their Figma pages once the URLs are in. */}
          <p>
            Built on borrowed scaffolding, starter kits from Blade and UX4G exude whiffs of the documentation and
            scaling principles that make both of these inspirations stand out.
          </p>
        </Prose>
      </ProjectSection>

      <ProjectSection id="principles" tag="approach" heading="First Principles in Fours">
        <Numbered items={PRINCIPLES} />
      </ProjectSection>

      <ProjectSection id="foundations" tag="foundations" heading="A Lean, Clean, Peetal Machine">
        <Prose>
          <p>
            v0.0.4 drops styles entirely for variables in three tiers: hidden primitives, semantic colours, and
            component tokens on top. The brand moved from navy and yellow to ojas violet (#4100CF) and agni orange
            (#FF7700).
          </p>
        </Prose>
        <Stats
          items={[
            { value: "680", label: "Tokens, 6 Collections" },
            { value: "333", label: "Base Primitive Tokens" },
            { value: "100%", label: "Tokens Scoped" },
            { value: "10", label: "Unified Indian Scripts" },
          ]}
        />
        <GrowMedia
          media={{
            label: "Colour ramps",
            src: "/media/peetal/colour-ramps-crop.png",
            aspect: 700 / 463,
            alt: "Peetal colour ramps: primary, secondary, success and error, each with steps 50 to 900 and alpha steps",
          }}
        />
        <Prose>
          <p>Eight hues, each with a branded name and a job:</p>
        </Prose>
        <Bullets items={HUES} />
        <Prose>
          <p>
            The ramps were built in OKLCH with manual HSB and LCH adjustments, weighing the 9-step Tailwind /
            Refactoring UI method against the 7-step data and accordion method for testing and iterations.
          </p>
          <p>Every ramp step has a stated role: 500 is the base, 600 hover, 700 active.</p>
        </Prose>
        <Figure
          src="/media/peetal/type-scale-responsive.ref.png"
          width={2592}
          height={4988}
          alt="Peetal responsive type styles: display, heading and body sizes on small and large screens"
        />
        <Prose>
          <p>
            Type runs on Anek across ten scripts, with Instrument Serif for display. Font sizes switch through Web
            and Mobile modes: display runs 80 to 48 on large screens and 48 to 34 on small, body 10 to 18 and 10 to
            16.
          </p>
        </Prose>
        <GrowMedia
          media={{
            label: "Elevation",
            src: "/media/peetal/elevation.png",
            aspect: 1216 / 759,
            alt: "Peetal elevation tokens: low, mid and high raised shadows",
          }}
        />
      </ProjectSection>

      <ProjectSection id="components" tag="components" heading="The Button, documented end to end.">
        <Prose>
          <p>
            One component carries the system&rsquo;s whole grammar. The built set has 160 variants: 4 layouts × 5
            sizes × 2 padding types × 4 states, with every padding, gap, stroke, fill and radius bound to a token.
          </p>
        </Prose>
        <Figure
          src="/media/peetal/documentaion.png"
          width={2856}
          height={11152}
          alt="Button documentation: anatomy, sizes, padding, corner smoothing, container types, states, colours, icon buttons and links, with key = value captions"
        />
        <Bullets items={BUTTON_RULES} />
        <GrowMedia
          media={{
            label: "Button board",
            src: "/media/peetal/button-primary-board.png",
            aspect: 1400 / 941,
            alt: "Button brand primary fill: 160 variants across size, padding, layout and state",
          }}
        />
        <Prose>
          <p>
            Every colour intent repeats the same structure and swaps only its tokens, so the next intent is a token
            set, not a redesign.
          </p>
        </Prose>
      </ProjectSection>

      <ProjectSection id="code" tag="handoff" heading="Migrating to Storybook">
        <Prose>
          <p>
            The Storybook pilot runs on React and Storybook 10: four components (Alert, InteractiveInput,
            Scrollbar, Ticker), 32 stories and 122 tokens pulled from the Figma variables through the Figma MCP.
          </p>
        </Prose>
        <Bullets items={STORYBOOK} />
        <GrowMedia media={{ label: "Storybook" }} />
      </ProjectSection>

      <ProjectSection id="tooling" tag="tooling & ai" heading="Prototypes that developers build from.">
        <Prose>
          <p>
            Netra, a coded prototype of the purchase journey, is the UI/UX source of truth at handoff: 127 commits,
            every one co-authored with Claude, and 99 files that cite 167 Figma node IDs. Peetal&rsquo;s inputs,
            checkboxes and selects were rebuilt there straight from their Figma nodes.
          </p>
          <p>
            The Figma file speaks to agents too: handover labels are marked to be skipped when an agent reads the
            design context, so only the real spec is read.
          </p>
          <p>
            NetraBot studio grew out of the same work: a parametric mascot tool with 78 expressions, 56 animations,
            a timeline and JSON export.
          </p>
        </Prose>
        {/* Ruled cells, as in Netra's Key Takeaways: the rules are the list's colour through 1px gaps. */}
        <ul className="grid gap-px border-y border-rule bg-rule sm:grid-cols-2">
          {LIVE.map((l) => (
            <li key={l.href} className="bg-bg">
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-2 px-4 py-8 transition-colors hover:bg-surface sm:px-6"
              >
                <span className="text-12 uppercase leading-none tracking-[0.01em] text-faint">{l.meta}</span>
                <span className="text-18 leading-6 tracking-[-0.015em] text-ink">{l.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </ProjectSection>

      <ProjectSection id="governance" tag="governance" heading="How it’s made, changed and checked.">
        <Prose>
          <p>
            I oversee how Peetal is made and updated, handle the change logs, and use Claude for AI-assisted work.
          </p>
          <p>
            Every component page follows one documentation template written for engineers: anatomy, states, a token
            reference and notes for engineers, with real values, such as a 240px tooltip and a 300ms show, 100ms
            hide.
          </p>
        </Prose>
        <Numbered items={DONE_STAGES} />
        <Prose>
          <p>
            A page only turns 🟢 when all three stages pass. Being honest about the gaps is part of it: a few docs
            still describe sizes and states the components don&rsquo;t have yet, and closing that drift is the
            current pass.
          </p>
        </Prose>
      </ProjectSection>

      <ProjectSection id="impact" tag="impact" heading="Weeks became days.">
        <Prose>
          <p>
            A first version on dev used to take about 6 weeks. With Netra prototypes as the UI/UX source of truth at
            handoff, it now takes days.
          </p>
        </Prose>
        <Stats
          items={[
            { value: "6 wks → x days", label: "to a first version on dev" },
            { value: "x", label: "screens built on Peetal" },
            { value: "x%", label: "fewer UI fixes after handoff" },
            { value: "x", label: "designers and developers using it" },
          ]}
        />
      </ProjectSection>

      <ProjectSection id="next" tag="what’s next" heading="Still building.">
        <Bullets items={NEXT} />
        <Prose>
          <p>
            Back to the case study:{" "}
            <Link
              href="/draft"
              className="text-ink underline decoration-from-font underline-offset-2 transition-colors hover:text-faint"
            >
              BimaKavach, 2023 - present
            </Link>
            .
          </p>
        </Prose>
      </ProjectSection>

      <NextProject after="peetal" />
    </article>
  );
}
