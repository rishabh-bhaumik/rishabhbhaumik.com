/**
 * Resume content, extracted from the Figma "resume" frame (node 8407:5605).
 * Swap copy / links here without touching components — mirrors the
 * data/site.ts pattern.
 *
 * NOTE: The source Figma metadata dump truncates long text-node `name`
 * values at ~50 characters. Several Experience bullets below end mid-word
 * (e.g. "...covering typograp") because the source itself was truncated —
 * not an extraction error. Re-run `get_design_context` (not `get_metadata`)
 * on the affected nodes to recover the full bullet text.
 */

/** A rich-text fragment: plain string, or a link. */
export type Frag = string | { text: string; href: string };

export interface ContactRow {
  label: string;
  value: string;
  href?: string;
}

export interface ExperienceItem {
  /** Left rail, e.g. "Jan '25 – Present" */
  dates: string;
  /** Left rail secondary, e.g. "1 yr 6 mos" or a location. Optional. */
  meta?: string;
  title: string;
  company: string;
  /** e.g. "Projects: Bima Saathi, Bima Kendra" — optional lead line. */
  lead?: string;
  /** Each bullet is an array of fragments so links can be inline. */
  bullets: Frag[][];
}

export interface EducationItem {
  dates: string;
  title: string;
  org: string;
  meta?: string;
}

export interface CredentialRow {
  label: string;
  items: Frag[];
}

export const RESUME_HEADER = {
  name: "Rishabh Bhaumik",
  // NOTE: source had a typo, "Vidusal" — corrected to "Visual" per instructions.
  subtitle: "Product & Visual Designer • Bengaluru, KA",
  // TODO: real PDF
  pdfHref: "#",
};

/** One string per paragraph. */
export const RESUME_ABOUT: string[] = [
  "I am a Product and Visual Designer with 5 years of experience in creating visual communication and digital products. Currently, I am working on Product, Video and Design at BimaKavach.",
  "My journey started taking shape at 145 East, where I focused on Photography, Videography, and Motion Design and Graphic Design. Joining Nymbl and especially Vedantu, have shaped my skills especially in Branding, Visual Design and Communication Design.",
  "What sets me apart is my ability to bring nuanced perspectives to the table, while balancing customer goals, business requirements, and technical limitations. Collaborating with exceptional Individuals in Engineering, Marketing, Performance, Content, Sales and Directors, I create user-centered, functional, and aesthetically appealing products.",
  "I excel at understanding the core of a business, product and service and translating it into impactful visuals. I love coming up with ideas that come from left-field thinking due to my past in film, theatre, and performance art. With obsessive attention to detail and a passion for re-inventing the wheel, I enjoy tacking complex challenges and managing the steps between thoughts and action.",
];

