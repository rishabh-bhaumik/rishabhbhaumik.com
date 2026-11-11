/**
 * Peetal's primitive colour ramps beside 003 (Figma 8736:44262): neutral, primary,
 * secondary and success, cropped by the frame, on the same surface as 004's specimen
 * and fading darker at the foot. Up to 696 × 392 on the page; positions are drawn on a
 * 1464 × 823.5 frame (the same picture, larger) in container units against that 1464px
 * width, so it scales as one picture (the same treatment as TypeSpecimen).
 */

import { FootShade } from "./ui";

const cq = (px: number) => `${(px / 14.64).toFixed(4)}cqw`;

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/** Card lefts in the frame; the row of eight ramps is slid left so only these show. */
const RAMPS = [
  { name: "neutral", left: -214.53, hexes: ["FFFFFF", "F4F5F6", "E6E8EA", "D2D5D8", "BEC2C6", "A9ACB1", "8F9398", "6F7378", "4A4D52", "1C1D1F"] },
  { name: "primary", left: 274.47, hexes: ["F4F1FF", "E8E2FF", "D1C6FF", "AC9CFF", "7F5EF4", "4100CF", "3800B4", "2C0091", "21006D", "160049"] },
  { name: "secondary", left: 763.47, hexes: ["FFF6ED", "FFE9D3", "FFD2A8", "FFB875", "FF9840", "FF7700", "DB6600", "B35300", "8A4000", "612C00"] },
  { name: "success", left: 1252.47, hexes: ["ECFBEA", "D4F5CF", "A9EAA2", "74DB71", "3CCB3C", "00B200", "009900", "007B00", "005E00", "004000"] },
];

const TEXT = {
  fontFamily: '"Anek Latin"',
  fontSize: cq(18),
  fontVariationSettings: '"wdth" 100',
  fontFeatureSettings: '"dlig" 1',
} as const;

export default function TokenRamps({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Peetal colour ramps: neutral, primary, secondary and success, steps 50 to 900"
      className={`@container relative aspect-[1464/823.5] w-full max-w-[696px] overflow-hidden bg-surface light:bg-white leading-[1.5] font-medium text-ink ${className}`}
    >
      {RAMPS.map((r) => (
        <div
          key={r.name}
          className="absolute border border-solid border-[rgba(169,172,177,0.16)]"
          style={{ left: cq(r.left), top: cq(341.11), width: cq(389), height: cq(1128), borderRadius: cq(24) }}
        >
          {STEPS.map((step, i) => {
            const top = 32 + i * 45;
            return (
              <div key={step}>
                <span className="absolute text-ink/45" style={{ ...TEXT, left: cq(31), top: cq(top) }}>
                  {r.name}
                </span>
                <span className="absolute" style={{ ...TEXT, left: cq(127), top: cq(top) }}>
                  {step}
                </span>
                <span
                  className="absolute"
                  style={{
                    left: cq(197),
                    top: cq(top - 1),
                    width: cq(29),
                    height: cq(29),
                    borderRadius: cq(8),
                    background: `#${r.hexes[i]}`,
                  }}
                />
                <span className="absolute" style={{ ...TEXT, left: cq(246), top: cq(top) }}>
                  {r.hexes[i]}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <FootShade />
    </div>
  );
}
