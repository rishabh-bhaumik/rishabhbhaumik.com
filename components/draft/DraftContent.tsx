import Image from "next/image";
import Link from "next/link";
import "@/components/bk/anek.css";
import PivotTimeline, { type PivotStep } from "./PivotTimeline";
import ScrollSlides, { type ScrollSlide } from "./ScrollSlides";
import { BODY, CARD, Stats, Tag, rail, type Stat } from "./ui";

// First-draft build of the Figma case-study page (Peetal DSL, node 8627:5701),
// section by section. Colours are theme tokens (Figma values in dark), so the page
// follows light mode; the exported images stay as rendered.

/** 005.1 - 005.3: media left, copy right, one at a time (ScrollSlides). Copy tops align with the media. */
const FORM_ROWS: ScrollSlide[] = [
  {
    tag: "005.1",
    src: "/media/draft/forms-chips.png",
    width: 906,
    height: 528,
    alt: "Two Share Your Business Details forms: suggestion chips, and the Other chip opening a search field",
    copy: (
      <>
        <p>Two examples of simplifying forms:</p>
        <p>
          1. Using Data to showcase the most used options as Suggestion Chips - and allowing single
          select only if the user fits none of the most commonly used options and
        </p>
        <p>
          2. Using Visual Cues in Binary Fields in order to increase the ability to scan the form
          without increasing cognitive load.
        </p>
      </>
    ),
  },
  {
    tag: "005.2",
    src: "/media/draft/forms-modal.png",
    width: 906,
    height: 528,
    alt: "Confirm Last Few Details modal over the loading quote page",
    copy: (
      <p>
        By showcasing a loading state of the Quote Page and asking no brainer questions in the form
        of a modal - we were able to reduce drop-offs, as the user is now more incentivized to
        complete the process.
      </p>
    ),
  },
  {
    tag: "005.3",
    src: "/media/draft/forms-otp.png",
    width: 906,
    height: 528,
    alt: "Verify Your Number OTP sheet on an iPhone",
    // Draft copy (005.3 had 005.2's text); the user to confirm or replace.
    copy: (
      <p>
        Verification comes last, once the quotes are already waiting - the sheet says so. Asking for
        the OTP at that point gives the user a reason to finish, not a reason to leave.
      </p>
    ),
  },
];

/** 006.1 - 006.4: one at a time, swapped by scrolling (FlowSlides). */
const FLOW_SLIDES: ScrollSlide[] = [
  {
    tag: "006.1",
    src: "/media/draft/flow-1.png",
    width: 1464,
    height: 850,
    alt: "Quote page on desktop and mobile: a feed of insurer cards with filters and compare",
    copy:
      "The Quote Page acts as a feed - filtering and sorting coverage offerings based on the user’s needs. Each Card contains further details and available quotes can be compared.",
  },
  {
    tag: "006.2",
    src: "/media/draft/flow-2.png",
    width: 1464,
    height: 850,
    alt: "Primary Details step on mobile and desktop, with a stepper and the price beside the button",
    copy:
      "Steppers help assess the user in how much or little work is pending. The Price is always shown next to the Button to encourage Further Movement and Constant Action.",
  },
  {
    tag: "006.3",
    src: "/media/draft/flow-3.png",
    width: 1464,
    height: 850,
    alt: "Four Complete KYC screens showing tool-tip cues for each state",
    copy:
      "Contextual Cues via Tool Tips help reduce action, and thus increase movement in the flow.",
  },
  {
    tag: "006.4",
    src: "/media/draft/flow-4.png",
    width: 1464,
    height: 850,
    alt: "Personal assistance page and a loading screen that bridge a failed insurer API",
    copy:
      "Insurance APIs are wonky - at any step should the API fail in anticipation of or during payment - contingency loaders and screens appear to bridge gaps.",
  },
];

/**
 * At-a-glance facts beside the intro, in two columns: Role, Timeline and Scope
 * on the left; Tools and Team on the right.
 */
