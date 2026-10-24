import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DraftContent from "@/components/draft/DraftContent";
import DraftRail from "@/components/draft/DraftRail";

// Unlisted work-in-progress page: reachable only by its link. Kept out of search
// results by the robots meta below and the X-Robots-Tag header in next.config.ts.
export const metadata: Metadata = {
  title: "Draft",
  robots: { index: false, follow: false, nocache: true },
};

export default function DraftPage() {
  return (
    <>
      <Header />
      {/* The rail floats over the left edge (hover to open); the page keeps full width. */}
      <DraftRail />
      <DraftContent />
      <Footer elsewhereLabel />
    </>
  );
}
