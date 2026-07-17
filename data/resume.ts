/**
 * Resume content, transcribed from the Figma "resume" frame (node 8407:5605)
 * via get_design_context. Swap copy / links here without touching components —
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
  /** Left rail, e.g. "Jan '26 - Present" */
  dates: string;
  /** Left rail secondary — duration, e.g. "(7 Months)". */
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
  // TODO: real PDF
  pdfHref: "#",
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
    "I excel at understanding the core of a business, product and service and translating it into impactful visuals. I love coming up with ideas that come from left-field thinking due to my past in film, theatre, and performance art. With obsessive attention to detail and a passion for re-inventing the wheel, I enjoy tacking complex challenges and managing the steps between thoughts and action.",
  ],
];

// NOTE: Twitter / Dribbble / Behance / Vimeo all read "harshitbeni" in the
// design, and Behance duplicates the Twitter URL. Transcribed verbatim —
// these look like leftover template copy and probably want real handles.
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
  { label: "Twitter", value: "x.com/harshitbeni", href: "https://x.com/harshitbeni" },
  {
    label: "Instagram",
    value: "instagram.com/rishabhbhaumik",
    href: "https://instagram.com/rishabhbhaumik",
  },
  {
    label: "Dribbble",
    value: "dribbble.com/harshitbeni",
    href: "https://dribbble.com/harshitbeni",
  },
  { label: "Behance", value: "x.com/harshitbeni", href: "https://x.com/harshitbeni" },
  {
    label: "Vimeo",
    value: "vimeo.com/harshitbeni",
    href: "https://vimeo.com/harshitbeni",
  },
];

