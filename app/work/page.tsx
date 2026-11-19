import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import WorkGallery from "@/components/WorkGallery";
import { PROJECTS, SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `Work - ${SITE.name}`,
  description: "Selected product and visual design work.",
};

/** The work gallery, on the ruled sheet like home and the projects. */
export default function WorkPage() {
  return (
    <Sheet>
      <div className="w-full px-4 pb-20 pt-26 sm:px-6">
        <WorkGallery projects={PROJECTS} />
      </div>
    </Sheet>
  );
}
