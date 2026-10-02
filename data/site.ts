/**
 * Single source of truth for page content. Swap copy / links / media here
 * without touching components. Media paths point at /public/media — drop your
 * own files in there to replace them.
 */

export const SITE = {
  name: "Rishabh Bhaumik",
  role: "Product & Visual Designer. Chasing.",
  domain: "rishabhbhaumik.com",
  builtWith: "Figma & Claude Code",
  /** Home hero headline. */
  greeting: "Hello, World!",
  /** Home hero pill above the headline. */
  version: "shipped '96 • v30.6",
  /** Home hero looping background video (the "orbitting" piece, also in PLAY). */
  heroVideo:
    "https://player.vimeo.com/video/780357035?h=430b68184b&background=1",
} as const;

/** `current` = the pathname for which this item is the active page (current item). */
export const NAV: { label: string; href: string; current?: string }[] = [
  { label: "home", href: "/", current: "/" },
  { label: "work", href: "/work", current: "/work" },
  { label: "play", href: "/play", current: "/play" },
  { label: "about", href: "/about", current: "/about" },
];

/** A company referenced inline in the bio, rendered as a brand chip + link. */
export interface Company {
  name: string;
  href: string;
  chip: {
    /** Chip background (brand colour). */
    bg: string;
    /** Logo image in /public/media. */
    logo?: string;
    /** Inset padding (px) for the logo inside the 16px chip. */
    pad?: number;
    /** Text-only chip (e.g. 145 East) when there's no logo mark. */
    text?: string;
    textColor?: string;
  };
}

export const BIO = {
  lead: "Practicing Experience Design at",
  current: {
    name: "BimaKavach",
    href: "https://bimakavach.com",
    chip: { bg: "#4100cf", logo: "/media/bimakavach-mark.svg", pad: 2 },
  } as Company,
  middle: "in Bengaluru. Previously Rishabh has worked with",
  companies: [
    {
      name: "Vedantu",
      href: "https://vedantu.com",
      chip: { bg: "#ff693d", logo: "/media/companies/vedantu.svg", pad: 2 },
    },
    {
      name: "145 East",
      href: "#",
      chip: { bg: "#000000", text: "145", textColor: "#efbe64" },
    },
    {
      name: "Nymbl",
      href: "#",
      chip: { bg: "#000000", logo: "/media/companies/nymbl.png" },
    },
    {
      name: "UNICEF",
      href: "https://unicef.org",
      chip: { bg: "#009edb", logo: "/media/companies/unicef.svg", pad: 1 },
    },
  ] as Company[],
  tail: "iterating craft and chasing ideas.",
};

export interface Project {
  slug: string;
  title: string;
  tag: string;
  description: string;
  href: string;
  /** Single media image (centered on the card's violet gradient). */
  media?: string;
  /** Width of the centered media as a % of the card (tunes each mockup). */
  mediaWidth?: string;
  /**
   * Full-bleed cover art on a dark card instead of a mockup centered on the
   * violet gradient. The media fills the frame and a bottom scrim lifts on
   * hover (Figma 7834-22472). Ignores `mediaWidth`.
   */
  cover?: boolean;
}

export const PROJECTS: Project[] = [
  {
    slug: "bima-saathi",
    title: "bima saathi",
    tag: "shipped 2026",
    description:
      "Designing the product that turned 1,000 agents into BimaKavach's second-largest revenue channel.",
    href: "/bima-saathi",
    media: "/media/work/bima.saathi.png",
    cover: true,
  },
  {
    slug: "bimakavach-identity",
    title: "BimaKavach Identity",
    tag: "shipped 2026",
    description:
      "Building the idea of BimaKavach as an intelligence company that is rooted in India's rich history of Ornamentation, Beauty and Aesthetic Identity.",
    href: "/bimakavach-identity",
    media: "/media/work/bimakavach.branding.png",
    cover: true,
  },
  {
    slug: "bima-kendra",
    title: "bima kendra",
    tag: "shipped 2026",
    description:
      "Creating the foundations for India's first centralized Commercial Insurance Management Software.",
    href: "#",
    media: "/media/work/bima.kendra.png",
    cover: true,
  },
  {
    slug: "peetal",
    title: "Peetal",
    tag: "shipped 2024",
    description:
      "Nunc blandit sed purus commodo purus. Mattis bibendum augue urna dictumst tempor tincidunt. Mauris vestibulum nec enim posuere ornare.",
    href: "#",
    media: "/media/work/design.system.png",
    cover: true,
  },
];

