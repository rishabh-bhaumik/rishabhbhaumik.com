import type { Metadata } from "next";
import Sheet from "@/components/home/Sheet";
import PeetalContent from "@/components/peetal/PeetalContent";

// Unlisted deep-dive on Peetal (linked from home's Selected Work and 004 on /draft). Kept
// out of search results by the robots meta below and the X-Robots-Tag header in next.config.ts.
export const metadata: Metadata = {
  title: "Peetal",
  robots: { index: false, follow: false, nocache: true },
};

/** Peetal, on the same ruled sheet as home and the other projects. */
export default function PeetalPage() {
  return (
    <Sheet>
      <PeetalContent />
    </Sheet>
  );
}
