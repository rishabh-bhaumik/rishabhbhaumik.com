import Link from "next/link";
import Sheet from "@/components/home/Sheet";
import SheetHero from "@/components/home/SheetHero";

/** The marquee's words on the 404, in place of the home's labels. */
const LOST = ["4 0 4", "Page not found", "4 0 4", "Off the map", "4 0 4", "Page not found", "4 0 4", "Off the map"];

/**
 * Any address that doesn't exist: the home's sheet and opening, with a headline saying
 * so, a way back beside it, and the marquee spelling out 404.
 */
export default function NotFound() {
  return (
    <Sheet contact>
      <SheetHero
        heading={
          <>
            <span className="sr-only">404: </span>This page is off the map.
          </>
        }
        aside={
          <div className="flex flex-col items-start gap-4">
            <p className="text-16 leading-6 tracking-[-0.01em] text-subtle">
              The link may be old or mistyped. The work is still where it was.
            </p>
            <Link
              href="/"
              className="flex h-8 items-center rounded-[8px] border-[0.5px] border-rule bg-bg px-3 text-12 leading-none text-ink transition-colors hover:border-faint/40"
            >
              Back to home
            </Link>
          </div>
        }
        marquee={LOST}
      />
    </Sheet>
  );
}
