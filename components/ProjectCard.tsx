"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { m } from "framer-motion";
import type { Project } from "@/data/site";
import { revealMedia, EASE } from "@/lib/motion";
import { useGrowFrame } from "./project/GrowMedia";

const MotionLink = m.create(Link);

/** Corner radius of a list card while its frame is small (it squares off at full size). */
const GROW_RADIUS = 16;

/**
 * The media frame. Two treatments:
 *  - `cover`: full-bleed art on a dark card with a bottom scrim that lifts on
 *    hover (Figma 7834-22472).
 *  - default: a mockup centered on black, sized by `mediaWidth`.
 * With `grow` (the list view) the frame spans the sheet and grows like a project
 * page's media (components/project/GrowMedia): 1000/1200 of its width as it comes
 * in, full width once it's all on screen, shrinking back as it leaves.
 */
function CardMedia({
  project,
  aspect,
  sizes,
  eager,
  grow = false,
}: {
  project: Project;
  aspect: string;
  sizes: string;
  /** The first card: its image is the page's largest paint, so fetch it first. */
  eager: boolean;
  grow?: boolean;
}) {
  const [mediaOk, setMediaOk] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const frame = useGrowFrame(ref, GROW_RADIUS);
  const cover = Boolean(project.cover && project.media && mediaOk);

  const fill = cover
    ? "bg-gradient-to-br from-surface to-bg"
    : grow
      ? "bg-surface"
      : "bg-bg ring-1 ring-border";

  const content = cover ? (
    <>
      <m.div
        variants={{
          rest: { scale: 1 },
          hover: { scale: 1.04 },
        }}
        transition={{ duration: 0.5, ease: EASE }}
        className="absolute inset-0 origin-center group-hover:will-change-transform"
      >
        <Image
          src={project.media!}
          alt={project.title}
          fill
          preload={eager}
          fetchPriority={eager ? "high" : undefined}
          onError={() => setMediaOk(false)}
          className="object-contain object-center"
          sizes={sizes}
        />
        {/* Dims the art a touch at rest; fading an overlay is cheaper than animating a filter. */}
        <div className="pointer-events-none absolute inset-0 bg-black/10 light:bg-bg/10 transition-opacity duration-500 group-hover:opacity-0" />
      </m.div>
      {/* Bottom scrim — the filter that lifts on hover. Washes toward the page colour in light mode. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 light:from-bg/60 to-transparent transition-opacity duration-500 group-hover:opacity-0" />
    </>
  ) : project.media && mediaOk ? (
    <m.div
      variants={{
        rest: { scale: 1 },
        hover: { scale: 1.06 },
      }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative origin-center group-hover:will-change-transform"
      style={{ width: project.mediaWidth ?? "70%" }}
    >
      <Image
        src={project.media}
        alt={project.title}
        width={1200}
        height={760}
        preload={eager}
        fetchPriority={eager ? "high" : undefined}
        onError={() => setMediaOk(false)}
        className="h-auto w-full rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        sizes={sizes}
      />
    </m.div>
  ) : (
    <Image
      src="/media/bimakavach-mark.svg"
      alt=""
      width={40}
      height={34}
      className="h-10 w-auto opacity-30"
    />
  );

  if (!grow) {
    return (
      <div className={`relative grid ${aspect} w-full place-items-center overflow-hidden rounded-2xl ${fill}`}>
        {content}
      </div>
    );
  }

  // The frame is clipped and its contents scaled in step (as in GrowMedia), so nothing
  // re-lays out while it grows. Reduced motion keeps both at full size (globals.css).
  return (
    <div ref={ref} className={`relative ${aspect} w-full`}>
      <m.div data-grow style={{ clipPath: frame.clipPath }} className={`absolute inset-0 overflow-hidden ${fill}`}>
        <m.div
          data-grow-scale
          style={{ scale: frame.scale }}
          className="absolute inset-0 grid place-items-center will-change-transform"
        >
          {content}
        </m.div>
      </m.div>
    </div>
  );
}

function Tag({ tag, className = "" }: { tag: string; className?: string }) {
  return (
    <span
      className={`shrink-0 rounded-full bg-surface px-2 py-1 font-mono text-10 tracking-wide text-faint ring-1 ring-border ${className}`}
    >
      {tag}
    </span>
  );
}

export default function ProjectCard({
  project,
  view = "list",
  index = -1,
}: {
  project: Project;
  view?: "grid" | "list";
  /** Position in the gallery; the first card's image loads first. */
  index?: number;
}) {
  const eager = index === 0;
  const itemProps = { variants: revealMedia };
  // Only the card's position animates between views, so its image is never stretched.
  const layoutProps = { layout: "position" as const, transition: { duration: 0.5, ease: EASE } };
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
          eager={eager}
          aspect="aspect-video"
          sizes="(max-width: 640px) 100vw, 600px"
        />

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-20 leading-tight text-ink">
              {project.title}
            </h2>
            <Tag tag={project.tag} />
          </div>
          <p className="text-14 leading-relaxed text-muted">
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
      className="group block focus:outline-none"
    >
      {/* The frame spans the sheet; the text below keeps the page's gutter. */}
      <CardMedia
        project={project}
        eager={eager}
        grow
        // 1200×675 like a project page's frames, so it fits on screen and reaches full size.
        aspect="aspect-[1200/675]"
        sizes="(min-width: 1200px) 1200px, 100vw"
      />

      {/* Footer. On mobile the tag sits on the title row and the description
          spans the full width (the Play-card layout). On desktop the tag
          floats to the far right of the whole block. */}
      <div className="mt-5 flex px-4 sm:px-6 flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-28 leading-tight text-ink">
                {project.title}
              </h2>
              <Tag tag={project.tag} className="mt-1.5 sm:hidden" />
            </div>
            <p className="mt-1.5 text-14 leading-relaxed text-muted sm:max-w-[34rem]">
              {project.description}
            </p>
          </div>
        </div>
        <Tag tag={project.tag} className="mt-1.5 hidden sm:block" />
      </div>
    </MotionLink>
  );
}
