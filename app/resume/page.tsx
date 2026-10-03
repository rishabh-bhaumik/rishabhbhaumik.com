import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResumeContent from "@/components/resume/ResumeContent";
import ResumeNav from "@/components/resume/ResumeNav";
import { RESUME_LIVE, SITE } from "@/data/site";

/**
 * Resume. Hidden in production until RESUME_LIVE (data/site.ts) is true; once
 * live, `robots: noindex, nofollow` still keeps it out of search results.
 */
export const metadata: Metadata = {
  title: `Resume - ${SITE.name}`,
  description: "Resume of Rishabh Bhaumik, Product & Visual Designer.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function ResumePage() {
  // Not public yet: production serves a 404 here (see RESUME_LIVE).
  if (!RESUME_LIVE && process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <Header />
      {/* The Bima Saathi layout: from md up, the chapter rail, the 700px column, and an
          empty column mirroring the rail so the column stays centred. */}
      <div className="w-full px-4 sm:px-6 md:grid md:grid-cols-[minmax(10rem,1fr)_minmax(0,var(--reading-max))_1fr] md:gap-8">
        <ResumeNav />
        <main className="min-w-0 pt-2">
          <ResumeContent />
        </main>
      </div>
      <Footer />
    </>
  );
}
