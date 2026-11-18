import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import NetraContent from "@/components/netra/NetraContent";
import { BIMA_NETRA } from "@/data/bima-netra";

// Kept out of search results while its media frames and execution notes are placeholders;
// drop `robots` once the page is final.
export const metadata: Metadata = {
  title: "BimaNetra",
  description: BIMA_NETRA.intro,
  robots: { index: false, follow: false },
};

/** The BimaNetra project (Figma 8818:32660), on the same ruled sheet as home. */
export default function NetraPage() {
  return (
    <Sheet>
      <NetraContent />
    </Sheet>
  );
}
