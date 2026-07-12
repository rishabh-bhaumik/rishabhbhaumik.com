# Company logos (inline bio chips)

These render as small brand-colored chips in the hero bio. Paths + chip colors
are configured in `data/site.ts` (`BIO.companies[].chip`). Current files:

- `vedantu.svg` — on a `#ff693d` chip
- `nymbl.png` — on a black chip
- `unicef.svg` — on a `#009edb` chip

Notes:
- **145 East** has no logo file — it renders as a `145` text chip (gold on black).
- **BimaKavach** uses `/public/media/bimakavach-mark.svg` on a `#4100cf` chip.

If a logo file is missing, the chip falls back to a letter monogram, so the page
never breaks. To change a chip, edit `BIO.companies` in `data/site.ts`.
