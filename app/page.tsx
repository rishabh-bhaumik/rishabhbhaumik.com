import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WorkGallery from "@/components/WorkGallery";
import Footer from "@/components/Footer";
import NowPlaying from "@/components/NowPlaying";
import { PROJECTS } from "@/data/site";

export default function Home() {
  return (
    <>
      <Header />
      <main id="work" className="mx-auto w-full max-w-[var(--shell-max)] pt-2">
        <div className="mx-auto max-w-[var(--content-max)]">
          <Hero />
        </div>
        <div id="projects">
          <WorkGallery projects={PROJECTS} />
        </div>
      </main>
      <Footer />
      <NowPlaying />
    </>
  );
}
