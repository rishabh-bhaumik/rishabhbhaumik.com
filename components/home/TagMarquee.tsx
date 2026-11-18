/**
 * The band of labels under the orbit (Figma 8780:35624): small uppercase words, each
 * followed by a tiny diamond, gliding left on a loop. Two identical runs side by side;
 * the track moves one run's width and repeats. It rests while pointed at, and stands
 * still under reduced motion. The words are read once (the second run is hidden from
 * screen readers).
 */
export default function TagMarquee({ items }: { items: readonly string[] }) {
  const run = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-10 px-10">
          <span className="whitespace-nowrap text-12 uppercase leading-none tracking-[0.01em] text-subtle">{t}</span>
          <span aria-hidden className="size-[4.243px] rotate-45 bg-faint/80" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="tag-marquee flex h-[58px] items-center overflow-hidden border-y border-rule bg-bg">
      <div className="flex w-max animate-[marquee_60s_linear_infinite] motion-reduce:animate-none">
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}
