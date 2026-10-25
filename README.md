# Rishabh Bhaumik - Portfolio

Live at **[rbhaumik.vercel.app](https://rbhaumik.vercel.app)**

Personal portfolio: a dark, editorial, monochrome site (with a light theme)
built in Figma and Claude Code. A hero-only home, a work gallery, About and
Play pages, case studies, and a few unlisted deep-dives and labs.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Home: hero clip (dark and light versions) and headline |
| `/work` | Work gallery, grid or list view |
| `/about` | About, with a live coin logo and photo carousel |
| `/play` | Play gallery (Vimeo / SoundCloud embeds via oEmbed) |
| `/bima-saathi` | Password-gated, vertical-scroll case study |
| `/bimakavach-identity` | Password-gated, horizontal panel-snap case study (19 sections) |
| `/draft` | Unlisted: the BimaKavach case study (2023 - present) |
| `/peetal` | Unlisted: deep-dive on Peetal, BimaKavach's design system |
| `/logo` | Unlisted: logo lab, the mark remade as a coin in 68 materials (always dark) |
| `/resume` | Resume; serves a 404 in production until `RESUME_LIVE` is on |

Unlisted pages are reachable by link only: they carry a `noindex` robots meta,
and `/draft` and `/peetal` also send an `X-Robots-Tag` header
(`next.config.ts`).

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** - CSS-first `@theme` tokens in `app/globals.css` (no `tailwind.config`)
- **Framer Motion** via `LazyMotion` + `m`, so the engine loads as its own chunk (`components/MotionProvider.tsx`)
- **Lenis** - site-wide smooth scroll, on Framer's frame loop
- **WebGL2** - the Identity ASCII dither and the logo lab renderer
- Body/UI font is **Arial**. **Anek** is self-hosted as per-script WOFF2
  subsets (`public/media/anek/`) and loaded only by the pages that use it.

## Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build (also typechecks)
npm run lint     # eslint
```

## Structure

```
app/
  layout.tsx            root layout: theme script, MotionProvider, sound FX, smooth scroll
  globals.css           Tailwind v4 @theme tokens (dark + light), base styles
  page.tsx              /
  work/ about/ play/    main pages
  bima-saathi/          gated case study
  bimakavach-identity/  gated case study
  draft/ peetal/        unlisted case study + design system deep-dive
  logo/                 logo lab (+ presets route, dev only)
  resume/               resume (hidden in production for now)
components/
  Header, Footer, Hero, HeroVideo, LocalClock      site chrome and home
  WorkGallery, ProjectCard, ViewToggle             work gallery
  Reveal, LazyVideo, SmoothScroll, MotionProvider  motion and media helpers
  PasswordGate, PasswordInput                      soft gate for the case studies
  ClickSFX, SoundToggle, PageRevealSFX             sound effects
  ThemeSync                                        keeps the theme in step per route
  about/ play/ resume/                             page content
  saathi/ bk/                                      the two gated case studies
  draft/        DraftContent, DraftRail (side contents), ScrollSlides, PivotTimeline
  peetal/       PeetalContent
  case-study/   parts shared by the case-study pages (Section, Tag, Heading, Body, Media)
  logo-lab/     WebGL2 renderer, materials, presets, recording
data/
  site.ts       copy, nav, companies, projects, footer links, play items
lib/
  availability.ts   weekly schedule behind the header's online-status dot
  theme.ts          theme store, setTheme, useTheme (client)
  theme-script.ts   no-flash <head> theme script, dark-only routes (server-safe)
  motion.ts         shared easing and variants
  sfx.tsx           shared Web Audio context for sound effects
  play.ts           oEmbed thumbnails for the Play gallery
```

## Content

Almost everything editable (copy, nav, companies, projects, project tags,
footer links, Play items) lives in `data/site.ts`; components read from it.
The `/draft` and `/peetal` pages keep their copy, stats and timeline steps at
the top of their own content components.

Project tags use **live** for work that is out and in use (for example
"live 2024").

## Theme

Dark by default. The header clock switches to the light theme, which re-points
the same token names under `:root[data-theme="light"]`. Use tokens
(`text-ink`, `border-ink/10`), not `white` / `black`, for chrome. A small
`<head>` script sets the theme before paint, so there is no flash.

## Deep-dive docs

Longer write-ups live in `docs/`:

- `ascii-dither.md` - the WebGL2 Bayer-dither shader in `components/bk/AsciiDither.tsx`
- `stagger-reveal.md` - the stagger + blur-in reveal system used by the case studies
- `typography-hover.md` - the variable Anek typeface showcase
- `horizontal-scroll.md` - the panel-snap horizontal stage in the Identity case study
- `password-gate.md` - how `PasswordGate` works and its limits
- `architecture.md` - app structure and data flow
- `hardcoded-colors.md` - where fixed colours remain and why
- `deploy.md` - deployment notes

## Deployment

Deployed on Vercel from `main`: every push builds and goes live at
[rbhaumik.vercel.app](https://rbhaumik.vercel.app). No `vercel.json` and no
environment variables are needed.

## Accessibility / reduced motion

`prefers-reduced-motion: reduce` is honoured throughout. Framer animations
are covered by `MotionConfig reducedMotion="user"` in the root layout, CSS
entrances (`.rise` / `.rise-text`) switch off under the media query, and
Lenis falls back to native scrolling. The cursor is the system default.
