"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { staggerContainer, EASE } from "@/lib/motion";
import type { Project } from "@/data/site";
import ProjectCard from "./ProjectCard";
import ViewToggle from "./ViewToggle";

type View = "grid" | "list";

export default function WorkGallery({ projects }: { projects: Project[] }) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("list");

  const listProps = reduce
    ? {}
    : {
        variants: staggerContainer(0.08),
        initial: "hidden" as const,
        animate: "show" as const,
      };

  return (
    <div className="flex flex-col gap-8">
      <ViewToggle view={view} onViewChange={setView} layoutId="work-view-pill" />

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
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} view={view} />
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
