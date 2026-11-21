"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV, SITE } from "@/data/site";
import { EASE } from "@/lib/motion";
import { DockControls } from "../Dock";
import LocalClock from "../LocalClock";

/**
 * The ruled sheet's top bar (Figma 8780:36250): the mark, name and the visitor's local
 * time on the left; the page links and the view controls (the dock's settings, which
 * step out of the corner while this bar is up) on the right. Sticks to the top. On
 * phones the links fold into a menu. The site's one nav: on pages off the sheet it runs
 * full width with its contents in the same 1200px column.
 */
export default function SheetNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const link = (item: (typeof NAV)[number], big = false) => {
    const current = !!item.current && pathname === item.current;
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={current ? "page" : undefined}
        className={`block lowercase transition-colors ${
          big ? "py-3 text-16" : "py-1 text-14 leading-[22.4px] tracking-[0.02em]"
        } ${current ? "text-ink" : "text-faint hover:text-ink focus-visible:text-ink"}`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header data-sheet-nav className="sticky top-0 z-50 border-b border-rule bg-bg">
      <div className="mx-auto flex w-full max-w-[var(--shell-max)] items-center justify-between px-4 py-2 sm:px-6">
        <Link href="/" aria-label={`${SITE.name}, home`} className="flex items-center gap-0.5">
          <span className="grid size-11 place-items-center">
            <Image src="/media/logo-mark.svg" alt="" width={32} height={32} className="light:invert" />
          </span>
          <span className="flex flex-col items-start gap-1">
            <span className="text-12 leading-none text-faint">{SITE.name}</span>
            <LocalClock compact dotFirst timeZone="Asia/Kolkata" label="(INDIA)" />
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <nav aria-label="Primary" className="hidden items-center gap-6 sm:flex">
            {NAV.map((item) => link(item))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid size-9 place-items-center rounded-full text-faint transition-colors hover:text-ink sm:hidden"
            >
              {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
            </button>
            <DockControls drop="down" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <m.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden border-t border-rule sm:hidden"
          >
            <div className="flex flex-col px-4 py-2">{NAV.map((item) => link(item, true))}</div>
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
