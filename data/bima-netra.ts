/**
 * The BimaNetra project page (Figma 8818:32660): its media, scenes and original copy, in page
 * order. /netra2 shows this copy; /netra shows the plain-language rewrite in
 * data/bima-netra-2.ts, which builds on this file. Media slots carry a `label` (what goes there, shown as a placeholder until a
 * file is added) and, once ready, `src` (an image, or an .mp4 with a `poster`).
 */
import type { Media } from "@/components/project/GrowMedia";
import type { RichText } from "@/components/project/parts";

/** A frame that may hold one of the page's live scenes instead of a file. */
export type NetraMedia = Media & { readonly scene?: "quote" | "whiteboard" | "routes" | "research" | "mobile" };

/** The page's copy with its literal strings loosened to `string`, so the rewrite (data/bima-netra-2.ts, at /netra) can share the shape. */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends { readonly label: string; readonly text: string }
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : // A media frame: any of Media's fields (a caption, say), whichever this page set.
          T extends { readonly label: string }
          ? Media & { readonly scene?: string }
          : T extends object
            ? { readonly [K in keyof T]: Widen<T[K]> }
            : T;
export type NetraCopy = Widen<typeof BIMA_NETRA> & {
  /** A closing paragraph under Impact (used by the rewrite at /netra). */
  readonly closing?: string;
};

