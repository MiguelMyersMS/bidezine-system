# Cloudflare hosting — `bs.bidezine.systems` (Bidezine System site)

> **Read this before touching any Cloudflare infrastructure from this repo.**
> This is the written record of what exists on Cloudflare **for `bidezine-system` (v2)**.
> **This file contains NO secrets** — only structure. Tokens never go here.

_Created 2026-08-03. Infrastructure stood up and verified end-to-end; **the site itself is not built yet**._

Sibling record for the **legacy** repo's site (`ds.bidezine.systems`):
`../design-system/docs/infra/CLOUDFLARE.md`. Both sites share one Cloudflare account and one domain.

---

## What this is (plain English)

The domain **`bidezine.systems`** is registered at Cloudflare. It now hosts **two separate private sites**:

| Address | What it is | Which repo |
|---|---|---|
| `ds.bidezine.systems` | The **legacy** design system's docs site | `ds-docs-site` (a separate project) |
| **`bs.bidezine.systems`** | **The Bidezine System site — NEW, this repo's** | _not built yet_ |

`bs` = **Bidezine System**. Both sites are **private**: Cloudflare puts a login screen in front, so only
approved people can open them. The public root `bidezine.systems` is still reserved for a future
public site and is unaffected. Everything runs on Cloudflare's **free** tier.

**Right now `bs.bidezine.systems` serves a placeholder page.** The plumbing is proven; the content is not
written. Deploying over it replaces the placeholder.

---

## The setup (technical)

| Thing | Value |
|---|---|
| Domain (zone) | `bidezine.systems` (active) |
| Zone ID | `653314675cd02556dc11d5bb64b716ba` (not a secret) |
| Cloudflare Account | `Miguel@bidezine.com's Account` |
| Account ID | `0b79f5dc3ec8ebcff7fc082b6b7282d9` (not a secret) |
| Hosting | **Cloudflare Pages**, project **`bs-site`** |
| Production branch | `main` |
| Internal Pages URL | `bs-site.pages.dev` |
| Private URL (LIVE) | `https://bs.bidezine.systems` |
| DNS | `CNAME bs → bs-site.pages.dev`, proxied (orange cloud) |
| Private gate | **Cloudflare Access** (Zero Trust, Free plan, ≤50 users) — email one-time-code login |
| Team domain (login host) | `still-credit-afbb.cloudflareaccess.com` |
| Access application | **Bidezine System site (private)** — `1474dfa4-5a9e-4710-9c66-875def753914` |
| Access policy | **Allow Miguel + Blair** — `f5f20581-bda3-436f-b517-26bfe3be78f5` |
| Session duration | 24h |
| Gated hostnames | `bs.bidezine.systems`, `bs-site.pages.dev`, `*.bs-site.pages.dev` (wildcard covers every deployment alias) |
| Allow-listed emails | `miguel@bidezine.com`, `miguelmyers@microsoft.com`, `blairjarmstrong@gmail.com` |
| What is published | **Placeholder only.** The real site is still to be built. |

### Why a separate Access application

`bs-site` got its **own** Access app rather than being bolted onto the legacy `DS Storybook (private)` app.
The allow-list is byte-identical (same three emails, same 24h session, same login experience), but the two
sites can now be re-scoped independently — changing who can see `bs.` will never silently change who can
see `ds.`, and the app names stay honest about what they gate.

---

## Deployment model — **Direct Upload via wrangler**

A static directory is uploaded as-is. There is **no** Git-connected auto-build — pushing to GitHub does
**not** publish the site. You publish by running the command below.

```bash
# from the repo root; credentials come from THIS repo's .env
set -a && . ./.env && set +a
npx --yes wrangler@4.40.0 pages deploy <DIRECTORY> --project-name bs-site --branch main --commit-dirty=true
```

- The production branch is `main`. Deploying to any other branch creates a **preview** URL
  (still gated — the `*.bs-site.pages.dev` wildcard covers previews).
- Do **not** create a second/duplicate Pages project — always deploy to `bs-site`.
- Pages projects **cannot be renamed**. `bs-site` is permanent unless you recreate and reattach the domain.

### 🚨 Pin wrangler to `4.40.0` — plain `npx wrangler` is BROKEN

On 2026-08-03, `npx wrangler` (which resolves to latest, `4.114.0`) **fails to install**:

```
npm error code ETARGET
npm error notarget No matching version found for sharp@0.35.2.
```

That release pins `sharp@0.35.2`, which no longer resolves on the npm registry (0.35.3 is now published).
**`wrangler@4.40.0` installs and deploys fine** and is what every command in this file uses. If a future
wrangler fixes the pin, this note can be dropped — but until someone verifies that, use `4.40.0`.

