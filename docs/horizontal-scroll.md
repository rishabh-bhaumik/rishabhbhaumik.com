# Horizontal scroll — the panel-snap carousel

Source: `components/bk/IdentityContent.tsx` — the `IdentityContent` component
body (`stageRef`, `dirRef`, `lastScrollLeft`, `scrollToId`, the `useEffect`
wiring `onScroll`/`onWheel`), and the JSX stage container.

## Where

The entire `/bimakavach-identity` page is one horizontal, panel-snap carousel:
19 full-viewport `<section>`s in a row — Hero, 11 story sections
(`section-story-0` through `section-story-10`), one brand-positioning section,
and 6 work sections (`section-work-0` through `section-work-5`, the last of
which is the typography-hover panel documented in `docs/typography-hover.md`).
Instead of scrolling down the page, the visitor scrolls or wheels right
through it.

## Stage container

```tsx
<div
  ref={stageRef}
  data-lenis-prevent
  className="fixed inset-0 z-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden bg-black [&_section]:snap-start"
  style={{ scrollBehavior: "auto" }}
>
```

Each class carries specific weight:

- **`fixed inset-0`** — pins the stage to the full viewport; the page never
  scrolls vertically. This div *is* the viewport for the case study.
- **`flex`** — lays the 19 `<section>` children out in a single horizontal
  row instead of stacking them.
- **`snap-x snap-mandatory`** — native CSS scroll-snap on the x-axis;
  `mandatory` means the browser always settles on a snap point after a
  gesture ends (vs. `proximity`, which only snaps if you land close).
- **`overflow-x-auto overflow-y-hidden`** — the only scrollable axis is
  horizontal; vertical overflow is clipped so nothing inside a panel can
  push the stage into vertical scrolling.
- **`[&_section]:snap-start`** — a Tailwind arbitrary-variant selector
  applying `scroll-snap-align: start` to every descendant `<section>`, so
  each panel's left edge is a valid snap point.
- **`data-lenis-prevent`** — an attribute Lenis (the site's smooth-scroll
  library, `components/SmoothScroll.tsx`) recognizes as an opt-out zone.
  Lenis intercepts wheel events globally by default; without this, it would
  fight the stage's own wheel handler for the same gesture.

`style={{ scrollBehavior: "auto" }}` keeps the element's default (non-smooth)
scroll behavior, so the wheel handler's own `scrollTo({ behavior: "smooth" })`
calls are the only source of eased motion — no double-easing between CSS
`scroll-behavior: smooth` and the JS-driven smooth scroll.

## Section widths

Every panel is:

```tsx
<section
  id="section-story-1"
  className="relative flex h-full w-screen shrink-0 items-center justify-center bg-black"
>
```

`w-screen` (not `w-full`) plus `shrink-0` is what makes exactly one section
fill the viewport at a time. Inside a flex row, `w-full` resolves against the
flex item's content-based basis and is subject to shrinking — `w-screen`
pins the width to `100vw` regardless of flex context, and `shrink-0` stops
flexbox from squeezing it smaller to fit siblings. Drop either half and the
wheel handler's `idx = Math.round(el.scrollLeft / w)` panel-index math goes
out of sync with where panels actually land.

## Wheel handler

Trackpads and mouse wheels fire many small `wheel` events per gesture; left
untouched, that's a slow native scroll rather than the "one flick = one
panel" feel of a curated case study. The handler intercepts wheel input
entirely, rounds to the nearest panel index, and animates there:

```tsx
let locked = false;
const onWheel = (e: WheelEvent) => {
  const delta =
    Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  e.preventDefault();
  if (locked || Math.abs(delta) < 6) return;
  const w = el.clientWidth;
  const idx = Math.round(el.scrollLeft / w);
  const dir = delta > 0 ? 1 : -1;
  const maxScroll = el.scrollWidth - el.clientWidth;
  const target = Math.max(0, Math.min((idx + dir) * w, maxScroll));
  if (Math.abs(target - el.scrollLeft) < 1) return;
  locked = true;
  dirRef.current = dir;
  el.scrollTo({ left: target, behavior: "smooth" });
  window.setTimeout(() => {
    locked = false;
  }, 720);
};
```

