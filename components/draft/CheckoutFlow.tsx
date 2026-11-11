import Image from "next/image";
import { FootShade } from "./ui";

/**
 * 006's checkout flow (Figma 8701:54855): the quote page branching into the payment
 * flow, the post-payment states and the offline fallbacks. Drawn on a 960.3 × 331.25
 * frame; every position and size is in container units against that width, so it
 * scales as one picture (the same treatment as TypeSpecimen and TokenRamps).
 *
 * Every connector is dotted, drawn on the exported vectors' centrelines as dashed
 * strokes so the dashes can march from source to target (`flow-dash` in globals.css:
 * 2s, linear, looping); only the short up/down arrows are Figma's exported vectors.
 *
 * Light mode: a white frame shaded at the foot like the other art (FootShade), pale
 * chips and terminals, and the lines drawn darker so they read on white.
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
      className={`absolute flex items-center justify-center whitespace-nowrap border-solid border-[rgba(169,172,177,0.08)] bg-surface light:border-black/[0.06] light:bg-[#f4f4f5] ${TONE[tone]}`}
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
      className="absolute flex items-center justify-center rounded-full border-solid border-surface bg-bg text-ink light:border-black/[0.06] light:bg-[#ededee]"
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

/**
 * A stage's box (all three drawn alike). Faint on dark; on light the stronger fill and
 * stroke, so the boxes still show on white. Children sit in its padding box.
 */
function Stage({
  x,
  w,
  h,
  children,
}: {
  x: number;
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute border-solid border-[rgba(169,172,177,0.04)] bg-[rgba(169,172,177,0.02)] light:border-[rgba(169,172,177,0.12)] light:bg-[rgba(169,172,177,0.08)]"
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
 * Drawn connectors, in frame coordinates, each path running source → target (the
 * way the dashes travel). Corners keep Figma's 6px radius. `tip` is the arrowhead.
 */
const DOTTED: {
  d: string;
  tip?: [number, number, "right" | "down"];
  /** The main path, drawn brighter: online quote into Payment Flow, Consent & Payment
      into Post Payment, and Post Payment into Payment Success. */
  bright?: boolean;
}[] = [
  // The branch elbows (Pre Payment's three, Payment Flow into its first step, Post
  // Payment's three): Figma's exported solid vectors, redrawn dotted on their lines
  { d: "M65.947 87.797V98.135A9 9 0 0 0 74.947 107.135H75.204", tip: [75.204, 107.135, "right"] },
  { d: "M65.947 87.797V127.739A9 9 0 0 0 74.947 136.739H75.204", tip: [75.204, 136.739, "right"] },
  { d: "M65.947 87.797V157.538A9 9 0 0 0 74.947 166.538H75.204", tip: [75.204, 166.538, "right"] },
  { d: "M250.449 47.074V57.412A9 9 0 0 0 259.449 66.412H259.706", tip: [259.706, 66.412, "right"] },
  { d: "M765.244 47.074V57.412A9 9 0 0 0 774.244 66.412H774.501", tip: [774.501, 66.412, "right"], bright: true },
  { d: "M765.244 47.074V87.994A9 9 0 0 0 774.244 96.994H774.501", tip: [774.501, 96.994, "right"] },
  { d: "M765.244 47.074V118.312A9 9 0 0 0 774.244 127.312H774.501", tip: [774.501, 127.312, "right"] },
  // online quote (immediate purchase) round and up into Payment Flow, dotted: Figma's
  // elbow, its upright and arrowhead where they were, run down to start from the chip
  {
    d: "M192.95 107.43H203.826A6 6 0 0 0 209.826 101.43V40.483A6 6 0 0 1 215.826 34.483H216.701",
    tip: [216.701, 34.483, "right"],
    bright: true,
  },
  // Payment Flow's steps
  { d: "M320.275 66.73H330.71", tip: [330.71, 66.73, "right"] },
  { d: "M411.334 66.73H421.768", tip: [421.768, 66.73, "right"] },
  { d: "M483.146 66.73H493.58", tip: [493.58, 66.73, "right"] },
  { d: "M528.432 66.73H538.866", tip: [538.866, 66.73, "right"] },
  // Re-Verification back up to Review
  { d: "M480.098 136.406H481.287A6 6 0 0 0 487.287 130.406V66.73" },
  // Consent & Payment straight on and up into Post Payment (where the old elbow met it),
  // and down to Payment Failure
  {
    d: "M612.34 66.414H719.012A6 6 0 0 0 725.012 60.414V40.484A6 6 0 0 1 731.012 34.484H731.889",
    tip: [731.889, 34.484, "right"],
    bright: true,
  },
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
  { d: "M724.223 306.371H749.135", tip: [749.135, 306.371, "right"] },
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
      aria-label="Checkout flow: pre payment, the quote page branches into online, offline and unavailable quotes. Online runs the payment flow (policy issuance, company registration, KYC verification, review, consent and payment) into the post-payment states (success, pending, failure), or to a payment failure; offline quotes fall back to a payment link or a quote by mail."
      className={`@container relative aspect-[960.3027/331.252] w-full overflow-hidden bg-surface font-medium leading-[1.5] light:bg-white ${className}`}
      style={{ fontFamily: '"Anek Latin"', fontVariationSettings: '"wdth" 100' }}
    >
      {/* Stages, steps and terminals, placed as in Figma's content frame */}
      <div
        className="absolute"
        style={{ left: cq(11.699), top: cq(8.527), width: cq(936.801), height: cq(306.892) }}
      >
        <Stage x={15.085} w={170.091} h={179.974}>
          <Chip x={5.2} y={47.48} head>
            Pre Payment
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
            Payment Flow
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
          <Chip x={58.22} y={40.05} tone="pass">
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
            {/* Grey at 24% in the file: drawn black (still 24%) on the light theme. */}
            <Image
              src={`${LINES}/${a.src}.svg`}
              alt=""
              fill
              unoptimized
              className="max-w-none light:brightness-0"
            />
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
            // Dark: Figma's grey at 24% (bright: solid light grey). Light: black at 28%
            // (bright: mid grey), so they read on white.
            className={
              l.bright
                ? "stroke-[#C8C8C8] light:stroke-[#7a7a7a]"
                : "stroke-[#A9ACB1] [stroke-opacity:0.24] light:stroke-black light:[stroke-opacity:0.28]"
            }
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
      <FootShade />
    </div>
  );
}
