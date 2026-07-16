"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV, SITE } from "@/data/site";
import { EASE } from "@/lib/motion";
import LocalClock from "./LocalClock";

const headerItem = {
  hidden: { opacity: 0, y: 6, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, delay: i * 0.06, ease: EASE },
  }),
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-bg/80 backdrop-blur-xl">
      <motion.div
        initial="hidden"
        animate="show"
        className="mx-auto flex h-16 w-full max-w-[var(--shell-max)] items-center justify-between px-4 sm:min-w-[700px] sm:px-6"
      >
        {/* Left — desktop nav / mobile menu toggle */}
        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {NAV.map((item, i) => {
            const isCurrent = !!item.current && pathname === item.current;
            return (
              <motion.div
                key={item.label}
                variants={reduce ? undefined : headerItem}
                custom={i}
              >
                <Link
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-[14px] tracking-[0.02em] transition-colors ${
                    isCurrent
                      ? "text-ink underline decoration-white/40 underline-offset-[6px]"
                      : "text-faint hover:text-ink focus-visible:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>
        <motion.button
          variants={reduce ? undefined : headerItem}
          custom={0}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-9 place-items-center rounded-full text-faint transition-colors hover:text-ink sm:hidden"
        >
          {open ? (
            <X className="size-5" strokeWidth={1.5} />
          ) : (
            <Menu className="size-5" strokeWidth={1.5} />
          )}
        </motion.button>

        {/* Right — identity + clock/status link */}
        <motion.div
          variants={reduce ? undefined : headerItem}
          custom={NAV.length}
        >
          <Link
            href="/"
            aria-label={`${SITE.name} — home`}
            className="group flex items-center gap-2 rounded-[36px] px-1 py-1 transition-opacity hover:opacity-90"
          >
            <span className="relative grid size-11 place-items-center">
              <Image
                src="/media/logo-mark.svg"
                alt=""
                width={32}
                height={32}
                className="size-8 transition-transform duration-300 group-hover:rotate-[8deg]"
                priority
              />
            </span>
            <span className="flex flex-col items-end pr-1">
              <span className="hidden whitespace-nowrap font-mono text-[14px] leading-tight text-faint sm:block">
                {SITE.name}
              </span>
              <LocalClock />
            </span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative overflow-hidden border-b border-white/10 bg-bg/95 backdrop-blur-xl sm:hidden"
          >
            <ul className="mx-auto flex max-w-[var(--shell-max)] flex-col px-4 py-2">
              {NAV.map((item) => {
                const isCurrent = !!item.current && pathname === item.current;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`block py-3 text-[16px] transition-colors ${
                        isCurrent
                          ? "text-ink underline decoration-white/40 underline-offset-[6px]"
                          : "text-faint hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
