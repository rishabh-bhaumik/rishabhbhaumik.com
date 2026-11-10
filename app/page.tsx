import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

// Rebuilt daily so the hero's version pill (lib/version.ts) moves on with the month.
export const revalidate = 86400;

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[var(--shell-max)] pt-2">
        <div className="mx-auto max-w-[var(--content-max)]">
          <Hero />
        </div>
      </main>
      <Footer />
    </>
  );
}
