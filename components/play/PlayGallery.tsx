"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { staggerContainer, EASE } from "@/lib/motion";
import type { PlayItem } from "@/data/site";
import PlayCard from "./PlayCard";
import ViewToggle from "@/components/ViewToggle";

export type PlayCardData = PlayItem & { thumb: string | null };

type View = "grid" | "list";

export default function PlayGallery({ items }: { items: PlayCardData[] }) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("grid");

  const listProps = reduce
    ? {}
    : {
        variants: staggerContainer(0.08),
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: { once: true, margin: "0px 0px -12% 0px" },
      };

  return (
    <div className="flex flex-col gap-8">
      <ViewToggle view={view} onViewChange={setView} layoutId="play-view-pill" />

      <LayoutGroup>
        <motion.div
          {...listProps}
          layout={!reduce}
          transition={{ duration: 0.5, ease: EASE }}
          className={
            view === "grid"
              ? "grid grid-cols-1 gap-x-16 gap-y-14 sm:grid-cols-2"
              : "mx-auto flex w-full max-w-[var(--content-max)] flex-col gap-24"
          }
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <PlayCard
                key={item.slug}
                item={item}
                reduce={!!reduce}
                view={view}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
