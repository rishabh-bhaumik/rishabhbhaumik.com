"use client";

import { m } from "framer-motion";
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
  const listProps = {
    variants: staggerContainer(0.07),
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true, margin: "0px" },
  };
  const itemProps = { variants: revealItem };

  const inlineLink =
    "text-ink underline decoration-ink/60 underline-offset-[2px] transition-colors hover:decoration-ink";

  return (
    <footer
      id="contact"
      className="flex flex-col gap-8 border-t-[0.5px] border-ink/10 px-4 pb-16 pt-10 sm:pb-10 lg:flex-row lg:items-end lg:justify-between"
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
        <m.ul
          {...listProps}
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-12"
        >
          {FOOTER.elsewhere.map((link) => {
            const Icon = PLATFORM_ICON[link.platform];
            return (
              <m.li key={link.handle} {...itemProps}>
                <a
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  aria-label={link.ariaLabel}
                  className="group flex h-[18px] items-center justify-between sm:justify-start"
                >
                  {/* Handle — whitens on hover */}
                  <span className="whitespace-nowrap text-14 leading-[18px] text-faint transition-colors group-hover:text-ink group-focus-visible:text-ink">
                    {link.handle}
                  </span>
                  {/* Platform icon — on phones (no hover) always shown, at the row's right
                      end; from sm up it reveals on hover beside the handle */}
                  <span className="ml-1 flex w-3 items-center justify-center overflow-hidden text-faint transition-all duration-200 sm:ml-0 sm:w-0 sm:text-ink sm:opacity-0 sm:group-hover:ml-1 sm:group-hover:w-3 sm:group-hover:opacity-100 sm:group-focus-visible:ml-1 sm:group-focus-visible:w-3 sm:group-focus-visible:opacity-100">
                    <Icon />
                  </span>
                </a>
              </m.li>
            );
          })}
        </m.ul>
      </div>
    </footer>
  );
}
