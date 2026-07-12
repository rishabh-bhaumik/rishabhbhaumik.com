# Deploy

How to get this site live on Vercel. Written for a first-time deploy of this
repo — no prior Vercel project exists yet, and there is no `vercel.json` in
the repo (none is needed; every setting below is a framework default Vercel
detects on its own).

## Prerequisites

- A GitHub account, with this repo (`portfolio`) pushed to it.
- A Vercel account — the free Hobby tier is sufficient for this project.
- Nothing else. There are no environment variables, databases, or third-party
  API keys to provision (see "Environment variables" below).

## Step-by-step: importing the project

1. Go to [`https://vercel.com/new`](https://vercel.com/new).
2. Click **Import Git Repository** and select the `portfolio` repo from your
   GitHub account. (First time connecting Vercel to GitHub, you'll be asked
   to authorize the Vercel GitHub App and grant it access to the repo.)
3. Vercel auto-detects the framework preset as **Next.js**. Leave the build
   settings on their defaults — they already match this project:
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (this repo's `package.json` defines
     it as plain `next build`, which also type-checks)
   - **Output Directory**: `.next`
   - **Install Command**: default (`npm install`)
4. **Environment Variables**: leave this section empty. Nothing in the
   codebase reads from `process.env` for anything user-facing. The two
   case-study passwords (`bktsaathi`, `bkt4`) are hardcoded props in
   `app/bima-saathi/page.tsx` and `app/bimakavach-identity/page.tsx` — they
   are client-side by design, not secrets pulled from config. See
   `docs/password-gate.md` for why.
5. Click **Deploy**. Vercel clones the repo, runs `npm install` then
   `npm run build`, and on success gives you a `*.vercel.app` URL. A first
   deploy of this project typically finishes in about 1–2 minutes.

## What Vercel does automatically

- Detects **Next.js 16.2.6** with the App Router (no config needed — this is
  read straight from `package.json` and the `app/` directory structure).
- Prerenders the app's static routes at build time. This project currently
  has 6: `/`, `/about`, `/bima-saathi`, `/bimakavach-identity`, `/play`, and
  the framework-generated `/_not-found`. (The two case-study routes prerender
  the *gate*, not the gated content — `PasswordGate` only mounts its children
  client-side, after a correct password, so there's nothing sensitive baked
  into the static HTML.)
- Serves everything under `public/` — including `public/media/`, the site's
  images, audio SFX (`entry01.wav`, `pw-success.wav`, etc.), and video —
  from Vercel's edge CDN, with no extra configuration.
- Sets up **preview deployments** automatically for every branch push and
  every pull request, each with its own shareable URL and its own comment
  thread on the PR (once the Vercel GitHub integration is installed, which
  happens as part of step 2 above).

## Continuous deployment

Once the project is imported, deploys are driven entirely by git pushes —
there's no separate "deploy" step to remember:

- A push to `main` triggers a **production** deploy, which replaces what's
  served at the project's primary domain (the `*.vercel.app` URL, plus any
  custom domain attached to production).
- A push to any other branch, or opening/updating a pull request, triggers a
  **preview** deploy on its own unique URL. Preview deploys never touch
  production and are safe to share for review.

## Custom domain (optional)

1. In the Vercel dashboard: **Project → Settings → Domains → Add**.
2. Enter the domain (or subdomain) and follow Vercel's on-screen DNS
   instructions:
   - For a subdomain (e.g. `www.yoursite.com`), add a **CNAME** record
     pointing to `cname.vercel-dns.com`.
   - For an apex/root domain (e.g. `yoursite.com`), add an **A** record
     pointing to `76.76.21.21`.
3. Once DNS propagates and Vercel verifies the record, HTTPS is provisioned
   automatically (Vercel issues and renews the certificate — no action
   needed).

## Common gotchas

- **`public/media/` size.** As of this write-up it's about 65 MB (images,
  the Anek variable-font showcase assets, and the SFX `.wav` files). That's
  comfortably under Vercel Hobby's static-asset limits, but it's worth
  keeping an eye on — if heavier media (long-form video, large image sets)
  pushes the repo well past 100 MB, move that media to a dedicated CDN
  (Cloudflare R2, Bunny) and reference it by URL instead of bundling it in
  `public/`.
- **No env vars today, but if you add them later**: any value that needs to
  reach client-side code (like `PasswordGate`, which runs in the browser)
  must be prefixed `NEXT_PUBLIC_*`. A server-only env var is invisible to
  client components — it would never make it into a prop like `password`.
  In other words, moving the case-study passwords into env vars would not
  make them any more secret; it would just relocate the same client-visible
  string. See `docs/password-gate.md` for the full reasoning.
- **`next.config.ts` allows remote images** from `**.vimeocdn.com` and
  `**.sndcdn.com` (used for Play-gallery oEmbed thumbnails). This is already
  configured in the repo and needs no changes on Vercel — Next's Image
  Optimization respects it automatically in the deployed build.
- **Vercel Analytics** is opt-in, not installed by default. To add it:
  `npm i @vercel/analytics`, then render `<Analytics />` inside
  `app/layout.tsx`.

## Verify the production build locally before every push

```bash
npm run build   # production build — this is what Vercel runs, and it type-checks
npm start        # serves the build at http://localhost:3000
```

Running this locally catches build-time errors (type errors, broken imports,
prerender failures) before they show up as a failed Vercel deployment.
