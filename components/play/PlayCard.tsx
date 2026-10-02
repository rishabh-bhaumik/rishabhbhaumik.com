"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import { revealMedia, EASE } from "@/lib/motion";

// The live coin (renderer and shaders) is its own chunk, loaded only on the client.
const IconLabCover = dynamic(() => import("./IconLabCover"), { ssr: false });
import type { PlayCardData } from "./PlayGallery";

/** Cover for a link item: the lab's coin on black; the whole cover opens the page in a new tab. */
function LinkCover({ item }: { item: PlayCardData }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${item.title} in a new tab`}
      className="absolute inset-0 grid place-items-center bg-black"
    >
      <IconLabCover />
    </a>
  );
}

/** A title that is a link when the item is one. */
function Title({ item, className }: { item: PlayCardData; className: string }) {
  const title = <h3 className={className}>{item.title}</h3>;
  if (!item.href) return title;
  return (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
      {title}
    </a>
  );
}

export default function PlayCard({
  item,
  view,
  index = -1,
}: {
  item: PlayCardData;
  view: "grid" | "list";
  /** Position in the gallery; the first cover loads first. */
  index?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const itemProps = { variants: revealMedia };
  // Only the card's position animates between views, so covers (and the live coin) are never stretched.
  const layoutProps = { layout: "position" as const, transition: { duration: 0.5, ease: EASE } };
  // The first row: their covers are on screen at load, so fetch them first.
  const eager = index >= 0 && index < 2;

  if (view === "list") {
    return (
      <m.div {...itemProps} {...layoutProps} data-card className="px-4 sm:px-6">
        {/* Media — matches ProjectCard: aspect-[800/544], full width */}
        <div className="relative grid aspect-[800/544] w-full place-items-center overflow-hidden rounded-2xl bg-[#0a0a0c] bg-[radial-gradient(130%_130%_at_82%_12%,rgba(255,255,255,0.07)_0%,rgba(10,10,12,0)_46%)]">
          {item.href ? (
            <LinkCover item={item} />
          ) : playing ? (
            <iframe
              src={item.embed}
              title={item.title}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${item.title}`}
              className="group absolute inset-0 h-full w-full cursor-pointer"
            >
              {item.thumb && (
                <Image
                  src={item.thumb}
                  preload={eager}
                  fetchPriority={eager ? "high" : undefined}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 832px"
                  className="object-cover"
                />
              )}
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-14 place-items-center rounded-full bg-black/40 ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                  <svg
                    viewBox="0 0 24 24"
                    className="ml-0.5 size-6 fill-white"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          )}
        </div>

        {/* Meta row — matches ProjectCard exactly */}
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <Title item={item} className="font-display text-28 leading-tight text-ink" />
            <p className="mt-1.5 max-w-[34rem] text-14 leading-relaxed text-muted">
              {item.description}
            </p>
          </div>
          <span className="mt-1.5 shrink-0 rounded-full bg-surface px-3 py-1 font-mono text-10 tracking-wide text-faint ring-1 ring-border">
            {item.tag}
          </span>
        </div>
      </m.div>
    );
  }

  // Grid view
  return (
    <m.div {...itemProps} {...layoutProps} data-card className="flex flex-col gap-4">
      {/* Media */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0a0a0c] bg-[radial-gradient(130%_130%_at_82%_12%,rgba(255,255,255,0.07)_0%,rgba(10,10,12,0)_46%)]">
        {item.href ? (
          <LinkCover item={item} />
        ) : playing ? (
          <iframe
            src={item.embed}
            title={item.title}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${item.title}`}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {item.thumb && (
              <Image
                src={item.thumb}
                  preload={eager}
                  fetchPriority={eager ? "high" : undefined}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-cover"
              />
            )}
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-14 place-items-center rounded-full bg-black/40 ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                <svg
                  viewBox="0 0 24 24"
                  className="ml-0.5 size-6 fill-white"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Title + tag + description */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <Title item={item} className="font-display text-20 leading-tight text-ink" />
          <span className="shrink-0 rounded-full bg-surface px-3 py-1.5 font-mono text-10 tracking-wide text-faint ring-1 ring-border">
            {item.tag}
          </span>
        </div>
        <p className="text-14 leading-relaxed text-muted">
          {item.description}
        </p>
      </div>
    </m.div>
  );
}