const DETAILS: { label: string; values: string[] }[][] = [
  [
    { label: "Role", values: ["Founding Designer"] },
    { label: "Timeline", values: ["2023 - present"] },
    { label: "Scope", values: ["Product", "Brand & Identity", "Design Thinking", "Tools & Systems"] },
  ],
  [
    { label: "Tools", values: ["Figma", "Claude Code", "Storybook"] },
    {
      label: "Team",
      values: [
        "Tejas Jain (Founder & CEO)",
        "Gopi Solia (Brand & Experience)",
        "Pradeep Ragiri (Product & Technology)",
        "Saharsh Jain (Product)",
        "Vishnu Gupta (Engineering)",
        "Rohit Mishra (Engineering)",
      ],
    },
  ],
];

/** Companion pieces to hand over alongside the case study. */
const DEEPER: { title: string; body: string; href: string; meta: string }[] = [
  {
    title: "Peetal design system",
    body: "Tokens, documentation and the Storybook pilot behind every screen above.",
    href: "/peetal",
    meta: "Deep-dive",
  },
  {
    title: "NetraBot studio",
    body: "A parametric mascot tool: 78 expressions, 56 animations, timeline and JSON export.",
    href: "https://netra-checkout-concepts.vercel.app/netrabot",
    meta: "Live tool ↗",
  },
  {
    title: "Netra: D&O journey",
    body: "The coded prototype that serves as the UI/UX source of truth at developer handoff.",
    href: "https://netra-checkout-concepts.vercel.app/directors-and-officers-insurance",
    meta: "Live prototype ↗",
  },
];

/** Outcome figures per section. "x" marks numbers still to come. */
const OUTCOMES: Record<string, Stat[]> = {
  story: [
    { value: "4.7×", label: "User Base Growth" },
    { value: "25%", label: "Increase in Online Checkouts" },
    { value: "8", label: "Insurers Quoting Live" },
  ],
  problem: [
    { value: "₹2 Lakh", label: "Highest Online Checkout Value" },
    { value: "38%", label: "Products at Online Checkout" },
    { value: "2,400", label: "Pincodes Reached Across India" },
  ],
  typography: [
    { value: "10", label: "Indian Scripts in One Type Family" },
    { value: "70%", label: "Reduction in Type Tokens" },
  ],
  designSystems: [
    { value: "680", label: "Tokens Scoped" },
    { value: "86%", label: "Reduction in Development Timelines" },
  ],
  forms: [
    { value: "x%", label: "fewer drop-offs on the quote form" },
    { value: "<2 Mins", label: "to a first quote" },
  ],
  flows: [
    { value: "8%", label: "Increase in Checkout Completion" },
    { value: "<2 Mins", label: "From Quote to Policy Issuance Online" },
    { value: "15%", label: "Recoveries from Failure Paths" },
  ],
};

/** 002's timeline: the homepage at each turn. Add `screen` to fill a step's phone. */
const PIVOT_STEPS: PivotStep[] = [
  {
    date: "03.23",
    title: "Minimum Viable Product",
    summary: "Aayra as Mascot, Tech Founder First, Recommendation Engine",
  },
  {
    date: "10.23",
    title: "The Gentle Nudge",
    summary: "Dilip Joshi as Mascot, SME Inclusive, Quote Generation Available",
  },
  {
    date: "03.25",
    title: "Platform as a Pivot",
    summary: "No Mascot, Marketplace positioning, Online Checkout",
  },
  {
    date: "06.26",
    title: "Orienting the Axis",
    summary: "Re-Branding, Online Checkout, Underwriting Intelligence.",
  },
];

