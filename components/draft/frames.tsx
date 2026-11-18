import Image from "next/image";
import { FootShade, LIGHT, LoopBar, media } from "./ui";

/*
 * /draft's one-off art frames, shared by the page and the lightbox (MediaLightbox).
 * Light in either theme (CLAUDE.md: /draft containers are always light).
 */

/** Cover media slot (showreel to come, Figma 8627:5995): a 24% hairline, 4px corners. */
export function CoverFrame({ className = "" }: { className?: string }) {
  return (
    <div
      {...LIGHT}
      {...media("cover")}
      className={`relative aspect-[1512/850] w-full overflow-clip rounded-[4px] border border-[rgba(169,172,177,0.24)] bg-surface light:bg-white ${className}`}
    >
      <p className="absolute left-1/2 top-[calc(50%-10.01px)] -translate-x-1/2 whitespace-nowrap text-center text-12 leading-[normal] text-faint">
        MEDIA INCOMING...
      </p>
      <FootShade />
    </div>
  );
}

/** 005 Branding's art: 696 x 392, the shot anchored to its top and cropped at the foot. */
export function BrandingFrame({ className = "" }: { className?: string }) {
  return (
    <div
      {...LIGHT}
      {...media("branding")}
      className={`relative aspect-[696/392] min-w-0 overflow-hidden bg-surface light:bg-white ${className}`}
    >
      <Image
        src="/media/draft/branding-tee-cut.webp"
        alt="A cream BimaKavach tee printed with a man skateboarding in a suit under the words Dhanda's better"
        fill
        sizes="(min-width: 1024px) 696px, 100vw"
        className="object-cover object-top"
      />
      <FootShade />
    </div>
  );
}

/**
 * 006's phone on white, its foot shaded. On the page: 810px tall (up to 1400 wide), the
 * phone 720px tall. `fluid` (the lightbox): a 1400:810 frame, the phone scaling with it.
 */
export function QuotePhoneFrame({ fluid = false, className = "" }: { fluid?: boolean; className?: string }) {
  return (
    <div
      {...LIGHT}
      {...media("quote")}
      className={`relative flex w-full flex-col items-center justify-end overflow-hidden bg-white ${
        fluid ? "aspect-[1400/810]" : "h-[810px]"
      } ${className}`}
    >
      <Image
        src="/media/draft/quote-form-phone.png"
        alt="BimaKavach's Get Quotes in a Few Steps form on an iPhone"
        width={449}
        height={720}
        sizes={fluid ? "50vw" : "449px"}
        className={fluid ? "block h-[88.89%] w-auto max-w-none" : "block h-[720px] w-[448.73px] max-w-none"}
      />
      <FootShade />
    </div>
  );
}

/** An empty art slot (media to come): white, shaded at the foot, its loop bar running. */
export function BlankFrame({ ratio, id }: { ratio: string; id: string }) {
  return (
    <div
      {...LIGHT}
      {...media(id)}
      className="relative w-full overflow-hidden bg-surface light:bg-white"
      style={{ aspectRatio: ratio }}
    >
      <FootShade />
      <LoopBar seconds={6} />
    </div>
  );
}
