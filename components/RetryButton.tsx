"use client";

import Image from "next/image";

/** The 404's one action (Figma 8189:3415): load the address again. */
export default function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="flex h-[42px] items-center gap-2 rounded-full bg-[#262c38] py-[6px] pl-1 pr-4 text-[20px] leading-[1.5] text-white transition-colors hover:bg-[#2f3645]"
    >
      <span className="flex h-8 items-center border-r border-[#303745] pl-2 pr-[5px]">
        <Image src="/media/404/refresh.svg" alt="" width={16} height={16} />
      </span>
      Retry
    </button>
  );
}
