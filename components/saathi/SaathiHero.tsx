"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";

const item = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: i * 0.1, ease: EASE },
  }),
};

export default function SaathiHero({
  children,
}: {
  children: React.ReactNode[];
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8"
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={reduce ? undefined : item} custom={i}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
