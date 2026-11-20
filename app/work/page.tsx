import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import TagMarquee from "@/components/home/TagMarquee";
import { PageHero } from "@/components/project/parts";
import WorkGallery from "@/components/WorkGallery";
import { PROJECTS, SITE, WORK_PAGE } from "@/data/site";

export const metadata: Metadata = {
  title: `Work - ${SITE.name}`,
  description: "Selected product and visual design work.",
};

/** The work gallery, on the ruled sheet: an opening like a project's, its marquee, then the cards. */
export default function WorkPage() {
  return (
    <Sheet
      contact
      hero={
        // The opening and its marquee, pinned while the cards scroll up over them.
        <>
          <PageHero page="work" title={WORK_PAGE.title} intro={WORK_PAGE.intro} />
          {/* The words twice over, so one run is wider than the sheet. */}
          <TagMarquee items={[...WORK_PAGE.marquee, ...WORK_PAGE.marquee]} />
        </>
      }
    >
      <div className="w-full">
        <WorkGallery projects={PROJECTS} />
      </div>
    </Sheet>
  );
}
