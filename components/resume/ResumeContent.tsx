import Reveal from "@/components/Reveal";
import {
  RESUME_ABOUT,
  RESUME_CONTACT,
  RESUME_CREDENTIALS,
  RESUME_EDUCATION,
  RESUME_EXPERIENCE,
  RESUME_HEADER,
  type Frag,
} from "@/data/resume";

/** Seconds between staggered items within a section. */
const STEP = 0.06;

/**
 * Renders a fragment list. The design lifts key phrases to white against the
 * muted body copy; linked fragments additionally get an underline.
 */
function Frags({ parts }: { parts: Frag[] }) {
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === "string") return p;
        if (p.href) {
          return (
            <a
              key={i}
              href={p.href}
              className="text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-ink"
            >
              {p.text}
            </a>
          );
        }
        return p.em ? (
          <span key={i} className="text-ink">
            {p.text}
          </span>
        ) : (
          p.text
        );
      })}
    </>
  );
}

/**
 * A titled block. The label sits in a left rail on desktop and stacks above
 * the content on mobile, so every row on the page shares one grid.
 */
function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-10 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
        <Reveal className="sm:w-[132px] sm:shrink-0">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            {label}
          </h2>
        </Reveal>
        <div className="flex min-w-0 flex-1 flex-col gap-10">{children}</div>
      </div>
    </section>
  );
}

export default function ResumeContent() {
  return (
    <article className="mx-auto w-full max-w-[var(--reading-max)] px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
      {/* Masthead */}
      <header id="overview" className="flex flex-col gap-4 pb-10 sm:flex-row sm:items-start sm:justify-between">
        <Reveal>
          <h1 className="font-display text-[clamp(1.75rem,5vw,2rem)] leading-tight text-ink">
            {RESUME_HEADER.name}
          </h1>
          <p className="mt-1 text-[15px] text-muted">{RESUME_HEADER.subtitle}</p>
        </Reveal>
        <Reveal delay={STEP} className="sm:shrink-0">
          <a
            href={RESUME_HEADER.pdfHref}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-surface px-4 py-2 font-mono text-[11px] tracking-wide text-faint ring-1 ring-border transition-colors hover:text-ink"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 1v7m0 0L3.5 5.5M6 8l2.5-2.5M2 10h8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download PDF
          </a>
        </Reveal>
      </header>

      <Section id="about" label="About">
        <div className="flex flex-col gap-4">
          {RESUME_ABOUT.map((para, i) => (
            <Reveal key={i} delay={i * STEP}>
              <p className="text-[15px] leading-relaxed text-muted">
                <Frags parts={para} />
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="contact" label="Contact">
        <dl className="flex flex-col gap-3">
          {RESUME_CONTACT.map((row, i) => (
            <Reveal key={row.label} delay={i * STEP}>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="text-[13px] text-faint sm:w-[88px] sm:shrink-0">
                  {row.label}
                </dt>
                <dd className="min-w-0 break-words text-[15px] text-muted">
                  {row.href ? (
                    <a
                      href={row.href}
                      className="text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-ink"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Section>

      <Section id="experience" label="Experience">
        {RESUME_EXPERIENCE.map((job, i) => (
          <Reveal key={i}>
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] text-ink">
                {job.title}
                <span className="text-muted"> · {job.company}</span>
              </h3>
              <p className="font-mono text-[11px] tracking-wide text-faint">
                {[job.dates, job.meta, job.location].filter(Boolean).join(" · ")}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {job.bullets.map((b, j) => (
                  <Reveal
                    key={j}
                    as="li"
                    delay={j * STEP}
                    y={12}
                    className="relative pl-4 text-[15px] leading-relaxed text-muted before:absolute before:left-0 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-faint"
                  >
                    <Frags parts={b} />
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </Section>

      <Section id="education" label="Education">
        {RESUME_EDUCATION.map((ed, i) => (
          <Reveal key={i} delay={i * STEP}>
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] text-ink">
                {ed.title}
                <span className="text-muted"> · {ed.org}</span>
              </h3>
              <p className="font-mono text-[11px] tracking-wide text-faint">
                {[ed.dates, ed.location].filter(Boolean).join(" · ")}
              </p>
            </div>
          </Reveal>
        ))}
      </Section>

      <Section id="certifications" label="Certifications">
        {RESUME_CREDENTIALS.map((c, i) => (
          <Reveal key={i} delay={i * STEP}>
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] text-ink">
                {c.title}
                <span className="text-muted"> · {c.org}</span>
              </h3>
              <p className="font-mono text-[11px] tracking-wide text-faint">
                {c.dates}
              </p>
            </div>
          </Reveal>
        ))}
      </Section>
    </article>
  );
}