/** One welcome line per script, set in the matching Anek face (zigzag alignment, as designed). */
const SCRIPT_LINES: { text: string; lang: string; font: string; right?: boolean; small?: boolean }[] = [
  { text: "Welcome, Emerging India!", lang: "en", font: "Anek Latin", right: true },
  { text: "স্বাগতম, উদীয়মান ভারত!", lang: "bn", font: "Anek Bangla" },
  { text: "उभरते भारत का स्वागत है!", lang: "hi", font: "Anek Devanagari", right: true },
  { text: "સ્વાગત છે, ઉભરતા ભારત!", lang: "gu", font: "Anek Gujarati" },
  { text: "ਜੀ ਆਇਆਂ ਨੂੰ, ਉੱਭਰ ਰਹੇ ਭਾਰਤ!", lang: "pa", font: "Anek Gurmukhi", right: true },
  { text: "ಉದಯೋನ್ಮುಖ ಭಾರತಕ್ಕೆ ಸ್ವಾಗತ!", lang: "kn", font: "Anek Kannada" },
  { text: "സ്വാഗതം, വളർന്നുവരുന്ന ഇന്ത്യ!", lang: "ml", font: "Anek Malayalam", right: true },
  { text: "ସ୍ୱାଗତ, ଉଦୀୟମାନ ଭାରତ!", lang: "or", font: "Anek Odia" },
  { text: "வருக, வளர்ந்து வரும் இந்தியா!", lang: "ta", font: "Anek Tamil", right: true },
  { text: "అభివృద్ధి చెందుతున్న భారతదేశానికి స్వాగతం!", lang: "te", font: "Anek Telugu", small: true },
];

const ROW = "flex flex-col gap-6 px-6";

