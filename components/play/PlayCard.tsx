"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { revealItem, EASE } from "@/lib/motion";
import type { PlayCardData } from "./PlayGallery";

export default function PlayCard({
  item,
  reduce,
  view,
}: {
  item: PlayCardData;
  reduce: boolean;
  view: "grid" | "list";
}) {
  const [playing, setPlaying] = useState(false);
  const itemProps = reduce ? {} : { variants: revealItem };
  const prefersReduce = useReducedMotion();
  const layoutProps = prefersReduce ? {} : { layout: true as const, transition: { duration: 0.5, ease: EASE } };

  if (view === "list") {
    return (
      <motion.div {...itemProps} {...layoutProps} className="px-4 sm:px-6">
        {/* Media — matches ProjectCard: aspect-[800/544], full width */}
        <div className="relative grid aspect-[800/544] w-full place-items-center overflow-hidden rounded-2xl bg-[#0a0a0c] bg-[radial-gradient(130%_130%_at_82%_12%,rgba(255,255,255,0.07)_0%,rgba(10,10,12,0)_46%)]">
          {playing ? (
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
            <h3 className="font-display text-[28px] leading-tight text-ink">
              {item.title}
            </h3>
            <p className="mt-1.5 max-w-[34rem] text-[15px] leading-relaxed text-muted">
              {item.description}
            </p>
          </div>
          <span className="mt-1.5 shrink-0 rounded-full bg-surface px-3 py-1 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border">
            {item.tag}
          </span>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div {...itemProps} {...layoutProps} className="flex flex-col gap-4">
      {/* Media */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0a0a0c] bg-[radial-gradient(130%_130%_at_82%_12%,rgba(255,255,255,0.07)_0%,rgba(10,10,12,0)_46%)]">
        {playing ? (
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
          <h3 className="font-display text-[22px] leading-tight text-ink">
            {item.title}
          </h3>
          <span className="shrink-0 rounded-full bg-surface px-3 py-1.5 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border">
            {item.tag}
          </span>
        </div>
        <p className="text-[15px] leading-relaxed text-muted">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}