export const BIMA_NETRA = {
  tags: ["2026", "ai saas", "in staging"],
  /** The headline, broken as in Figma on wide screens. */
  title: ["BimaNetra™: India’s first agentic infrastructure solution", "for a 200 year old problem"],
  intro: "BimaNetra™ is how BimaKavach can price risk, underwrite smartly, and surface gaps in their business.",
  /** The band under the opening: label, value, label, value… */
  marquee: [
    "role",
    "product designer",
    "timeline",
    "2 months",
    "team",
    "1 Designer, 1 PM, 3 engineers",
    "tools",
    "figma, Figjam, claude co-work, claude Code",
  ],

  // Drawn live by components/netra/NetraSplash; the alt describes what it plays.
  splash: {
    label: "Splash video: Netra in action",
    alt: "BimaKavach's curtain lifts on the D&O insurance page. A pointer types Pepe into the company field, picks Pepe Jeans Innerfashion Private Limited from the MCA records, hovers Get My Quote, then clicks Know More, and the curtain falls back to the logo.",
  } satisfies Media,
  overview: {
    tag: "overview",
    lead: "Smart Underwriting, engineered. profiling, quote generation, and checkout, in a matter of minutes",
    body: [
      "BimaNetra™ lets businesses generate comprehensive insurance quotes without filling forms. I had two jobs here: revisit the existing checkout flow ",
      { text: "post rebranding", href: "/bimakavach-identity" },
      " to investigate lead generation and drop-offs, and create the new probabilistic based journey super intuitive for first-time users.",
    ] satisfies RichText,
  },

  context: {
    // The old journey's drop-offs (NetraThesis, Figma 8903:31127).
    media: {
      label: "Core Thesis and Vision: Profiling, QUOTE request, and checkout would not scale in a deterministic model",
      alt: "The old journey: landing page and form, quote page, checkout. 20% of customers left at the form (\"this form is long and complicated\") and 35% at the quote page (\"I dont know what to pick\"). Core thesis: deterministic flows ask every business the same questions; an agentic flow asks only the ones that matter, and does the rest for them. Probabilistic models can also infer from data, behaviour and expectations.",
    } satisfies Media,
    tag: "context",
    heading: "Context",
    rows: [
      {
        label: "Overview",
        text: "BimaKavach is an IRDAI-regulated insurance broker designed to help startups, micro, small, and medium enterprises (MSMEs), and growing businesses understand, compare, purchase, and manage business insurance.",
      },
      {
        label: "My Role",
        text: "Product Designer. Owned end-to-end product design, from research through handoff, partnering closely with engineering and PM.",
      },
      { label: "Timeline", text: "60 Days, from the problem statement through v1 launch on Web." },
    ],
  },

  brief: {
    // Five papers, one at a time (NetraResearch, Figma 8927:30390); copy in RESEARCH_PAPERS below.
    media: {
      label: "Some research papers that can reverse engineer decisions taken on BimaNetra’s final outcome",
      scene: "research",
      alt: "The research behind Netra: five papers, one at a time, each with its first page, what it shaped in Netra and three findings",
    } satisfies NetraMedia,
    tag: "context",
    heading: "Project Brief",
    intro:
      "BimaKavach sells business insurance to startups and MSMEs. Before BimaNetra, a quote began with a proposal form: a founder describing their own company, line by line, before an insurer would name a price.",
    need: "We needed a way to profile a business from what the public record already says about it, so a founder types one name and reaches real quotes in minutes.",
    challenge: "The Challenge: Designing trust into a system that guesses before it asks",
    constraint:
      "It had to hold up in all three cases (Netra finds the company, makes a best guess, or finds nothing), show its working while it searches, and be built from Peetal in the new identity, so three engineers could ship it in 60 days.",
  },

  /** The two frames between the brief and the execution notes. */
  thesis: [
    // The whiteboard photo over the room it was taken in (NetraWhiteboard, Figma 8913:30316).
    {
      label: "Photos of whiteboarding!!!!!!!!",
      scene: "whiteboard",
      alt: "The whiteboard from our planning sessions: the product page, eleven questions, the quote page, KYC and payment sketched out by hand, held over a photo of the room it was drawn in",
    },
    // Figma 8913:30378.
    {
      label: "Preliminary sketches (gold quote!!!!!)",
      src: "/media/netra/sketches.webp",
      alt: "A whiteboard of six routes from a company name: the agent fails, gets a fuzzy match or passes, then fills or validates, a modal with or without a nudge, and the quote, the last pre-underwritten",
    },
  ] satisfies NetraMedia[],

  execution: {
    tag: "execution",
    heading: "How we shipped it",
    /** One paragraph; each entry starts a new line. */
    body: [
      "Research shaped the architecture: one company name routes a business into three cases, verified, guessed or not found.",
      "Over 60 days and 139 commits we built a coded prototype on Peetal’s fields, tracing each screen to Figma. We cut the questions from twelve to ten, then audited every case against Nielsen’s heuristics before handoff.",
    ],
    media: [
      // BimaNetra's quote modal filling itself in (NetraQuoteModal).
      {
        label: "Dither Transition on a Quote Card",
        scene: "quote",
        alt: "BimaNetra's quote modal filling itself in: Profile arrives filled and is confirmed, then Business and Risk each load and fill their own answers, ending on Get Instant Quotes",
      },
      // Case B on a phone (NetraMobileFlow): Sabyasachi, from one name to quotes.
      {
        label: "Onboarding flow - Mobile Screen of Netra Folder Going up and down!!!!!",
        scene: "mobile",
        alt: "Netra on a phone. A founder types Sabyasachi, picks Sabyasachi Calcutta from the MCA records and taps Get My Quote. The quote sheet rises: Netra introduces itself, the founder types their name, phone and email, then Netra reads up on the business and guesses two answers, the founder sets the business type to Retail & Wholesale and picks a turnover, Netra suggests ₹10 Cr of cover, and the founder answers two questions and gets quotes.",
      },
    ] satisfies NetraMedia[],
  },

  takeaways: {
    tag: "key takeaways",
    heading: "Key Takeaways",
    items: [
      {
        title: "Clarity beats Options",
        body: "Placeholder. Progressive disclosure outperformed a packed dashboard. Showing less up front made people act with more confidence.",
      },
      {
        title: "Trust is in the details",
        body: "Placeholder. Micro-interactions around input, AI built UI calls, and balance in what we offer did more for perceived trust than any marketing copy.",
      },
      {
        title: "Risk the Business. Insurance comes later",
        body: "Placeholder. One timeline across risk profiling, quotes, and policy issuance changed how people thought about their insurance, not just how they viewed it.",
      },
    ],
  },

  gallery: [
    { label: "NetraBot: controls on right and model on left (full!!!)" },
    { label: "Onboarding, case A & B post profile (dual!!)" },
    { label: "Modals: risk score & chatbot (full!!)" },
    { label: "Chatbot feature (dual!!)" },
    { label: "WIP" },
    { label: "WIP" },
    { label: "WIP" },
  ] satisfies Media[],

  impact: {
    tag: "results",
    heading: "Impact",
    stats: [
      { value: "$ 30M.", label: ["Increase in", "Direct Underwriting Authority"] },
      { value: "50%", label: ["Increase in", "Lead Generation"] },
      { value: "67%", label: ["Less Form filing", "during Checkout"] },
      { value: "2", label: ["New Insurers", "Onboarded"] },
    ],
  },

} as const;

