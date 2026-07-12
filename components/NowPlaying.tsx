"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Music } from "lucide-react";
import { NOW_PLAYING } from "@/data/site";
import { useState } from "react";
import { EASE } from "@/lib/motion";

export default function NowPlaying() {
  const reduce = useReducedMotion();
  const [imgOk, setImgOk] = useState(true);

  const motionProps = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 16, filter: "blur(8px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        transition: { duration: 0.8, delay: 0.3, ease: EASE },
      };

  return (
    <motion.a
      href={NOW_PLAYING.href}
      {...motionProps}
      className="group fixed bottom-3 left-3 z-40 hidden items-center gap-2 overflow-hidden rounded-[38px] border border-surface-2/60 bg-surface-2/60 py-1 pl-1 pr-3 shadow-[0_10px_8px_rgba(0,0,0,0.04),0_4px_8px_-4px_rgba(0,0,0,0.1)] backdrop-blur-md transition-colors hover:bg-surface-2/80 lg:flex"
    >
      <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-surface-3">
        {imgOk ? (
          <Image
            src={NOW_PLAYING.art}
            alt={`${NOW_PLAYING.title} cover`}
            fill
            className="object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <span className="grid size-full place-items-center text-faint">
            <Music className="size-5" strokeWidth={1.5} />
          </span>
        )}
      </span>
      <span className="flex flex-col py-1">
        <span className="text-[11px] leading-[14px] text-white/35">
          {NOW_PLAYING.when}
        </span>
        <span className="text-[13px] font-medium leading-5 text-white/90">
          {NOW_PLAYING.title}
        </span>
        <span className="text-[12px] leading-[14px] text-white/50">
          {NOW_PLAYING.artist}
        </span>
      </span>
    </motion.a>
  );
}
