# ASCII Dither — `components/bk/AsciiDither.tsx`

## What it renders

`section-work-0` of `/bimakavach-identity` is a full-bleed WebGL2 canvas
replaying a source video (`section-work-0-ascii-video.mp4`, an ASCII-art
render of "BIMAKAVACH") through a fragment shader reproducing a Figma
composition (node `8262-149012`): a **Bayer-16×16, 2-level, mono-white
ordered dither** of the video's luma, sliced into **9 horizontal bands**,
each tinted by its own filter colour — 8 bands via Figma's **Plus Darker**
(linear burn), the middle band via **Plus Lighter** (additive). The
composite happens entirely inside the shader, not via CSS
`mix-blend-mode`, so it looks identical across browsers.

It's mounted by `WorkVideo` in `components/bk/IdentityContent.tsx`, which
wraps it in its own `IntersectionObserver` (against `ScrollRootCtx`,
`threshold: 0.1`) and passes the observer's `inView` state straight through
as the `active` prop:

```tsx
<AsciiDither
  active={inView}
  colors={FILTER_COLORS}
  videoSrc={`${MC}/section-work-0-ascii-video.mp4`}
/>
```

The 9 band colours, also in `IdentityContent.tsx`:

```ts
const FILTER_COLORS = [
  "#f4f1ff",
  "#e8e2ff",
  "#d1c6ff",
  "#ac9cff",
  "#4100cf",
  "#3800b4",
  "#2c0091",
  "#21006d",
  "#160049",
] as const;
```

Index 4 (`#4100cf`, brand violet) is the odd one out — the only band that
gets the additive blend.

## How it works

### Blend modes — why band 4 reads differently

The dither backdrop is binary per pixel: `mono` is `0.0` (off) or `1.0`
(on). Composited with flat band colour `Cs`:

- **Plus Darker (linear burn):** `clamp(mono + Cs - 1.0, 0, 1)` — at
  `mono=0`: `clamp(Cs-1,0,1) = 0` for any colour with channels `<1` (off →
  **black**); at `mono=1`: `clamp(Cs,0,1) = Cs` (on → **band colour**). Net:
  colour-on-black.
- **Plus Lighter (additive):** `clamp(mono + Cs, 0, 1)` — at `mono=0`:
  simply `Cs` (off pixels already show the **full band colour**, since
  addition never zeroes anything); at `mono=1`: `clamp(1+Cs,0,1) = white`
  (on → **saturates white**). Net: a solid violet field with dots blown out
  to white.

Plus Darker can only subtract toward black; Plus Lighter can only add
toward white — same binary mask, opposite sides of it. That's why band 4
alone reads as a bright violet strip with white dots while the other 8 read
as dots-on-black.

### The shader

Full fragment shader (`FRAG`):

```glsl
#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVideo;   // the ascii source video
uniform sampler2D uBayer;   // 16×16 ordered-dither threshold map (R channel, 0..1)
uniform vec3  uColors[9];   // the 9 band filter colours
uniform float uBrightness;  // Figma Brightness (1.01)
uniform float uContrast;    // Figma Contrast (1.0)
uniform float uCell;        // dither cell size in device px (Figma "Size")
uniform float uReveal;      // 0..1 staggered entry progress
uniform float uBandStagger; // normalised delay between consecutive bands
uniform float uBandDur;     // normalised per-band reveal duration

void main() {
  // Which of the 9 horizontal bands this fragment belongs to, and its local Y.
  float b = min(floor(vUv.y * 9.0), 8.0);
  int band = int(b);
  float localY = fract(vUv.y * 9.0);

  // Per-band entry: band 0 reveals first, each subsequent band a little later.
  float p = clamp((uReveal - b * uBandStagger) / uBandDur, 0.0, 1.0);
  p = p * p * (3.0 - 2.0 * p); // smoothstep ease

  // Slide the band's content in from the right as it reveals.
  vec2 uv = vec2(vUv.x + (1.0 - p) * 0.05, localY);

  // The video is cover-fit into each band (band & video aspect ≈ 14.1, so a
  // near-exact fill). Each band shows the full ascii strip.
  vec3 src = texture(uVideo, uv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));

  // Brightness / contrast (Figma dither controls).
  luma = clamp((luma - 0.5) * uContrast + 0.5, 0.0, 1.0) * uBrightness;

  // Ordered dither → 2 levels (mono white on black). uCell scales the pattern.
  ivec2 cell = ivec2(gl_FragCoord.xy / uCell);
  float threshold = texelFetch(uBayer, ivec2(cell.x % 16, cell.y % 16), 0).r;
  float mono = luma > threshold ? 1.0 : 0.0;

  // Band tint. Middle band = Plus Lighter (additive); others = Plus Darker
  // (linear burn). With a binary backdrop this yields: darker bands show the
  // colour only on the lit dots; the middle band shows a violet field with
  // white dots.
  vec3 c = uColors[band];
  vec3 outColor = (band == 4)
    ? clamp(vec3(mono) + c, 0.0, 1.0)          // plus-lighter
    : clamp(vec3(mono) + c - 1.0, 0.0, 1.0);   // plus-darker

  fragColor = vec4(outColor * p, 1.0); // fade the band up from black
}
```

