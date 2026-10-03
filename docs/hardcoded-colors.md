# Hard-coded colours

Colours written directly into components instead of using theme tokens
(`bg-bg`, `text-ink`, `border-ink/10`, …). Hard-coded colours don't follow
the light/dark switch. Snapshot: 2026-10-03.

## Intentional (kept dark on purpose)

| Where | What | Why |
|---|---|---|
| `components/Hero.tsx:17` | `bg-black light:bg-bg` hero card | Behind the dark clip; page colour behind the light one |
| `components/about/AboutContent.tsx:22` | `bg-black light:bg-bg` coin card | Behind the dark coin clip; page colour behind the light (keyed) one |
| `components/about/AboutContent.tsx:74` | `rgba(0,0,0,0.6)` corner shading | Sits on video |
| `components/about/PhotoCarousel.tsx:64,73` | `bg-black`, `from-black/85` caption fade | Fade over photos for caption |
| `components/play/PlayCard.tsx:21` | `bg-black light:bg-bg` Icon Lab cover | The live coin's backdrop follows the theme (`LogoRenderer.background`) |
| `components/play/PlayCard.tsx:60,125` | `bg-[#0a0a0c]` + radial glow | Media frames for dark embeds |
| `components/play/PlayCard.tsx:91,94,156,159` | play button `bg-black/40 ring-white/30 fill-white` | Sits on thumbnails |
| `components/ProjectCard.tsx:56,59` | `bg-black/10`, `from-black/70` (light variants added) | Shading over cover art |
| `components/ProjectCard.tsx:86` | `shadow rgba(0,0,0,0.35)` | Drop shadow |
| `components/Header.tsx:56` | current-item `shadow rgba(0,0,0,0.25)` (`light:shadow-none`) | — |
| `components/SoundToggle.tsx:27`, `ViewToggle.tsx:78` | `invert light:invert-0` on icons | Icons are black SVGs |
| `components/bk/AsciiDither.tsx:271,277` | `#000000` fallbacks for a missing band colour / page colour | Defaults only; the field reads `--color-bg` |
| `components/bk/IdentityContent.tsx:1288` | hero caption fade `from-black/80 via-black/30` | Sits on the billboard photo |
| `components/bk/IdentityContent.tsx:1291,1294` | hero caption text `text-white/50`, `text-white` | Sits on the billboard photo |
| `components/bk/IdentityContent.tsx:1302` | hero choice dividers `divide-white/10` | Sits on the billboard photo |
| `components/bk/IdentityContent.tsx:1337,1342` | hero choices `bg-black/70\|40`, `text-white\|white/70` | Glass over the billboard photo |

## Brand / data colours (not theme colours)

| Where | What |
|---|---|
| `lib/availability.ts:120–122` | status dot: online `#34d399`, away `#fbbf24`, offline `#6b7280` + glows |
| `components/CompanyChip.tsx:40` | chip monogram fallback `#ffffff` |
| `data/site.ts:62–84` | 5 company chip colours |
| `components/bk/IdentityContent.tsx:255–263` | `FILTER_COLORS` violet ramp for the ASCII dither (`#f4f1ff` → `#160049`); light mode uses it reversed |
| `components/bk/IdentityContent.tsx:1079` | CTA `from-brand to-brand-bold text-white` |

## Converted: BimaKavach Identity (`components/bk/IdentityContent.tsx`)

Now follows the switch. Done on 2026-10-03:

- Large body text, context card, ASCII video panel, scroll stage and the 17
  section panels use tokens (`text-ink`, `to-bg`, `ring-ink/10`, `bg-bg`).
- Type-swap colours `COLOR_ACTIVE` / `COLOR_REST` are `var(--color-ink)` /
  `var(--color-muted)`.
- The ASCII dither (`AsciiDither.tsx`) has a light mode: ink on the page
  colour, with the ramp mirrored in lightness.

What's left in this file is the hero overlay on the billboard photo (listed
under Intentional) and the brand CTA.

## Out of scope: Logo lab (`/logo`, always dark)

~80 lines using `white` / `black` in `components/logo-lab/Controls.tsx`,
`LogoLab.tsx` and `Library.tsx` (buttons, borders, inputs, edge fades), plus
shader colours in `materials/*.ts`. Leave them unless the logo lab gets a
light mode.

## Comments only (no change needed)

- `components/resume/ResumeNav.tsx:23` mentions `#363636`
- `components/logo-lab/materials/design.ts:84` mentions `#1e1e1e`
- `components/bk/AsciiDither.tsx:12` mentions `#4100cf`
