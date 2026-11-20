import Sheet from "@/components/home/Sheet";
import SheetHero from "@/components/home/SheetHero";
import SurpriseMe from "@/components/home/SurpriseMe";

/** The marquee's words on the 404, in place of the home's labels. */
const LOST = ["4 0 4", "Page not found", "4 0 4", "Off the map", "4 0 4", "Page not found", "4 0 4", "Off the map"];

/**
 * Any address that doesn't exist: the home's sheet and opening, with a headline saying
 * so, a random case study beside it (Surprise me), and the marquee spelling out 404.
 * No footer: the page ends on the marquee.
 */
export default function NotFound() {
  return (
    <Sheet footer={false}>
      <SheetHero
        heading={
          <>
            <span className="sr-only">404: </span>
            {/* Peetal's label/neutral/disabled: #A9ACB1 at 48%. */}
            <span className="text-[#a9acb1]/48">This page is off the map.</span>
          </>
        }
        aside={
          <div className="flex flex-col items-start gap-4">
            <p className="text-16 leading-6 tracking-[-0.01em] text-subtle">
              The link may be old or mistyped.
            </p>
            <SurpriseMe />
          </div>
        }
        marquee={LOST}
      />
    </Sheet>
  );
}
