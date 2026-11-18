import Image from "next/image";
import { FOOTER, HOME, SITE } from "@/data/site";
import LocalClock from "../LocalClock";

/**
 * The sheet's foot (Figma 8780:36213): a row of four links in ruled cells, then the
 * note on the site and, at the right, the mark, name and the time in India.
 */
export default function SheetFooter() {
  const inline = "text-subtle underline decoration-from-font underline-offset-2 transition-colors hover:text-ink";
  return (
    <footer className="flex flex-col">
      {/* The rules between cells are the list's own colour showing through 1px gaps. */}
      <ul className="grid grid-cols-2 gap-px border-b border-rule bg-rule sm:grid-cols-4">
        {HOME.links.map((l) => (
          <li key={l.label} className="bg-bg">
            <a
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="block px-4 py-5 text-center text-12 uppercase leading-[17.6px] tracking-[0.13em] text-subtle transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-6 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {/* Two lines, one per sentence (Figma 8780:36223); narrow phones may wrap. */}
        <p className="px-3 py-3 text-10 leading-[1.5] text-muted sm:whitespace-nowrap">
          {FOOTER.blurb}
          <br />
          This is <span className={inline}>v2</span>, made with{" "}
          <a href="https://figma.com" target="_blank" rel="noreferrer" className={inline}>Figma</a> &amp;{" "}
          <a href="https://claude.ai/code" target="_blank" rel="noreferrer" className={inline}>Claude Code</a>.
        </p>
        <div className="flex items-center gap-0.5 pr-3">
          <span className="grid size-8 place-items-center">
            <Image src="/media/logo-mark.svg" alt="" width={23} height={23} className="light:invert" />
          </span>
          <span className="flex flex-col items-start gap-1">
            <span className="text-12 leading-none text-faint">{SITE.name}</span>
            <LocalClock compact timeZone="Asia/Kolkata" label="(INDIA)" />
          </span>
        </div>
      </div>
    </footer>
  );
}
