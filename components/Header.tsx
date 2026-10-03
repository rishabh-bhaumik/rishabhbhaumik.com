"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV, SITE } from "@/data/site";
import { EASE } from "@/lib/motion";
import HeaderCoin from "./HeaderCoin";
import LocalClock from "./LocalClock";

/** Each item fades up and un-blurs, one after another across the bar. */
const headerItem = {
  hidden: { opacity: 0, y: 6, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, delay: i * 0.06, ease: EASE },
    transitionEnd: { filter: "none" },
  }),
};

/** A nav item that is shown but not yet a link. */
const DISABLED = "cursor-not-allowed select-none text-faint/40";

const LEFT = NAV.filter((item) => item.side === "left");

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  /** One half of the wide nav. `from` continues the entrance stagger across the header. */
  const navSet = (side: "left" | "right", from: number, place: string) => (
    <nav
      aria-label={side === "left" ? "Primary" : "Secondary"}
      className={`hidden items-center gap-6 sm:flex ${place}`}
    >
      {NAV.filter((item) => item.side === side).map((item, i) => {
        const isCurrent = !!item.current && pathname === item.current;
        return (
          <m.div key={item.label} variants={headerItem} custom={from + i}>
            {item.disabled ? (
              <span
                aria-disabled="true"
                className={`block py-1 text-14 lowercase tracking-[0.02em] ${DISABLED}`}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`block py-1 text-14 lowercase tracking-[0.02em] transition-colors ${
                  isCurrent
                    ? "border-b border-nav-current text-nav-current shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                    : "text-faint hover:text-ink focus-visible:text-ink"
                }`}
              >
                {item.label}
              </Link>
            )}
          </m.div>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-bg/90">
      {/* Wide: three columns — links left, the logo centred, links right. Narrow: menu button and logo. */}
      <m.div
        initial="hidden"
        animate="show"
        className="flex h-16 w-full items-center justify-between px-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-6"
      >
        {/* Left — Home, Work, Play / mobile menu toggle */}
        {navSet("left", 0, "justify-self-start")}
        <m.button
          variants={headerItem}
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
        </m.button>

        {/* Centre — name, logo and local time in a row (the logo flips on hover) */}
        <m.div
          variants={headerItem}
          custom={LEFT.length}
          className="justify-self-center"
        >
          <Link
            href="/"
            aria-label={`${SITE.name} — home`}
            className="group flex items-center gap-2 rounded-[36px] px-1 py-1 transition-opacity hover:opacity-90 sm:gap-3"
          >
            <span className="hidden whitespace-nowrap font-mono text-12 leading-tight text-faint sm:block">
              {SITE.name}
            </span>
            <HeaderCoin />
            {/* Phones show the logo alone. */}
            <span className="hidden sm:contents">
              <LocalClock />
            </span>
          </Link>
        </m.div>

        {/* Right — Resume, About */}
        {navSet("right", LEFT.length + 1, "justify-self-end")}
      </m.div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {open && (
          <m.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative overflow-hidden border-b border-white/10 bg-bg/95 sm:hidden"
          >
            <ul className="mx-auto flex max-w-[var(--shell-max)] flex-col px-4 py-2">
              {NAV.map((item) => {
                const isCurrent = !!item.current && pathname === item.current;
                return (
                  <li key={item.label}>
                    {item.disabled ? (
                      <span
                        aria-disabled="true"
                        className={`inline-block py-3 text-16 lowercase ${DISABLED}`}
                      >
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`inline-block py-3 text-16 lowercase transition-colors ${
                          isCurrent
                            ? "border-b border-nav-current text-nav-current"
                            : "text-faint hover:text-ink"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
