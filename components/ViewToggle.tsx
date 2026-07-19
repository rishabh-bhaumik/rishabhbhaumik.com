"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { useSfx } from "@/lib/sfx";

type View = "grid" | "list";

export default function ViewToggle({
  view,
  onViewChange,
  layoutId,
}: {
  view: View;
  onViewChange: (v: View) => void;
  layoutId: string;
}) {
  const { play } = useSfx();

  return (
    <div className="hidden items-center justify-end sm:flex sm:min-w-[700px]">
      <div data-no-click-sfx className="flex items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-border">
        <ViewButton
          active={view === "grid"}
          onClick={() => { onViewChange("grid"); play("/media/switcher/view-grid.wav", 0.3); }}
          label="Grid view"
          icon="/media/Iconography/switcher/grid.svg"
          layoutId={layoutId}
        />
        <ViewButton
          active={view === "list"}
          onClick={() => { onViewChange("list"); play("/media/switcher/view-list.wav", 0.3); }}
          label="List view"
          icon="/media/Iconography/switcher/list.svg"
          layoutId={layoutId}
        />
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  icon,
  layoutId,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
  layoutId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`relative grid size-8 place-items-center rounded-full transition-colors ${
        active ? "text-ink" : "text-faint hover:text-ink"
      }`}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-full bg-surface-2 ring-1 ring-white/10"
          transition={{ duration: 0.3, ease: EASE }}
        />
      )}
      <Image
        src={icon}
        alt=""
        width={14}
        height={14}
        className={`relative size-3.5 ${active ? "invert" : "invert opacity-50"}`}
      />
    </button>
  );
}
