"use client";

import { useState } from "react";
import { LayoutGroup, m } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import type { Project } from "@/data/site";
import ProjectCard from "./ProjectCard";
import ViewToggle from "./ViewToggle";

type View = "grid" | "list";

export default function WorkGallery({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<View>("grid");

  // Staggered in as the list scrolls into view (not all at once on mount).
  const listProps = {
    variants: staggerContainer(0.08),
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true, margin: "0px 0px -8% 0px" },
  };

  return (
    <div className="flex flex-col gap-8">
      <ViewToggle view={view} onViewChange={setView} layoutId="work-view-pill" />

      <LayoutGroup>
        <m.div
          {...listProps}
          className={
            view === "grid"
              ? "grid grid-cols-1 gap-x-16 gap-y-14 sm:grid-cols-2"
              : "mx-auto flex w-full max-w-[var(--content-max)] flex-col gap-24"
          }
        >
          {projects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} view={view} index={index} />
          ))}
        </m.div>
      </LayoutGroup>
    </div>
  );
}
