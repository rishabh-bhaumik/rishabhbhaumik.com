# Stagger Reveal — `StaggerItem` / `StaggerSeqCtx`

## What it does

Both case studies (`components/bk/IdentityContent.tsx` for BimaKavach
Identity, `components/saathi/SaathiContent.tsx` for Bima Saathi) reveal
content in atomic beats rather than whole-section fades: every tag pill,
card background, paragraph, media block, and meta label/value pair animates
in on its own delayed step as it crosses into view. The feel is
"luxurious" and unhurried on entry (each item's own transition runs
~1.1–1.2s), but fast on exit — scrolling back past something already
revealed snaps out quickly so re-entering doesn't feel laggy.

The primitive is the same shape in both files — a `StaggerItem` reading its
delay index from a per-section `StaggerSeqCtx` — but `IdentityContent.tsx`
is the fuller implementation (direction-aware, horizontal-scroll-root-aware)
and `SaathiContent.tsx` is a simpler port for a plain vertical-scrolling
page.

## How it works — IdentityContent.tsx

### The context stack

```ts
const ScrollRootCtx = createContext<React.RefObject<HTMLDivElement | null>>({
  current: null,
});
const ScrollDirCtx = createContext<React.RefObject<number>>({ current: 1 });
/** Per-section sequence: hands each StaggerItem the next reveal index. */
const StaggerSeqCtx = createContext<{ next: () => number }>({ next: () => 0 });

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Delay between consecutive reveals. Small because sections are now broken
 *  down into many atomic items — keeps dense cards from running minutes long. */
const STEP = 0.09;
```

- `ScrollRootCtx` — a ref to the horizontal-scroll stage (`stageRef`, the
  `<div data-lenis-prevent ... overflow-x-auto ...>`). Every `StaggerItem`'s
  observer uses this as `root`, since the case study scrolls horizontally
  inside a fixed, clipped container where the document viewport isn't a
  meaningful intersection root.
- `ScrollDirCtx` — a ref holding `1`/`-1`, the current scroll direction,
  updated by the wheel/scroll handlers in the top-level component.
- `StaggerSeqCtx` — a `{ next(): number }` counter provided fresh per
  section, so a `StaggerItem` with no explicit `index` pulls a sequential
  one in render order.
- `EASE_OUT` — the cubic-bezier for every reveal transition.
- `STEP = 0.09` (seconds) — per-item delay multiplier; item `i` starts `i *
  STEP` seconds after it triggers.

### The observer-wrapper / animated-inner split

