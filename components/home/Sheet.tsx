import SheetFooter from "./SheetFooter";
import SheetGutters from "./SheetGutters";
import SheetMain from "./SheetMain";
import SheetPin from "./SheetPin";
import SheetNav from "./SheetNav";

/**
 * The ruled sheet (Figma 8780:35610): one 1200px column with hairlines down both
 * sides, the nav stuck to its top and the footer at its foot. Home, the 404, the
 * projects, About, Work and Play sit on it.
 * - `contact` opens the footer on the contact card, above its links and note (home,
 *   Work, About, Play). Projects' footers have no card; their Next Project banner is
 *   the page's last block. `footer={false}` drops the footer (the 404).
 * - `hero` pins an opening for the rest to cover; the footer does the reverse,
 *   sliding up over the page once it has reached its end (SheetMain).
 * - Outside the rules, the gutters carry the orbit clip's stars (SheetGutters).
 */
export default function Sheet({
  children,
  contact,
  footer = true,
  hero,
}: {
  children?: React.ReactNode;
  contact?: boolean;
  /** false: no footer at all (the 404). */
  footer?: boolean;
  /**
   * An opening that stays put while the rest of the page scrolls up over it (home,
   * Work, Play): pinned under the nav, or lower when it's too tall for the screen, so
   * its foot stays in view (SheetPin).
   */
  hero?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[var(--shell-max)] flex-col border-rule min-[1201px]:border-x">
      <SheetGutters />
      <SheetNav />
      {/* The page holds at its end while the footer slides up over it (SheetMain). */}
      <SheetMain gap={contact}>
        {hero ? (
          <>
            <SheetPin>{hero}</SheetPin>
            {/* Opaque, and over the hero, so it covers it as it comes up. */}
            <div className="relative z-10 flex flex-col gap-20 bg-bg">{children}</div>
          </>
        ) : (
          children
        )}
      </SheetMain>
      {footer && <SheetFooter contact={contact} />}
    </div>
  );
}
