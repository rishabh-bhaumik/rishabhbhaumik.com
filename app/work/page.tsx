import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkGallery from "@/components/WorkGallery";
import { PROJECTS, SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `Work - ${SITE.name}`,
  description: "Selected product and visual design work.",
};

export default function WorkPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[var(--shell-max)] px-4 pb-20 pt-26 sm:px-6">
        <WorkGallery projects={PROJECTS} />
      </main>
      <Footer />
    </>
  );
}
