"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Project } from "@/data/site";
import { revealItem, EASE } from "@/lib/motion";

const MotionLink = motion.create(Link);

/**
 * The media frame. Two treatments:
 *  - `cover`: full-bleed art on a dark card with a bottom scrim that lifts on
 *    hover (Figma 7834-22472).
 *  - default: a mockup centered on the violet gradient, sized by `mediaWidth`.
 */
function CardMedia({
  project,
  reduce,
  aspect,
  sizes,
}: {
  project: Project;
  reduce: boolean;
  aspect: string;
  sizes: string;
}) {
  const [mediaOk, setMediaOk] = useState(true);

  if (project.cover && project.media && mediaOk) {
    return (
      <div
        className={`relative ${aspect} w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c1c] to-black`}
      >
        <motion.div
          variants={{
            rest: { scale: reduce ? 1.04 : 1 },
            hover: { scale: 1.04 },
          }}
          transition={{ duration: 0.5, ease: EASE }}
          className="absolute inset-0 origin-center will-change-transform"
        >
          <Image
            src={project.media}
            alt={project.title}
            fill
            onError={() => setMediaOk(false)}
            className="object-contain object-center brightness-[0.9] transition-[filter] duration-500 group-hover:brightness-100"
            sizes={sizes}
          />
        </motion.div>
        {/* Bottom scrim — the filter that lifts on hover. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-500 group-hover:opacity-0" />
      </div>
    );
  }

  return (
    <div
      className={`relative grid ${aspect} w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-brand to-brand-bold`}
    >
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
            sizes={sizes}
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
  );
}

/** Brand-chip icon shared by both card layouts. */
function MarkIcon({ size }: { size: "sm" | "lg" }) {
  const box = size === "lg" ? "size-6" : "size-5";
  const rounded = size === "lg" ? "rounded-md" : "rounded";
  return (
    <span
      className={`grid ${box} shrink-0 place-items-center overflow-hidden ${rounded} bg-brand p-0.5`}
    >
      <Image
        src="/media/bimakavach-mark.svg"
        alt=""
        width={size === "lg" ? 14 : 12}
        height={size === "lg" ? 12 : 10}
        className={size === "lg" ? "h-auto w-3.5" : "h-auto w-3"}
      />
    </span>
  );
}

function Tag({ tag, className = "" }: { tag: string; className?: string }) {
  return (
    <span
      className={`shrink-0 rounded-full bg-surface px-3 py-1.5 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border ${className}`}
    >
      {tag}
    </span>
  );
}

export default function ProjectCard({
  project,
  view = "list",
}: {
  project: Project;
  view?: "grid" | "list";
}) {
  const reduce = useReducedMotion();
  const itemProps = reduce ? {} : { variants: revealItem };
  const layoutProps = reduce
    ? {}
    : { layout: true as const, transition: { duration: 0.5, ease: EASE } };
  const hoverProps = {
    initial: "rest" as const,
    animate: "rest" as const,
    whileHover: "hover" as const,
    whileFocus: "hover" as const,
  };

  if (view === "grid") {
    return (
      <MotionLink
        href={project.href}
        {...itemProps}
        {...layoutProps}
        {...hoverProps}
        className="group block focus:outline-none"
      >
        <CardMedia
          project={project}
          reduce={!!reduce}
          aspect="aspect-video"
          sizes="(max-width: 640px) 100vw, 600px"
        />

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MarkIcon size="sm" />
              <h2 className="font-display text-[22px] leading-tight text-ink">
                {project.title}
              </h2>
            </div>
            <Tag tag={project.tag} />
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
      {...hoverProps}
      className="group block px-4 focus:outline-none sm:px-6"
    >
      <CardMedia
        project={project}
        reduce={!!reduce}
        aspect="aspect-[800/544]"
        sizes="(max-width: 832px) 100vw, 832px"
      />

      {/* Footer. On mobile the tag sits on the title row and the description
          spans the full width (the Play-card layout). On desktop the tag
          floats to the far right of the whole block. */}
      <div className="mt-5 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5">
            <MarkIcon size="lg" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-[28px] leading-tight text-ink">
                {project.title}
              </h2>
              <Tag tag={project.tag} className="mt-1.5 sm:hidden" />
            </div>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted sm:max-w-[34rem]">
              {project.description}
            </p>
          </div>
        </div>
        <Tag tag={project.tag} className="mt-1.5 hidden sm:block" />
      </div>
    </MotionLink>
  );
}
