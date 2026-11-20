import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import PlaySection from "@/components/play/PlaySection";
import TagMarquee from "@/components/home/TagMarquee";
import { PageHero } from "@/components/project/parts";
import { PLAY_PAGE, SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `Play - ${SITE.name}`,
  description:
    "Films, experiments, and audio - the creative side of Rishabh Bhaumik.",
};

/** The Play gallery, on the ruled sheet: an opening like a project's, its marquee, then the cards. */
export default function PlayPage() {
  return (
    <Sheet
      contact
      hero={
        // The opening and its marquee, pinned while the cards scroll up over them.
        <>
          <PageHero page="play" title={PLAY_PAGE.title} intro={PLAY_PAGE.intro} />
          {/* The words twice over, so one run is wider than the sheet. */}
          <TagMarquee items={[...PLAY_PAGE.marquee, ...PLAY_PAGE.marquee]} />
        </>
      }
    >
      <PlaySection />
    </Sheet>
  );
}
