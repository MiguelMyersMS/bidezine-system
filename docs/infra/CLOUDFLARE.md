# Cloudflare Pages deployment

This is the real production deploy path for `https://bs.bidezine.systems/`. It was
referenced by the placeholder page that used to live on that domain before this was
written up.

## TL;DR

- **Host:** Cloudflare Pages, project name `bs-site`.
- **Domain:** `bs.bidezine.systems` (custom domain on the Pages project), also reachable
  at `bs-site.pages.dev`.
- **Access:** the whole site sits behind **Cloudflare Access** (email one-time-code
  login gate). This is infra-level auth in front of Cloudflare Pages, unrelated to the
  app itself. A correct deploy still shows the Access login page first — that is
  expected, not a bug.
- **What gets deployed:** the built output of `site/` (a Vite + React + React Router SPA)
  after it's built once with the real `@bidezine/system` library
  ([CLAUDE.md](/CLAUDE.md) requires the site to consume `dist/`, never `src/` directly).
- **How it deploys:** automatically, via GitHub Actions, on every push to `main`.
  Workflow: [.github/workflows/deploy-cloudflare.yml](/.github/workflows/deploy-cloudflare.yml).

## Why this doc exists

For most of this project it was assumed `bs.bidezine.systems` was served by **GitHub
Pages** (there's a whole other workflow —
[.github/workflows/deploy-site.yml](/.github/workflows/deploy-site.yml) — plus a
`site/public/CNAME` file for that). That workflow is real and still runs successfully,
but it is **not** what the public domain actually points at.

The real answer, found by inspecting the Cloudflare Pages API directly, is a separate
project called `bs-site`:

```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/bs-site
```

Key facts from that inspection:

- `production_branch: "main"`
- `domains: ["bs-site.pages.dev", "bs.bidezine.systems"]`
- `deployment_trigger.type: "ad_hoc"` — **not** git-integrated. Cloudflare never polls or
  clones the GitHub repo itself for this project. There is no "build settings" screen to
  fix on the Cloudflare side; the *only* way content changes is via a direct
  upload/deploy call (Wrangler CLI or the Pages API), which is why a CI step is required
  to do that upload on our behalf.
- `build_config.*` fields are all `null` — confirms the above (no framework preset, no
  build command, nothing for Cloudflare to run).

So: **GitHub Pages workflow = builds and deploys to GitHub's own Pages host (a parallel,
unused-by-DNS target). Cloudflare Pages workflow = builds and pushes to the project the
domain actually resolves to.** Both are harmless to keep; only the Cloudflare one matters
for what visitors see at `bs.bidezine.systems`.

## A red herring worth remembering

At one point a completely different, self-contained static bundle turned up at
`C:\Users\miguelmyers\Downloads\bidezinesystem Design System\dist\deploy\`, produced by a
separate design tool. It had no build step, loaded React/ReactDOM/Babel from the unpkg
CDN, transpiled JSX in-browser, and its own README called its bundle *"the
design-system recreation used for previewing"* — i.e. explicitly **not** meant to be the
production artifact. It was confirmed with the project owner to be unintended and is not
part of this repo. If something like it resurfaces, treat it as superseded — the real
site is always the built output of [site/](/site).

## The GitHub Actions workflow

[.github/workflows/deploy-cloudflare.yml](/.github/workflows/deploy-cloudflare.yml):

1. Checks out the repo.
2. `npm install` + `npm run build` at the repo root — builds `@bidezine/system` itself
   into `dist/`.
3. `npm install` + `npm run build` inside `site/` — builds the showcase SPA into
   `site/dist/`, importing the library's built `dist/` output per CLAUDE.md.
4. Deploys `site/dist` to the `bs-site` Cloudflare Pages project via
   [`cloudflare/pages-action@v1`](https://github.com/cloudflare/pages-action), targeting
   branch `main`.

Triggers: push to `main`, or manual `workflow_dispatch`.

### Required secrets

Set once as GitHub repo secrets (Settings → Secrets and variables → Actions, or via
`gh secret set`):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Both are also present locally in the gitignored `.env` file (see `.env.example` for the
expected variable names) for manual/ad-hoc deploys — see below.

## Manual deploy (fallback, rarely needed)

Only needed if GitHub Actions is unavailable and a deploy is urgent. Requires the two
env vars above to be set in the shell first (e.g. sourced from `.env`), then:

```powershell
npm run build              # builds the library -> dist/
cd site
npm run build               # builds the SPA -> site/dist/, using the library's dist/
cd ..
npx wrangler pages deploy site/dist --project-name=bs-site --branch=main --commit-dirty=true
```

This is exactly what was done once, manually, to prove the real site could replace the
placeholder, before the GitHub Actions workflow existed. Prefer letting CI do this now —
it's the source of truth going forward.

## How to verify a deploy actually shipped

A green GitHub Actions run is necessary but not sufficient — confirm the content
actually reached Cloudflare:

```powershell
$headers = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
$resp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/pages/projects/bs-site" -Headers $headers
$resp.result.latest_deployment.id
$resp.result.latest_deployment.deployment_trigger.metadata.commit_hash
$resp.result.latest_deployment.latest_stage.status   # expect "success"
```

Confirm `commit_hash` matches the commit you expect, and `latest_stage.status` is
`success`. Then hit the site in a browser — you should see the Cloudflare Access login
page ("Log in to Bidezine System site (private)"). That's the expected first screen for
anyone, including you; it means DNS/TLS/Access are untouched and only the app content
changed.

## Open items / things to revisit later

- Decide whether the GitHub Pages workflow ([deploy-site.yml](/.github/workflows/deploy-site.yml))
  should eventually be removed now that it's confirmed to be a non-production, parallel
  target — kept for now to avoid disruption, but it could be a source of confusion later
  (e.g. if DNS is ever repointed by mistake).
- No custom Cloudflare Pages `_headers`/`_redirects` files exist yet for SPA routing
  edge cases; the client-side router has worked fine so far but this is worth a look if
  deep-link refreshes ever 404.
