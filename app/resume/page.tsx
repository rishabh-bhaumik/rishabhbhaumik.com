import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResumeContent from "@/components/resume/ResumeContent";
import ResumeNav from "@/components/resume/ResumeNav";
import { SITE } from "@/data/site";

/**
 * Resume, linked from the header nav. `robots: noindex, nofollow` still keeps
 * it out of search results.
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
