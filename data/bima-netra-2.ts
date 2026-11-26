/**
 * /netra2: the BimaNetra page with its copy rewritten by docs/writing.md (plain sentences,
 * founders first, one quote then the call, Netra as a character, "I" for my calls and "we"
 * for the team's). Media, scenes and layout are /netra's. Story beats only Rishabh can
 * supply are "Placeholder." lines. The review quotes are the ones in /netra's Context frame.
 */
import { BIMA_NETRA, type NetraCopy } from "./bima-netra";

export const BIMA_NETRA_2: NetraCopy = {
  ...BIMA_NETRA,
  title: ["Designing an AI Agent", "for Business Insurance Quotes"],
  intro:
    "What happens to an insurance form when an agent can read about your company faster than you can type? With BimaNetra™, a founder types their company’s name. Netra, our AI agent, looks the business up and fills in the quote form for them to check.",
  splash: { ...BIMA_NETRA.splash, caption: "Netra finding a company from four letters" },
  marquee: [
    "role",
    "product designer",
    "timeline",
    "2 months",
    "team",
    "1 designer, 1 PM, 3 engineers",
    "tools",
    "Figma, FigJam, Claude Cowork, Claude Code",
  ],

  overview: {
    tag: "overview",
    lead: "Business insurance quotes in India still start with a proposal form. A founder describes their own company, line by line, before an insurer will name a price.",
    body: [
      "After the ",
      { text: "rebrand", href: "/bimakavach-identity" },
      ", I looked at BimaKavach’s old checkout to find where people left and why. I came away wanting a form that Netra fills in and the founder only has to read and check.",
    ],
  },

  context: {
    ...BIMA_NETRA.context,
    media: {
      ...BIMA_NETRA.context.media,
      caption: "Core thesis: deterministic flows ask every business the same questions, while probabilistic flows infer most answers from data and ask only what’s missing.",
      alt: "The old flow: landing page and form, quote page, checkout. 20% of customers left at the form, most often saying \"this form is long and complicated\", and 35% left at the quote page, most often saying \"i dont know what to pick\".",
    },
    heading: "Context",
    rows: [
      {
        label: "Overview",
        text: "BimaKavach is an insurance broker regulated by IRDAI, India’s insurance regulator. Startups and small businesses use it to compare, buy and manage business insurance.",
      },
      {
        label: "My Role",
        text: "I was the only designer, working with one PM and three engineers. I did the research and designed the flows and screens, and we built the coded prototype together.",
      },
      { label: "Timeline", text: "60 days, from the problem statement to the first release on web." },
    ],
  },

  brief: {
    ...BIMA_NETRA.brief,
    media: { ...BIMA_NETRA.brief.media, caption: "Five papers that shaped Netra" },
    heading: "Why customers left",
    intro:
      "In the old flow, 20% of customers left at the proposal form and 35% left at the quote page. In reviews, the most common reason at the form was “this form is long and complicated”, and at the quote page it was “i dont know what to pick”.",
    need: "So we decided to start from the public record, and ask the founder only what it doesn’t show.",
    challenge: "Netra guesses before it asks, so founders need to see how it got each answer.",
    constraint:
      "It had to work whether Netra found the company, made a best guess or found nothing, and show its working while it searched. We built it from Peetal, our design system, so three engineers could ship it in 60 days.",
  },

  thesis: [
    {
      ...BIMA_NETRA.thesis[0],
      caption: "The whiteboard from our planning sessions",
      alt: "The whiteboard from our planning sessions, with the product page, an earlier count of eleven questions, the quote page, KYC and payment drawn by hand, held over a photo of the room it was drawn in",
    },
    {
      ...BIMA_NETRA.thesis[1],
      // The whiteboard's six routes redrawn as a flowchart (NetraRoutes).
      scene: "routes",
      caption: "Six routes from one company name",
      alt: "A flowchart of six routes from one company name. Netra fails to find the company, makes a fuzzy match or finds it. It then fills in the answers or validates them, the modal is answered no or yes, and every route ends on a quote. A verified company with a yes is quoted pre-underwritten.",
    },
  ],

  execution: {
    ...BIMA_NETRA.execution,
    heading: "Three cases",
    body: [
      "On a whiteboard I drew every route a business could take from one company name. There were six, and they fell into the three cases above.",
      "We cut the questions from twelve to ten. Placeholder. Which two went, who chose them and why.",
      "Netra fills in each answer while the founder watches, so they can check it before they confirm.",
      "Placeholder. Something we tried that didn’t work, and what we did next.",
      "In 60 days and 139 commits we built a coded prototype with Peetal’s components, with every screen matched to its Figma frame. Before handoff we checked each of the three cases against Nielsen’s heuristics.",
    ],
    media: [
      {
        label: "Dither Transition on a Quote Card",
        scene: "quote",
        caption: "How Netra helps fill a proposal form",
        alt: "Netra filling in the quote form. Profile arrives filled and the founder confirms it, then Business and Risk each load and fill in their answers, ending on Get Instant Quotes.",
      },
      { ...BIMA_NETRA.execution.media[1], caption: "Netra on a phone, from one company name to quotes" },
    ],
  },

  showcase: { ...BIMA_NETRA.showcase, caption: "Placeholder caption. Onboarding on mobile" },
  gallery: [
    { ...BIMA_NETRA.gallery[0], caption: "Placeholder caption. Netra and its controls" },
    { ...BIMA_NETRA.gallery[1], caption: "Placeholder caption. Onboarding after the profile, in two cases" },
    { ...BIMA_NETRA.gallery[2], caption: "Placeholder caption. The risk score and the chat" },
    { ...BIMA_NETRA.gallery[3], caption: "Placeholder caption. Chatting with Netra" },
    { ...BIMA_NETRA.gallery[4], caption: "Placeholder caption" },
    { ...BIMA_NETRA.gallery[5], caption: "Placeholder caption" },
    { ...BIMA_NETRA.gallery[6], caption: "Placeholder caption" },
  ],

  takeaways: {
    ...BIMA_NETRA.takeaways,
    heading: "What we learned",
    items: [
      {
        title: "Ask fewer questions",
        body: "Placeholder. What changed after we cut the questions, as a number or a tester’s words.",
      },
      {
        title: "Show Netra working",
        body: "Placeholder. What testers said or did when they could watch Netra fill each field.",
      },
      {
        title: "Start from the business’s risk",
        body: "Placeholder. What founders did differently when the quote started from their business’s risk.",
      },
    ],
  },

  impact: {
    ...BIMA_NETRA.impact,
    stats: [
      { value: "$30M", label: ["Increase in", "direct underwriting authority"] },
      { value: "50%", label: ["More", "leads"] },
      { value: "67%", label: ["Less form filling", "at checkout"] },
      { value: "2", label: ["New insurers", "onboarded"] },
    ],
  },

  closing:
    "Probabilistic models can learn from a business’s data, behaviour and expectations, so Netra can keep filling in more of the form. That moves the design work to the moment a founder reads Netra’s answers and decides whether to believe them. Placeholder. One line on what building Netra changed in how you think about forms.",
};
