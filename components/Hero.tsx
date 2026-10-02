import { BIO, SITE } from "@/data/site";
import { getVimeoThumbnail } from "@/lib/play";
import CompanyChip from "./CompanyChip";
import HeroVideo from "./HeroVideo";

/**
 * Home hero. A server component: everything here is in the first HTML and
 * eases in with CSS (.rise), so it paints before any JavaScript arrives.
 */
export default async function Hero() {
  const poster = await getVimeoThumbnail(SITE.heroVideoPage);
  const at = (i: number) => ({ "--i": i }) as React.CSSProperties;

  return (
    <section className="flex flex-col items-center gap-6 px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
      {/* Looping showreel — the "orbitting" piece. Vimeo's `background=1` gives
          autoplay + muted + loop with no controls and no pointer interaction. */}
      <div style={at(0)} className="rise relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <HeroVideo src={SITE.heroVideo} poster={poster} title="Showreel" />
      </div>

      {/* Version pill */}
      <span
        style={at(1)}
        className="rise w-fit rounded-full bg-surface px-3 py-1 font-mono text-10 tracking-wide text-faint ring-1 ring-border"
      >
        {SITE.version}
      </span>

      {/* Headline */}
      <h1 style={at(2)} className="rise-text font-display text-balance text-40 sm:text-56 leading-[1.05] text-ink">
        {SITE.greeting}
      </h1>

      {/* Bio with inline company chips */}
      <p style={at(3)} className="rise-text max-w-[34rem] text-18 leading-[1.5] text-muted">
        {BIO.lead} <CompanyChip company={BIO.current} /> {BIO.middle}{" "}
        {BIO.companies.map((c, i) => (
          <span key={c.name}>
            <CompanyChip company={c} />
            {i < BIO.companies.length - 1 ? ", " : ", "}
          </span>
        ))}
        {BIO.tail}
      </p>
    </section>
  );
}
