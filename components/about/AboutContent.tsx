"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
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
        {/* Hero — full-bleed field + heading (left) + intro (right) */}
        <motion.section
          initial="hidden"
          animate="show"
          className="flex flex-col gap-10 pt-2"
        >
          <motion.div
            variants={reduce ? undefined : aboutItem}
            custom={0}
            className="relative aspect-[1512/850] w-full overflow-hidden border-y border-[#1c1d1f]"
          >
            <video
              src="/media/about/field.webm"
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-[#b0b0b0]/25 to-transparent" />
          </motion.div>

          <div className="mx-auto flex w-full max-w-[var(--shell-max)] flex-col gap-6 px-4 sm:px-6">
            <motion.h1
              variants={reduce ? undefined : aboutItem}
              custom={1}
              className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.1] text-ink"
            >
              Who&rsquo;s this Jack again?
            </motion.h1>
            <motion.div
              variants={reduce ? undefined : aboutItem}
              custom={2}
              className="flex justify-end"
            >
              <p className="max-w-[640px] text-[18px] leading-[1.7] text-muted">
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
          <h2 className="font-display text-[clamp(1.6rem,4.5vw,2.25rem)] leading-tight text-ink">
            My heritage forms the core of my being
          </h2>
          <p className="text-[18px] leading-[1.7] text-muted">
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
          <Reveal className="flex w-full flex-col gap-6 px-4 sm:px-10">
            <div className="flex justify-end">
              <div className="flex w-full max-w-[581px] flex-col gap-4">
                <span className="w-fit rounded-full bg-surface px-3 py-2 font-mono text-[12px] tracking-wide text-faint ring-1 ring-border">
                  About Me
                </span>
                <div className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-black p-1">
                    <Image
                      src="/media/about/mark.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="size-6"
                    />
                  </span>
                  <h2 className="font-display text-[clamp(1.5rem,4vw,2.25rem)] leading-tight text-ink">
                    Where does curiosity come from?
                  </h2>
                </div>
              </div>
            </div>
            <p className="max-w-[480px] text-[18px] leading-[1.7] text-muted">
              My childhood was filled with awe. I remember distinctly sitting on
              the floor as a toddler, looking awestruck at the window in front of
              me. It&rsquo;s a sunny afternoon in the hot, hot city of Kolkata.
              Sparks of dust, floating as if in space, revealing themselves only
              during the moments the light hits perfectly. Reminds me of how
              reflections on water sparkle in the dazzling sun, like diamonds.
            </p>
          </Reveal>

          <Reveal className="relative aspect-[1512/1080] w-full overflow-hidden sm:aspect-[1512/900]">
            <video
              src="/media/about/curiosity.webm"
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(144deg,rgba(0,0,0,0.6)_0%,transparent_37%,transparent_66%,rgba(0,0,0,0.6)_100%)]" />
          </Reveal>
        </section>

        <Footer />
      </main>
    </>
  );
}
