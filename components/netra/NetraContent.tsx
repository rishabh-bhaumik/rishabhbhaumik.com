import { Fragment } from "react";
import { BIMA_NETRA, type NetraCopy } from "@/data/bima-netra";
import type { Media } from "../project/GrowMedia";
import NextProject from "../project/NextProject";
import SheetPin from "../home/SheetPin";
import TagMarquee from "../home/TagMarquee";
import GrowMedia from "../project/GrowMedia";
import NetraSplash from "./NetraSplash";
import NetraQuoteModal from "./NetraQuoteModal";
import NetraThesis from "./NetraThesis";
import NetraWhiteboard from "./NetraWhiteboard";
import NetraRoutes from "./NetraRoutes";
import NetraResearch from "./NetraResearch";
import NetraMobileFlow from "./NetraMobileFlow";
import { BODY as body, HEADING as heading, ProjectHero, Rich, Tags } from "../project/parts";

/**
 * The BimaNetra project (Figma 8818:32660), on the ruled sheet: the opening, the band
 * of facts, then media frames (GrowMedia) between the overview, context, brief,
 * execution, takeaways and impact, and the banner to the next project. Copy in
 * data/bima-netra.ts (the original, shown at /netra2); /netra passes the plain-language
 * rewrite (data/bima-netra-2.ts) as `copy`.
 */
