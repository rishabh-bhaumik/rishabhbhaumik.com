// Shared bits of the draft page (server and client sections both use them).

export const CARD = "overflow-hidden rounded-[16px] border-[0.5px] border-ink/25";
/**
 * The shade over the draft's art frames (Figma's "filter", 8736:45045 / 8736:45215): black
 * down to 80%, then #131313 at the foot, in difference, so the frame and everything on it
 * turn more muted over the bottom fifth: darker on dark, greyer on light. Used in both
 * themes on 003 and 004's art, 005's frames and 006's slides. The frame must be `relative`.
 */
export function FootShade() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-difference"
      style={{ backgroundImage: "linear-gradient(to bottom, #000 0%, #000 80.206%, #131313 100%)" }}
    />
  );
}

/**
 * A 2px neutral bar along a frame's foot, pinned left, that grows to full width as a
 * loop plays: 005 and 006's frames. `once` plays a single pass (re-key it each loop to
 * keep it in step with a timed animation); otherwise it repeats. Hidden under reduced
 * motion. The frame must be `relative`.
 */
export function LoopBar({ seconds, once = false }: { seconds: number; once?: boolean }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left animate-[loop-bar_1s_linear_infinite] bg-[#A9ACB1]/30 motion-reduce:hidden"
      style={{
        animationDuration: `${seconds}s`,
        animationIterationCount: once ? 1 : "infinite",
        animationFillMode: once ? "forwards" : "none",
      }}
    />
  );
}

/** Body copy. Short blocks, so lines are balanced (the `p` children too) for an even rag. */
export const BODY = "text-14 leading-[1.7] text-muted text-balance [&_p]:text-balance";

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-[24px] border border-surface bg-surface-2 px-3 py-[10px] text-12 leading-none text-muted">
      {children}
    </span>
  );
}

/**
 * Marks an element as a rail entry. DraftRail reads these from the page in order,
 * so adding, removing or renumbering a section updates the rail by itself.
 * Level 2 entries (005.1, 006.3, …) sit indented under the one before.
 */
export function rail(id: string, label: string, level: 1 | 2 = 1) {
  return { id, "data-rail": label, "data-rail-level": String(level) };
}

export type Stat = { value: string; label: string };

/**
 * A section's outcome figures: big number, small label, on a hairline. From sm up
 * the figures share the row's full width, none narrower than its one-line label. Unknown
 * figures are written as "x" until the real numbers are in.
 */
export function Stats({ items }: { items: Stat[] }) {
  return (
    <dl className="mt-2 grid w-full grid-cols-2 gap-x-6 gap-y-6 border-t-[0.5px] border-ink/10 pt-6 sm:flex sm:flex-wrap sm:gap-x-10">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col gap-2 sm:flex-1">
          <dd className="text-[32px] leading-none tracking-[-0.02em] text-ink tabular-nums">
            {s.value}
          </dd>
          <dt className="text-12 leading-[1.4] text-muted sm:whitespace-nowrap">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
