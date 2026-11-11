import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Splash from "@/components/enter/Splash";

/** One beat of the marquee, as set in Figma (8736:43211): spaced digits, a spaced slash. */
const BEAT = "4 0 4  /  ";
/** A run wide enough to cover a 4K-wide screen on its own (~40px a beat). */
const RUN = BEAT.repeat(100);

/**
 * Any address that doesn't exist: the /enter splash again, with a tiny "4 0 4 /"
 * marquee running across the screen above the blurred clip, and Restart in Enter's
 * place. A dead or retired link restarts the visit: Restart morphs straight into
 * home, in place (components/enter/Splash). Keep the tree in step with app/page.tsx.
 */
export default function NotFound() {
  return (
    <Splash
      label="Restart"
      title={
        <>
          <h1 className="sr-only">404 - page not found</h1>
          {/* Two identical runs side by side; the track slides left by one run and loops.
              Still (the start of the line) under reduced motion. Edges fade out. */}
          <div
            aria-hidden
            className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)]"
          >
            <div className="flex w-max animate-[marquee_100s_linear_infinite] motion-reduce:animate-none">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="whitespace-pre text-12 leading-[1.1] tracking-[-0.02em] text-ink"
                >
                  {RUN}
                </span>
              ))}
            </div>
          </div>
        </>
      }
    >
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
