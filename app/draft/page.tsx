import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import DraftContent from "@/components/draft/DraftContent";
import DraftShell from "@/components/draft/DraftShell";

// Unlisted work-in-progress page: reachable only by its link. Kept out of search
// results by the robots meta below and the X-Robots-Tag header in next.config.ts.
export const metadata: Metadata = {
  title: "Draft",
  robots: { index: false, follow: false, nocache: true },
};

export default function DraftPage() {
  return (
    <>
      {/* The rail drawer sits outside the sheet: the sheet's main column is its own
          stacking layer, which would put the drawer under the sliding footer. */}
      <DraftShell />
      {/* On the ruled sheet like the projects: footer without the contact card, the
          page ending on its Next Project banner (DraftContent). */}
      <Sheet>
        <DraftContent />
      </Sheet>
    </>
  );
}
