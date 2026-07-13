# Typography hover — the "Text Magnifier" line

Source: `components/bk/IdentityContent.tsx` (`SCRIPTS`, `toGraphemes`,
`TypeLine`, `VariableWidthType`). Font files + `@font-face` blocks:
`app/globals.css`.

## Where it renders

`section-work-5` of `/bimakavach-identity` — the last panel in the horizontal
carousel, titled "A Typeface for All India" — renders `VariableWidthType`
inside a `Shell manual` block:

```tsx
<Shell manual width={1032} gap={5}>
  <VariableWidthType />
  <StaggerItem><Tag>solutions</Tag></StaggerItem>
  <StaggerItem><H>A Typeface for All India</H></StaggerItem>
  <StaggerItem><Body>...</Body></StaggerItem>
</Shell>
```

`VariableWidthType` renders ten lines, one per script, all reading "Welcome,
emerging India!" translated. `SCRIPTS` is the source of truth (Tamil,
Kannada, Gujarati, Bangla, Latin, Devanagari, Odia, Gurmukhi, Malayalam,
Telugu — each in its own self-hosted Anek variable font):

```tsx
const SCRIPTS = [
  { text: "வருக, வளர்ந்து வரும் இந்தியா!", lang: "ta", font: "Anek Tamil" },
  { text: "ಉದಯೋನ್ಮುಖ ಭಾರತಕ್ಕೆ ಸ್ವಾಗತ!", lang: "kn", font: "Anek Kannada" },
  { text: "સ્વાગત છે, ઉભરતા ભારત!", lang: "gu", font: "Anek Gujarati" },
  { text: "স্বাগতம, উদীয়মান ভারত!", lang: "bn", font: "Anek Bangla" },
  { text: "Welcome, Emerging India!", lang: "en", font: "Anek Latin" },
  { text: "उभरते भारत का स्वागत है!", lang: "hi", font: "Anek Devanagari" },
  { text: "ସ୍ୱାଗତ, ଉଦୀୟମାନ ଭାରତ!", lang: "or", font: "Anek Odia" },
  { text: "ਜੀ ਆਇਆਂ ਨੂੰ, ਉੱਭਰ ਰਹੇ ਭਾਰਤ!", lang: "pa", font: "Anek Gurmukhi" },
  { text: "സ്വാഗതം, വളർന്നുവരുന്ന ഇന്ത്യ!", lang: "ml", font: "Anek Malayalam" },
  { text: "అభివృద్ధి చెందుతున్న భారతదేశానికి స్వాగతం!", lang: "te", font: "Anek Telugu" },
] as const;
```

## The interaction model: one active line at a time

Full redesign of the hover behavior (per Figma 8341-5696), not a tweak. The
old version had all ten lines at a uniform 29px / 20% opacity; hovering one
brightened only that line in place, and nothing else moved.

The new model has exactly **one line active at all times**, including before
any hover: the active line renders at 32px in `#FFFFFF` and is the only one
receiving cursor-proximity glyph modulation; the other nine sit at 16px in
`#A7ADB8`. Hovering any line makes it the new active line — the previously
active line springs back to rest size/color, and because the whole stack is
wrapped in `motion.div layout`, the vertical composition reflows with a FLIP
animation instead of jump-cutting: growing/shrinking rows push their
neighbors, so the stack visibly "breathes" as attention moves between lines.
Before any hover, Latin (`en`) is active by default.

```tsx
const SIZE_ACTIVE_PX = 32;
const SIZE_REST_PX = 16;
const COLOR_ACTIVE = "#FFFFFF";
const COLOR_REST = "#A7ADB8";
```

The swap uses a custom spring rather than Framer Motion's default — tuned
per Figma's note that it should feel "smoother and more responsive," with no
perceptible lag:

```tsx
const SWAP_SPRING = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.9 };
```

## `active` lives in the parent, not each line

`VariableWidthType` owns one piece of state — which script is active —
rather than each line tracking its own hover flag. That's what makes
"exactly one active line" enforceable: activating one is, by construction,
deactivating whatever was active before.

```tsx
const [active, setActive] = useState<string>("en"); // Figma: Latin is default
```

`TypeLine` has no internal `active` state anymore. It's a controlled
component driven by `isActive` + `onActivate` from the parent:

```tsx
function TypeLine({
  text,
  lang,
  font,
  isActive,
  onActivate,
}: {
  text: string;
  lang: string;
  font: string;
  isActive: boolean;
  onActivate: () => void;
}) {
```

Each line sits inside the `motion.div` that owns the size/layout animation;
`onActivate` flips the parent's `active` state:

```tsx
{SCRIPTS.map((script) => {
  const isActive = script.lang === active;
  return (
    <StaggerItem key={script.lang} className="w-full">
      <motion.div
        layout={reduce ? false : true}
        transition={reduce ? { duration: 0 } : SWAP_SPRING}
        style={{
          fontSize: isActive ? SIZE_ACTIVE_PX : SIZE_REST_PX,
          width: "100%",
        }}
      >
        <TypeLine
          text={script.text}
          lang={script.lang}
          font={script.font}
          isActive={isActive}
          onActivate={() => setActive(script.lang)}
        />
      </motion.div>
    </StaggerItem>
  );
})}
```