`vUv.y * 9.0` splits Y into band index + `localY` so each band samples the
video as its own full-height strip, not a 1/9th sliver. Brightness/contrast
pivots around mid-grey (`CONTRAST = 1.0` is a no-op; `BRIGHTNESS = 1.01`
nudges borderline pixels over threshold). The Bayer lookup is the actual
dither decision; the per-band blend and `outColor * p` fade-up follow.

### The Bayer 16×16 matrix

Generated recursively, not hand-authored:

```ts
function bayerMatrix(n: number): number[][] {
  if (n === 1) return [[0]];
  const half = bayerMatrix(n / 2);
  const h = n / 2;
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < h; x++) {
      const v = half[y][x];
      m[y][x] = 4 * v;
      m[y][x + h] = 4 * v + 2;
      m[y + h][x] = 4 * v + 3;
      m[y + h][x + h] = 4 * v + 1;
    }
  }
  return m;
}
```

Standard Bayer construction: from the 1×1 base case `[[0]]`, recursively
build the `2n×2n` matrix by interleaving four scaled-and-offset copies
(`4v`, `4v+2`, `4v+3`, `4v+1`) into its quadrants. `N = 16` recurses
`1→2→4→8→16`, producing the canonical 16×16 ordered-dither matrix, which is
then packed into a single-channel (`R8`) texture — each value normalized
and offset by half a level so each threshold centers within its bucket
(`bayerData[y*N+x] = Math.round(((mat[y][x] + 0.5) / (N*N)) * 255)`) —
uploaded once with `NEAREST` filtering and `REPEAT` wrapping (so `cell.x %
16, cell.y % 16` tiling lines up with hardware wrap), bound to texture unit
1 (`uBayer`), separate from the video on unit 0 (`uVideo`).

## Values / tunables

| Constant | Value | Effect |
|---|---|---|
| `BRIGHTNESS` | `1.01` (`brightness` prop default) | Post-contrast brightness multiplier |
| `CONTRAST` | `1.0` (`contrast` prop default) | Contrast pivot strength around 0.5 |
| cell size | `cell = 2` (device px) prop default, `× dpr` on upload | Dither cell size; bigger = chunkier dots |
| `dpr` | `Math.min(window.devicePixelRatio \|\| 1, 2)` | Caps DPR scaling at 2× |
| `uBandStagger` | `0.06` (hardcoded in setup effect) | Normalized delay added per band index |
| `uBandDur` | `0.5` (hardcoded in setup effect) | Normalized duration of each band's own reveal |
| `REVEAL_MS` | `1600` (play/pause effect) | Wall-clock length of the whole `rAF`-driven reveal |
| bands | `9` (`vUv.y * 9.0`, in-shader) | Number of horizontal slices |
| additive band | index `4` (`band == 4`, in-shader) | Which band gets Plus Lighter |

`WorkVideo` never overrides `cell`/`brightness`/`contrast`, so
`section-work-0` runs at the component defaults above.

## The staggered band-entry reveal

Two things drive the "each band slides and lights up a beat after the
last" entrance:

**In-shader, per band:**

```glsl
float p = clamp((uReveal - b * uBandStagger) / uBandDur, 0.0, 1.0);
p = p * p * (3.0 - 2.0 * p); // smoothstep ease
vec2 uv = vec2(vUv.x + (1.0 - p) * 0.05, localY);
...
fragColor = vec4(outColor * p, 1.0);
```

