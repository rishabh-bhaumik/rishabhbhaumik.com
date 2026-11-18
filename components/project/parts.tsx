import Link from "next/link";

/**
 * Small pieces shared by the project pages (BimaNetra first): the round tags over
 * each section and running text that carries an inline link.
 */

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
