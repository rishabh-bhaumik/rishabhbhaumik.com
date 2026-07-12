# Typography hover — the "Text Magnifier" line

Source: `components/bk/IdentityContent.tsx` (`SCRIPTS`, `toGraphemes`,
`TypeLine`, `VariableWidthType`). Font files + `@font-face` blocks:
`app/globals.css`.

## Where it renders

`section-work-5` of `/bimakavach-identity` — the last panel in the horizontal
carousel, titled "A Typeface for All India." It sits above the `H`/`Body` copy
about the brand's Anek Variable typeface choice, rendered by
`VariableWidthType` inside a `Shell manual` block:

```tsx
<Shell manual width={1032} gap={5}>
  <VariableWidthType />
  <StaggerItem><Tag>solutions</Tag></StaggerItem>
  <StaggerItem><H>A Typeface for All India</H></StaggerItem>
  <StaggerItem><Body>...</Body></StaggerItem>
</Shell>
```

`VariableWidthType` renders ten lines, one per script, all reading the same
message — "Welcome, emerging India!" — translated. `SCRIPTS` is the literal
source of truth:

```tsx
const SCRIPTS = [
  { text: "வருக, வளர்ந்து வரும் இந்தியா!", lang: "ta", font: "Anek Tamil" },
  { text: "ಉದಯೋನ್ಮುಖ ಭಾರತಕ್ಕೆ ಸ್ವಾಗತ!", lang: "kn", font: "Anek Kannada" },
  { text: "સ્વાગત છે, ઉભરતા ભારત!", lang: "gu", font: "Anek Gujarati" },
  { text: "স্বাগতম, উদীয়মান ভারত!", lang: "bn", font: "Anek Bangla" },
  { text: "Welcome, Emerging India!", lang: "en", font: "Anek Latin" },
  { text: "उभरते भारत का स्वागत है!", lang: "hi", font: "Anek Devanagari" },
  { text: "ସ୍ୱାଗତ, ଉଦୀୟମାନ ଭାରତ!", lang: "or", font: "Anek Odia" },
  { text: "ਜੀ ਆਇਆਂ ਨੂੰ, ਉੱਭਰ ਰਹੇ ਭਾਰਤ!", lang: "pa", font: "Anek Gurmukhi" },
  { text: "സ്വാഗതം, വളർന്നുവരുന്ന ഇന്ത്യ!", lang: "ml", font: "Anek Malayalam" },
  { text: "అభివృద్ధి చెందుతున్న భారతదేశానికి స్వాగతం!", lang: "te", font: "Anek Telugu" },
] as const;
```

Ten scripts: Tamil, Kannada, Gujarati, Bangla, Latin, Devanagari, Odia,
Gurmukhi, Malayalam, Telugu — each set in its own self-hosted Anek variable
font. Alignment alternates in `VariableWidthType`: left for the first four,
centered for the Latin line (index 4), right for the rest —
`i < 4 ? "text-left" : i === 4 ? "text-center" : "text-right"`.

## The effect it emulates

The reference is inikaj.com's "Text Magnifier" component (a Framer University
build). Two independent effects run on the same line at once, both driven off
`pointerenter` / `pointermove` / `pointerleave`: **font activation** — at rest
every line sits at 20% opacity so ten scripts don't visually compete; the
hovered line jumps to 100%, others stay dim (a single `opacity` transition on
the `<p>`, driven by `active` state) — and **per-glyph proximity** —
independent of opacity, every glyph's `wght`/`wdth` axes track distance from
the cursor, thickest/widest right under the pointer, tapering off linearly
away from it.

## Grapheme spans, not per-character

Wrapping each JS string index (`text[i]`) in its own `<span>` breaks Indic
scripts: a Tamil consonant-vowel ligature or a Devanagari half-form is
composed of multiple code units that must stay adjacent, unstyled-between,
for the font's shaping engine to render the correct glyph — and it gets
specifically fragile once each span carries its own
`font-variation-settings`, which forces a shaping boundary at every split.

`toGraphemes` instead splits with `Intl.Segmenter` at `granularity:
"grapheme"` — returning Unicode grapheme clusters, the atomic "user
perceived characters" Tamil ligatures and Devanagari conjuncts are built
from — falling back to `Array.from(text)` if `Intl.Segmenter` is missing:

```tsx
/** Split into grapheme clusters so Indic conjuncts stay intact per span. */
function toGraphemes(text: string): string[] {
  const Seg = (
    Intl as unknown as { Segmenter?: typeof Intl.Segmenter }
  ).Segmenter;
  if (Seg) {
    const seg = new Seg(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}
```

Each grapheme cluster gets exactly one `<span>`, so the proximity effect can
animate per-cluster without ever styling into the middle of a ligature.

## Proximity math

The falloff is **linear**, not Gaussian — matching inikaj's actual algorithm
(`clamp(1 - dist/radius, 0)`), not the smoother bell curve you might guess
from the visual:

