import { HOME, SITE } from "@/data/site";
import HeroVideo from "../HeroVideo";
import Greeting from "./Greeting";
import TagMarquee from "./TagMarquee";
import "./hello.css";

/**
 * The sheet's opening (Figma 8780:35614): the greeting (hello in seventeen languages,
 * starting in Bangla) over the headline with a short note beside it, the orbit clip
 * under them, then the label marquee. Server-rendered; the text rises in with CSS (.rise) before
 * any JavaScript. The 404 passes its own headline, note and marquee words.
 */
export default function SheetHero({
  heading,
  aside,
  marquee = HOME.tags,
}: {
  heading: React.ReactNode;
  aside: React.ReactNode;
  marquee?: readonly string[];
}) {
  const at = (i: number) => ({ "--i": i }) as React.CSSProperties;
  return (
    <section className="flex flex-col">
      {/* From lg up the text sits over the orbit, as in Figma (the hero is then 560px with
          the marquee). Narrower, the text runs full width and would cross the planet, so
          the two stack. */}
      <div className="grid">
        {/* 72px from lg (120px narrower): over the orbit, the headline's last line has to clear
            the big planet, whose top sits ~326px down the hero, to stay readable. */}
        <div className="relative z-10 flex flex-col px-4 pb-12 pt-16 sm:px-6 sm:pb-20 sm:pt-[120px] lg:pt-[72px] lg:[grid-area:1/1]">
          <Greeting
            style={at(0)}
            className="rise-text text-36 font-medium leading-[1.25] tracking-[-0.015em] text-ink sm:text-48"
          />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <h1
              style={at(1)}
              className="rise-text text-28 leading-[1.3] tracking-[-0.015em] text-ink text-balance sm:text-40 lg:text-48 lg:[text-wrap:wrap]"
            >
              {heading}
            </h1>
            <div style={at(2)} className="rise-text max-w-[420px] lg:w-[280px] lg:shrink-0">
              {aside}
            </div>
          </div>
        </div>

        {/* The orbit, as in Figma at every width: only the clip's top half shows, sitting on
            the marquee, which cuts it through the planet's middle (1200x340 at full width).
            From lg it starts 162px down, under the text. */}
        <div className="relative aspect-[1200/340] overflow-hidden bg-black light:bg-bg lg:mt-[162px] lg:self-start lg:[grid-area:1/1]">
          <div className="absolute inset-x-0 top-0 aspect-video">
            <HeroVideo dark={SITE.heroVideo.dark} light={SITE.heroVideo.light} />
          </div>
        </div>
      </div>

      <TagMarquee items={marquee} />
    </section>
  );
}

/** The home headline: its Figma line breaks on wide screens, running text below. */
export function HomeHeading() {
  return HOME.headline.map((line, i) => (
    <span key={i} className="lg:block">
      {line}
      {i < HOME.headline.length - 1 && " "}
    </span>
  ));
}

/** The note beside the home headline. */
export function HomeAside() {
  return <p className="text-16 leading-6 tracking-[-0.01em] text-subtle">{HOME.intro}</p>;
}