```tsx
function StaggerItem({
  children,
  index,
  className = "",
  wrapperClassName = "",
  style,
}: {
  children?: ReactNode;
  index?: number;
  className?: string;
  wrapperClassName?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRoot = useContext(ScrollRootCtx);
  const dirRef = useContext(ScrollDirCtx);
  const seq = useContext(StaggerSeqCtx);
  const [i] = useState(() => index ?? seq.next());
  const [visible, setVisible] = useState(false);
  // Direction captured when visibility flips, kept in state (not a ref) so it's
  // safe to read during render for the direction-aware entry offset.
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const el = ref.current;
    const root = scrollRoot.current;
    if (!el || !root) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setDir(dirRef.current);
        setVisible(entry.isIntersecting);
      },
      { root, threshold: 0.05, rootMargin: "0px -25% 0px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollRoot, dirRef]);

  const delay = i * STEP;
  const tx = visible ? 0 : dir > 0 ? 120 : -120;

  // The OUTER wrapper is the observer target — it stays at its resting layout
  // position (no transform), so the 75%-viewport trigger reads the true spot
  // even for right-edge elements. The INNER element carries the slide/blur/fade.
  return (
    <div ref={ref} className={wrapperClassName}>
      <div
        className={className}
        style={{
          opacity: visible ? 1 : 0,
          filter: visible ? "blur(0px)" : "blur(16px)",
          transform: `translateX(${tx}px)`,
          transition: visible
            ? `opacity 1.1s ${EASE_OUT} ${delay}s, filter 1s ${EASE_OUT} ${delay}s, transform 1.2s ${EASE_OUT} ${delay}s`
            : `opacity 0.5s ease ${delay * 0.2}s, filter 0.5s ease ${delay * 0.2}s, transform 0.5s ease ${delay * 0.2}s`,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

The key structural decision is the **two nested `<div>`s**: an outer wrapper
(`ref`, `wrapperClassName`) carrying no transform of its own — the actual
`IntersectionObserver` target — and an inner element (`className`, `style`)
carrying the `translateX(±120)` + `filter: blur(16px)` + `opacity: 0` →
visible transitions.

**The bug this fixes:** if the observed element were the same one being
transformed, a not-yet-visible item sitting at `translateX(120px)` would
have its *observed* bounding box shifted 120px right of its true resting
position. Combined with `rootMargin: "0px -25% 0px 0px"` (which shrinks the
effective root by 25% of its width on the right), an item resting near the
right edge of a full-width panel could have that shifted-right position land
inside the shrunk-away dead zone even though its *real* resting position was
well inside the visible area — the observer would report "not intersecting"
forever and the item would stay hidden no matter how far the user scrolled.
Splitting the untransformed observer target from the transformed animated
inner removes that feedback loop: the observer always measures the content's
true layout position, regardless of the transform currently applied to its
child.

### Trigger geometry

`{ root, threshold: 0.05, rootMargin: "0px -25% 0px 0px" }` — `threshold:
0.05` fires as soon as 5% of the element intersects the margin-adjusted
root; `rootMargin` shrinks the root by 25% of its width from the **right**
edge only (order: top, right, bottom, left). Together these mean items
reveal once they've scrolled to roughly the **75% mark** of the viewport
width — before a panel has fully arrived at center, matching the horizontal
panel-snap scroll where content should already be animating in partway
through the panel's motion.

**Direction-aware entry offset** — `tx = visible ? 0 : dir > 0 ? 120 : -120`.
`dir` is `useState`, set inside the observer callback from `dirRef.current`
— whatever the global scroll-direction ref was *at the moment visibility
flipped*, captured once and held in state so it's stable through that
transition. This is what makes items slide in from the right when advancing
through the case study and from the left when scrolling back.

### Per-section index counter

`StaggerItem` calls `seq.next()` unless an explicit `index` is passed.
`Shell` provides `seq`:

```tsx
function Shell({ children, width = 1100, gap, className = "", manual = false }: {
  children: ReactNode; width?: number; gap?: number; className?: string; manual?: boolean;
}) {
  // Fresh per-render sequence: each StaggerItem pulls its reveal index in
  // render order at mount. Recreated each render (a plain object, not a ref) so
  // React StrictMode's double render re-numbers from zero rather than doubling.
  const counter = { n: 0 };
  const seq: { next: () => number } = { next: () => counter.n++ };
  return (
    <StaggerSeqCtx.Provider value={seq}>
      <div className={`mx-auto flex h-full w-[90vw] flex-col justify-center px-2 sm:px-6 ${className}`}
        style={{ maxWidth: width, gap: gap != null ? `${gap * 0.25}rem` : undefined }}>
        {manual
          ? children
          : React.Children.toArray(children).map((child, i) => (
              <StaggerItem key={i} index={i}>{child}</StaggerItem>
            ))}
      </div>
    </StaggerSeqCtx.Provider>
  );
}
```

`counter`/`seq` are plain objects created fresh on every render (not
`useRef`/`useMemo`), deliberately: since each mounted `StaggerItem` locks its
index once via `useState(() => index ?? seq.next())`, a stable/memoized
`seq` would let React Strict Mode's double-invoke call `seq.next()` twice
per item and double-count. A fresh object per render means each render's
count restarts at 0, and only the first call per instance (its initial mount
render) sticks, thanks to `useState`'s lazy initializer running once.

### Helper components

**`Shell`** centers a section's content column and provides
`StaggerSeqCtx`. By default it auto-wraps each direct child in its own
`<StaggerItem index={i}>` — good for flat sibling stacks. `manual` opts out
so the author places `StaggerItem`s (and plain elements) by hand for finer
control — cards, meta grids, side-by-side media/text pairs.

**`Card`** is a surface whose background reveals as its own stagger step,
separate from the content stacked on top:

```tsx
function Card({ children, width = 480 }: { children: ReactNode; width?: number }) {
  return (
    <div className="relative mx-auto w-full rounded-3xl p-8" style={{ maxWidth: width }}>
      <StaggerItem
        wrapperClassName="absolute inset-0"
        className="h-full w-full rounded-3xl bg-gradient-to-b from-surface/60 to-black ring-1 ring-white/10"
      />
      <div className="relative z-10 flex flex-col gap-6">{children}</div>
    </div>
  );
}
```

This is the clearest illustration of the wrapper/inner split for a
non-text case: `wrapperClassName="absolute inset-0"` positions the
untransformed observer target to fill the card exactly, while
`className="...bg-gradient-to-b from-surface/60 to-black ring-1
ring-white/10"` is the visual layer that actually gets `translateX`/
blur/opacity animated. The card's `children` render in a normal sibling
`<div z-10>`, so each child that wants its own reveal wraps itself in a
separate `StaggerItem`.

