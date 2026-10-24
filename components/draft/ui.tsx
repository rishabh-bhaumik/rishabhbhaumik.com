// Shared bits of the draft page (server and client sections both use them).

export const CARD = "overflow-hidden rounded-[16px] border-[0.5px] border-ink/25";
export const BODY = "text-14 leading-[1.7] text-muted";

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
