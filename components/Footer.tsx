"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FOOTER, type SocialLink } from "@/data/site";
import { revealItem, staggerContainer } from "@/lib/motion";
import Reveal from "./Reveal";
import {
  IconArrowRight,
  IconMail,
  IconX,
  IconLinkedIn,
  IconInstagram,
} from "./SocialIcons";

const PLATFORM_ICON: Record<SocialLink["platform"], React.FC<{ className?: string }>> = {
  mail: IconMail,
  x: IconX,
  li: IconLinkedIn,
  ig: IconInstagram,
};

export default function Footer() {
  const reduce = useReducedMotion();
  const listProps = reduce
    ? {}
    : {
        variants: staggerContainer(0.07),
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: { once: true, margin: "0px 0px -12% 0px" },
      };
  const itemProps = reduce ? {} : { variants: revealItem };

  return (
    <footer id="contact" className="px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto flex min-h-[420px] max-w-[var(--reading-max)] flex-col justify-between overflow-hidden rounded-3xl border border-border bg-[#0a0a0c] p-8 sm:p-12">
        {/* Blurb */}
        <Reveal
          as="p"
          className="max-w-[34rem] text-[15px] leading-relaxed text-muted"
        >
          {FOOTER.blurb}{" "}
          This is{" "}
          <a href="#" className="underline underline-offset-[3px] decoration-muted/50 hover:text-ink transition-colors">v2</a>
          , made with{" "}
          <a href="https://figma.com" target="_blank" rel="noreferrer" className="underline underline-offset-[3px] decoration-muted/50 hover:text-ink transition-colors">Figma</a>
          {" "}&amp;{" "}
          <a href="https://claude.ai/code" target="_blank" rel="noreferrer" className="underline underline-offset-[3px] decoration-muted/50 hover:text-ink transition-colors">Claude Code</a>
          .
        </Reveal>

        {/* Elsewhere */}
        <div className="mt-12">
          <Reveal
            as="p"
            className="text-[12px] uppercase tracking-[0.6px] text-[#858e9e]"
          >
            Elsewhere
          </Reveal>
          <motion.ul {...listProps} className="mt-3 flex flex-col gap-2">
            {FOOTER.elsewhere.map((link) => {
              const Icon = PLATFORM_ICON[link.platform];
              return (
                <motion.li key={link.handle} {...itemProps}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    aria-label={link.ariaLabel}
                    className="group flex h-[18px] items-center"
                  >
                    {/* Arrow — reveals far-left on hover */}
                    <span className="flex w-0 items-center justify-center overflow-hidden text-white opacity-0 transition-all duration-200 group-hover:mr-1 group-hover:w-3 group-hover:opacity-100 group-focus-visible:mr-1 group-focus-visible:w-3 group-focus-visible:opacity-100">
                      <IconArrowRight />
                    </span>
                    {/* Leader line — lightens on hover */}
                    <span className="flex h-px flex-1 items-center px-1">
                      <span className="h-[0.5px] w-full rounded-[0.2px] bg-[#262c38] transition-colors group-hover:bg-[#363636] group-focus-visible:bg-[#363636]" />
                    </span>
                    {/* Handle — right-aligned, whitens on hover */}
                    <span className="ml-1 shrink-0 whitespace-nowrap text-[14px] leading-[18px] text-[#a3a3a3] transition-colors group-hover:text-white group-focus-visible:text-white">
                      {link.handle}
                    </span>
                    {/* Platform icon — reveals far-right on hover */}
                    <span className="flex w-0 items-center justify-center overflow-hidden text-white opacity-0 transition-all duration-200 group-hover:ml-1 group-hover:w-3 group-hover:opacity-100 group-focus-visible:ml-1 group-focus-visible:w-3 group-focus-visible:opacity-100">
                      <Icon />
                    </span>
                  </a>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      </div>
    </footer>
  );
}