`onPointerEnter` calls `onActivate()` then `measure()`, so cached glyph
centers are fresh for the newly-active line.

## Resetting glyphs when a line goes inactive

`isActive` is now owned externally, so a line can be deactivated by
something other than its own pointer leaving it — another line becoming
active. `TypeLine` handles that in a `useEffect`: when `isActive` flips to
`false`, it calls `paint(null)`, resetting every glyph back to `REST`.
Without this, a deactivated line would freeze mid-bulge from the last cursor
position instead of relaxing back to rest. `onPointerMove` also early-outs
when the line isn't active, so a stray pointer event over a resting (16px)
line can't paint proximity values into spans that shouldn't receive them:

```tsx
useEffect(() => {
  if (!isActive) paint(null);
  else measure();
}, [isActive, measure, paint]);

// ...

onPointerMove={(e) => {
  if (!isActive) return;
  const p = pRef.current;
  if (!p) return;
  paint(e.clientX - p.getBoundingClientRect().left);
}}
```

## Grapheme spans, not per-character — unchanged

Wrapping each JS string index in its own `<span>` breaks Indic scripts: a
Tamil ligature or Devanagari half-form is composed of multiple code units
that must stay adjacent for the shaping engine to render the correct glyph —
especially fragile once each span carries its own
`font-variation-settings`, which forces a shaping boundary at every split.

`toGraphemes` splits with `Intl.Segmenter` at `granularity: "grapheme"`,
falling back to `Array.from(text)`:

```tsx
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

Each grapheme cluster gets exactly one `<span>`, so the proximity effect on
the active line can animate per-cluster without ever styling into the
middle of a ligature.

## Proximity math on the active line — unchanged

Falloff is still **linear**, not Gaussian — `clamp(1 - dist/radius, 0)` —
and it only ever runs on whichever line is currently active:

```tsx
const REST = "'wght' 500, 'wdth' 100"; // resting / dimmed line
const RADIUS = 82; // px, linear proximity falloff (inikaj "Text Magnifier"-style)
const WGHT_REST = 500;
const WGHT_PEAK = 800;
const WDTH_REST = 100;
const WDTH_PEAK = 125;
```

```tsx
const paint = useCallback((cursorX: number | null) => {
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
}, []);
```

`g` is 1 directly under the cursor, linearly down to 0 at `RADIUS` px,
clamped beyond that. `paint(null)` is now also the reset path used on
deactivation, not just the initial/`pointerleave` state.

`measure()` — unchanged — still runs once per `pointerenter`, caching each
grapheme span's horizontal center relative to the line's own left edge, so
`onPointerMove` never forces a `getBoundingClientRect()` per glyph per frame.

## The `layout` swap animation

The size/position change when activation moves between lines is driven by
Framer Motion's `layout` prop, not a manual height/transform tween — set
alongside the `fontSize` toggle shown above:

```tsx
<motion.div
  layout={reduce ? false : true}
  transition={reduce ? { duration: 0 } : SWAP_SPRING}
```

When `fontSize` changes, the `motion.div`'s box height changes; Framer
Motion's FLIP machinery (`layout`) measures the before/after position of
every sibling `motion.div` in the stack and animates each from old to new
position using `SWAP_SPRING`. That's what makes the container feel like one
breathing composition rather than a single line growing in place — the
whole vertical stack redistributes as the active row expands and the
previous one contracts. `useReducedMotion()` gates this entirely: with
reduced motion on, `layout` is `false` (no measuring or animating of
position/size) and `transition` collapses to `{ duration: 0 }` — size and
color still change, but the swap is instant instead of springing.

## Auto-fit scaling — unchanged, now reruns on activation change

Per-glyph `<span>` wrapping loses inter-cluster kerning, so a fully-wrapped
line renders wider than normally-set text — enough that the longest scripts
(Telugu, Tamil) can overflow the 1032px shell, especially now that the
active line renders at 32px. `VariableWidthType` still shrinks the whole
block via `ResizeObserver` + `transform: scale()`, but the effect now
depends on `active`, so it re-measures every time a different (larger) line
becomes active:

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
}, [active]);
```

## How to add another script

Unchanged.

1. Drop the variable TTF into `public/media/Anek Font Selection/Anek_<Script>/`.
2. Add an `@font-face` block in `app/globals.css` — same `font-weight: 100
   800` range, `font-display: swap`.
3. Append `{ text, lang, font }` to `SCRIPTS` in `IdentityContent.tsx` —
   `lang` as the correct BCP-47 subtag, `font` matching step 2 exactly.

`TypeLine`, the grapheme splitting, the proximity math, and the auto-fit
scaler all operate generically over whatever lines `SCRIPTS` contains. New
scripts join the swap composition at rest size (16px, `COLOR_REST`) until
hovered, same as the existing nine.
