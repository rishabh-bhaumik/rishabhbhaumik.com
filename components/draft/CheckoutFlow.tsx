import Image from "next/image";

/**
 * 006's checkout flow (Figma 8701:54855): the quote page branching into the payment
 * flow, the post-payment states and the offline fallbacks. Drawn on a 960.3 × 331.25
 * frame; every position and size is in container units against that width, so it
 * scales as one picture (the same treatment as TypeSpecimen and TokenRamps).
 *
 * The solid connectors are Figma's exported vectors. The dotted ones are drawn from
 * the same vectors' centrelines as dashed strokes, so the dashes can march from
 * source to target (`flow-dash` in globals.css: 2s, linear, looping).
 */

const W = 960.3027;
const H = 331.252;
const cq = (px: number) => `${((px / W) * 100).toFixed(4)}cqw`;

const LINES = "/media/draft/checkout-flow";

type Tone = "ink" | "fail" | "pass" | "off";
const TONE: Record<Tone, string> = {
  ink: "text-ink",
  // Figma's red and green; a shade deeper on the light theme so they still read.
  fail: "text-[#ff5f57] light:text-[#d23a32]",
  pass: "text-[#27c840] light:text-[#17912b]",
  off: "text-ink/55",
};

/** A step. Figma's stroke sits inside the box, so the padding gives up its width. */
function Chip({
  x,
  y,
  w,
  head = false,
  tone = "ink",
  children,
}: {
  x: number;
  y: number;
  w?: number;
  head?: boolean;
  tone?: Tone;
  children: React.ReactNode;
}) {
  const border = head ? 1.04 : 0.78;
  return (
    <p
      className={`absolute flex items-center justify-center whitespace-nowrap border-solid border-[rgba(169,172,177,0.08)] bg-surface ${TONE[tone]}`}
      style={{
        left: cq(x),
        top: cq(y),
        width: w === undefined ? undefined : cq(w),
        borderWidth: cq(border),
        borderRadius: cq(4.161),
        padding: `${cq(3.121 - border)} ${cq(4.161 - border)}`,
        fontSize: cq(head ? 9.363 : 7.282),
      }}
    >
      {children}
    </p>
  );
}

/** Start and End. */
function Terminal({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <p
      className="absolute flex items-center justify-center rounded-full border-solid border-surface bg-bg text-ink"
      style={{
        left: cq(x),
        top: cq(y),
        width: cq(54.096),
        height: cq(54.096),
        borderWidth: cq(0.52),
        fontSize: cq(9.363),
      }}
    >
      {children}
    </p>
  );
}