**`MetaPair`** splits a label/value row into two independent reveal steps:

```tsx
function MetaPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <StaggerItem>
        <dt className="text-[13px] text-faint">{label}</dt>
      </StaggerItem>
      <StaggerItem>
        <dd className="text-[15px] leading-snug text-ink">{value}</dd>
      </StaggerItem>
    </div>
  );
}
```

The label fades/slides in first, the value follows on the next beat (each
pulling from the enclosing `StaggerSeqCtx`) — a `dl` of four `MetaPair`s
produces eight reveal steps, not four.

## Saathi variant — `components/saathi/SaathiContent.tsx`

Same primitive, simplified for a page that scrolls the normal document
vertically:

```tsx
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const STEP = 0.09; // seconds per stagger step

function StaggerItem({ children, index, className = "", style }: {
  children?: ReactNode; index?: number; className?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useContext(StaggerSeqCtx);
  const [i] = useState(() => index ?? seq.next());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const delay = i * STEP;

  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      filter: visible ? "blur(0px)" : "blur(16px)",
      transform: `translateY(${visible ? 0 : 20}px)`,
      transition: visible
        ? `opacity 1.1s ${EASE_OUT} ${delay}s, filter 1s ${EASE_OUT} ${delay}s, transform 1.2s ${EASE_OUT} ${delay}s`
        : `opacity 0.5s ease ${delay * 0.2}s, filter 0.5s ease ${delay * 0.2}s, transform 0.5s ease ${delay * 0.2}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}
```

Differences from the identity version:

- No `ScrollRootCtx`/`ScrollDirCtx` — the observer is constructed with no
  `root`, defaulting to the browser viewport; `threshold` relaxes to `0.1`
  with no `rootMargin` override.
- No direction tracking — every item slides up from a fixed
  `translateY(20)` to `0` regardless of scroll direction.
- No observer-wrapper/inner split — `ref`, `className`, and the transform
  all live on one `<div>`. With no `rootMargin` shrinking one edge of a
  full, unmodified viewport root, and no horizontal transform to throw the
  observed box into a margin dead zone, the bug the split fixes in
  `IdentityContent.tsx` doesn't apply here.

`EASE_OUT` differs in *type* — an array tuple (Framer Motion's
cubic-bezier point format) here versus a CSS string in
`IdentityContent.tsx` — but both resolve to the same curve; it's
interpolated into the CSS `transition` string via template literal either
way, so the array form isn't doing anything the string form wouldn't.

`Section` provides the per-section sequence and wraps its **entire**
content group in one `StaggerItem`, rather than exposing per-child
staggering:

```tsx
function Section({ id, children, className = "" }: {
  id: string; children: React.ReactNode; className?: string;
}) {
  // Fresh per-render sequence for this section's stagger item.
  const counter = { n: 0 };
  const seq: { next: () => number } = { next: () => counter.n++ };

  return (
    <StaggerSeqCtx.Provider value={seq}>
      <section id={id} className={`scroll-mt-24 ${className}`}>
        <StaggerItem className="flex flex-col gap-4">{children}</StaggerItem>
      </section>
    </StaggerSeqCtx.Provider>
  );
}
```

`SaathiContent.tsx` is explicitly work-in-progress (media placeholders,
lorem ipsum copy — see the file's own top comment), so its sections aren't
yet broken down to the same per-paragraph/per-media granularity as
`IdentityContent.tsx`; each `Section` currently reveals as one block. The
`StaggerSeqCtx` plumbing already supports finer breakdown — any
`StaggerItem` placed inside a `Section`'s children pulls its own sequential
index exactly like the identity page's manual sections do — it's just not
exercised yet.

## Reduced motion

Neither `StaggerItem` checks `prefers-reduced-motion` itself — unlike
`AsciiDither` (see `docs/ascii-dither.md`), which gates its
`requestAnimationFrame` loop because it's a continuously-running WebGL
animation. The stagger reveal's transitions are plain, cheap, one-shot CSS
`transition`s, so they're left ungated at the primitive level.

`IdentityContent.tsx`'s parent component does use Framer Motion's
`useReducedMotion()`, but only to skip an unrelated concern — the
horizontal-scroll wheel handler and the whole-stage entrance blur:

```tsx
const reduce = useReducedMotion();
useEffect(() => {
  if (reduce) return;
  // ...wheel/scroll handlers...
}, [reduce]);

