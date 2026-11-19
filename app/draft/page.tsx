import type { Metadata } from "next";
import SheetNav from "@/components/home/SheetNav";
import Footer from "@/components/Footer";
import NextProject from "@/components/project/NextProject";
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
      <SheetNav />
      {/* Rail and page side by side: hovering the left edge opens the rail and the page moves over. */}
      <DraftShell>
        <DraftContent />
      </DraftShell>
      {/* Draft is project 999, the last of all: its banner wraps round to the first
          project in Selected Work. On the sheet's 1200px column, as on the projects. */}
      <div className="mx-auto w-full max-w-[var(--shell-max)] border-rule min-[1201px]:border-x">
        <NextProject after="draft" />
      </div>
      <Footer elsewhereLabel />
    </>
  );
}
