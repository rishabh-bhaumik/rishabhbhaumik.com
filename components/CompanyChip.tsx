"use client";

import Image from "next/image";
import { useState } from "react";
import type { Company } from "@/data/site";

/**
 * Inline company reference rendered as a small brand chip + name, sitting in the
 * running bio text. Each chip uses the company's brand colour; logos load from
 * /public/media and fall back to a monogram if missing.
 *
 * Plain inline text, not a flex box: the name sits on the sentence's own baseline
 * (so a following comma lines up with it), and the 16px logo is nudged down 0.09em
 * so its centre meets the middle of the capitals (Arial's cap height is 0.716em).
 * No-wrap keeps the logo and name on one line.
 */
export default function CompanyChip({ company }: { company: Company }) {
  const [imgFailed, setImgFailed] = useState(false);
  const { chip } = company;
  const showImage = chip.logo && !imgFailed;

  return (
    <a
      href={company.href}
      target={company.href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="whitespace-nowrap text-ink decoration-ink/40 underline-offset-4 transition-colors hover:underline"
    >
      {/* inline-block + overflow-hidden: its baseline is its bottom edge whatever the
          logo's padding, so every chip's logo sits at the same height. */}
      <span
        className="relative mr-1.5 inline-block size-4 overflow-hidden rounded-[4px] align-[-0.09em] ring-[0.5px] ring-ink/15"
        style={{ backgroundColor: chip.bg }}
      >
        <span
          className="grid size-full place-items-center"
          style={{ padding: chip.pad ? chip.pad : undefined }}
        >
          {showImage ? (
            <Image
              src={chip.logo as string}
              alt=""
              width={16}
              height={16}
              className="size-full object-contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span
              className="text-10 font-semibold leading-none tracking-tighter"
              style={{ color: chip.textColor ?? "#ffffff" }}
            >
              {chip.text ?? company.name.charAt(0)}
            </span>
          )}
        </span>
      </span>
      {company.name}
    </a>
  );
}
