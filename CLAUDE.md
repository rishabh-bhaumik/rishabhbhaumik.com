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
- Layout widths: `--reading-max` (700px: About, resume), `--content-max` (832px: home hero column, list views), `--shell-max` (1200px: the ruled sheet, Work and Play grids). The nav (`SheetNav`) is the same on every page: inside the sheet on sheet pages, full width with its contents in the 1200px column elsewhere.
- Hairlines: the old footer's top and resume dividers are `0.5px` at `white/10`; the sheet's rules are `border-rule`

## Routes

- `/` — home on the **ruled sheet** (Figma 8780:35610, `components/home/`): one 1200px column with
  `rule` hairlines down both sides (`Sheet.tsx`; outside them the gutters carry the orbit clip's starfield: `SheetGutters`,
  two fixed canvases whose stars stream out from the screen's middle at the clip's measured rate, density, lifetimes and
  pop-in/blink-out, stepping at its 12fps; ink-coloured; one still field under reduced motion), its own sticky nav (`SheetNav`: mark, name, local
  time, links, and the dock's controls, so the floating dock hides while `[data-sheet-nav]` is up),
  the greeting over the headline (`Greeting`: hello in 17 languages from `HOME.greetings`, rolling
  up one at a time from "নমস্কার", which is server-rendered and stays under reduced motion; each
  non-Latin script has its own tiny font cut to its word, `components/home/hello.css`, made by
  `scripts/hello-fonts.py`, ~38 KB in all; Hello, Enchanté and Ciao are in the site's Arial;
  `GreetingRoll` also fills the contact block's "Say …"), the orbit clip (at every width only its top half shows,
  sitting on the marquee, which cuts the planet through its middle; from lg up it sits under the
  text, 162px down, so the hero is 560px as in Figma; narrower, text and strip stack), the label marquee
  (`TagMarquee`; the whole opening, greeting to marquee, stays pinned under the nav while the rest scrolls up over it: `<Sheet hero>` →
  `SheetPin`, measured, pinned lower when taller than the screen; Work and Play pin theirs the same way, and so do the projects (BimaNetra, Bima Saathi, Peetal: `SheetPin`
  round `ProjectHero` + marquee inside their article, the rest in a `relative z-10 bg-bg` layer)), Selected Work (`SelectedWork`, Figma 8785:37079; Overview links to each project,
  "Work in progress" where there's no page yet), contact (`ContactOrbit`: the same clip on its
  still, played while the pointer is over the block) and footer. On every sheet page the page holds once its end is on
  screen and the whole footer (contact card included, where there is one) slides up into the room left for it (`SheetMain`:
  sticky main, measured height, footer-high padding, plus the usual 80px before a contact footer). Copy in `HOME` / `SELECTED_WORK`
  (`data/site.ts`). Every page uses `SheetNav` (the old `Header` is gone); pages off the sheet (/resume, /draft, /enter) still use the old `Footer`. Pages that aren't projects (home, Work, About, Play) have a footer that opens on the contact block (`<Sheet contact>`: contact card, then the four links, then the note; one block); projects' footers are just the links and note, and the page ends on `NextProject` (the last thing in the page, above the plain footer; also on their password gates), and /draft (project 999) has one too, wrapping to the first project.
- `app/not-found.tsx` — 404 on the same sheet: `SheetHero` with its own headline, "Surprise me" (`SurpriseMe`, the
  Overview button's style with Peetal's sparkle icon, opening a random case study), and the marquee spelling out 404;
  no footer (`<Sheet footer={false}>`).
- `/enter` — retired: the splash is no longer reached (the `ENTER_SCRIPT` redirect is gone from the
  root layout); its files (`components/enter/`, `lib/enter.ts`) are kept but unused.
- `/netra` — the BimaNetra project (Figma 8818:32660) on the ruled sheet (`components/netra/`, copy in
  `data/bima-netra.ts`). Built from `components/project/`, shared by project pages to come: `GrowMedia` (a
  1200×675 media frame whose media starts at 1000×526, grows to full size once the frame is on screen and
  shrinks back as it leaves; clip plus scale in step, so nothing re-lays out; full size under reduced
  motion), `NextProject` (the orbit clip behind the next project's title, played on hover as in the
  contact block) and `Tags` / `Rich`. Media slots show their label until a file is added; a GrowMedia can
  instead hold its own scene as children, reading the growth with `useGrow()`. The opening frame is
  one: `NetraSplash` (storyboard Figma 8831:35640), a live 1200×675 stage scaled to the frame. BimaKavach's
  curtain with the logo scrubbed by the growth, then at full size a ~14s loop on the D&O page (Netra's
  own fonts, colours and gavel clip, in `public/media/netra/`; its D&O icon is drawn live by `NetraArcs`,
  15 stacked ogee rings, and hands over from the bottom left to under the column rather than moving:
  one collapses away down-left as another forms from below, both through an #ff7700 Bayer dither, as
  Netra's DitherWash): camera to the quote column, a
  pointer types "Pepe", picks the MCA record, hovers the CTA (the camera closes in, storyboard 07.1:
  the gavel lifts away, the icon stays), then heads for Know More as the field and CTA dissolve (07.2), clicks it, and
  the curtain rises back to the logo. NetraBot sits beside Know More as the visitor's stand-in, its states,
  reactions and gaze (on the fake pointer, the field, the icon…) scripted per beat. Resets when off screen;
  one still under reduced motion. NetraBot itself is ported from BimaNetra into `components/netrabot/` +
  `lib/netrabot/` (data, player, renderer; plus a `getGaze` prop so a script can aim its eyes). Not indexed
  while it has placeholders.
- `/work` — work gallery (`WorkGallery`) on the ruled sheet, opening like a project (`PageHero` in `components/project/parts.tsx`:
  breadcrumb home // work, title, note; copy and marquee words in `WORK_PAGE`); list view (the default) gives each card a sheet-wide 1200×675 frame that grows like GrowMedia's (`useGrowFrame`, rounded while small), grid view keeps static rounded cards
- `/about` — `AboutContent`, on the ruled sheet
- `/play` — Play gallery (Vimeo/SoundCloud embeds via oEmbed), on the ruled sheet, opening with `PageHero` (home // play) and its
  marquee (`PLAY_PAGE`)
- `/bima-saathi` — password-gated; the gate and the case study (`components/saathi/SaathiContent.tsx`) both sit on
  the ruled sheet, built from `components/project/` like /netra. `/peetal` (unlisted) is the same, copy in
  `components/peetal/PeetalContent.tsx`. Next Project on each follows Selected Work's order.
- `/bimakavach-identity` — password-gated, horizontal panel-snap-scroll case study (19 sections, then a last panel with Next Project and the footer). Both gates show Next Project and the footer under the password too

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
- /draft containers are always light (hard rule): every art frame, placeholder and
  diagram on /draft renders as in light mode, in either theme. Spread `LIGHT`
  (`components/draft/ui.tsx`, i.e. `data-theme="light"`) onto a new container's root;
  the light tokens in globals.css and the `light:` variant then apply inside it.
  Each container also takes `media(id)` and gets a slide in `SLIDES`
  (`components/draft/MediaLightbox.tsx`): clicking one opens a lightbox carousel of
  only the media, at that one.
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
  the dark one's negative (dark orbs, ink on the page colour; only lightness is
  inverted, so the dark clip's faint teal edge and rose stay where they are), made frame by
  frame from the dark master by `<IGNORE>/media-sources/orbitting-negative/make.py`
  (encode with `-tune grain` or x264 smooths the grain away). The earlier white
  "studio" render lives on in `<IGNORE>/media-sources/orbitting-light/`.
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
- `components/project/` — the project-page kit (GrowMedia's scroll-grown frames, NextProject,
  ProjectHero / ProjectSection / Numbered / Stats) behind /netra, /bima-saathi and /peetal
- `components/PasswordGate.tsx` — soft client-side gate for both case studies
  (password lives in the page component's props — not real security)
- `lib/availability.ts` — weekly schedule + `resolveStatus()` behind the
  header's live local-time / availability dot

## Deep-dive docs

See `docs/` for longer write-ups: `ascii-dither.md`, `stagger-reveal.md`,
`typography-hover.md`, `horizontal-scroll.md`, `password-gate.md`,
`architecture.md`, `deploy.md`, `hardcoded-colors.md`, `optimizations.md` (lighter/faster
things to do later, e.g. re-encoding the 18 MB music file).
