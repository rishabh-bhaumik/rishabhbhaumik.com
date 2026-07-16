# Architecture

Source: `app/layout.tsx`, `app/page.tsx`, `app/{about,work,play,bima-saathi,
bimakavach-identity}/page.tsx`, `data/site.ts`, `lib/{availability.ts,
motion.ts,sfx.tsx}`, `app/globals.css`, and the `components/` tree.

## Pitch

This is a single-domain personal portfolio: a hero-only home surface, a
dedicated work gallery, an about page, a play gallery of video/audio work
with oEmbed-fetched thumbnails, and two password-gated case studies. The visual language
is dark, editorial, violet — one `@theme` token layer in `app/globals.css`
drives every surface, text, and brand color across the site. Motion is
deliberately luxurious: Lenis-smoothed scroll, Framer Motion reveals with
blur-in entrances, and (inside the BimaKavach Identity case study) a fully
custom horizontal panel-snap carousel with its own CSS-transition stagger
system. Self-hosted variable fonts (Anek, ten Indic scripts) are used in
exactly one showcase section rather than site-wide — the rest of the site
runs on Arial.

## Routing table

| Route | Renders | Gated |
|---|---|---|
| `/` | `app/page.tsx` — `Header`, `Hero` (looping Vimeo showreel background, version pill, headline, bio with company chips), `Footer` | No |
| `/work` | `app/work/page.tsx` — `Header`, `WorkGallery` (fed `PROJECTS` from `data/site.ts`), `Footer` | No |
| `/about` | `app/about/page.tsx` → `components/about/AboutContent.tsx` (full-bleed video hero + `PhotoCarousel`) | No |
| `/play` | `app/play/page.tsx` — `Header`, `PlaySection` (→ `PlayGallery`/`PlayCard`, fed `PLAY` from `data/site.ts` + oEmbed thumbnails via `lib/play.ts`), `Footer` | No |
| `/bima-saathi` | `app/bima-saathi/page.tsx` → `PasswordGate` wrapping `components/saathi/SaathiContent.tsx`; `metadata.robots = { index: false }` | Yes — soft client-side password gate |
| `/bimakavach-identity` | `app/bimakavach-identity/page.tsx` → `PasswordGate` wrapping `components/bk/IdentityContent.tsx`; `metadata.robots = { index: false }` | Yes — soft client-side password gate |

Both gated routes use the same `PasswordGate` component, each supplying its
own `project` label and `password` string as props — the password check is
plain client-side string comparison (`v === password`) with no persistence
across visits, so it's explicitly a soft teaser gate rather than real access
control (see `docs/password-gate.md`).

## Data model

`data/site.ts` is the single source of truth for editable copy: `SITE`
(name/role/domain), `NAV` (header links + "current route" matching), `BIO` +
`Company`/chip metadata (the inline company chips in the Home bio), `PROJECTS`
(Work gallery cards), `FOOTER` (blurb + social links), and `PLAY` (the Play gallery's Vimeo/
SoundCloud items). Components pull from this file rather than hardcoding
strings, so most copy edits touch only `data/site.ts`.

`lib/availability.ts` computes the online/away/offline status shown next to
the visitor's local time in the header (`LocalClock`). `WEEKLY_SCHEDULE` is a
static per-weekday set of `HourRange`s in a fixed IANA timezone
(`Asia/Kolkata`); `getAvailability()` is an intentionally async accessor —
today it just resolves the static schedule, but it's the seam for swapping in
a real database/API call later without touching `LocalClock`. `resolveStatus`
compares the current local time in that timezone against the schedule and
returns `"online"` inside a range, `"away"` within a 30-minute soft edge
before/after a range, and `"offline"` otherwise.

## Design system

The token layer is a Tailwind v4 CSS-first `@theme` block in
`app/globals.css` — there is no `tailwind.config.*`. Token groups:

- **Surfaces** — `--color-bg`, `--color-surface`, `--color-surface-2`,
  `--color-surface-3`, `--color-border`
- **Text** — `--color-ink`, `--color-muted`, `--color-faint`
- **Brand** — `--color-brand` (`#4100cf`), `--color-brand-bold`,
  `--color-brand-subtle`
- **Status** — `--color-status-online`, `--color-status-away`,
  `--color-status-offline` (consumed by `STATUS_META` in
  `lib/availability.ts`)
- **Fonts** — `--font-sans`/`--font-mono`/`--font-display`, all currently
  Arial/Helvetica (no webfont is loaded site-wide; see the typography-hover
  doc for the one section that self-hosts variable fonts instead)
- **Size caps** — `--content-max` (832px, Home hero column / Work gallery
  column), `--reading-max` (700px, About/Saathi/gate/footer), `--shell-max`
  (1200px, header/Play gallery)

Tailwind v4 gotcha, called out directly in `app/globals.css`'s own comment:
custom base-element CSS (the `html`/`body` rules) must go inside `@layer
base`, because Tailwind's utility classes live in the utilities layer and
**win over any unlayered rule** regardless of source order. An unlayered
`html`/`body` rule would silently beat something like `mx-auto`.

## Motion layer