export const RESUME_EXPERIENCE: ExperienceItem[] = [
  {
    dates: "Jan '26 - Present",
    meta: "(7 Months)",
    title: "Product & Brand Designer",
    company: "BimaKavach",
    location: "Bengaluru, Ka",
    bullets: [
      [
        { text: "Led end-to-end design of core B2B privacy platform", em: true },
        " features used by enterprise engineering teams.",
      ],
      [
        "Drove a mobile app scanning feature that ",
        { text: "generated 300k of revenue", em: true },
        " within one quarter from enterprise customers.",
      ],
      [
        "Built and scaled a ",
        { text: "design system", em: true },
        " covering typography, color, components, and motion tokens, improving product and visual design consistency across web and mobile while ",
        { text: "reducing design handoff time by over 30%", em: true },
        ".",
      ],
      [
        "Collaborated with engineering and PM across 3 timezones to ship complex ",
        { text: "data-heavy interfaces", em: true },
        " such as tables, bulk actions, and third-party integrations.",
      ],
      [
        "Assisted the design team with the revamp of the marketing website, including branding, illustrations, and web design.",
      ],
    ],
  },
  {
    dates: "Jan '25 - Jan '26",
    meta: "(10 Months)",
    title: "Product Designer",
    company: "BimaKavach",
    location: "Bengaluru, Ka",
    bullets: [
      [
        "Ensured ",
        { text: "Future Proofing of Brand", em: true },
        ", using Anek Variable, a multi-lingual variable typeface that has hints of Indian Devnagari & Dravidian Scripts.",
      ],
      [
        "Led the ",
        { text: "transition of Blog Hosting", em: true },
        " from Ghost to Wordpress, adding new robust features like Curation Posts, Author Profiles, Category Tags, Dark Mode and Auto-Transcription Support.",
      ],
      [
        "Built ",
        { text: "Research-led User Experience Design", em: true },
        " for the optimization of the Quote Generation Page, ",
        { text: "increasing CTA Clicks by 60%", em: true },
        ".",
      ],
    ],
  },
  {
    dates: "March '23 - Jan '25",
    meta: "1 Year 11 Months",
    title: "Senior Designer",
    company: "BimaKavach",
    location: "Bengaluru, Ka",
    bullets: [
      [
        "Led ",
        { text: "end-to-end website design", em: true },
        " and ",
        { text: "reimagined the entire product", em: true },
        ".",
      ],
      [
        "Designed a dynamic and versatile ",
        { text: "Dashboard", em: true },
        ", resulting in reduction of active ",
        { text: "churn to under 0.4%", em: true },
        " while also achieving ",
        { text: "85% Policy Retention", em: true },
        ".",
      ],
      ["Designed intuitive user experience for purchase and onboarding journeys."],
      [
        "Built PeetalDSL, a ",
        { text: "Design System Library", em: true },
        " in order to scale GUI Designs across all digital touch-points.",
      ],
      [
        "Optimized Communication Design for Blog Pages, ",
        { text: "reducing TAT by 45%", em: true },
        " and ",
        { text: "increasing Daily Blog output by 5x", em: true },
        ".",
      ],
      [
        "Completed the entire assembly of a ",
        { text: "Brand Film in 4 working days", em: true },
        ", directing A-Roll shoot setups while creating Motion Graphic Assets for Chapter Cards, Title Card & Start/End Card.",
      ],
    ],
  },
  {
    dates: "August '21 - March '23",
    meta: "1 Year 8 Months",
    title: "Senior Marketing Graphic Designer",
    company: "Vedantu",
    location: "Bengaluru, India",
    bullets: [
      [
        "Worked with the ",
        { text: "larger Brand Design Team", em: true },
        " in branding and communication design for the main brand as well as sub-technologies.",
      ],
      [
        "Led ",
        { text: "Landing Page Design", em: true },
        " for Offline Centre Registration with Unbounce, resulting in ",
        { text: "creating new marketing funnels", em: true },
        ".",
      ],
      [
        "In-charge of all ",
        { text: "Communication, Marketing & Brand Design", em: true },
        " for the 'Early Learning' Category, consisting of 4 products.",
      ],
      [
        "Created a",
        { text: " Brand films", em: true },
        " for Vedantu's ",
        { text: "Real Achievers Series.", em: true },
      ],
    ],
  },
  {
    dates: "July '20 - July '21",
    meta: "(1 Year)",
    title: "Marketing Graphic Designer",
    company: "Vedantu",
    location: "Bengaluru, India",
    bullets: [
      [
        "Tasked with ",
        { text: "leading of Performance Marketing", em: true },
        " for the 'Early Learning' Category consisting of 2 Products.",
      ],
    ],
  },
  {
    dates: "January '20 - April '20",
    meta: "4 Months",
    title: "Creative Graphic and Motion Designer",
    company: "Nymbl Digital",
    location: "Bengaluru, India",
    bullets: [
      [
        "Created ",
        { text: "Social Media Communication", em: true },
        " for Clients like HDFC Securities, QueMath, and Stockal.",
      ],
      [
        "Led the",
        { text: " Creation Landing Pages", em: true },
        " for Clients like Annuvit.",
      ],
    ],
  },
  {
    dates: "March '19 - November '19",
    meta: "8 Months",
    title: "In House Video Editor, Colorist, Motion Graphics Artist",
    company: "145 East",
    location: "Kolkata, WB",
    bullets: [
      [
        "Engaged in",
        { text: " building and scaling video content", em: true },
        " of the 145's Clothing Line via it's social media channels.",
      ],
      [
        "Worked on making ",
        { text: "Brand Films", em: true },
        " and Social Media Content for clients like Kompanero.",
      ],
      // NOTE: these last two bullets read as leftover template copy from a
      // fintech/trading resume — they do not match this video/motion role.
      // Transcribed verbatim from the design; likely want replacing.
      ["(intraday,positional, holding) while maintaining clarity and speed."],
      [
        "Conducted user research and competitor analysis to identify workflow gaps and inform product direction.",
      ],
    ],
  },
  {
    // NOTE: overlaps the Vedantu dates above — presumably concurrent freelance work.
    dates: "2020 - 2021",
    title: "Video Editor, Creative Direction, Motion Design",
    company: "Freelance",
    location: "Kolkata, WB",
    bullets: [
      [
        "Made Music Videos for Toronto & Kolkata based artist ZNA, becoming the 1st Creative Director to have a VEVO Music Video based out of Calcutta.",
      ],
      [
        "Made Tour Videos & Documentaries for multiple Grammy Award winning Indian Percussionist, Pandit Tanmay Bose.",
      ],
    ],
  },
];

export const RESUME_EDUCATION: EducationItem[] = [
  {
    dates: "2015 - 2018",
    title: "Masters in Mass Communication & Videography",
    org: "St. Xavier's College",
    // NOTE: source reads "Kolklata" — left verbatim.
    location: "Kolklata, WB, India",
  },
];

export const RESUME_CREDENTIALS: CredentialItem[] = [
  {
    dates: "2023",
    title: "UX Design Fundamentals",
    org: "California Institute of the Arts",
  },
  {
    dates: "2023",
    title: "Visual Elements of User Interface Design",
    org: "California Institute of the Arts",
  },
];
