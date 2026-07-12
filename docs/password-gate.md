# Password Gate

`components/PasswordGate.tsx` + `components/PasswordInput.tsx` — the soft
lock in front of `/bima-saathi` and `/bimakavach-identity`.

**This is not real security.** The password is a prop passed to a client
component, so it ships inside the JavaScript bundle sent to every visitor's
browser — anyone who opens devtools or reads the network payload can find it
in plain text. The gate's job isn't to hide the case study from anyone
determined to see it; it's to make the page *feel* intentional and a little
exclusive, like a "request access" door on a deck shared with a specific
audience. If you ever need to actually restrict who can view a page, see
"Security note" below.

## Composition

`PasswordGate` wraps a case study's content component; its `authed` state
decides what renders:

```tsx
// components/PasswordGate.tsx
export default function PasswordGate({ project, password, children }) {
  const [authed, setAuthed] = useState(false);

  if (authed) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[var(--reading-max)] pt-2">
        <section className="flex flex-col gap-6 px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
          <h1 className="font-display text-[32px] leading-none text-ink">
            Confirm Entry for &ldquo;{project}&rdquo;
          </h1>
          <PasswordInput
            placeholder={`Enter password for "${project}"`}
            minLength={password.length}
            onSubmit={(v) => {
              const ok = v === password;
              if (ok) setAuthed(true);
              return ok;
            }}
          />
        </section>
        <Footer />
      </main>
    </>
  );
}
```

While `authed` is `false`, the gate renders its own `Header` + `Footer` and a
prompt — `children` (the real case study) is never mounted, so there's
nothing to find by disabling JS or inspecting the initial DOM. Once
`onSubmit` returns `true`, the next render returns `children` directly and
the case study (`SaathiContent` / `IdentityContent`) mounts in place.

## Non-persistent unlock

`authed` is a plain `useState(false)` local to the component — nothing is
written to `localStorage`, `sessionStorage`, or a cookie. The file's own
comment states the intent directly:

> Soft client-side gate for case-study pages. Re-prompts on every visit (the
> unlock lives only in component state — no persistence). NOTE: the password
> is in the frontend, so this is a soft teaser gate, not real security.

Refreshing the tab, or navigating away and back, re-gates the page. That's
deliberate — the gate is a small ritual on each visit, not a one-time login.

## Per-project password

The password is a prop, so each route owns its own via its own invocation:

```tsx
// app/bima-saathi/page.tsx
<PasswordGate project="Bima Saathi" password="bktsaathi">
  <SaathiContent />
</PasswordGate>

// app/bimakavach-identity/page.tsx
<PasswordGate project="BimaKavach Identity" password="bkt4">
  <IdentityContent />
</PasswordGate>
```

`bima-saathi` uses `bktsaathi`; `bimakavach-identity` uses `bkt4`. Both pages
also set `robots: { index: false }` in `metadata`, so search engines don't
crawl the gate or the content behind it.

## `PasswordInput` UX

`components/PasswordInput.tsx` handles typing, submission, and feedback;
`PasswordGate` only supplies `minLength`, `placeholder`, and `onSubmit`.

- **`minLength` gates the reveal.** `revealed = value.length >= minLength`.
  `PasswordGate` passes `minLength={password.length}`, so the submit
  affordance only appears once the typed value is at least as long as the
  real password — below that, there's nothing to click.
- **`revealed` also hides the caret** (`caretColor: transparent`), a small
  visual cue that "you've typed enough" without giving anything else away.
- **Enter submits** via `onKeyDown`; `submit()` no-ops unless `revealed`.
- **Wrong password sets an error state**: red border, red caption
  ("Incorrect password. Try again."), and the trailing icon swaps from the
  enter arrow to a refresh icon. Clicking it while errored clears the input
  (`setValue(""); setError(false)`) so the visitor can retry immediately.
- **SFX** via `lib/sfx.tsx`'s `useSfx()` hook. Every keystroke alternates
  between `entry01.wav` / `entry02.wav` (never repeating the same sample
  twice in a row); a correct submit plays `pw-success.wav`, a wrong one
  plays `pw-error.wav`. The input's wrapper carries `data-no-click-sfx` so
  the site-wide click-SFX listener (`SfxProvider` in `app/layout.tsx`)
  skips it — otherwise every keystroke/click would double up with the
  generic click sound.

## Security note

Repeating this because it's the one thing worth not getting wrong:

> NOTE: the password is in the frontend, so this is a soft teaser gate, not
> real security.

`password` is a prop on a `"use client"` component — bundled and shipped to
the browser on every load, with no server in the loop deciding whether to
reveal `children`. If a page ever needs actual access control, don't extend
this component; move the check to a server-checked flow instead — a route
handler that verifies the password server-side and sets an httpOnly cookie,
or a proper auth provider like NextAuth. Client-side password comparisons
are theater.

## Adding a new gated case study

1. Create `app/<slug>/page.tsx` and a content component for it.
2. Wrap the content in `PasswordGate` with a project name and password:
   ```tsx
   export default function MyCaseStudyPage() {
     return (
       <PasswordGate project="My Case Study" password="pick-a-password">
         <MyCaseStudyContent />
       </PasswordGate>
     );
   }
   ```
3. Set `metadata.robots = { index: false }`, matching the existing routes.

No changes to `PasswordGate` or `PasswordInput` are needed — both are
already generic over `project` and `password`.
