import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlaySection from "@/components/play/PlaySection";
import NowPlaying from "@/components/NowPlaying";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `Play — ${SITE.name}`,
  description:
    "Films, experiments, and audio — the creative side of Rishabh Bhaumik.",
};

export default function PlayPage() {
  return (
    <>
      <Header />
      <main className="w-full pt-2">
        <PlaySection />
      </main>
      <Footer />
      <NowPlaying />
    </>
  );
}