function SectionHead({
  tag,
  title,
  children,
  className = "",
}: {
  tag: string;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-5 px-6 pb-6 ${className}`}>
      <div className="flex flex-col gap-4">
        <Tag>{tag}</Tag>
        <h2 className="py-[2px] text-[36px] font-normal leading-none text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function DraftContent() {
  return (
    <main className="flex w-full min-w-0 flex-col gap-20">
      {/* Cover + intro */}
      <section {...rail("context", "000. For Your Consideration")} className="flex scroll-mt-16 flex-col items-center gap-6 px-6 py-[60px]">
        {/* Cover media slot (showreel to come); capped at 1200px, centred. */}
        <div className="relative aspect-[1512/850] w-full max-w-[1200px] bg-surface">
          <p className="absolute left-1/2 top-[calc(50%-10.01px)] -translate-x-1/2 whitespace-nowrap text-center text-12 leading-[normal] text-faint">
            MEDIA INCOMING...
          </p>
        </div>
        {/* Title and intro hidden for now; the h1 stays for screen readers. */}
        <div className="sr-only">
          <h1 className="text-[40px] font-normal leading-[1.3] text-ink">For Your Consideration</h1>
          <p hidden className={`${BODY} max-w-[700px]`}>
            As a thespian &amp; film student who’s started his career in video editing &amp;
            creative direction, I have seen how the power of stories help shape experiences. A
            Designer based out of Bengaluru, India, Hello World - I’m Rishabh.
          </p>
        </div>
      </section>

      {/* 001 */}
      <section {...rail("story", "001. How did my story start?")} className="scroll-mt-16 px-6 py-4">
        <div className="flex flex-col justify-between gap-10 px-6 lg:flex-row">
          <div className="flex flex-col gap-4 lg:w-[480px] lg:shrink-0">
            <Tag>001.</Tag>
            <h2 className="py-[2px] text-[36px] font-normal leading-none text-ink">
              How did my story start?
            </h2>
            <div className={`${BODY} mt-6`}>
              <p>
                I was hired at <b className="font-normal text-ink">BimaKavach</b> in{" "}
                <b className="font-normal text-ink">2023</b> when the company was nascent, and was
                still a <b className="font-normal text-ink">simple recommendation engine</b>.
              </p>
              <p className="mt-[1.7em]">
                Since then, the company has been able to{" "}
                <b className="font-normal text-ink">display live quotes</b> enabling user-product
                discovery, and has recently{" "}
                <b className="font-normal text-ink">enabled payments</b> for immediate online
                purchase, and has{" "}
                <b className="font-normal text-ink">grown its user base 4.7×*</b>
              </p>
            </div>
            {/* Footnote for the 4.7×. On desktop it sits just above the stats row's divider
                opposite: lifted by that row's height (hairline + 24px + 32px figure + 8px +
                16.8px label) plus 4px. */}
            <p className="text-12 leading-[1.5] text-muted lg:mt-auto lg:mb-[calc(0.5px+1.5rem+32px+0.5rem+16.8px+4px)]">
              *from 800 during March 2023 to around 3,760 by October 2025.
            </p>
          </div>
          <div className="flex flex-col gap-20 lg:w-[480px] lg:shrink-0">
            {/* Project facts, above the outcomes. */}
            {/* Second column (Tools, Team) hugs its longest line from sm up; the first takes the rest. */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-[1fr_max-content]">
              {DETAILS.map((cell) => (
                <div key={cell[0].label} className="flex flex-col gap-6">
                  {cell.map((d) => (
                    <div key={d.label} className="flex flex-col gap-2">
                      <dt className="text-12 leading-[1.6] font-medium text-ink">{d.label}</dt>
                      <dd className="flex flex-col gap-1 text-12 leading-[1.6] text-muted">
                        {d.values.map((v) => (
                          <span key={v} className="sm:whitespace-nowrap">
                            {v}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </div>
              ))}
            </dl>
            <Stats items={OUTCOMES.story} />
          </div>
        </div>
      </section>

      {/* 002 · The Pivot and the Problem */}
      <section {...rail("problem", "002. The Pivot and the Problem")} className={`scroll-mt-16 ${ROW}`}>
        <SectionHead tag="002." title="The Pivot and the Problem">
          <p className={BODY}>
            I started off as a Senior Designer - and had to tackle challenges outside the Product’s
            design including the Visual Language and Branding of the company. This helped in
            pivoting BimaKavach from a Recommendation Engine for urban startups to an SME
            inclusive, Insurtech Broking Firm.
          </p>
        </SectionHead>
        <PivotTimeline steps={PIVOT_STEPS} />
        {/* Outcomes close the section, inset like the head above. */}
        <div className="px-6">
          <Stats items={OUTCOMES.problem} />
        </div>
      </section>

      {/* 003 Typography and 004 Design Systems: copy left, media right; one block, no gap between */}
      <div className="flex flex-col">
        <section {...rail("typography", "003. Solutions - Typography")} className="scroll-mt-16 px-6 py-[60px]">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <SectionHead tag="003." title={"Solutions -\u00a0Typography"} className="min-w-0 justify-center lg:max-w-[528px]">
              <div className={`${BODY} flex flex-col gap-[1.7em]`}>
                <p>
                  In order to cater to the multicultural hyperlocal nature of Tier 2 &amp; Tier 3
                  Businesses, we started with Foundational Typography. We had decided that Anek
                  Variable would be the obvious typeface of choice.
                </p>
                <p>
                  Anek is a contemporary, multi-script, open-source typeface family created by the
                  Indian foundry Ek Type (in collaboration with Google). It supports multiple Indian
                  scripts (including Devanagari, Tamil, Bengali, etc.) as well as Latin, and it’s
                  offered in a variable font format.
                </p>
              </div>
              <Stats items={OUTCOMES.typography} />
            </SectionHead>
            <div
              className="@container flex aspect-[1464/850] min-w-0 flex-col items-center justify-center lg:mr-6 lg:w-[564px] lg:max-w-[calc(100%-1.5rem)] lg:justify-self-end"
            >
              {/* Sized in container units against a 640px-wide card, so the lines keep
                  their proportions (and fit) at any card width. */}
              <div className="flex w-full flex-col gap-[2.542cqw] tracking-[-0.0391cqw] text-ink">
                {SCRIPT_LINES.map((l) => (
                  <p
                    key={l.lang}
                    lang={l.lang}
                    className={`${l.small ? "text-[2.346cqw]" : "text-[2.607cqw]"} leading-[3.129cqw] ${
                      l.right ? "text-right" : ""
                    }`}
                    style={{
                      fontFamily: `"${l.font}"`,
                      fontVariationSettings: '"wdth" 100',
                      fontFeatureSettings: '"zero" 1, "kern" 0, "liga" 0, "dlig" 1',
                    }}
                  >
                    {l.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section {...rail("design-systems", "004. Solutions - Design Systems")} className="scroll-mt-16 px-6 py-[60px]">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <SectionHead tag="004." title={"Solutions -\u00a0Design Systems"} className="min-w-0 justify-center lg:max-w-[528px]">
              <p className={BODY}>
                Scaling Anek to work for Discovery, Conversation and Retention, we had quickly
                developed a modern Design System Library, aptly called Peetal. Peetal is built
                completely in-house, with whiffs of Blade and UX4G - taking cues from Blade’s
                Collaborative Structure and Usefulness to Developers, and UX4G’s scalability and
                simplicity.
              </p>
              <Link
                href="/peetal"
                className="w-fit text-14 text-ink underline decoration-ink/60 underline-offset-[2px] transition-colors hover:decoration-ink"
              >
                More on Peetal
              </Link>
              <Stats items={OUTCOMES.designSystems} />
            </SectionHead>
            <div className={`min-w-0 lg:mr-6 lg:w-[564px] lg:max-w-[calc(100%-1.5rem)] lg:justify-self-end ${CARD}`}>
              <Image
                src="/media/draft/design-systems.png"
                alt="Peetal design system: colour scales, borders, buttons, elevation"
                width={720}
                height={418}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="block h-auto w-full"
              />
            </div>
          </div>
        </section>
      </div>

      {/* 005 · Forms & Modals */}
      <section
        {...rail("forms", "005. Solutions - Forms & Modals for Discovery & Quote Generation")}
        className={`scroll-mt-16 ${ROW}`}>
        <SectionHead tag="005." title={"Solutions -\u00a0Forms & Modals for Discovery & Quote Generation"}>
          <p className={BODY}>
            Redesigning Forms &amp; Modals in order to boost discovery, expedite Quote Generation,
            and build intuitive journeys towards Quote Generation was the next task.
          </p>
          <Stats items={OUTCOMES.forms} />
        </SectionHead>
        <div className={`flex h-[850px] flex-col items-center justify-end bg-white ${CARD}`}>
          <Image
            src="/media/draft/quote-form-phone.png"
            alt="BimaKavach's Get Quotes in a Few Steps form on an iPhone"
            width={449}
            height={720}
            className="block h-[720px] w-[448.73px] max-w-none"
          />
        </div>
      </section>

      {/* 005.1 - 005.3: pinned, one at a time */}
      <ScrollSlides slides={FORM_ROWS} idPrefix="forms" layout="row" />

      {/* 006 · Flows - Checkout & Payment: copy left, flowchart right */}
      <section
        {...rail("flows", "006. Flows - Checkout & Payment")}
        className={`scroll-mt-16 ${ROW}`}
      >
        <div className="overflow-hidden rounded-[10.5px] border-[0.5px] border-ink/25">
          <Image
            src="/media/draft/checkout-flow.png"
            alt="Checkout flow: the quote page branches into the payment flow, post-payment states and offline fallbacks"
            width={1464}
            height={505}
            sizes="(min-width: 1512px) 1464px, 100vw"
            className="block h-auto w-full"
          />
        </div>
        <SectionHead
          tag="006."
          title={
            <>
              Flows - Checkout
              <br />& Payment
            </>
          }
        >
          <p className={BODY}>
            Massive diversions and permutations from the quote page exists and change per product -
            meaning that the journey must seem consistent and concise for any user
          </p>
        </SectionHead>
        {/* Outcomes close the section, inset like the head above. */}
        <div className="px-6">
          <Stats items={OUTCOMES.flows} />
        </div>
      </section>

      {/* 006.1 - 006.4: pinned, one slide at a time */}
      <ScrollSlides slides={FLOW_SLIDES} idPrefix="flows" layout="stack" />

      {/* Companion links: the same set that goes out with the resume */}
      <section {...rail("deeper", "Go deeper")} className="flex scroll-mt-16 flex-col gap-6 px-6 pb-20">
        <h2 className="px-6 text-[36px] font-normal leading-none text-ink">Go deeper</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {DEEPER.map((d) => {
            const external = d.href.startsWith("http");
            return (
              <Link
                key={d.title}
                href={d.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="group flex flex-col gap-3 rounded-xl p-6 ring-[0.5px] ring-border transition-colors hover:bg-surface/40"
              >
                <span className="text-12 uppercase tracking-[0.6px] text-faint">{d.meta}</span>
                <span className="text-20 leading-snug text-ink">{d.title}</span>
                <span className={BODY}>{d.body}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