/** A stage's box; the quote page's is drawn a step stronger. Children sit in its padding box. */
function Stage({
  x,
  w,
  h,
  strong = false,
  children,
}: {
  x: number;
  w: number;
  h: number;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute border-solid ${
        strong
          ? "border-[rgba(169,172,177,0.12)] bg-[rgba(169,172,177,0.08)]"
          : "border-[rgba(169,172,177,0.04)] bg-[rgba(169,172,177,0.02)]"
      }`}
      style={{
        left: cq(x),
        top: cq(9.882),
        width: cq(w),
        height: cq(h),
        borderWidth: cq(0.52),
        borderRadius: cq(8.323),
      }}
    >
      {children}
    </div>
  );
}

/**
 * Solid connectors, as exported, in frame coordinates. `inset` (top, right, bottom,
 * left, % of the box) lets the stroke and arrowhead spill past the vector's bounds.
 */
const SOLID: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  inset: [number, number, number, number];
  flip?: boolean;
}[] = [
  // Elbows into payment.flow and Post Payment (mirrored in Figma)
  { src: "8385c", x: 192.905, y: 34.484, w: 23.796, h: 31.929, inset: [-5.77, -1.05, -0.78, -1.05], flip: true },
  { src: "8385c", x: 708.093, y: 34.484, w: 23.796, h: 31.929, inset: [-5.77, -1.05, -0.78, -1.05], flip: true },
  // main.quote.page's three branches
  { src: "12249", x: 65.947, y: 87.797, w: 9.257, h: 19.338, inset: [-1.29, -2.7, -9.52, -2.7] },
  { src: "dd952", x: 65.947, y: 87.797, w: 9.257, h: 48.942, inset: [-0.51, -2.7, -3.76, -2.7] },
  { src: "fe337", x: 65.947, y: 87.797, w: 9.257, h: 78.741, inset: [-0.32, -2.7, -2.34, -2.7] },
  // payment.flow into its first step
  { src: "12249", x: 250.449, y: 47.074, w: 9.257, h: 19.338, inset: [-1.29, -2.7, -9.52, -2.7] },
  // Post Payment's three branches
  { src: "12249", x: 765.244, y: 47.074, w: 9.257, h: 19.338, inset: [-1.29, -2.7, -9.52, -2.7] },
  { src: "441e7", x: 765.244, y: 47.074, w: 9.257, h: 49.92, inset: [-0.5, -2.7, -3.69, -2.7] },
  { src: "1f70d", x: 765.244, y: 47.074, w: 9.257, h: 80.238, inset: [-0.31, -2.7, -2.29, -2.7] },
];

/** Short vertical arrows: a 10.4-long horizontal vector turned about its centre. */
const ARROWS: { src: string; cx: number; cy: number; rot: 90 | -90 }[] = [
  { src: "46fd8", cx: 449.41, cy: 83.831, rot: 90 }, // KYC Verification ↓ Verification Failure
  { src: "46fd8", cx: 504.709, cy: 83.831, rot: 90 }, // Review ↓ Edit Details
  { src: "4e7a7", cx: 518.109, cy: 83.831, rot: 90 }, // Edit Details ↑ Review
  { src: "46fd8", cx: 445.895, cy: 118.515, rot: 90 }, // Verification Failure ↓ Re-Verification
  { src: "0d2f4", cx: 452.926, cy: 118.514, rot: -90 }, // Re-Verification ↑ Verification Failure
  { src: "0d2f4", cx: 809.32, cy: 81.869, rot: -90 }, // Payment Pending ↑ Payment Success
  { src: "46fd8", cx: 809.32, cy: 111.515, rot: 90 }, // Payment Pending ↓ Payment Failure
];
const ARROW_LEN = 10.403;

/**
 * Dotted connectors, in frame coordinates, each path running source → target (the
 * way the dashes travel). Corners keep Figma's 6px radius. `tip` is the arrowhead.
 */
const DOTTED: { d: string; tip?: [number, number, "right" | "down"]; bright?: boolean }[] = [
  // payment.flow's steps
  { d: "M320.275 66.73H330.71", tip: [330.71, 66.73, "right"] },
  { d: "M411.334 66.73H421.768", tip: [421.768, 66.73, "right"] },
  { d: "M483.146 66.73H493.58", tip: [493.58, 66.73, "right"] },
  { d: "M528.432 66.73H538.866", tip: [538.866, 66.73, "right"] },
  // Re-Verification back up to Review
  { d: "M480.098 136.406H481.287A6 6 0 0 0 487.287 130.406V66.73" },
  // Consent & Payment to Payment Success, and down to Payment Failure
  { d: "M612.34 66.414H639.993", tip: [639.993, 66.414, "right"] },
  { d: "M629.078 67.191V157.937A6 6 0 0 0 635.078 163.937H639.992", tip: [639.992, 163.937, "right"] },
  // Payment Failure to Request Payment Link
  { d: "M674.758 172.52V222.013", tip: [674.758, 222.013, "down"] },
  // Offline and unavailable quotes, round to their fallbacks
  {
    d: "M181.877 136.742H194.621A6 6 0 0 1 200.621 142.742V231.815A6 6 0 0 0 206.621 237.815H639.293",
    tip: [639.293, 237.815, "right"],
  },
  { d: "M131.961 178.273V300.37A6 6 0 0 0 137.961 306.37H639.003", tip: [639.003, 306.37, "right"] },
  // Fallbacks to their outcomes
  { d: "M724.223 237.813H749.135", tip: [749.135, 237.813, "right"] },
  { d: "M724.223 306.371H749.135", tip: [749.135, 306.371, "right"], bright: true },
  // Post Payment: Payment Failure to Request Help
  { d: "M839.23 126.023H849.664", tip: [849.664, 126.023, "right"] },
];

/** Figma's arrow lines: two strokes back from the tip at 45°. */
function arrowhead([x, y, dir]: [number, number, "right" | "down"], a: number) {
  return dir === "right"
    ? `M${x - a} ${y - a}L${x} ${y}L${x - a} ${y + a}`
    : `M${x - a} ${y - a}L${x} ${y}L${x + a} ${y - a}`;
}

export default function CheckoutFlow({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Checkout flow: the quote page branches into online, offline and unavailable quotes. Online runs the payment flow (policy issuance, company registration, KYC verification, review, consent and payment) to payment success or failure, then post-payment states; offline quotes fall back to a payment link or a quote by mail."
      className={`@container relative aspect-[960.3027/331.252] w-full overflow-hidden bg-surface font-medium leading-[1.5] ${className}`}
      style={{ fontFamily: '"Anek Latin"', fontVariationSettings: '"wdth" 100' }}
    >
      {/* Stages, steps and terminals, placed as in Figma's content frame */}
      <div
        className="absolute"
        style={{ left: cq(11.699), top: cq(8.527), width: cq(936.801), height: cq(306.892) }}
      >
        <Stage x={15.085} w={170.091} h={179.974} strong>
          <Chip x={5.2} y={47.48} head>
            main.quote.page
          </Chip>
          <Chip x={49.41} y={80.25} w={114.434}>
            online quote (immediate purchase)
          </Chip>
          <Chip x={49.41} y={109.976}>
            offline quote (lead generation)
          </Chip>
          <Chip x={49.41} y={139.701}>
            unavailable quote (offline model)
          </Chip>
        </Stage>
        <Terminal x={0.152} y={0.258}>
          Start
        </Terminal>

        <Chip x={632.283} y={146.825} tone="fail">
          Payment Failure
        </Chip>
        <Chip x={632.283} y={49.302} tone="pass">
          Payment Success
        </Chip>
        <Chip x={632.283} y={220.704}>
          Request Payment Link
        </Chip>
        <Chip x={740.175} y={220.704} tone="off">
          Moved Offline
        </Chip>
        <Chip x={740.175} y={289.26} tone="off">
          Moved Offline • RFQ Sent to Insurer
        </Chip>
        <Chip x={632.283} y={289.26}>
          Request Quote on Mail
        </Chip>

        <Stage x={193.499} w={418.206} h={133.68}>
          <Chip x={210.66} y={73.11} tone="fail">
            Verification Failure
          </Chip>
          <Chip x={284.24} y={73.11}>
            Edit Details
          </Chip>
          <Chip x={217.68} y={108.89}>
            Re-Verification
          </Chip>
          <Chip x={13} y={6.76} head>
            payment.flow
          </Chip>
          <Chip x={58.38} y={40.05}>
            Policy Issuance
          </Chip>
          <Chip x={127.59} y={40.05}>
            Company Registration
          </Chip>
          <Chip x={218.65} y={40.05}>
            KYC Verification
          </Chip>
          <Chip x={290.46} y={40.05}>
            Review
          </Chip>
          <Chip x={335.75} y={40.05}>
            Consent &amp; Payment
          </Chip>
        </Stage>

        <Stage x={708.453} w={196.619} h={133.68}>
          <Chip x={12.84} y={6.76} head>
            Post Payment
          </Chip>
          <Chip x={58.22} y={40.05}>
            Payment Success
          </Chip>
          <Chip x={58.22} y={69.7}>
            Payment Pending
          </Chip>
          <Chip x={57.7} y={98.83}>
            Payment Failure
          </Chip>
          <Chip x={131.07} y={98.83}>
            Request Help
          </Chip>
          <Terminal x={173.69} y={-10.15}>
            End
          </Terminal>
        </Stage>
      </div>

      {/* Solid connectors (exported vectors) */}
      {SOLID.map((v) => (
        <div
          key={`${v.src}-${v.x}-${v.h}`}
          className={`absolute ${v.flip ? "-scale-x-100" : ""}`}
          style={{ left: cq(v.x), top: cq(v.y), width: cq(v.w), height: cq(v.h) }}
        >
          <div
            className="absolute"
            style={{ inset: v.inset.map((n) => `${n}%`).join(" ") }}
          >
            <Image src={`${LINES}/${v.src}.svg`} alt="" fill unoptimized className="max-w-none" />
          </div>
        </div>
      ))}
      {ARROWS.map((a) => (
        <div
          key={`${a.cx}-${a.cy}`}
          className="absolute h-0"
          style={{
            left: cq(a.cx - ARROW_LEN / 2),
            top: cq(a.cy),
            width: cq(ARROW_LEN),
            transform: `rotate(${a.rot}deg)`,
          }}
        >
          <div className="absolute" style={{ inset: `-${cq(1.841)} -2.4%` }}>
            <Image src={`${LINES}/${a.src}.svg`} alt="" fill unoptimized className="max-w-none" />
          </div>
        </div>
      ))}

      {/* Dotted connectors, marching source → target */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="pointer-events-none absolute inset-0 size-full"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {DOTTED.map((l) => (
          <g
            key={l.d}
            stroke={l.bright ? "#C8C8C8" : "#A9ACB1"}
            strokeOpacity={l.bright ? 1 : 0.24}
            strokeWidth={l.bright ? 0.52 : 0.5}
          >
            <path
              d={l.d}
              strokeDasharray="2.0806 2.0806"
              className="animate-[flow-dash_2s_linear_infinite]"
            />
            {l.tip && <path d={arrowhead(l.tip, l.bright ? 1.655 : 1.591)} />}
          </g>
        ))}
      </svg>
    </div>
  );
}
