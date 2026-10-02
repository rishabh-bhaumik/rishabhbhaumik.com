"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FOOTER, type SocialLink } from "@/data/site";
import { revealItem, staggerContainer } from "@/lib/motion";
import Reveal from "./Reveal";
import {
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
        viewport: { once: true, margin: "0px" },
      };
  const itemProps = reduce ? {} : { variants: revealItem };

  const inlineLink =
    "text-white underline decoration-white/60 underline-offset-[2px] transition-colors hover:decoration-white";

  return (
    <footer
      id="contact"
      className="flex flex-col gap-8 px-4 pb-10 pt-[120px] lg:flex-row lg:items-end lg:justify-between"
    >
      {/* Blurb */}
      <Reveal
        as="p"
        margin="0px"
        className="px-3 text-14 leading-[1.5] text-muted"
      >
        {FOOTER.blurb} This is{" "}
        <a href="#" className={inlineLink}>v2</a>
        , made with{" "}
        <a href="https://figma.com" target="_blank" rel="noreferrer" className={inlineLink}>Figma</a>
        {" "}&amp;{" "}
        <a href="https://claude.ai/code" target="_blank" rel="noreferrer" className={inlineLink}>Claude Code</a>
        .
      </Reveal>

      {/* Elsewhere */}
      <div className="flex flex-col gap-2 px-3 lg:px-0">
        <motion.ul
          {...listProps}
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-12"
        >
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
                  {/* Handle — whitens on hover */}
                  <span className="whitespace-nowrap text-14 leading-[18px] text-[#a3a3a3] transition-colors group-hover:text-white group-focus-visible:text-white">
                    {link.handle}
                  </span>
                  {/* Platform icon — reveals on hover */}
                  <span className="flex w-0 items-center justify-center overflow-hidden text-white opacity-0 transition-all duration-200 group-hover:ml-1 group-hover:w-3 group-hover:opacity-100 group-focus-visible:ml-1 group-focus-visible:w-3 group-focus-visible:opacity-100">
                    <Icon />
                  </span>
                </a>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </footer>
  );
}