export default function NetraContent({ copy: P = BIMA_NETRA }: { copy?: NetraCopy }) {
  return (
    <article className="flex flex-col">
      {/* The opening and its marquee stay put while the page scrolls up over them. */}
      <SheetPin>
      <ProjectHero
        href="/netra"
        tags={P.tags}
        title={P.title}
        // A "\n" in the intro starts a new line.
        intro={P.intro.split("\n").map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </Fragment>
        ))}
      />
      <TagMarquee items={P.marquee} />
      </SheetPin>
      <div className="relative z-10 flex flex-col bg-bg">

      {/* Overview */}
      <div className="flex flex-col pt-20">
        <GrowMedia media={P.splash}>
          <NetraSplash label={P.splash.alt ?? P.splash.label} />
        </GrowMedia>
        <section
          aria-label="Overview"
          className="flex flex-col items-end px-4 pb-6 pt-[88px] sm:px-6"
        >
          <Tags items={[P.overview.tag]} />
          <div className="flex w-full flex-col">
            <p className="max-w-[760px] pt-4 text-18 leading-[1.8] tracking-[-0.015em] text-ink">
              {P.overview.lead}
            </p>
            <p className={`max-w-[700px] pt-5 ${body}`}>
              <Rich parts={P.overview.body} />
            </p>
          </div>
        </section>
      </div>

      {/* Context */}
      <div className="flex flex-col pt-20">
        <GrowMedia media={P.context.media}>
          {/* With a caption under the frame, the caption carries the thesis and the frame drops its own lines. */}
          <NetraThesis label={P.context.media.alt ?? P.context.media.label} thesis={!P.context.media.caption} />
        </GrowMedia>
        <section
          aria-labelledby="context"
          className="flex flex-col items-start px-4 pb-6 pt-[88px] sm:px-6"
        >
          <Tags items={[P.context.tag]} className="self-end" />
          <h2 id="context" className={`pt-4 ${heading}`}>
            {P.context.heading}
          </h2>
          <dl className="flex w-full flex-col gap-10 pt-8">
            {P.context.rows.map((r) => (
              <div
                key={r.label}
                className="flex flex-col gap-2 md:flex-row md:gap-10"
              >
                <dt className="pt-1 text-12 leading-[1.8] tracking-[-0.015em] text-subtle md:w-[370px] md:shrink-0">
                  {r.label}
                </dt>
                <dd className="max-w-[700px] text-16 leading-6 tracking-[-0.01em] text-ink">
                  {r.text}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Project brief */}
      <div className="flex flex-col pt-20">
        <Frame media={P.brief.media} />
        <section
          aria-labelledby="brief"
          className="flex flex-col px-4 pb-6 pt-[88px] sm:px-6"
        >
          <Tags items={[P.brief.tag]} className="self-end" />
          <div className="flex flex-col gap-6 pt-3 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <h2
              id="brief"
              className={`sm:text-32 lg:w-[370px] lg:shrink-0 ${heading}`}
            >
              {P.brief.heading}
            </h2>
            <div className="flex max-w-[720px] flex-col">
              <p className={body}>{P.brief.intro}</p>
              <p className="pt-5 text-18 font-bold leading-6 tracking-[-0.015em] text-ink">
                {P.brief.need}
              </p>
              <blockquote className="mt-5 border-l-2 border-ink py-1 pl-4 text-16 leading-[1.8] tracking-[-0.015em] text-ink">
                {P.brief.challenge}
              </blockquote>
              <p className={`pt-5 ${body}`}>{P.brief.constraint}</p>
            </div>
          </div>
        </section>
      </div>

      {P.thesis.map((m, i) => (
        <div key={i} className="pt-20">
          <Frame media={m} />
        </div>
      ))}

      {/* Execution */}
      <div className="pt-20">
        <section
          aria-labelledby="execution"
          className="flex flex-col items-start border-y border-rule px-4 py-10 sm:px-6"
        >
          <Tags items={[P.execution.tag]} className="self-end" />
          <h2 id="execution" className={`pt-3 ${heading}`}>
            {P.execution.heading}
          </h2>
          {/* Wide enough for the first line (829px) to sit on one line; pretty, not the site's
              balance, which would split it in two. */}
          <p className={`max-w-[840px] pt-6 [text-wrap:pretty] ${body}`}>
            {P.execution.body.map((t, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {t}
              </Fragment>
            ))}
          </p>
        </section>
      </div>
      {P.execution.media.map((m, i) => (
        <div key={i} className="pt-20">
          <Frame media={m} />
        </div>
      ))}

      {/* The takeaways */}
      <div className="py-20">
        <section
          aria-labelledby="takeaways"
          className="flex flex-col border-y border-rule"
        >
          <div className="flex flex-col items-start border-b border-rule px-4 pb-6 pt-10 sm:px-6">
            <Tags items={[P.takeaways.tag]} className="self-end" />
            <h2 id="takeaways" className={`pt-3 ${heading}`}>
              {P.takeaways.heading}
            </h2>
          </div>
          <ol className="grid md:grid-cols-3">
            {P.takeaways.items.map((t, i) => (
              <li
                key={t.title}
                className="flex flex-col border-rule px-4 py-8 max-md:border-b max-md:last:border-b-0 sm:px-6 md:border-r md:last:border-r-0"
              >
                <span className="text-12 leading-none text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="pt-3 text-18 font-bold leading-6 tracking-[-0.015em] text-ink">
                  {t.title}
                </h3>
                <p className={`pt-3 ${body}`}>{t.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {P.gallery.map((m, i) => (
        <div key={i} className="pt-20">
          <GrowMedia media={m} />
        </div>
      ))}

      {/* Impact */}
      <div className="pt-20">
        <section
          aria-labelledby="impact"
          className="flex flex-col border-b border-rule"
        >
          <div className="flex flex-col items-start border-b border-rule px-4 pb-6 pt-10 sm:px-6">
            <Tags items={[P.impact.tag]} className="self-end" />
            <h2 id="impact" className={`pt-4 ${heading}`}>
              {P.impact.heading}
            </h2>
          </div>
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {P.impact.stats.map((s) => (
              <li key={s.value} className="flex flex-col p-4 sm:p-6">
                <span className="text-40 leading-none tracking-[-0.015em] text-ink sm:text-56 lg:text-64">
                  {s.value}
                </span>
                <span className="pt-3 text-16 leading-[1.2] tracking-[-0.015em] text-subtle">
                  {s.label[0]}
                  <br />
                  {s.label[1]}
                </span>
              </li>
            ))}
          </ul>
          {P.closing && (
            <div className="border-t border-rule px-4 py-10 sm:px-6">
              <p className="max-w-[760px] text-18 leading-[1.8] tracking-[-0.015em] text-ink">{P.closing}</p>
            </div>
          )}
        </section>
      </div>

      <NextProject after="bima-netra" />
      </div>
    </article>
  );
}

/** A media frame, or one of the live scenes: the quote modal filling itself in, the whiteboard over its room, the six routes as a flowchart, or the research carousel. */
function Frame({ media }: { media: Media & { readonly scene?: string } }) {
  if (media.scene === "quote")
    return (
      <GrowMedia media={media}>
        <NetraQuoteModal label={media.alt ?? media.label} />
      </GrowMedia>
    );
  if (media.scene === "mobile")
    return (
      <GrowMedia media={media}>
        <NetraMobileFlow label={media.alt ?? media.label} />
      </GrowMedia>
    );
  if (media.scene === "research")
    return (
      <GrowMedia media={media}>
        <NetraResearch label={media.alt ?? media.label} />
      </GrowMedia>
    );
  if (media.scene === "routes")
    return (
      <GrowMedia media={media}>
        <NetraRoutes label={media.alt ?? media.label} />
      </GrowMedia>
    );
  if (media.scene === "whiteboard")
    return (
      <GrowMedia media={media}>
        <NetraWhiteboard label={media.alt ?? media.label} />
      </GrowMedia>
    );
  return <GrowMedia media={media} />;
}