<motion.div
  initial={reduce ? false : { opacity: 0, filter: "blur(12px)" }}
  animate={reduce ? undefined : { opacity: 1, filter: "blur(0px)" }}
  transition={{ duration: 1, ease: EASE }}
  className="flex h-full"
>
```

When `reduce` is true, the wheel-driven one-panel-per-gesture scroll-snap is
skipped entirely and the stage's own entrance blur-in is skipped in favor of
its final state. Individual `StaggerItem` reveals are untouched either way —
a reduced-motion user still gets the per-item fade/blur/slide while
scrolling, just without the custom wheel-snap or the outer stage's own
entrance blur.

## Gotchas

- **Delay accumulates per section, not globally** — `STEP * i` resets to `i
  = 0` at the start of each new `Shell`/`Section`, so a section with 12
  atomic items delays its last one `11 * 0.09 ≈ 0.99s`; dense `manual`
  sections can stack a noticeable total delay if broken into too many
  `StaggerItem`s.
- **Mixing explicit and implicit `index` in the same section can collide**
  — the counter doesn't know about explicitly-passed indices as it counts
  up. Every call site in both files stays consistent within a section, but
  this isn't enforced by the API.
- **Nothing un-reveals an item once `visible` flips true except scrolling it
  back out of the observer's bounds** — `visible` mirrors
  `entry.isIntersecting` directly, so re-entering re-triggers the full enter
  transition (with its `delay`) every time, by design.

## How to add a new atomic reveal

1. **Decide the granularity.** A flat stack of siblings inside a fresh
   `Shell` (not `manual`) is already auto-wrapped — no `StaggerItem` needed
   by hand. Denser compositions (a card, a grid, text beside media) call for
   `<Shell manual ...>` with items wrapped individually.
2. **Wrap the piece in `<StaggerItem>`** — no props needed beyond children;
   it pulls the next index from whichever `StaggerSeqCtx` is active.
3. **For an absolutely-positioned background layer**, follow `Card`'s
   pattern: a `wrapperClassName` that positions the untransformed observer
   target (`"absolute inset-0"` is the common case) and a `className` that
   holds the actual visual styling that animates.
4. **For a label/value pair**, reach for `MetaPair` rather than one
   `StaggerItem` wrapping both.
5. **In `IdentityContent.tsx`**, nothing else is required —
   `ScrollRootCtx`/`ScrollDirCtx` are already provided at the top level. In
   `SaathiContent.tsx`, no root/dir context exists to wire at all (it
   observes the viewport by default).
6. **Don't hand-pick an `index`** unless there's a real reason to reorder —
   leaving it unset (`seq.next()`) is what every call site does, and keeps
   future JSX reordering automatically correct.