export interface SocialLink {
  handle: string;
  href: string;
  /** Which platform glyph shows on hover (see components/SocialIcons). */
  platform: "mail" | "x" | "li" | "ig";
  ariaLabel: string;
}

export const FOOTER = {
  blurb: `${SITE.domain} is my internet home and a repository of my work and play.`,
  meta: `This is v2, made with ${SITE.builtWith}.`,
  elsewhere: [
    {
      handle: "rishabh.bhaumik@gmail.com",
      href: "mailto:rishabh.bhaumik@gmail.com",
      platform: "mail",
      ariaLabel: "Email",
    },
    {
      handle: "@RishabhBhaumik",
      href: "https://x.com/RishabhBhaumik",
      platform: "x",
      ariaLabel: "X",
    },
    {
      handle: "rishabh-bhaumik",
      href: "https://linkedin.com/in/rishabh-bhaumik",
      platform: "li",
      ariaLabel: "LinkedIn",
    },
    {
      handle: "@rishabhbhaumik",
      href: "https://instagram.com/rishabhbhaumik",
      platform: "ig",
      ariaLabel: "Instagram",
    },
  ] as SocialLink[],
};

/**
 * "Play" gallery (Home #play). Each card shows a cover thumbnail auto-fetched
 * from the provider's oEmbed (see lib/play.ts); clicking swaps in `embed` (the
 * autoplay player iframe).
 */
export interface PlayItem {
  slug: string;
  title: string;
  tag: string;
  description: string;
  provider: "vimeo" | "soundcloud";
  /** Public URL used for the oEmbed thumbnail lookup. */
  oembed: string;
  /** Player iframe src loaded on click (autoplay on). */
  embed: string;
}

export const PLAY: PlayItem[] = [
  {
    slug: "dystopia",
    title: "dystopia",
    tag: "art-direction",
    description: "In 2021, I made an experimental zero budget fashion film.",
    provider: "vimeo",
    oembed: "https://vimeo.com/532172140/81618c0b21",
    embed:
      "https://player.vimeo.com/video/532172140?h=81618c0b21&autoplay=1&title=0&byline=0&portrait=0",
  },
  {
    slug: "mr-rays-sequence",
    title: "mr. ray's sequence",
    tag: "experimental",
    description: "A Tribute in Visual Expression for the Maestro himself.",
    provider: "vimeo",
    oembed: "https://vimeo.com/530915046/0ffa518b50",
    embed:
      "https://player.vimeo.com/video/530915046?h=0ffa518b50&autoplay=1&title=0&byline=0&portrait=0",
  },
  {
    slug: "gold",
    title: "gold",
    tag: "audio-track",
    description: "spiritual podcasting sampled",
    provider: "soundcloud",
    oembed: "https://soundcloud.com/rishabhbhaumik/gold",
    embed:
      "https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F1216424269&auto_play=true&visual=true&color=%234100cf&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false",
  },
  {
    slug: "orbitting",
    title: "orbitting",
    tag: "motion-design",
    description: "The best thing I made for v1 of rishabhbhaumik.com",
    provider: "vimeo",
    oembed: "https://vimeo.com/780357035/430b68184b",
    embed:
      "https://player.vimeo.com/video/780357035?h=430b68184b&autoplay=1&title=0&byline=0&portrait=0",
  },
];