Three ingredients work together:

1. **Lenis** — site-wide smooth scroll, mounted once in `app/layout.tsx` via
   `components/SmoothScroll.tsx`, wrapping `{children}`. It's skipped
   entirely under `prefers-reduced-motion` (falls back to native scroll) and
   is explicitly excluded from the BimaKavach Identity stage via
   `data-lenis-prevent` (see `docs/horizontal-scroll.md`), since that page
   drives its own horizontal wheel-to-scroll logic.
2. **Framer Motion** — used for entrance choreography throughout: `Reveal`
   (a reusable blur-in + fade + rise-on-scroll wrapper used across About,
   Footer, etc.), the Home `Hero`'s per-line stagger (`heroItem` variants,
   custom-indexed delay), the Header's nav-item stagger, and small hover/tap
   transitions (`ViewToggle`'s layout-animated pill, `CompanyChip` underline,
   Footer link reveal). All of it is gated behind `useReducedMotion()`.
3. **A custom CSS-transition-based stagger reveal** — the horizontal
   case-study pages (`IdentityContent`, `SaathiContent`) don't use Framer
   Motion's `whileInView` for their reveals; they run a hand-built
   `StaggerItem` + `IntersectionObserver` system with inline `transition`
   strings, so blur/opacity/translateX timing can be tuned per-item and
   direction-aware (see `docs/stagger-reveal.md` for the full mechanism).

Sound is a fourth, smaller layer, not motion but choreographed alongside it:
`lib/sfx.tsx`'s `SfxProvider`/`useSfx` gate all audio behind a mute toggle and
`prefers-reduced-motion`; `ClickSFX` and `SoundToggle` are mounted globally in
`app/layout.tsx`, and `PageRevealSFX` plays a one-time reveal sound per
session (`sessionStorage` guarded) on first load.

## Key component groups

**Shell** (site-wide, mounted from `app/layout.tsx` or used on every page)
- `Header` — sticky nav, mobile menu, renders `LocalClock`
- `Footer` — the contact/"elsewhere" card with social links
- `SmoothScroll` — Lenis mount/teardown wrapper
- `LocalClock` — live local time + availability dot (reads `lib/availability.ts`)
- `PasswordGate` — soft client-side gate for the two case-study routes
- `PasswordInput` — the password field the gate renders

**Home** (`app/page.tsx`)
- `Hero` — looping Vimeo showreel background (`SITE.heroVideo`), version pill (`SITE.version`), headline (`SITE.greeting`), and bio with inline company chips
- `CompanyChip` — inline brand chip + link used inside the bio text

**Work** (`app/work/page.tsx`)
- `WorkGallery` — grid/list toggle + `AnimatePresence`/`LayoutGroup` wrapper around `ProjectCard`s (fed `PROJECTS` from `data/site.ts`)
- `ProjectCard` — one work-gallery card (grid/list aware)

**Play** (`app/play/page.tsx`)
- `components/play/PlaySection` — page-level wrapper that resolves oEmbed thumbnails and renders `PlayGallery`
- `components/play/PlayGallery` — grid/list toggle + stagger wrapper around `PlayCard`s (mirrors `WorkGallery`)
- `components/play/PlayCard` — one Play item; click-to-play swaps a static thumbnail for an autoplaying Vimeo/SoundCloud iframe
- `lib/play.ts` — oEmbed thumbnail fetcher (`getPlayThumbnail(s)`); `data/site.ts`'s `PLAY` array is the actual content source (there is no separate `data/play.ts`)

**BimaKavach Identity** (`/bimakavach-identity`)
- `components/bk/IdentityContent.tsx` — the horizontal panel-snap stage, its `StaggerItem` reveal system, and the `section-work-5` typography-hover panel (see `docs/horizontal-scroll.md`, `docs/stagger-reveal.md`, `docs/typography-hover.md`)
- `components/bk/AsciiDither.tsx` — the WebGL2 Bayer-dither shader driving the `section-work-0` ASCII video field (see `docs/ascii-dither.md`)

**Bima Saathi** (`/bima-saathi`)
- `components/saathi/SaathiContent.tsx` — the vertical-scroll case study body, with its own local `StaggerSeqCtx`-driven reveal sequence (WIP media placeholders + lorem copy pending final assets)
- `components/saathi/SaathiHero.tsx` — the case study's stacked hero intro, staggered per child
- `components/saathi/SectionNav.tsx` — fixed left table-of-contents that scroll-spies `SAATHI_SECTIONS` via `IntersectionObserver` and highlights the active one

## Deep-dive links

- `docs/typography-hover.md` — the `section-work-5` multiscript hover/proximity typeface effect
- `docs/horizontal-scroll.md` — the BimaKavach Identity panel-snap carousel mechanics
- `docs/stagger-reveal.md` — the shared `StaggerItem`/`IntersectionObserver` reveal system used by both case studies
- `docs/ascii-dither.md` — the WebGL2 Bayer-dither shader behind `section-work-0`
- `docs/password-gate.md` — how `PasswordGate`/`PasswordInput` work and why it's a soft gate, not real security
- `docs/deploy.md` — deployment notes
