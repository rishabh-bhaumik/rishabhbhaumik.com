import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResumeContent from "@/components/resume/ResumeContent";
import ResumeNav from "@/components/resume/ResumeNav";
import { SITE } from "@/data/site";

/**
 * Unlisted resume. `robots: noindex, nofollow` keeps it out of search results
 * and it is deliberately absent from NAV — reachable only via a direct link
 * (and, later, a Resume button on Home).
 */
export const metadata: Metadata = {
  title: `Resume — ${SITE.name}`,
  description: "Resume of Rishabh Bhaumik, Product & Visual Designer.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function ResumePage() {
  return (
    <>
      <Header />
      <ResumeNav />
      <main className="w-full pt-2">
        <ResumeContent />
      </main>
      <Footer />
    </>
  );
}
