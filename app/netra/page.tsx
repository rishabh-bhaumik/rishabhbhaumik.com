import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import NetraContent from "@/components/netra/NetraContent";
import { BIMA_NETRA_2 } from "@/data/bima-netra-2";

// Kept out of search results while its media frames and takeaways are placeholders;
// drop `robots` once the page is final.
export const metadata: Metadata = {
  title: "BimaNetra",
  description: BIMA_NETRA_2.intro,
  robots: { index: false, follow: false },
};

/**
 * The BimaNetra project (Figma 8818:32660), on the same ruled sheet as home, with the
 * plain-language copy (data/bima-netra-2.ts, built on data/bima-netra.ts). The original
 * copy is at /netra2.
 */
export default function NetraPage() {
  return (
    <Sheet>
      <NetraContent copy={BIMA_NETRA_2} />
    </Sheet>
  );
}
