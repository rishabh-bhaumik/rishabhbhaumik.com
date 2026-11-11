# Rishabh Bhaumik — Portfolio · Project Guide

Personal portfolio: dark, editorial, monochrome. Home work gallery, About, Play,
and two password-gated case studies (Bima Saathi, BimaKavach Identity).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 — **CSS-first `@theme` in `app/globals.css`** (no `tailwind.config`)
- Framer Motion via `LazyMotion` + `m` (reveals, hover, layout transitions; engine loads as its own chunk, see `components/MotionProvider.tsx`) + Lenis (smooth scroll, on Framer's frame loop)
- Body/UI font is **Arial** — not a custom typeface. Anek Variable is
  self-hosted as per-script WOFF2 files subset to the showcase lines
  (`public/media/anek/`, `@font-face` rules in `components/bk/anek.css`,
  imported only by the BimaKavach Identity page).

## Design tokens (`app/globals.css` `@theme`)

- Surfaces: `--color-bg #000000`, `--color-surface #1c1c1c`, `--color-surface-2 #262626`, `--color-border #ffffff14`
- Text: `--color-ink #fff`, `--color-muted #a8a8a8`, `--color-faint #a3a3a3`
- Brand: `--color-brand #4100cf`, `--color-brand-bold #2c0091`, BimaKavach's violet, used only inside its Identity case study; the site itself has no colour
- Status dot: online `#34d399`, away `#fbbf24`, offline `#6b7280`, kept in `STATUS_META` (`lib/availability.ts`), not as tokens
- Fonts: `--font-sans`/`--font-mono`/`--font-display` all resolve to Arial
- Light theme: the same token names re-pointed under `:root[data-theme="light"]`
  (warm off-white `--color-bg #f5f3ef`). Use tokens (`text-ink`, `border-ink/10`),
  not `white`/`black`, for chrome; `light:` is a variant for the rare
  light-only tweak (e.g. `invert light:invert-0` on icons)
- Layout widths: `--reading-max` (700px: About, Saathi, resume, gate), `--content-max` (832px: home hero column, list views), `--shell-max` (1200px: Work and Play grids). Header and footer run full width.
- Hairlines: header bottom, footer top and resume dividers are `0.5px` at `white/10`

## Routes

- `/enter` — splash, the front door: the home page held back (`components/enter/Splash.tsx`):
  the hero clip blurred and grained in place, one Enter button, and only the theme switch
  (bottom right, every screen size; it follows the visitor's theme; Splash renders it, and the
  dock hides while any `[data-splash="on"]` is up, `.site-dock` in globals.css). Enter morphs it into home
  with no page change (clip unblurs over `MORPH`, page rises in, music fades in muffled to
  clear, URL becomes `/` via replaceState) and marks the session entered; a fresh load of `/`
  goes here first (`ENTER_SCRIPT`, `lib/enter.ts`). Keep its tree in step with app/page.tsx.
  The WebGPU shader host (`components/enter/ShaderVideo.tsx`, modules in `lib/custom-effects/`)
  is kept but not mounted while Figma's shaders are hidden.
- `/` — home (Header, Hero, Footer)
- `/work` — work gallery (Header, WorkGallery, Footer)
- `/about` — `AboutContent`
- `/play` — Play gallery (Vimeo/SoundCloud embeds via oEmbed)
- `app/not-found.tsx` — 404 for any unknown address: the same splash (`Splash` with a `title`):
  a tiny "4 0 4  /" marquee (Figma 8736:43211) across the screen in the dark band above the
  blurred clip, Restart on the clip (Enter's button, `label`); it morphs into home exactly as Enter does on /enter, so a dead link restarts the visit. Keep its tree in step too.
- `/bima-saathi` — password-gated, vertical-scroll case study
- `/bimakavach-identity` — password-gated, horizontal panel-snap-scroll case study (19 sections)

## Conventions

- **Custom base CSS must go in `@layer base`.** Unlayered rules beat Tailwind
  utilities in v4 — an unlayered rule can silently override a utility class.
- All editable copy/links/companies/projects live in
  `data/site.ts`. Prefer editing that file over hardcoding strings in components.
- Path alias `@/*` → repo root (see `tsconfig.json`).
- Honor `prefers-reduced-motion` in any new animation. Framer animations are
  covered by `MotionConfig reducedMotion="user"` in the root layout — don't
  branch on `useReducedMotion()` while rendering (it differs between server
  and client and breaks hydration); read it in effects only. CSS entrances
  (`.rise` / `.rise-text` in `globals.css`) switch off under the media query.
- Above-the-fold entrances use the CSS `.rise` / `.rise-text` utilities
  (stagger with `style={{ "--i": n }}`), so they paint before hydration.
  Scroll reveals use `Reveal` / `revealItem`; pass `media` / use `revealMedia`
  for blocks holding video, images or canvases (no blur on big layers).
- Media: muted clips go through `components/LazyVideo.tsx` (poster, fetched
  near the viewport, plays only while visible). Sounds are small MP3s played
  through the shared Web Audio context in `lib/sfx.tsx`.
- Theme: three modes, dark / auto / light (auto = light 06:00-18:00 local, dark otherwise),
  `DEFAULT_MODE` in `lib/theme-script.ts` (dark for now). The dock's mode control switches
  dark/light only (auto is built but not offered); the header clock is display only.
- Dock (`components/Dock.tsx`): view control, Figma's "supermenu": a round settings button
  (Lucide settings-2; an x while pinned open by a click) whose hover reveals a slim pill of theme, background music (`SITE.bgm`, state shared via
  `lib/bgm.ts`; on by default for visits landing on home: tries to play on load, else at
  the first gesture, as browsers allow; an "off" is remembered) and sound effects; music and sfx are independent switches. Hovering a
  control lights it and writes its state beside it ("dark: on"). From sm up it floats
  bottom right (pill opens upward), always visible, with the header's `bg-bg/90` overlay
  fill; on phones it sits in the header, right side (tap to open, pill drops down).
  `lib/theme.ts` (client: store, `setTheme`, `useThemePreference`) and
  `lib/theme-script.ts` (server-safe: no-flash `<head>` script,
  `DARK_ONLY_ROUTES` — `/logo` always renders dark). `useTheme()` gives the
  theme showing on the current route (the Identity ASCII dither reads it).
- Home hero: `HeroVideo` stacks a dark and a light clip (`SITE.heroVideo`,
  `public/media/home/orbit-*.mp4`, 12 fps) that match frame for frame; CSS shows
  the one for the theme and the hidden one is kept in step. The light clip is
  rendered by a script in `<IGNORE>/media-sources/orbitting-light/`.
- Cursor: the system default everywhere. The custom crosshair cursor was
  removed; don't hide or replace the pointer.
- Availability/online-status logic is isolated in `lib/availability.ts`
  (`getAvailability()` is the seam for swapping the static schedule for a
  real data source later).

## Where the interesting code lives

- `components/bk/AsciiDither.tsx` — WebGL2 Bayer-dither shader driving the
  BimaKavach Identity ASCII video field
- `components/bk/IdentityContent.tsx` — the horizontal, panel-snap scroll
  stage and its stagger + blur-in reveal system
- `components/saathi/SaathiContent.tsx` — the vertical-scroll case study and
  its own stagger + blur-in reveal system
- `components/PasswordGate.tsx` — soft client-side gate for both case studies
  (password lives in the page component's props — not real security)
- `lib/availability.ts` — weekly schedule + `resolveStatus()` behind the
  header's live local-time / availability dot

## Deep-dive docs

See `docs/` for longer write-ups: `ascii-dither.md`, `stagger-reveal.md`,
`typography-hover.md`, `horizontal-scroll.md`, `password-gate.md`,
`architecture.md`, `deploy.md`, `hardcoded-colors.md`, `optimizations.md` (lighter/faster
things to do later, e.g. re-encoding the 18 MB music file).
