import Image from "next/image";
import Link from "next/link";
import { SELECTED_WORK } from "@/data/site";

/**
 * The pieces project pages are made of (BimaNetra, Bima Saathi, Peetal), after Figma
 * 8818:32660: the opening, titled sections with their tag at the right, running text
 * in a reading column, callouts, numbered points in ruled cells, big figures, tall
 * figures, and text that carries inline links. Media frames are GrowMedia.
 */

export const HEADING = "text-28 leading-[1.3] tracking-[-0.015em] text-ink";
export const BODY = "text-16 leading-[1.8] tracking-[-0.015em] text-subtle";
/** The reading column: 760px of text inside the sheet's side padding. */
const COLUMN = "max-w-[808px] px-4 sm:px-6";

/** A row of tags (Figma's "Project Tag"): small lowercase words in rounded pills. */
export function Tags({
  items,
  className = "",
  style,
}: {
  items: readonly string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <ul style={style} className={`flex flex-wrap items-center gap-6 p-3 ${className}`}>
      {items.map((t) => (
        <li
          key={t}
          className="rounded-[24px] border border-rule bg-surface px-3 py-2.5 text-12 lowercase leading-none text-faint"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Running text: plain strings, with `{ text, href }` parts set as underlined links. */
export type RichText = readonly (string | { readonly text: string; readonly href: string })[];

export function Rich({ parts }: { parts: RichText }) {
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <Link
        key={i}
        href={p.href}
        className="underline decoration-from-font underline-offset-2 transition-colors hover:text-ink"
      >
        {p.text}
      </Link>
    ),
  );
}

type Crumb = { readonly label: string; readonly href?: string };

/** home // … // here: every step but the last is a link. */
function Crumbs({ trail }: { trail: readonly Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-5 text-12 uppercase leading-none tracking-[0.01em] text-subtle">
      {trail.map((c, i) => (
        <span key={c.label} className="flex items-center gap-5">
          {i > 0 && <span aria-hidden className="text-faint/50">{"//"}</span>}
          {c.href ? (
            <Link href={c.href} className="transition-colors hover:text-ink">{c.label}</Link>
          ) : (
            <span aria-current="page">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Where a project sits: home // work // its number in Selected Work and slug
 * ("002.bima-netra"), the number following SELECTED_WORK's order.
 */
function projectTrail(href: string): Crumb[] {
  const n = SELECTED_WORK.findIndex((w) => w.href === href);
  const here = n < 0 ? href.slice(1) : `${String(n + 1).padStart(3, "0")}.${SELECTED_WORK[n].slug}`;
  return [{ label: "home", href: "/" }, { label: "work", href: "/work" }, { label: here }];
}

/**
 * A page's opening (Figma 8818:33249): a 56px row with the breadcrumb at the left
 * and any tags at the right, the headline (broken line by line on wide screens) and a
 * short note. It rises in with CSS before any JavaScript.
 */
function Opening({
  trail,
  tags,
  title,
  intro,
}: {
  trail: readonly Crumb[];
  tags?: readonly string[];
  title: readonly string[];
  intro: React.ReactNode;
}) {
  const at = (i: number) => ({ "--i": i }) as React.CSSProperties;
  return (
    <section className="flex flex-col items-end px-4 pb-20 pt-16 sm:px-6 sm:pt-[120px]">
      <div style={at(0)} className="rise-text flex min-h-14 w-full flex-wrap items-center justify-between gap-x-4">
        <Crumbs trail={trail} />
        {tags && <Tags items={tags} className="-mx-3" />}
      </div>
      <h1 style={at(1)} className="rise-text w-full text-28 leading-[1.3] tracking-[-0.015em] text-ink sm:text-40 lg:text-48">
        {title.map((line, i) => (
          <span key={i} className="lg:block">
            {line}
            {i < title.length - 1 && " "}
          </span>
        ))}
      </h1>
      <p style={at(2)} className="rise-text w-full pt-5">
        <span className="block max-w-[520px] text-16 leading-6 tracking-[-0.01em] text-subtle">{intro}</span>
      </p>
    </section>
  );
}

/** A project's opening: home // work // 00n.slug, with its tags at the right. */
export function ProjectHero({
  href,
  tags,
  title,
  intro,
}: {
  /** The project's route, for the breadcrumb. */
  href: string;
  tags: readonly string[];
  title: readonly string[];
  intro: React.ReactNode;
}) {
  return <Opening trail={projectTrail(href)} tags={tags} title={title} intro={intro} />;
}

/** A section page's opening (Work, Play): home // its name, and no tags. */
export function PageHero({ page, title, intro }: { page: string; title: readonly string[]; intro: React.ReactNode }) {
  return <Opening trail={[{ label: "home", href: "/" }, { label: page }]} title={title} intro={intro} />;
}

/**
 * A titled section: its tag at the right, the heading, then its blocks, 24px apart.
 * Text blocks keep to the reading column; media frames and ruled cells run the
 * sheet's full width.
 */
export function ProjectSection({
  id,
  tag,
  heading,
  children,
}: {
  id: string;
  tag: string;
  heading: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6 pb-6 pt-[88px]">
      <div className="flex flex-col items-start px-4 sm:px-6">
        <Tags items={[tag]} className="self-end" />
        <h2 id={id} className={`max-w-[760px] pt-3 ${HEADING}`}>
          {heading}
        </h2>
      </div>
      {children}
    </section>
  );
}

/** Paragraphs (or a subheading among them) in the reading column. */
export function Prose({ children }: { children: React.ReactNode }) {
  return <div className={`flex flex-col gap-4 ${COLUMN} ${BODY}`}>{children}</div>;
}

/** A subheading inside Prose. */
export function Subhead({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-20 leading-[1.4] tracking-[-0.015em] text-ink">{children}</h3>;
}

/** A line set apart with a rule at its left (Netra's "The Challenge"). */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className={COLUMN}>
      <blockquote className="border-l-2 border-ink py-1 pl-4 text-18 leading-[1.6] tracking-[-0.015em] text-ink">
        {children}
      </blockquote>
    </div>
  );
}

/** A list in the reading column, each item led by the marquee's small diamond. */
export function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className={`flex flex-col gap-2 ${COLUMN} ${BODY}`}>
      {items.map((i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-3 size-[4.243px] shrink-0 rotate-45 bg-faint/80" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Numbered points in ruled cells (Netra's Key Takeaways): two or three across, four
 * as two then four. The rules are the list's own colour showing through 1px gaps.
 */
export function Numbered({ items }: { items: readonly { title: string; body?: string }[] }) {
  const cols =
    items.length === 2 ? "md:grid-cols-2" : items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4";
  return (
    <ol className={`grid gap-px border-y border-rule bg-rule ${cols}`}>
      {items.map((t, i) => (
        <li key={t.title} className="flex flex-col bg-bg px-4 py-8 sm:px-6">
          <span className="text-12 leading-none text-faint">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="pt-3 text-18 font-bold leading-6 tracking-[-0.015em] text-ink">{t.title}</h3>
          {t.body && <p className={`pt-3 ${BODY}`}>{t.body}</p>}
        </li>
      ))}
    </ol>
  );
}

/** Big figures (Netra's Impact): a value over its label, two across, four on wide screens. */
export function Stats({ items }: { items: readonly { value: string; label: string }[] }) {
  return (
    <ul className="grid grid-cols-2 border-y border-rule lg:grid-cols-4">
      {items.map((s) => (
        <li key={s.label} className="flex flex-col p-4 sm:p-6">
          <span className="text-28 leading-none tracking-[-0.015em] text-ink tabular-nums sm:text-40">{s.value}</span>
          <span className="pt-3 text-16 leading-[1.2] tracking-[-0.015em] text-subtle">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** A tall image (documentation, type scales) shown whole in the reading column. */
export function Figure({ src, width, height, alt }: { src: string; width: number; height: number; alt: string }) {
  return (
    <div className={COLUMN}>
      <Image src={src} alt={alt} width={width} height={height} sizes="(min-width: 808px) 760px, 100vw" className="h-auto w-full" />
    </div>
  );
}