/**
 * The research carousel (NetraResearch, Figma 8927:30390): five papers in the order a founder
 * meets their ideas, from Netra searching to the rules over the whole flow. Each `why` is two
 * lines, broken at the \n. Each finding was checked against the paper's own text; first pages
 * are in public/media/netra/papers/<key>.webp.
 */
export const RESEARCH_PAPERS = [
  {
    key: "buell",
    title: "Creating Reciprocal Value Through Operational Transparency",
    authors: "Ryan W. Buell, Tami Kim, Chia-Jung Tsay. Management Science 2017",
    why: "People value work they can see,\nso Netra fills each field while the founder watches.",
    insights: [
      "Watching the work raised its value",
      "Seeing the cook idle added no value",
      "Diners felt a longer wait and valued it more",
    ],
    href: "https://dash.harvard.edu/server/api/core/bitstreams/7312037d-8844-6bd4-e053-0100007fdf3b/content",
  },
  {
    key: "horvitz",
    title: "Principles of Mixed-Initiative User Interfaces",
    authors: "Eric Horvitz. CHI 1999",
    why: "Act when sure, ask when unsure.\nNetra’s three cases come from that rule.",
    insights: [
      "Act when sure, ask when unsure, else wait",
      "Show its guesses and let people edit them",
      "When unsure, do less and get it right",
    ],
    href: "https://erichorvitz.com/chi99horvitz.pdf",
  },
  {
    key: "dietvorst",
    title: "Overcoming Algorithm Aversion",
    authors: "Berkeley J. Dietvorst, Joseph P. Simmons, Cade Massey. Management Science 2018",
    why: "People use models they can edit,\nso every value Netra fills stays editable.",
    insights: [
      "More people chose a model they could edit",
      "People edited less than they were allowed",
      "Editing made people more tolerant of errors",
    ],
    href: "https://marketing.wharton.upenn.edu/wp-content/uploads/2020/07/Dietvorst-Overcoming-Algorithm-Aversion.pdf",
  },
  {
    key: "mckenzie",
    title: "Recommendations Implicit in Policy Defaults",
    authors: "Craig R. M. McKenzie, Michael J. Liersch, Stacey R. Finkelstein. Psychological Science 2006",
    why: "People read a default as advice,\nso Netra’s ₹10 Cr pick comes with its reason.",
    insights: [
      "People read a default as advice",
      "Unsure people likely lean more on defaults",
      "Trust in the source likely adds weight",
    ],
    href: "https://pages.ucsd.edu/~mckenzie/McKenzieetal2006PsychSci.pdf",
  },
  {
    key: "amershi",
    title: "Guidelines for Human-AI Interaction",
    authors: "Saleema Amershi et al. CHI 2019",
    why: "AI should say how sure it is\nand be easy to correct. Netra does both.",
    insights: [
      "Few products said how often they err",
      "Testers often couldn't see why the AI acted",
      "Ask when unsure and make fixing easy",
    ],
    href: "https://www.microsoft.com/en-us/research/uploads/prod/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf",
  },
] as const;