- **Axis normalization** — `delta` picks whichever of `deltaY`/`deltaX` is
  larger, so both a mouse wheel and a trackpad's horizontal swipe drive the
  same logic; `e.preventDefault()` is unconditional so native scroll never
  gets a chance to fight the JS-driven one.
- **Debounce guard** — ignores wheel events below a small magnitude
  (filters trackpad jitter/momentum tail) and, more importantly, ignores
  everything while `locked` is true.
- **Round-to-nearest-panel** — `idx = Math.round(el.scrollLeft / w)` finds
  which panel the stage is currently closest to (recovers cleanly even
  mid-transition); `dir` is `+1`/`-1` from the sign of `delta`.
- **Clamp to bounds** — `target` is `(idx + dir) * w` clamped into
  `[0, maxScroll]`, so wheeling past the first or last panel is a no-op.
- **Animate + lock** — `scrollTo({ behavior: "smooth" })` drives the actual
  transition; `locked = true` for 720ms is the debounce that stops one
  trackpad flick (which keeps firing wheel events past that mark on many
  devices) from being read as several gestures and skipping panels.

## Direction tracking

Panels reveal content with a direction-aware slide (full mechanism in
`docs/stagger-reveal.md`) — content should enter from the direction you're
scrolling away from. `onScroll` tracks sign of movement:

```tsx
const onScroll = () => {
  const cur = el.scrollLeft;
  if (cur > lastScrollLeft.current) dirRef.current = 1;
  else if (cur < lastScrollLeft.current) dirRef.current = -1;
  lastScrollLeft.current = cur;
};
```

`dirRef` is a ref, not state, so updating it every scroll event never
triggers a re-render. It's threaded through `ScrollDirCtx` and read by every
`StaggerItem` at the moment its `IntersectionObserver` fires, so each reveal
picks up whichever direction was current when it became visible. The wheel
handler also sets `dirRef.current = dir` directly before the animated scroll
starts, so a reveal firing mid-transition never reads a stale direction from
the previous gesture.

## Programmatic navigation

`scrollToId(id)` is the escape hatch for jumping straight to a named panel —
used by the hero's "Tell me the story" / "Show me the work" buttons:

```tsx
const scrollToId = useCallback((id: string) => {
  const el = document.getElementById(id);
  if (!el || !stageRef.current) return;
  stageRef.current.scrollTo({
    left: el.offsetLeft,
    behavior: "smooth",
  });
}, []);
```

It looks up the target `<section>` by `id`, reads its `offsetLeft` (its
horizontal position in the flex row — since every panel is exactly
`w-screen`, this is just `panelIndex * viewportWidth`), and animates the
stage there directly, bypassing the wheel handler's index-stepping logic.

## Reduced motion

```tsx
useEffect(() => {
  if (reduce) return;
  const el = stageRef.current;
  if (!el) return;
  // ...wheel/scroll listeners...
}, [reduce]);
```

`reduce` comes from Framer Motion's `useReducedMotion()`. When true, neither
`onScroll` nor `onWheel` is attached — the stage falls back to plain native
scrolling (still with CSS `snap-x snap-mandatory`, so panels still snap, just
via browser scroll physics instead of the JS-driven one-panel-per-gesture
animation). Reduced-motion visitors lose the curated single-flick pacing but
keep full scroll control and still land cleanly on panel boundaries.

## Gotchas

- **`data-lenis-prevent` is required.** Lenis is mounted site-wide in
  `app/layout.tsx` via `components/SmoothScroll.tsx` and intercepts wheel
  events by default to drive its own eased vertical scroll. Without this
  attribute, Lenis and the horizontal wheel handler both try to own the same
  `wheel` event and the panel-snap breaks unpredictably.
- **Sections must be `w-screen`, not `w-full`.** Inside the `flex` stage,
  `w-full` lets flexbox negotiate width against siblings (shrink behavior),
  so panels stop being exactly one viewport wide and the wheel handler's
  panel-index math goes out of sync with where panels actually land — even
  though CSS `scroll-snap` itself is still technically active.
