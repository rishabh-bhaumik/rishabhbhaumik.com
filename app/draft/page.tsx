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
      {/* From md up: the section rail (after Saathi's), then the page. */}
      <div className="w-full md:grid md:grid-cols-[13rem_minmax(0,1fr)]">
        <DraftRail />
        <DraftContent />
      </div>
      <Footer />
    </>
  );
}