---

## Credentials

Same two-token model as the legacy repo. **Both files are gitignored and must NEVER be committed.**

| Agent | Stored in | Env var |
|---|---|---|
| Claude Code | `.env` | `CLOUDFLARE_API_TOKEN` |
| GitHub Copilot | `.env.copilot` | `CLOUDFLARE_API_TOKEN` |

Both files also carry `CLOUDFLARE_ACCOUNT_ID=0b79f5dc3ec8ebcff7fc082b6b7282d9`.

**`.env` does not travel through git.** On a machine that doesn't have one yet, copy it from the sibling
repo — the values are shared across our repos, so you are not authoring a new secret:

```bash
cp ../design-system/.env .env
cp ../design-system/.env.copilot .env.copilot
git check-ignore -v .env   # MUST print a .gitignore rule. If it prints nothing, STOP.
```

The `SessionStart` hook in `.claude/settings.json` already prints this instruction when `.env` is missing.

> 🚨 **Name the file exactly `.env` — leading DOT, not underscore.** `_env` is not matched by `.gitignore`
> and is one `git add -A` away from publishing a live API token. This has nearly happened once before.

---

## Verified on 2026-08-03

All checks run from the machine that created the infrastructure:

- [x] Token verified `active`
- [x] Zone `bidezine.systems` active
- [x] Pages project `bs-site` created (production branch `main`)
- [x] Custom domain `bs.bidezine.systems` attached
- [x] DNS `CNAME bs → bs-site.pages.dev` created, proxied
- [x] Access application + allow-policy created; wildcard `*.bs-site.pages.dev` added so no deployment
      alias is ever public
- [x] Placeholder deployed (1 file) — HTTPS handshake succeeds, so the TLS certificate is issued and working
- [x] **Gate verified:** anonymous requests to all three hostnames return **302 → Access login**

```
https://bs.bidezine.systems         HTTP 302 -> still-credit-afbb.cloudflareaccess.com/...
https://bs-site.pages.dev           HTTP 302 -> still-credit-afbb.cloudflareaccess.com/...
https://e69c7e04.bs-site.pages.dev  HTTP 302 -> still-credit-afbb.cloudflareaccess.com/...
```

> Note: the Pages API may report the custom domain's `status` as `pending` for a while after it is already
> serving. The 302 above is served over working HTTPS, which is the real proof. Ignore the lagging field.

---

## Open items

1. **The site has not been designed or built.** Only a placeholder is deployed. What `bs.bidezine.systems`
   should contain is still to be specified by Miguel.
2. **Which directory gets deployed is undecided** — it depends on item 1. Fill in `<DIRECTORY>` in the
   deploy command once the site exists.
3. ⚠️ **`.claude/settings.json` needs a one-line human edit — deploys will prompt until it's made.**
   The existing allow-rules are `Bash(npx wrangler *)` / `Bash(npx wrangler:*)`. These are **prefix**
   matches, so they do **not** match the pinned command `npx --yes wrangler@4.40.0 …`. Add these two
   entries to `permissions.allow`:

   ```json
   "Bash(npx wrangler@4.40.0:*)",
   "Bash(npx --yes wrangler@4.40.0:*)",
   ```

   **This must be done by a human.** Claude Code's auto-mode classifier refuses to let an agent widen its
   own permissions — the edit was attempted on 2026-08-03 and blocked, exactly as the legacy repo's
   `docs/infra/CLOUDFLARE.md` (answer 5) records happening before. Without it, deploys still work; they
   just prompt for approval each time.

   > Deliberately **not** added: `Bash(curl *)`. A curl allow-rule is a prefix match and cannot be limited
   > to the Cloudflare API — it would permit `curl` to *any* address from this repo. Cloudflare **settings**
   > changes (which use curl against the REST API) will therefore keep prompting. That is the intended
   > trade-off, carried over from the legacy repo.

---

## Coexistence rules

1. **This file is the source of truth for `bs-site`.** Read it before making Cloudflare changes; update it after.
2. **Never touch `ds-storybook`** from this repo. That is the legacy site and belongs to a different project.
3. **One Pages project per site** — `bs-site` here, `ds-storybook` there. Never create duplicates.
4. **Never commit secrets.** `.env` / `.env.*` stay local and gitignored.
5. **Announce infra changes** by updating this file and pushing, so the other machines and humans stay aware.
   Per `docs/process/TEAM-SYNC-DISCIPLINE.md`, all three machines work on `main` — pull before you start,
   push when you stop.
