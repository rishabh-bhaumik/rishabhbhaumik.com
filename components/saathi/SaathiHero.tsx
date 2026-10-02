/**
 * The Saathi hero's staggered entrance, in CSS (.rise): it plays as soon as
 * the page paints, with no JavaScript. Text children also un-blur; media
 * children only fade and rise.
 */
export default function SaathiHero({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="flex flex-col gap-8">
      {children.map((child, i) => (
        <div key={i} style={{ "--i": i } as React.CSSProperties} className={i === 0 ? "rise" : "rise-text"}>
          {child}
        </div>
      ))}
    </div>
  );
}
