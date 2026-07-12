"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Project } from "@/data/site";
import { revealItem, EASE } from "@/lib/motion";

const MotionLink = motion.create(Link);

export default function ProjectCard({
  project,
  view = "list",
}: {
  project: Project;
  view?: "grid" | "list";
}) {
  const reduce = useReducedMotion();
  const [mediaOk, setMediaOk] = useState(true);
  const itemProps = reduce ? {} : { variants: revealItem };
  const layoutProps = reduce
    ? {}
    : { layout: true as const, transition: { duration: 0.5, ease: EASE } };

  if (view === "grid") {
    return (
      <MotionLink
        href={project.href}
        {...itemProps}
        {...layoutProps}
        className="group block focus:outline-none"
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileFocus="hover"
      >
        <div className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-brand to-brand-bold">
          {project.media && mediaOk ? (
            <motion.div
              variants={{
                rest: { scale: reduce ? 1.06 : 1 },
                hover: { scale: 1.06 },
              }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative origin-center will-change-transform"
              style={{ width: project.mediaWidth ?? "70%" }}
            >
              <Image
                src={project.media}
                alt={project.title}
                width={1200}
                height={760}
                onError={() => setMediaOk(false)}
                className="h-auto w-full rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                sizes="(max-width: 640px) 100vw, 600px"
              />
            </motion.div>
          ) : (
            <Image
              src="/media/bimakavach-mark.svg"
              alt=""
              width={40}
              height={34}
              className="h-10 w-auto opacity-30"
            />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded bg-brand p-0.5">
                <Image
                  src="/media/bimakavach-mark.svg"
                  alt=""
                  width={12}
                  height={10}
                  className="h-auto w-3"
                />
              </span>
              <h2 className="font-display text-[22px] leading-tight text-ink">
                {project.title}
              </h2>
            </div>
            <span className="shrink-0 rounded-full bg-surface px-3 py-1.5 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border">
              {project.tag}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed text-muted">
            {project.description}
          </p>
        </div>
      </MotionLink>
    );
  }

  return (
    <MotionLink
      href={project.href}
      {...itemProps}
      {...layoutProps}
      className="group block px-4 focus:outline-none sm:px-6"
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
    >
      <div className="relative grid aspect-[800/544] w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-brand to-brand-bold">
        {project.media && mediaOk ? (
          <motion.div
            variants={{
              rest: { scale: reduce ? 1.06 : 1 },
              hover: { scale: 1.06 },
            }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative origin-center will-change-transform"
            style={{ width: project.mediaWidth ?? "70%" }}
          >
            <Image
              src={project.media}
              alt={project.title}
              width={1200}
              height={760}
              onError={() => setMediaOk(false)}
              className="h-auto w-full rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              sizes="(max-width: 832px) 100vw, 832px"
            />
          </motion.div>
        ) : (
          <Image
            src="/media/bimakavach-mark.svg"
            alt=""
            width={40}
            height={34}
            className="h-10 w-auto opacity-30"
          />
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 grid size-6 shrink-0 place-items-center overflow-hidden rounded-md bg-brand p-0.5">
            <Image
              src="/media/bimakavach-mark.svg"
              alt=""
              width={14}
              height={12}
              className="h-auto w-3.5"
            />
          </span>
          <div>
            <h2 className="font-display text-[28px] leading-tight text-ink">
              {project.title}
            </h2>
            <p className="mt-1.5 max-w-[34rem] text-[15px] leading-relaxed text-muted">
              {project.description}
            </p>
          </div>
        </div>
        <span className="mt-1.5 shrink-0 rounded-full bg-surface px-3 py-1 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border">
          {project.tag}
        </span>
      </div>
    </MotionLink>
  );
}
