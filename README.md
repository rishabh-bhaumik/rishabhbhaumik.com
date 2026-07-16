# Rishabh Bhaumik — Portfolio

Personal portfolio: a dark, editorial, violet-accented site with a hero-only
home, a dedicated work gallery, an About page, a Play gallery, and two
password-gated case studies.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** — CSS-first `@theme` tokens in `app/globals.css` (no `tailwind.config`)
- **Framer Motion** — reveals, hover states, layout transitions
- **Lenis** — site-wide smooth scroll (`components/SmoothScroll.tsx`)
- **GSAP** + `@gsap/react` — present in dependencies for animation work beyond what Framer Motion covers
- Body/UI font is **Arial** (a CSS system default, no web font request). The
  **Anek** variable-font family is self-hosted from
  `public/media/Anek Font Selection/` and used only inside the BimaKavach
  Identity typeface showcase (see below), one `@font-face` per script.

## Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build (also typechecks)
npm run lint     # eslint
```

## Structure

```
app/
  layout.tsx                    root layout — SfxProvider, sound FX, SmoothScroll
  page.tsx                      home: Header, Hero, Footer
  globals.css                   Tailwind v4 @theme tokens, base styles, Anek @font-face
  about/page.tsx                /about
  work/page.tsx                 /work — Header, WorkGallery, Footer
  play/page.tsx                 /play
  bima-saathi/page.tsx          /bima-saathi          (password-gated case study)
  bimakavach-identity/page.tsx  /bimakavach-identity  (password-gated case study)
components/
  Header.tsx, Footer.tsx, Hero.tsx        top-level chrome
  WorkGallery.tsx, ProjectCard.tsx         work gallery grid/list + view toggle
  ViewToggle.tsx                           shared grid/list switch (work + play)
  LocalClock.tsx, CompanyChip.tsx          header clock/availability, bio chips
  Reveal.tsx, SmoothScroll.tsx             scroll-reveal wrapper, Lenis mount
  PasswordGate.tsx, PasswordInput.tsx      soft client-side gate for case studies
  ClickSFX.tsx, SoundToggle.tsx, PageRevealSFX.tsx   interaction sound effects
  SocialIcons.tsx                          footer platform glyphs
  about/       AboutContent.tsx, PhotoCarousel.tsx
  play/        PlaySection.tsx, PlayGallery.tsx, PlayCard.tsx
  saathi/      SaathiContent.tsx, SaathiHero.tsx, SectionNav.tsx
  bk/          IdentityContent.tsx, AsciiDither.tsx
data/
  site.ts      all copy, nav, companies, projects, footer links, play items
lib/
  availability.ts   weekly online-hours schedule + status resolver
  motion.ts         shared Framer Motion easing + variants
  sfx.tsx           SfxProvider/useSfx — click + entry sound effects
  play.ts           oEmbed thumbnail fetch for the Play gallery
```

`/bima-saathi` is a vertical-scroll case study; `/bimakavach-identity` is a
horizontal, panel-snap-scroll case study of 19 sections. Both build their
reveals on a custom stagger + blur-in system (own implementation per page,
not a shared component). Both are gated by `components/PasswordGate.tsx` — a
soft client-side gate (the password lives in the page's props, so this is a
teaser, not real security).

## Content

Nearly everything editable — copy, nav links, the companies in the bio,
projects, footer links, and the Play items — lives in
`data/site.ts`. Swap values there; components read from it and don't need to
change.

## Deep-dive docs

Longer write-ups of the less obvious parts of the codebase live in `docs/`:

- `docs/ascii-dither.md` — the WebGL2 Bayer-dither shader behind
  `components/bk/AsciiDither.tsx`
- `docs/stagger-reveal.md` — the custom stagger + blur-in reveal system used
  by both case studies
- `docs/typography-hover.md` — the section-work-5 variable Anek typeface
  showcase and its hover behavior
- `docs/horizontal-scroll.md` — the panel-snap horizontal scroll stage in
  `components/bk/IdentityContent.tsx`
- `docs/password-gate.md` — how `PasswordGate` works and its limits
- `docs/architecture.md` — overall app structure and data flow
- `docs/deploy.md` — deployment notes

## Deployment

Designed to deploy on Vercel: import the repo and Vercel auto-detects the
Next.js app, runs `next build`, and serves it — no `vercel.json` and no
environment variables required.

## Accessibility / reduced-motion

`prefers-reduced-motion: reduce` is honored throughout: Lenis smooth scroll is
skipped in favor of native scrolling, CSS transitions/animations collapse to
near-zero duration (`app/globals.css`), and individual components (`Reveal`,
`Header`, `Hero`, `Footer`, `ProjectCard`, `AsciiDither`, the case-study
stagger items) check `useReducedMotion()` / the media query and render their
static end-state instead of animating.
