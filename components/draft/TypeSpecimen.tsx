/**
 * The Anek type specimen beside 004 (Figma 8693:24721): the system's typographic
 * rules up top, and below them ten scripts climbing the same size ramp in five
 * mirrored pairs. Drawn on a 720 × 405 frame; every position and size is in
 * container units against that 720px width, so it scales as one picture.
 */

const cq = (px: number) => `${(px / 7.2).toFixed(4)}cqw`;

const RULES = [
  { label: "Permissible Scripts(10)", value: "Latin, Telugu, Bangla, Malayalam, Devanagari, Odia, Gurmukhi, Tamil, Gujarati, Kannada", left: 10.5, top: 24.59 },
  { label: "Permissible Weights(4)", value: "Regular, Medium, Semibold, Bold", left: 469.24, top: 24.59 },
  { label: "Permissible Line Heights(8)", value: "100%-170%", left: 622.23, top: 24.59 },
  { label: "Permissible Heights for Display(5)", value: "48,56,64,72,80", left: 10.5, top: 75.21 },
  { label: "Permissible Heights for Heading(5)", value: "20,24,28,32,40", left: 163.43, top: 75.21 },
  { label: "Permissible Heights for Body(5)", value: "10,12,14,16,18", left: 316.42, top: 75.21 },
  { label: "Permissible Kerning(5)", value: "2%, 1%, 0%, -1%, -2%", left: 469.24, top: 75.21 },
  { label: "Permissible Paragraph Lining(5)", value: "0,2,4,8,12,16", left: 622.23, top: 75.21 },
];

/** The ramp each script climbs, smallest first. */
const SIZES = [4.853, 5.824, 6.795, 7.766, 8.736, 9.707, 11.648, 13.59, 15.531, 19.414, 23.297, 27.18, 31.062, 34.945];

type Ramp = { text: string; font: string; lang: string; tops: number[] };

/**
 * Five pairs meeting on a seam at `x`: the first script is set flush right against
 * it, the second flush left from it. Tops are per script, as placed in Figma.
 */
const PAIRS: { x: number; right: Ramp; left: Ramp }[] = [
  {
    x: 107.77,
    right: { text: "അആ", font: "Anek Malayalam", lang: "ml", tops: [184.78, 190.19, 196.73, 204.02, 212.44, 221.6, 231.89, 244.06, 258.1, 274.01, 294.05, 317.84, 345.38, 377.05] },
    left: { text: "aA", font: "Anek Latin", lang: "en", tops: [184.4, 190.19, 196.36, 203.65, 212.06, 221.23, 231.52, 243.31, 257.35, 273.26, 292.93, 316.72, 343.88, 375.55] },
  },
  {
    x: 218.39,
    right: { text: "अआ", font: "Anek Devanagari", lang: "hi", tops: [184.78, 190.74, 197.83, 205.67, 214.63, 224.34, 235.18, 247.89, 262.48, 278.94, 299.53, 323.87, 351.95, 384.17] },
    left: { text: "ಅಆ", font: "Anek Kannada", lang: "kn", tops: [184.78, 190.55, 197.45, 205.1, 213.88, 223.4, 234.05, 246.58, 260.98, 277.25, 297.65, 321.8, 349.7, 381.73] },
  },
  {
    x: 359.83,
    right: { text: "ଅଆ", font: "Anek Odia", lang: "or", tops: [184.78, 190.9, 198.14, 206.13, 215.25, 225.12, 236.12, 248.98, 263.73, 280.35, 301.09, 325.58, 353.83, 386.19] },
    left: { text: "ਅਆ", font: "Anek Gurmukhi", lang: "pa", tops: [184.78, 190.9, 198.14, 205.76, 215.25, 225.12, 236.12, 248.98, 263.35, 279.97, 301.09, 325.21, 353.45, 386.19] },
  },
  {
    x: 494.01,
    right: { text: "అఆ", font: "Anek Telugu", lang: "te", tops: [184.78, 190.58, 197.52, 205.2, 214, 223.56, 234.24, 246.8, 261.23, 277.54, 297.97, 322.15, 350.08, 382.14] },
    left: { text: "অআ", font: "Anek Bangla", lang: "bn", tops: [183.65, 189.46, 196.39, 204.07, 212.5, 222.06, 232.37, 244.55, 258.6, 274.54, 293.84, 317.65, 344.83, 376.14] },
  },
  {
    x: 641.15,
    right: { text: "અઆ", font: "Anek Gujarati", lang: "gu", tops: [184.78, 190.44, 197.24, 204.78, 213.44, 222.86, 233.4, 245.81, 260.1, 276.27, 296.56, 320.6, 348.39, 380.31] },
    left: { text: "அஆ", font: "Anek Tamil", lang: "ta", tops: [184.4, 190.44, 196.86, 204.4, 213.07, 222.48, 233.02, 245.06, 259.35, 275.52, 295.44, 319.48, 346.89, 378.81] },
  },
];

function RampGlyphs({ ramp, x, side }: { ramp: Ramp; x: number; side: "left" | "right" }) {
  return SIZES.map((size, i) => (
    <span
      key={size}
      lang={ramp.lang}
      className="absolute whitespace-nowrap"
      style={{
        top: cq(ramp.tops[i]),
        // Flush right ends on the seam; flush left starts from it.
        ...(side === "right" ? { right: cq(720 - x) } : { left: cq(x) }),
        fontFamily: `"${ramp.font}"`,
        fontSize: cq(size),
        // Latin steps up from Medium to Regular at the heading sizes, as drawn.
        fontWeight: ramp.lang === "en" && size < 20 ? 500 : 400,
        fontVariationSettings: '"wdth" 100',
      }}
    >
      {ramp.text}
    </span>
  ));
}

export default function TypeSpecimen({ className = "" }: { className?: string }) {
  return (
    <div
      className={`@container relative aspect-[720/405] w-full max-w-[720px] overflow-hidden leading-none text-ink ${className}`}
    >
      {RULES.map((r) => (
        <div
          key={r.label}
          className="absolute flex flex-col whitespace-nowrap font-medium"
          style={{
            left: cq(r.left),
            top: cq(r.top),
            gap: cq(4.5),
            fontFamily: '"Anek Latin"',
            fontSize: cq(6),
            fontVariationSettings: '"wdth" 100',
            fontFeatureSettings: '"dlig" 1',
          }}
        >
          <p className="text-ink/45">{r.label}</p>
          <p>{r.value}</p>
        </div>
      ))}
      <div aria-hidden>
        {PAIRS.map((p) => (
          <div key={p.x}>
            <RampGlyphs ramp={p.right} x={p.x} side="right" />
            <RampGlyphs ramp={p.left} x={p.x} side="left" />
          </div>
        ))}
      </div>
    </div>
  );
}