`uReveal` is one 0→1 scalar driven from JS, shared by every fragment. Band
`b` subtracts `b * uBandStagger` before dividing by `uBandDur` — band 0
starts the instant `uReveal` leaves 0, band 1 waits until `0.06`, band 8
until `0.48`; each band still spans `0.5` of `uReveal`, so the last band
finishes just after `uReveal` hits `1.0`. `p` is smoothstep-eased, offsets
the sample UV right by `(1-p) * 0.05` (the slide), and multiplies the final
colour (the fade-up from black) — slide and fade finish together per band.

**JS-driven `uReveal` + canvas blur** (play/pause effect):

```ts
video.play().catch(() => {});
const REVEAL_MS = 1600;
const start = performance.now();
const loop = () => {
  const t = Math.min((performance.now() - start) / REVEAL_MS, 1);
  revealRef.current = t;
  // Overall blur clears as the bands settle in.
  canvas.style.filter = t < 1 ? `blur(${(1 - t) * 10}px)` : "none";
  drawRef.current?.();
  rafRef.current = requestAnimationFrame(loop);
};
rafRef.current = requestAnimationFrame(loop);
```

A `rAF` loop ramps `t` linearly 0→1 over `1600` ms into `revealRef.current`
(a ref — read every draw, no re-renders), and separately fades a CSS
`filter: blur(...)` on the canvas element from `10px` to `0` over the same
span, clearing alongside the in-shader reveal.

## IntersectionObserver play/pause

`WorkVideo` watches its own wrapper against `ScrollRootCtx` (the
horizontal-scroll stage) with `threshold: 0.1` and flips `inView`, passed
into `AsciiDither` as `active`. `AsciiDither`'s play/pause effect reacts:

```ts
if (!active) {
  video.pause();
  stop();
  // Reset so the staggered entry replays next time it scrolls into view.
  revealRef.current = 0;
  canvas.style.filter = "blur(10px)";
  return;
}
```

When `active` goes false: the video pauses, the `rAF` loop cancels, and
**`revealRef.current` resets to 0** — every band's `p` returns to 0 and the
full `10px` blur reapplies, so scrolling away and back replays the entire
staggered entrance from scratch rather than resuming or staying revealed.

## `prefers-reduced-motion`

Checked once in the WebGL setup effect (`window.matchMedia("(prefers-reduced-motion:
reduce)").matches`). In the play/pause effect, if `active` and that flag is
true:

```ts
if (reduceRef.current) {
  // Fully revealed, static — no animation.
  revealRef.current = 1;
  canvas.style.filter = "none";
  const once = () => drawRef.current?.();
  if (video.readyState >= 2) once();
  else video.addEventListener("loadeddata", once, { once: true });
  return () => video.removeEventListener("loadeddata", once);
}
```

`revealRef.current` jumps straight to `1` (no slide, no fade), blur clears
immediately, and a single `draw()` fires once the video has a decoded frame
— no `rAF` loop ever starts. Result: one static dithered frame, motionless.

## Gotchas

- **Texture upload is frame-gated, not time-gated** — `draw()` only
  re-uploads when `video.currentTime !== lastUpload`; pausing doesn't itself
  blank the canvas, the ref reset + blur are what signal "reset."
- **`uColors` expects exactly 9 entries and `band == 4` is a hardcoded
  index**, not derived from `colors.length` — missing entries fall back to
  `"#000000"`, and changing band count without updating `band == 4` only
  coincidentally keeps it "the middle one."
- **`cell` is device px, pre-multiplied by a capped DPR**, not CSS px — even
  on a 3× device the multiplier caps at 2 via `Math.min(dpr, 2)`.

## How to tweak

- **Band count** — change the `9.0` (and matching `8.0` clamp) in `float b =
  min(floor(vUv.y * 9.0), 8.0);`, update `band == 4` if a different band
  should be additive, and give `FILTER_COLORS` exactly `N` entries
  (`uColors` is declared `vec3[9]` in-shader, so bump that too).
- **Dither cell size** — pass a different `cell` prop to `<AsciiDither
  .../>` from `WorkVideo` (default `2`); larger = chunkier dots, smaller =
  closer to a smooth gradient.
- **Reveal duration / stagger feel** — `REVEAL_MS` (`1600`, in the
  play/pause effect) sets the overall wall-clock length; `uBandStagger`
  (`0.06`) and `uBandDur` (`0.5`) — hardcoded right after
  `gl.uniform1f(uContrast, contrast)` in the setup effect — set,
  respectively, the beat between band starts and each band's own slide/fade
  length.
