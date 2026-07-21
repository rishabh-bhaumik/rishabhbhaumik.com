/**
 * Resume content, transcribed verbatim from the Figma "resume" frame
 * (node 8407:5605). Swap copy / links here without touching components —
 * mirrors the data/site.ts pattern.
 *
 * The design sets key phrases in white against muted body text. That is the
 * `em` flag below; `href` turns a fragment into a link.
 */

/** A run of body text. Plain string, or a fragment that is emphasised, linked, or both. */
export type Frag = string | { text: string; em?: true; href?: string };

export interface ContactRow {
  label: string;
  value: string;
  href?: string;
}

export interface ExperienceItem {
  /** Left rail, e.g. "Jan ‘26 - Present" */
  dates: string;
  /** Left rail secondary — duration, e.g. "(6 Months)". */
  meta?: string;
  title: string;
  company: string;
  location: string;
  /** Each bullet is a fragment list so emphasis can sit inline. */
  bullets: Frag[][];
}

export interface EducationItem {
  dates: string;
  title: string;
  org: string;
  location?: string;
}

export interface CredentialItem {
  dates: string;
  title: string;
  org: string;
}

export const RESUME_HEADER = {
  name: "Rishabh Bhaumik",
  // Source reads "Vidusal" — an obvious typo, corrected here.
  subtitle: "Product & Visual Designer • Bengaluru, KA",
  pdfHref:
    "https://drive.google.com/file/d/1Va0F1SL-W1ohgZKdOHr8TEM6MafNWeA8/view?usp=sharing",
};

/** One entry per paragraph. */
export const RESUME_ABOUT: Frag[][] = [
  [
    "I am a ",
    { text: "Product and Visual Designer", em: true },
    " with ",
    { text: "5 years of experience", em: true },
    " in creating visual communication and digital products. Currently, I am working on Product, Video and Design at BimaKavach.",
  ],
  [
    "My journey started taking shape at 145 East, where I focused on Photography, Videography, and Motion Design and Graphic Design. Joining Nymbl and especially Vedantu, have shaped my skills especially in Branding, Visual Design and Communication Design.",
  ],
  [
    "What sets me apart is my ability to bring nuanced perspectives to the table, while balancing customer goals, business requirements, and technical limitations. Collaborating with exceptional Individuals in Engineering, Marketing, Performance, Content, Sales and Directors, I create user-centered, functional, and aesthetically appealing products.",
  ],
  [
    // NOTE: source reads "tacking" (for "tackling") — left verbatim.
    "I excel at understanding the core of a business, product and service and translating it into impactful visuals. I love coming up with ideas that come from left-field thinking due to my past in film, theatre, and performance art. With obsessive attention to detail and a passion for re-inventing the wheel, I enjoy tacking complex challenges and managing the steps between thoughts and action.",
  ],
];

export const RESUME_CONTACT: ContactRow[] = [
  {
    label: "Email",
    value: "rishabh.bhaumik@gmail.com",
    href: "mailto:rishabh.bhaumik@gmail.com",
  },
  { label: "Phone", value: "+91 9007 296 854", href: "tel:+919007296854" },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/rishabh-bhaumik",
    href: "https://linkedin.com/in/rishabh-bhaumik",
  },
  {
    label: "Twitter",
    value: "x.com/RishabhBhaumik",
    href: "https://x.com/RishabhBhaumik",
  },
  {
    label: "Instagram",
    value: "instagram.com/rishabhbhaumik",
    href: "https://instagram.com/rishabhbhaumik",
  },
  {
    label: "Dribbble",
    value: "dribbble.com/rishabhbhaumik",
    href: "https://dribbble.com/rishabhbhaumik",
  },
  {
    label: "Behance",
    value: "www.behance.net/rishabhbhaumik",
    href: "https://www.behance.net/rishabhbhaumik",
  },
  {
    label: "Vimeo",
    value: "vimeo.com/rishabhbhaumik",
    href: "https://vimeo.com/rishabhbhaumik",
  },
];

