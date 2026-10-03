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
- Layout widths: `--reading-max` (700px: About, Saathi, resume, gate), `--content-max` (832px: home hero column, list views), `--shell-max` (1200px: Work and Play grids). Header and footer run full width.
- Hairlines: header bottom, footer top and resume dividers are `0.5px` at `white/10`

## Routes

- `/` — home (Header, Hero, Footer)
- `/work` — work gallery (Header, WorkGallery, Footer)
- `/about` — `AboutContent`
- `/play` — Play gallery (Vimeo/SoundCloud embeds via oEmbed)
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
`architecture.md`, `deploy.md`.
