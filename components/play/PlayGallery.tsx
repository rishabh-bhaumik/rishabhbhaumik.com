"use client";

import { useState } from "react";
import { LayoutGroup, m } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import type { PlayItem } from "@/data/site";
import PlayCard from "./PlayCard";
import ViewToggle from "@/components/ViewToggle";

export type PlayCardData = PlayItem & { thumb: string | null };

type View = "grid" | "list";

export default function PlayGallery({ items }: { items: PlayCardData[] }) {
  const [view, setView] = useState<View>("list");

  const listProps = {
    variants: staggerContainer(0.08),
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true, margin: "0px 0px -12% 0px" },
  };

  return (
    <div className="flex flex-col gap-8">
      <ViewToggle view={view} onViewChange={setView} layoutId="play-view-pill" />

      <LayoutGroup>
        <m.div
          {...listProps}
          className={
            view === "grid"
              ? "grid grid-cols-1 gap-x-16 gap-y-14 sm:grid-cols-2"
              : "mx-auto flex w-full max-w-[var(--content-max)] flex-col gap-24"
          }
        >
          {items.map((item, index) => (
            <PlayCard key={item.slug} item={item} view={view} index={index} />
          ))}
        </m.div>
      </LayoutGroup>
    </div>
  );
}
