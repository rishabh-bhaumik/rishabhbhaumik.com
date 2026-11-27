import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import NetraContent from "@/components/netra/NetraContent";
import { BIMA_NETRA } from "@/data/bima-netra";

// The BimaNetra page's original copy, kept to compare against /netra; never indexed.
export const metadata: Metadata = {
  title: "BimaNetra (original)",
  description: BIMA_NETRA.intro,
  robots: { index: false, follow: false },
};

/** /netra with its original copy (data/bima-netra.ts); the media and layout are the same. */
export default function Netra2Page() {
  return (
    <Sheet>
      <NetraContent />
    </Sheet>
  );
}