```tsx
const REST = "'wght' 500, 'wdth' 100"; // resting / dimmed line
const RADIUS = 82; // px, linear proximity falloff (inikaj "Text Magnifier"-style)
const WGHT_REST = 500;
const WGHT_PEAK = 800;
const WDTH_REST = 100;
const WDTH_PEAK = 125;
```

`RADIUS` is 82px — glyphs farther than that from the cursor sit exactly at
rest (Anek's full range is wght 100–800 / wdth 75–125; these rest/peak values
pick a comfortable mid-weight rather than the font's thin extreme). The paint
function:

```tsx
const paint = (cursorX: number | null) => {
  spansRef.current.forEach((sp, i) => {
    if (!sp) return;
    if (cursorX == null) {
      sp.style.fontVariationSettings = REST;
      return;
    }
    const d = Math.abs(centersRef.current[i] - cursorX);
    const g = Math.max(0, 1 - d / RADIUS); // linear falloff: 1 at cursor → 0 past radius
    const wght = Math.round(WGHT_REST + g * (WGHT_PEAK - WGHT_REST));
    const wdth = Math.round(WDTH_REST + g * (WDTH_PEAK - WDTH_REST));
    sp.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}`;
  });
};
```

`g` is the falloff gain: 1 directly under the cursor, linearly down to 0 at
`RADIUS` px, clamped at 0 beyond that. `wght`/`wdth` interpolate from `REST`
to `PEAK` by `g` and round to whole units before being written into
`font-variation-settings`, avoiding sub-pixel-value churn every mousemove.

## Measurement

`measure()` runs once per `pointerenter`, not on every `pointermove` — it
caches each grapheme span's horizontal center relative to the line's own left
edge:

```tsx
const measure = () => {
  const p = pRef.current;
  if (!p) return;
  const base = p.getBoundingClientRect().left;
  centersRef.current = spansRef.current.map((sp) => {
    if (!sp) return 0;
    const r = sp.getBoundingClientRect();
    return r.left + r.width / 2 - base;
  });
};
```

Caching on enter avoids forcing a synchronous layout read on every mouse
event — a `getBoundingClientRect()` call per glyph per frame would be real
layout thrash across ten multi-script lines. `pointermove` only converts the
cursor to line-relative coordinates via the same subtraction and paints
against the cached centers:

```tsx
onPointerMove={(e) => {
  const p = pRef.current;
  if (!p) return;
  paint(e.clientX - p.getBoundingClientRect().left);
}}
```

Each span declares its own transition so weight/width changes animate rather
than snap: `transition: font-variation-settings 0.2s ${EASE_OUT}` — fast
enough to feel responsive while smoothing frame-to-frame `g` jumps.

## Auto-fit scaling

Per-glyph `<span>` wrapping loses the inter-cluster kerning/shaping a single
unwrapped text run gets, so a fully-wrapped line renders slightly wider than
the same text set normally — enough that the longest scripts (Telugu, Tamil)
can overflow their 1032px shell. `VariableWidthType` compensates with a
`ResizeObserver` that measures natural width and shrinks the whole block via
`transform: scale()`:

```tsx
useEffect(() => {
  const el = wrapRef.current;
  const parent = el?.parentElement;
  if (!el || !parent) return;
  const fit = () => {
    let natural = 0;
    el.querySelectorAll("p").forEach((p) => {
      natural = Math.max(natural, p.scrollWidth);
    });
    const avail = el.clientWidth;
    setScale(natural > avail + 1 ? avail / natural : 1);
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(parent);
  (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready?.then(
    fit,
  );
  return () => ro.disconnect();
}, []);
```

It measures each `<p>`'s own `scrollWidth` (not the wrapper's — lines are
fixed-width blocks whose text can overflow internally) against the available
`clientWidth`, only ever shrinking, and re-measures on resize and again after
`document.fonts.ready` since the Anek TTFs load asynchronously.

This transform-based scale does not perturb the proximity math: glyph rects
and the pointer's `clientX` are both read in the same post-transform viewport-
pixel coordinate space, so scaling the block down scales the glyph rects and
apparent cursor position identically. `measure()` re-runs on the next
`pointerenter` after any resize, so cached centers are never stale for the
scale in effect.

## How to add another script

1. Drop the variable TTF into `public/media/Anek Font Selection/Anek_<Script>/`.
2. Add an `@font-face` block in `app/globals.css` — same `font-weight: 100
   800` range, `font-display: swap`:
   ```css
   @font-face {
     font-family: "Anek <Script>";
     src: url("/media/Anek Font Selection/Anek_<Script>/Anek<Script>-VariableFont_wdth,wght.ttf") format("truetype");
     font-weight: 100 800;
     font-display: swap;
   }
   ```
3. Append `{ text, lang, font }` to `SCRIPTS` in `IdentityContent.tsx` —
   `lang` as the correct BCP-47 subtag, `font` matching step 2 exactly.

No other changes are required — `TypeLine`, the grapheme splitting, the
proximity math, and the auto-fit scaler all operate generically over whatever
lines `SCRIPTS` contains.
