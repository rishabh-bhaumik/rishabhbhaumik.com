"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import HeroCoin from "@/components/about/HeroCoin";
import PhotoCarousel from "@/components/about/PhotoCarousel";
import { EASE } from "@/lib/motion";

const aboutItem = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: i * 0.1, ease: EASE },
  }),
};

export default function AboutContent() {
  const reduce = useReducedMotion();

  return (
    <>
      <Header />
      <main className="w-full">
        {/* Hero — flipping coin box + heading (left) + intro (right) */}
        <motion.section
          initial="hidden"
          animate="show"
          className="flex flex-col gap-10 pt-2"
        >
          {/* Same box as the home hero's showreel: 16:9, rounded, black, in the content column. */}
          <div className="mx-auto w-full max-w-[var(--content-max)] px-4 sm:px-6">
            <motion.div
              variants={reduce ? undefined : aboutItem}
              custom={0}
              className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
            >
              <HeroCoin />
            </motion.div>
          </div>

          <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-col gap-6 px-4 sm:px-6">
            <motion.h1
              variants={reduce ? undefined : aboutItem}
              custom={1}
              className="text-center font-display text-32 leading-[1.1] sm:text-44 text-ink"
            >
              Who&rsquo;s this Jack again?
            </motion.h1>
            <motion.div
              variants={reduce ? undefined : aboutItem}
              custom={2}
              className="flex justify-center"
            >
              <p className="max-w-[640px] text-center text-18 leading-[1.7] text-muted">
                Hello World, I&rsquo;m Rishabh- a Visual Designer based out of
                Bengaluru, India. As a thespian &amp; film student who&rsquo;s
                started his career in video editing &amp; creative direction, I
                have seen how the power of stories help shape experiences.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Heritage — centered 700 column + carousel */}
        <Reveal
          as="section"
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

        {/* Curiosity — heading (right) + paragraph (left) + full-bleed media */}
        <section className="mt-28 flex flex-col gap-10">
          <Reveal className="mx-auto flex w-full max-w-[var(--content-max)] flex-col gap-6 px-4 sm:px-6">
            <div className="flex justify-center">
              <div className="flex w-full max-w-[581px] flex-col items-center gap-4">
                <span className="w-fit rounded-full bg-surface px-3 py-2 font-mono text-12 tracking-wide text-faint ring-1 ring-border">
                  About Me
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded bg-black p-[3px] sm:size-6">
                    <Image
                      src="/media/about/mark.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="size-full"
                    />
                  </span>
                  <h2 className="font-display text-24 sm:text-28 leading-tight text-ink">
                    Where does curiosity come from?
                  </h2>
                </div>
              </div>
            </div>
            <p className="mx-auto w-full max-w-[581px] text-center text-16 leading-[1.7] text-muted">
              My childhood was filled with awe. I remember distinctly sitting on
              the floor as a toddler, looking awestruck at the window in front of
              me. It&rsquo;s a sunny afternoon in the hot, hot city of Kolkata.
              Sparks of dust, floating as if in space, revealing themselves only
              during the moments the light hits perfectly. Reminds me of how
              reflections on water sparkle in the dazzling sun, like diamonds.
            </p>
          </Reveal>

          <Reveal className="mx-auto w-full max-w-[var(--content-max)] px-4 sm:px-6">
            <div className="relative aspect-[1512/1080] w-full overflow-hidden rounded-2xl sm:aspect-[1512/900]">
              <video
                src="/media/about/curiosity.webm"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(144deg,rgba(0,0,0,0.6)_0%,transparent_37%,transparent_66%,rgba(0,0,0,0.6)_100%)]" />
            </div>
          </Reveal>
        </section>

        <Footer />
      </main>
    </>
  );
}