export const RESUME_CONTACT: ContactRow[] = [
  {
    label: "Email",
    value: "rishabh.bhaumik@gmail.com",
    href: "mailto:rishabh.bhaumik@gmail.com",
  },
  {
    label: "Phone",
    value: "+91 9007 296 854",
    href: "tel:+919007296854",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/rishabh-bhaumik",
    href: "https://linkedin.com/in/rishabh-bhaumik",
  },
  // NOTE: source value is "x.com/harshitbeni" (a different handle than the
  // rest of the page) — transcribed verbatim, looks like leftover template
  // copy rather than Rishabh's actual Twitter/X handle.
  {
    label: "Twitter",
    value: "x.com/harshitbeni",
    href: "https://x.com/harshitbeni",
  },
  {
    label: "Instagram",
    value: "instagram.com/rishabhbhaumik",
    href: "https://instagram.com/rishabhbhaumik",
  },
  // NOTE: source value is "dribbble.com/harshitbeni" — same template-leftover
  // handle mismatch as Twitter/Behance below.
  {
    label: "Dribbble",
    value: "dribbble.com/harshitbeni",
    href: "https://dribbble.com/harshitbeni",
  },
  // NOTE: source value duplicates the Twitter row ("x.com/harshitbeni")
  // rather than a Behance URL — transcribed verbatim.
  {
    label: "Behance",
    value: "x.com/harshitbeni",
    href: "https://x.com/harshitbeni",
  },
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
    lead: "Bengaluru, Ka",
    bullets: [
      ["Led end-to-end design of core B2B privacy platform"],
      ["Drove a mobile app scanning feature that generated"],
      ["Built and scaled a design system covering typograp"],
      ["Collaborated with engineering and PM across 3 time"],
      ["Assisted the design team with the revamp of the ma"],
    ],
  },
  {
    dates: "Jan '25 - Jan '26",
    meta: "(10 Months)",
    title: "Product Designer",
    company: "BimaKavach",
    lead: "Bengaluru, Ka",
    bullets: [
      ["Led end-to-end design of core B2B privacy platform"],
      ["Drove a mobile app scanning feature that generated"],
      ["Built and scaled a design system covering typograp"],
    ],
  },
  {
    dates: "March '23 - Jan '25",
    meta: "1 Year 11 Months",
    title: "Senior Designer",
    company: "BimaKavach",
    lead: "Bengaluru, Ka",
    bullets: [
      ["Led end-to-end design of core B2B privacy platform"],
      ["Drove a mobile app scanning feature that generated"],
      ["Built and scaled a design system covering typograp"],
      ["Collaborated with engineering and PM across 3 time"],
      ["Assisted the design team with the revamp of the ma"],
      ["Assisted the design team with the revamp of the ma"],
    ],
  },
  {
    dates: "August '21 - March '23",
    meta: "1 Year 8 Months",
    title: "Senior Marketing Graphic Designer",
    company: "Vedantu",
    lead: "Bengaluru, India",
    bullets: [
      ["Designed core fintech workflows across web and mob"],
      ["Built a scalable color and theming system that wor"],
      ["Led the redesign of the refund transaction flow on"],
      ["Created the investor pitch deck used in fundraisin"],
    ],
  },
  {
    dates: "July '20 - July '21",
    meta: "(1 Year)",
    title: "Marketing Graphic Designer",
    company: "Vedantu",
    lead: "Bengaluru, India",
    bullets: [["Designed core fintech workflows across web and mob"]],
  },
  {
    dates: "January '20 - April '20",
    meta: "4 Months",
    title: "Creative Graphic and Motion Designer",
    company: "Nymbl Digital",
    lead: "Bengaluru, India",
    bullets: [
      ["Led 01 product and brand design for a platform he"],
      ["Conducted 25+ user interviews and market studies t"],
    ],
  },
  {
    // NOTE: source name is "March'19" (no space before the apostrophe) —
    // transcribed verbatim.
    dates: "March'19 - November '19",
    meta: "8 Months",
    title: "In House Video Editor, Colorist, Motion Graphics Artist",
    company: "145 East",
    lead: "Kolkata, WB",
    bullets: [
      ["Worked on Angel One, one of India's largest stock "],
      ["Designed high-complexity trading interfaces throug"],
      ["(intraday,positional, holding) while maintaining c"],
      ["Conducted user research and competitor analysis to"],
    ],
  },
  {
    // NOTE: dates overlap with the Vedantu "July '20 - July '21" entry above
    // — transcribed as-is, presumably concurrent freelance work.
    dates: "2020 - 2021",
    title: "Video Editor, Creative Direction, Motion Design",
    company: "Freelance",
    lead: "Kolkata, WB",
    bullets: [
      ["Worked on Angel One, one of India's largest stock "],
      ["Designed high-complexity trading interfaces throug"],
    ],
  },
];

export const RESUME_EDUCATION: EducationItem[] = [
  {
    dates: "2015 - 2018",
    title: "Masters in Mass Communication & Videography",
    org: "St. Xavier's College",
    // NOTE: source spelling is "Kolklata" (typo in the design) — transcribed verbatim.
    meta: "Kolklata, WB, India",
  },
];

export const RESUME_CREDENTIALS: CredentialRow[] = [
  {
    label: "2023",
    items: [
      "UX Design Fundamentals",
      { text: "California Institute of the Arts", href: "#" },
    ],
  },
  {
    label: "2023",
    items: [
      "Visual Elements of User Interface Design",
      { text: "California Institute of the Arts", href: "#" },
    ],
  },
];
