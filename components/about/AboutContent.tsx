"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import HeroCoin from "@/components/about/HeroCoin";
import PhotoCarousel from "@/components/about/PhotoCarousel";
import LazyVideo from "@/components/LazyVideo";

const at = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default function AboutContent() {

  return (
    <>
      <Header />
      <main className="w-full pb-20">
        {/* Hero — flipping coin box + heading + intro. A CSS entrance (.rise), so it paints before hydration. */}
        <section className="flex flex-col gap-10 pt-2">
          {/* Same box as the home hero's showreel: 16:9, rounded, black (page colour in light mode), in the content column. */}
          <div className="mx-auto w-full max-w-[var(--content-max)] px-4 sm:px-6">
            <div style={at(0)} className="rise relative aspect-video w-full overflow-hidden rounded-2xl bg-black light:bg-bg">
              <HeroCoin />
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-col gap-6 px-4 sm:px-6">
            <h1 style={at(1)} className="rise-text text-center font-display text-32 leading-[1.1] sm:text-44 text-ink">
              Who&rsquo;s this Jack again?
            </h1>
            <div style={at(2)} className="rise-text flex justify-center">
              <p className="max-w-[640px] text-center text-18 leading-[1.7] text-muted">
                Hello World, I&rsquo;m Rishabh- a Visual Designer based out of
                Bengaluru, India. As a thespian and film student who&rsquo;s
                started his career in video editing and creative direction, I
                have seen how the power of stories help shape experiences.
              </p>
            </div>
          </div>
        </section>

        {/* Heritage — centered 700 column + carousel */}
        <Reveal
          as="section"
          media
          className="mx-auto mt-28 flex w-full max-w-[var(--reading-max)] flex-col gap-5 px-4 sm:px-6"
        >
          <h2 className="text-center font-display text-24 sm:text-36 leading-tight text-ink">
            My heritage forms the core of my being
          </h2>
          <p className="text-center text-16 leading-[1.7] text-muted">
            My experiences, weather good or bad, have shaped who I am today. The
            duality of privilege and burden, of wealth and poverty, and of peace
            and chaos, are all potent in forming my earliest impressions on this
            wonderful thing we call living.
          </p>
          <div className="mt-6">
            <PhotoCarousel />
          </div>
        </Reveal>

        {/* Curiosity — one vertical stack, as wide as its headline: the clip
            (4:3, the stack's width) on top, the text below it.
            The headline sets the width; the paragraph only fills it. */}
        <section className="mt-28 px-4 sm:px-6">
          <div className="mx-auto flex w-fit max-w-full flex-col gap-3">
            <Reveal media>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                <LazyVideo
                  src="/media/about/curiosity.mp4"
                  poster="/media/about/curiosity.webp"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(144deg,rgba(0,0,0,0.6)_0%,transparent_37%,transparent_66%,rgba(0,0,0,0.6)_100%)]" />
              </div>
            </Reveal>
            <Reveal className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-4">
                <span className="w-fit rounded-full bg-surface px-3 py-2 font-mono text-12 tracking-wide text-faint ring-1 ring-border">
                  About Me
                </span>
                <h2 className="text-center font-display text-24 leading-tight text-ink sm:whitespace-nowrap sm:text-28">
                  Where does curiosity come from?
                </h2>
              </div>
              <p className="w-0 min-w-full text-center text-16 leading-[1.7] text-muted">
                My childhood was filled with awe. I remember distinctly sitting on
                the floor as a toddler, looking awestruck at the window in front of
                me. It&rsquo;s a sunny afternoon in the hot, hot city of Kolkata.
                Sparks of dust, floating as if in space, revealing themselves only
                during the moments the light hits perfectly. Reminds me of how
                reflections on water sparkle in the dazzling sun, like diamonds.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
