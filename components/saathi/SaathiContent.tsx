import Sheet from "@/components/home/Sheet";
import TagMarquee from "@/components/home/TagMarquee";
import GrowMedia from "@/components/project/GrowMedia";
import NextProject from "@/components/project/NextProject";
import { Callout, Numbered, ProjectHero, ProjectSection, Prose, Subhead } from "@/components/project/parts";
import { PROJECTS, SELECTED_WORK } from "@/data/site";

/**
 * Bima Saathi (behind PasswordGate), laid out like the BimaNetra project on the ruled
 * sheet: the opening and band of facts, the cover, then tagged sections with media
 * frames (GrowMedia) and numbered points, and the banner to the next project.
 * Composition is final; images and most copy are WIP, so frames show what goes there
 * and body text is lorem. Real media drops into /public/media/saathi/.
 */

const LOREM =
  "Cras mattis consectetur purus sit amet fermentum. Nullam quis risus eget urna mollis ornare vel eu leo. Aenean lacinia bibendum nulla sed consectetur, vestibulum id ligula porta felis euismod semper.";
const LOREM_SHORT = "Nullam quis risus eget urna mollis ornare vel eu leo. Donec ullamcorper nulla non metus auctor.";

/** Its card on home: the headline and tags come from there. */
const WORK = SELECTED_WORK.find((w) => w.slug === "bima-saathi")!;
/** The work gallery's cover (a phone on a transparent background). */
const COVER = PROJECTS.find((p) => p.slug === "bima-saathi")!.media;

const MARQUEE = [
  "role",
  "product designer",
  "timeline",
  "Oct - Dec 2024",
  "team",
  "1 PM, 1 Engineer, 1 Designer",
  "skills",
  "Product Design, User Research",
];

const SOLUTION_ROWS = [
  "Choose from a range of offerings beyond Motor, Life and Health.",
  "Onboard clients and manage their policy issuance, servicing, and renewal.",
  "Access payouts at all times with transparency.",
];

const PAIN_POINTS = [
  {
    title: "Agents didn't know commercial insurance was something they could sell.",
    body: "Most had built their careers on life, health and motor. Business cover felt like broker territory, so even agents whose clients ran shops and factories never brought it up.",
  },
  {
    title: "Lead agents had no way to track their sub-agents.",
    body: "Many run a small team of sub-agents under them. With no view of who was quoting, who had sold and who was stuck, they managed by phone calls and chat threads, and leads went cold.",
  },
];

export default function SaathiContent() {
  return (
    <Sheet>
      <article className="flex flex-col">
        <ProjectHero
          href="/bima-saathi"
          tags={[WORK.year, WORK.kind]}
          title={WORK.heading}
          intro="Saathi is India’s smartest business insurance partner app, allowing BimaKavach to offer insurance products beyond life, health, and motor to partners, who can reach customers even we normally can’t."
        />
        <TagMarquee items={MARQUEE} />
        <div className="pt-20">
          <GrowMedia
            media={{
              label: "Bima Saathi",
              src: COVER,
              fit: "contain",
              alt: "Bima Saathi's Submit a Claim screen on a phone",
            }}
          />
        </div>

        <ProjectSection
          id="overview"
          tag="overview"
          heading="What if we put business insurance in the hands of the agents India already trusts?"
        >
          <Prose>
            <p>
              Across India, insurance agents sell life, health and motor every day, but business insurance has
              always been out of their reach. It&rsquo;s complex to quote, slow to issue and hard to explain to a
              client. That gap is where Saathi started. The agents already had the relationships; they just
              didn&rsquo;t have the products.
            </p>
          </Prose>
        </ProjectSection>

        <ProjectSection id="solution" tag="solution" heading="One product, three moments that made it stick.">
          <Numbered items={SOLUTION_ROWS.map((title) => ({ title }))} />
          {SOLUTION_ROWS.map((label) => (
            <GrowMedia key={label} media={{ label }} />
          ))}
        </ProjectSection>

        <ProjectSection id="outcomes" tag="outcomes" heading="Outcomes">
          <Prose>
            <p>{LOREM_SHORT}</p>
          </Prose>
          <GrowMedia media={{ label: "Outcomes" }} />
        </ProjectSection>

        <ProjectSection
          id="observations"
          tag="initial observations"
          heading="What we noticed before we designed anything."
        >
          <Prose>
            <p>{LOREM}</p>
          </Prose>
        </ProjectSection>

        <ProjectSection id="pain-points" tag="pain points" heading="Pain Points">
          <Numbered items={PAIN_POINTS} />
          <Callout>Key insight: the fastest path to trust was making the next action obvious.</Callout>
          <Prose>
            <p>{LOREM_SHORT}</p>
          </Prose>
        </ProjectSection>

        <ProjectSection id="research" tag="market research" heading="Market Research">
          <GrowMedia media={{ label: "Market research" }} />
          <Numbered
            items={["Channel one", "Channel two", "Channel three"].map((title) => ({ title, body: LOREM_SHORT }))}
          />
          <Callout>
            How might we make buying business insurance feel intuitive, convenient, and worth the agent&rsquo;s
            time?
          </Callout>
        </ProjectSection>

        <ProjectSection
          id="competitors"
          tag="competitor research"
          heading="Existing interfaces were complex and not built for agents."
        >
          <GrowMedia media={{ label: "Competitor interfaces" }} />
          <Prose>
            <p>{LOREM}</p>
          </Prose>
        </ProjectSection>

        <ProjectSection
          id="process"
          tag="design process"
          heading="A familiar, uncluttered surface with bespoke moments."
        >
          <Prose>
            <p>{LOREM}</p>
          </Prose>
          <GrowMedia media={{ label: "Design process" }} />
          <Prose>
            <p>{LOREM_SHORT}</p>
          </Prose>
          <GrowMedia media={{ label: "Design process" }} />
          <Prose>
            <Subhead>What if we brought in a guided simulation?</Subhead>
            <p>{LOREM}</p>
          </Prose>
          <GrowMedia media={{ label: "Guided simulation" }} />
          <Prose>
            <p>{LOREM_SHORT}</p>
          </Prose>
        </ProjectSection>

        <ProjectSection id="final" tag="final designs" heading="A simple, familiar, and clean interface.">
          <Prose>
            <p>{LOREM_SHORT}</p>
          </Prose>
          <GrowMedia media={{ label: "Final designs" }} />
        </ProjectSection>

        <ProjectSection id="reflection" tag="reflection" heading="What I learned">
          <Numbered
            items={["Keep cutting it down to the MLP.", "User research is not enough."].map((title) => ({
              title,
              body: LOREM,
            }))}
          />
        </ProjectSection>

        <NextProject after="bima-saathi" />
      </article>
    </Sheet>
  );
}
