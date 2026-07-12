"use client";

import Image from "next/image";
import { useState } from "react";
import type { Company } from "@/data/site";

/**
 * Inline company reference rendered as a small brand chip + name, sitting in the
 * running bio text. Each chip uses the company's brand colour; logos load from
 * /public/media and fall back to a monogram if missing.
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
      className="inline-flex items-center gap-1.5 align-baseline text-ink decoration-brand-subtle/40 underline-offset-4 transition-colors hover:underline"
    >
      <span
        className="relative inline-grid size-4 translate-y-[2px] place-items-center overflow-hidden rounded-[4px] ring-[0.5px] ring-white/15"
        style={{ backgroundColor: chip.bg, padding: chip.pad ? chip.pad : undefined }}
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
            className="text-[7px] font-semibold leading-none"
            style={{ color: chip.textColor ?? "#ffffff" }}
          >
            {chip.text ?? company.name.charAt(0)}
          </span>
        )}
      </span>
      <span>{company.name}</span>
    </a>
  );
}
