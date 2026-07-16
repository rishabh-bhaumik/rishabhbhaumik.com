# Rishabh Bhaumik — Portfolio · Project Guide

Personal portfolio: dark, editorial, violet. Home work gallery, About, Play,
and two password-gated case studies (Bima Saathi, BimaKavach Identity).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 — **CSS-first `@theme` in `app/globals.css`** (no `tailwind.config`)
- Framer Motion (reveals, hover, layout transitions) + Lenis (smooth scroll) + GSAP/`@gsap/react` in deps
- Body/UI font is **Arial** — not a custom typeface. Anek Variable is
  self-hosted (`public/media/Anek Font Selection/`, one `@font-face` per
  script) and used only in the BimaKavach Identity typeface showcase.

## Design tokens (`app/globals.css` `@theme`)

- Surfaces: `--color-bg #0d0d0f`, `--color-surface #1c1c1c`, `--color-surface-2 #262c38`, `--color-surface-3 #333a47`, `--color-border #ffffff14`
- Text: `--color-ink #fff`, `--color-muted #a7adb8`, `--color-faint #a3a3a3`
- Brand: `--color-brand #4100cf`, `--color-brand-bold #2c0091`, `--color-brand-subtle #e8e2ff`
- Status: online `#34d399`, away `#fbbf24`, offline `#6b7280`
- Fonts: `--font-sans`/`--font-mono`/`--font-display` all resolve to Arial
- Layout widths: `--reading-max` (700px — About, Saathi, footer, gate), `--content-max` (832px — home hero column / work gallery column), `--shell-max` (1200px — header, Play gallery)

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
- Honor `prefers-reduced-motion` in any new animation — check
  `useReducedMotion()` (Framer Motion) or the media query directly, and render
  a static end-state instead of animating.
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
