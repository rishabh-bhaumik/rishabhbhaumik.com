"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSfx } from "@/lib/sfx";
import { EASE } from "@/lib/motion";

export default function SoundToggle() {
  const { muted, toggle } = useSfx();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      data-no-click-sfx
      className="fixed bottom-4 right-4 z-40 grid size-9 place-items-center rounded-full text-faint transition-colors hover:bg-surface hover:text-ink"
    >
      <span className="relative size-4">
        <Image
          src="/media/Iconography/sound-music-control/volume.svg"
          alt=""
          width={16}
          height={16}
          className="size-4 invert"
        />
        <AnimatePresence>
          {muted && (
            <motion.svg
              key="strike"
              viewBox="0 0 24 24"
              className="absolute inset-0 size-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <motion.line
                x1="1"
                y1="23"
                x2="23"
                y2="1"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                exit={{ pathLength: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
