import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import PlaySection from "@/components/play/PlaySection";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `Play - ${SITE.name}`,
  description:
    "Films, experiments, and audio - the creative side of Rishabh Bhaumik.",
};

/** The Play gallery, on the ruled sheet like home and the projects. */
export default function PlayPage() {
  return (
    <Sheet>
      <div className="w-full pb-20 pt-2">
        <PlaySection />
      </div>
    </Sheet>
  );
}
