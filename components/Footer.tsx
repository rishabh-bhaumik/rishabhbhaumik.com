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
    <footer id="contact" className="flex justify-center px-4 pt-[120px]">
      <div
        className="w-full max-w-[var(--reading-max)] rounded-t-[32px] px-4 pb-[10px] pt-6"
        style={{
          backgroundImage:
            "linear-gradient(230.48deg, rgba(255,255,255,0.2) 1.02%, rgba(178,182,188,0.2) 6.56%, rgba(105,110,120,0.2) 11.12%, rgba(51,58,71,0.2) 17.21%, rgba(28,28,28,0.2) 22.15%)",
        }}
      >
        {/* Blurb */}
        <Reveal
          as="p"
          margin="0px"
          className="px-3 text-[14px] leading-[1.3] text-muted"
        >
          {FOOTER.blurb}
          <br />
          This is{" "}
          <a href="#" className={inlineLink}>v2</a>
          , made with{" "}
          <a href="https://figma.com" target="_blank" rel="noreferrer" className={inlineLink}>Figma</a>
          ,{" "}
          <a href="https://claude.ai/code" target="_blank" rel="noreferrer" className={inlineLink}>Claude Code</a>
          , and{" "}
          <a href="https://framer.com" target="_blank" rel="noreferrer" className={inlineLink}>Framer</a>
          . {FOOTER.pitch}
        </Reveal>

        {/* Elsewhere */}
        <div className="mt-14 flex flex-col gap-2">
          <Reveal
            as="p"
          margin="0px"
            className="pb-2 text-[12px] uppercase leading-[16px] tracking-[0.6px] text-[#858e9e]"
          >
            Elsewhere
          </Reveal>
          <motion.ul
            {...listProps}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
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
                    <span className="whitespace-nowrap text-[14px] leading-[18px] text-[#a3a3a3] transition-colors group-hover:text-white group-focus-visible:text-white">
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
      </div>
    </footer>
  );
}
