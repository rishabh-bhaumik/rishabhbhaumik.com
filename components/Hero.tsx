"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BIO, SITE } from "@/data/site";
import { EASE } from "@/lib/motion";
import CompanyChip from "./CompanyChip";

const heroItem = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE },
  }),
};

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <motion.section
      initial="hidden"
      animate="show"
      className="flex flex-col items-center gap-6 px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24"
    >
      {/* Looping showreel — the "orbitting" piece. Vimeo's `background=1` gives
          autoplay + muted + loop with no controls and no pointer interaction. */}
      <motion.div
        variants={reduce ? undefined : heroItem}
        custom={0}
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
      >
        <iframe
          src={SITE.heroVideo}
          title="Showreel"
          allow="autoplay; fullscreen"
          loading="lazy"
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
        />
      </motion.div>

      {/* Version pill */}
      <motion.span
        variants={reduce ? undefined : heroItem}
        custom={1}
        className="w-fit rounded-full bg-surface px-3 py-1 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border"
      >
        {SITE.version}
      </motion.span>

      {/* Headline */}
      <motion.h1
        variants={reduce ? undefined : heroItem}
        custom={2}
        className="font-display text-balance text-[clamp(2.5rem,7vw,3.5rem)] leading-[1.05] text-ink"
      >
        {SITE.greeting}
      </motion.h1>

      {/* Bio with inline company chips */}
      <motion.p
        variants={reduce ? undefined : heroItem}
        custom={3}
        className="max-w-[34rem] text-[18px] leading-[1.5] text-muted"
      >
        {BIO.lead} <CompanyChip company={BIO.current} /> {BIO.middle}{" "}
        {BIO.companies.map((c, i) => (
          <span key={c.name}>
            <CompanyChip company={c} />
            {i < BIO.companies.length - 1 ? ", " : ", "}
          </span>
        ))}
        {BIO.tail}
      </motion.p>
    </motion.section>
  );
}
