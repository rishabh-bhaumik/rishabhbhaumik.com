import { IconGitHub, IconInstagram, IconLinkedIn, IconMail, IconX } from "../SocialIcons";

/** Each link's glyph (the old footer's "Elsewhere" icons, plus GitHub). */
const ICONS: Record<string, React.FC<{ className?: string }>> = {
  mail: IconMail,
  linkedin: IconLinkedIn,
  instagram: IconInstagram,
  x: IconX,
  github: IconGitHub,
};

/** The reveal's timing, shared by the slot opening and the icon sliding in. */
const EASE = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/**
 * A footer link (and the contact block's email) that shows its platform's icon on hover (or keyboard focus): a slot
 * opens to the right of the word and the icon slides into it from the left, fading
 * in; the word and icon stay centred together in the cell, so the word eases left as
 * the slot opens and back again when it closes.
 */
export default function RollLink({
  label,
  href,
  className,
  icon = label.toLowerCase(),
}: {
  label: string;
  href: string;
  className: string;
  /** Which glyph (a key of ICONS); the label, lowercased, by default. */
  icon?: string;
}) {
  const Icon = ICONS[icon];
  const external = href.startsWith("http");
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={`group ${className}`}>
      <span className="inline-flex items-center justify-center">
        <span className="underline decoration-from-font underline-offset-2">{label}</span>
        {Icon && (
          <span
            aria-hidden
            className={`flex w-0 items-center overflow-hidden opacity-0 transition-[width,margin,opacity] group-hover:ml-2 group-hover:w-[14px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:w-[14px] group-focus-visible:opacity-100 ${EASE}`}
          >
            <span className={`block -translate-x-3 transition-transform group-hover:translate-x-0 group-focus-visible:translate-x-0 ${EASE}`}>
              <Icon className="size-[14px]" />
            </span>
          </span>
        )}
      </span>
    </a>
  );
}