export const RESUME_EXPERIENCE: ExperienceItem[] = [
  {
    dates: "Jan ‘26 - Present",
    meta: "(6 Months)",
    title: "Product & Brand Designer",
    company: "BimaKavach",
    location: "Bengaluru, Ka",
    bullets: [
      [
        { text: "1,000 agents onboarded onto Bima Saathi,", em: true },
        " a field-agent mobile app I designed end-to-end (onboarding, quote builder, policy tracker), turning a paper-based sales force into a self-serve digital channel generating measurable quarterly revenue.",
      ],
      [
        { text: "55-day full rebrand", em: true },
        " across 12 touchpoints (web, app, marketing, merchandise, HR/admin), led end-to-end from user research and moodboarding through developer handoff.",
      ],
    ],
  },
  {
    dates: "Jan ‘25 - Dec ‘25",
    meta: "(11 Months)",
    title: "Product Designer",
    company: "BimaKavach",
    location: "Bengaluru, Ka",
    bullets: [
      [
        { text: "60% lift in CTA conversion", em: true },
        " on the Quote Generation page by running A/B tests on layout variants, conducting competitive analysis across 8 insurance platforms, and redesigning the page hierarchy using analytics that pinpointed where users dropped off.",
      ],
      [
        { text: "70% reduction in localization effort", em: true },
        " (estimated) by transitioning the product to Anek Variable, a multi-lingual typeface supporting Devanagari and Dravidian scripts, and embedding typographic foundations into the design system to scale across regions.",
      ],
      [
        { text: "5x daily blog output, 45% faster turnaround", em: true },
        " by leading the platform migration from Ghost to WordPress, designing the category architecture, author profiles, curation posts, and dark mode, all informed by content analytics showing reader drop-off patterns.",
      ],
    ],
  },
  {
    dates: "March ‘23 - Dec ‘24",
    meta: "1 Year 9 Months",
    title: "Senior Designer",
    company: "BimaKavach",
    location: "Bengaluru, Ka",
    bullets: [
      [
        { text: "0.4% churn, 85% retention on active policies", em: true },
        " after I redesigned the core dashboard, running usability tests with 20+ customers, mapping user journeys end-to-end, and iterating on data visualizations that surfaced renewal timelines and coverage gaps.",
      ],
      [
        { text: "3-platform design system", em: true },
        " (Peetal) built from scratch covering web, app, and POS, defining component architecture, Figma variables, auto-layout structures, and documentation that cut design-to-dev handoff time by an estimated 40% and ensured consistency across every digital touchpoint.",
      ],
      [
        { text: "7-step flow simplified to 4", em: true },
        " for the purchase and onboarding journey, based on user research sessions with SME owners, reducing form abandonment and shortening time-to-first-policy.",
      ],
      [
        { text: "Full website redesign", em: true },
        " shipped end-to-end, from wireframes and prototyping through developer handoff and QA, resulting in a responsive product that aligned brand perception with the actual product experience.",
      ],
    ],
  },
  {
    dates: "Jul 2020 - Mar 2023",
    meta: "(2 years 8 months)",
    title: "Designer, Growth & Brand",
    company: "Vedantu",
    location: "Bengaluru, India",
    bullets: [
      [
        { text: "High-converting landing pages", em: true },
        " designed on Unbounce for offline centre registration, building marketing funnels that became a repeatable growth playbook across 4 products in the Early Learning category.",
      ],
      [
        { text: "4-product brand system", em: true },
        " owned across the Early Learning vertical, covering all communication, campaign, and marketing design, establishing templates the broader brand team adopted as standards.",
      ],
      [
        { text: "Performance marketing creatives", em: true },
        " designed for 2 products, producing ad variants and landing pages that fed directly into growth experimentation cycles alongside the product and growth teams.",
      ],
    ],
  },
  {
    dates: "Jul 2018 - Apr 2020",
    meta: "(1 year 9 months)",
    title: "Creative & Motion Designer",
    company: "Nymbl Digital / Freelance",
    location: "Bengaluru and Kolkata, India",
    bullets: [
      [
        "Tasked with ",
        { text: "leading of Performance Marketing", em: true },
        " for the 'Early Learning' Category consisting of 2 Products.",
      ],
    ],
  },
];

export const RESUME_EDUCATION: EducationItem[] = [
  {
    dates: "2015 - 2018",
    title: "Masters in Mass Communication & Videography",
    org: "St. Xavier’s College",
    // NOTE: source reads "Kolklata" — left verbatim.
    location: "Kolklata, WB, India",
  },
];

export const RESUME_CREDENTIALS: CredentialItem[] = [
  {
    dates: "2022",
    title: "UX Design Fundamentals",
    org: "California Institute of the Arts",
  },
  {
    dates: "2022",
    title: "Visual Elements of User Interface Design",
    org: "California Institute of the Arts",
  },
];
