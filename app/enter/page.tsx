import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Splash from "@/components/enter/Splash";

// The site's front door: shared links start here. It is the home page held back
// behind Enter (components/enter/Splash), so keep the tree in step with
// app/page.tsx. Crawlers index home itself, so this page stays out of search.
// Rebuilt daily, like home, for the hero's version pill (lib/version.ts).
export const revalidate = 86400;

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function EnterPage() {
  return (
    <Splash>
      <Header />
      <main className="mx-auto w-full max-w-[var(--shell-max)] pt-2">
        <div className="mx-auto max-w-[var(--content-max)]">
          <Hero />
        </div>
      </main>
      <Footer />
    </Splash>
  );
}
