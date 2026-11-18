import { BIMA_NETRA as P } from "@/data/bima-netra";
import TagMarquee from "../home/TagMarquee";
import GrowMedia from "../project/GrowMedia";
import NextProject from "../project/NextProject";
import { Rich, Tags } from "../project/parts";

const heading = "text-28 leading-[1.3] tracking-[-0.015em] text-ink";
const body = "text-16 leading-[1.8] tracking-[-0.015em] text-subtle";

/**
 * The BimaNetra project (Figma 8818:32660), on the ruled sheet: the opening, the band
 * of facts, then media frames (GrowMedia) between the overview, context, brief,
 * execution, takeaways and impact, and the banner to the next project. Copy in
 * data/bima-netra.ts.
 */
export default function NetraContent() {
  const at = (i: number) => ({ "--i": i }) as React.CSSProperties;
  return (
    <article className="flex flex-col">
      <section className="flex flex-col items-end px-4 pb-20 pt-16 sm:px-6 sm:pt-[120px]">
        <Tags items={P.tags} style={at(0)} className="rise-text" />
        <h1 style={at(1)} className="rise-text w-full text-28 leading-[1.3] tracking-[-0.015em] text-ink sm:text-40 lg:text-48">
          {P.title.map((line, i) => (
            <span key={i} className="lg:block">
              {line}
              {i < P.title.length - 1 && " "}
            </span>
          ))}
        </h1>
        <p style={at(2)} className="rise-text w-full pt-5">
          <span className="block max-w-[520px] text-16 leading-6 tracking-[-0.01em] text-subtle">{P.intro}</span>
        </p>
      </section>
      <TagMarquee items={P.marquee} />

      {/* Overview */}
      <div className="flex flex-col pt-20">
        <GrowMedia media={P.splash} still />
        <section aria-label="Overview" className="flex flex-col items-end px-4 pb-6 pt-[88px] sm:px-6">
          <Tags items={[P.overview.tag]} />
          <div className="flex w-full flex-col">
            <p className="max-w-[760px] pt-4 text-18 leading-[1.8] tracking-[-0.015em] text-ink">{P.overview.lead}</p>
            <p className={`max-w-[700px] pt-5 ${body}`}>
              <Rich parts={P.overview.body} />
            </p>
          </div>
        </section>
      </div>

      {/* Context */}
      <div className="flex flex-col pt-20">
        <GrowMedia media={P.context.media} />
        <section aria-labelledby="context" className="flex flex-col items-start px-4 pb-6 pt-[88px] sm:px-6">
          <Tags items={[P.context.tag]} />
          <h2 id="context" className={`pt-4 ${heading}`}>
            {P.context.heading}
          </h2>
          <dl className="flex w-full flex-col gap-10 pt-8">
            {P.context.rows.map((r) => (
              <div key={r.label} className="flex flex-col gap-2 md:flex-row md:gap-10">
                <dt className="pt-1 text-12 leading-[1.8] tracking-[-0.015em] text-subtle md:w-[370px] md:shrink-0">
                  {r.label}
                </dt>
                <dd className="max-w-[700px] text-16 leading-6 tracking-[-0.01em] text-ink">{r.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Project brief */}
      <div className="flex flex-col pt-20">
        <GrowMedia media={P.brief.media} />
        <section
          aria-labelledby="brief"
          className="flex flex-col gap-6 px-4 pb-6 pt-[88px] sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10"
        >
          <div className="flex flex-col items-start">
            <Tags items={[P.brief.tag]} />
            <h2 id="brief" className={`pt-3 sm:text-32 lg:w-[370px] ${heading}`}>
              {P.brief.heading}
            </h2>
          </div>
          <div className="flex max-w-[720px] flex-col">
            <p className={body}>{P.brief.intro}</p>
            <p className="pt-5 text-18 font-bold leading-6 tracking-[-0.015em] text-ink">{P.brief.need}</p>
            <blockquote className="mt-5 border-l-2 border-ink py-1 pl-4 text-16 leading-[1.8] tracking-[-0.015em] text-ink">
              {P.brief.challenge}
            </blockquote>
            <p className={`pt-5 ${body}`}>{P.brief.constraint}</p>
          </div>
        </section>
      </div>

      {P.thesis.map((m, i) => (
        <div key={i} className="pt-20">
          <GrowMedia media={m} />
        </div>
      ))}

      {/* Execution */}
      <div className="pt-20">
        <section aria-labelledby="execution" className="flex flex-col items-start border-y border-rule px-4 py-10 sm:px-6">
          <Tags items={[P.execution.tag]} />
          <h2 id="execution" className={`pt-3 ${heading}`}>
            {P.execution.heading}
          </h2>
          {P.execution.body.map((t, i) => (
            <p key={i} className={`max-w-[760px] ${i ? "pt-4" : "pt-6"} ${body}`}>
              {t}
            </p>
          ))}
        </section>
      </div>
      {P.execution.media.map((m, i) => (
        <div key={i} className="pt-20">
          <GrowMedia media={m} />
        </div>
      ))}

      {/* Showcase, then the takeaways */}
      <div className="pt-40">
        <GrowMedia media={P.showcase} still />
      </div>
      <div className="py-20">
        <section aria-labelledby="takeaways" className="flex flex-col border-y border-rule">
          <div className="flex flex-col items-start border-b border-rule px-4 pb-6 pt-10 sm:px-6">
            <Tags items={[P.takeaways.tag]} />
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
                <span className="text-12 leading-none text-faint">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="pt-3 text-18 font-bold leading-6 tracking-[-0.015em] text-ink">{t.title}</h3>
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
        <section aria-labelledby="impact" className="flex flex-col border-b border-rule">
          <div className="flex flex-col items-start border-b border-rule px-4 pb-6 pt-10 sm:px-6">
            <Tags items={[P.impact.tag]} />
            <h2 id="impact" className={`pt-4 ${heading}`}>
              {P.impact.heading}
            </h2>
          </div>
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {P.impact.stats.map((s) => (
              <li key={s.value} className="flex flex-col p-4 sm:p-6">
                <span className="text-40 leading-none tracking-[-0.015em] text-ink sm:text-56 lg:text-64">{s.value}</span>
                <span className="pt-3 text-16 leading-[1.2] tracking-[-0.015em] text-subtle">
                  {s.label[0]}
                  <br />
                  {s.label[1]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <NextProject href={P.next.href} title={P.next.title} />
    </article>
  );
}
