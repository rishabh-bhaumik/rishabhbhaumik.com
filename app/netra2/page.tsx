import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import NetraContent from "@/components/netra/NetraContent";
import { BIMA_NETRA_2 } from "@/data/bima-netra-2";

// A rewrite of /netra's copy to compare against it; never indexed.
export const metadata: Metadata = {
  title: "BimaNetra (v2)",
  description: BIMA_NETRA_2.intro,
  robots: { index: false, follow: false },
};

/** /netra with its copy rewritten (data/bima-netra-2.ts); everything else is /netra's. */
export default function Netra2Page() {
  return (
    <Sheet>
      <NetraContent copy={BIMA_NETRA_2} />
    </Sheet>
  );
}
