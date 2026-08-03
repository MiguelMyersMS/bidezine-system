# Evidence bundles — the commit lock

> **New here? Read [`GUIDE.md`](./GUIDE.md)** — the practical, step-by-step "how to
> ship a component through the lock." This file is the contract/reference.

This directory is the **trust substrate** for the Figma → spec → code → Storybook
pipeline. It exists because the protocol failed not for lack of documentation but
because `verified ✅` is self-attested and free (see
[`../Ambiguity-in-protocols.md`](../Ambiguity-in-protocols.md)). Here, "done" is
**computed from files on disk**, not typed by an agent.

## The rule

A change that touches `src/gallery/<Component>.tsx`, `<Component>.stories.tsx`, or
`docs/atomic/**/<component>.spec.md` must carry a fresh, passing, untampered evidence
bundle for that component.

**Where it is enforced (this matters — a red-team proved a local hook is not enough):**

| Layer | Runs | Status | Why |
|-------|------|--------|-----|
| **CI check** (`.github/workflows/evidence.yml`) | `--range` over the PR's **committed blobs**, gate logic taken from the **trusted base ref** | **the real lock** | Cannot be skipped by `--no-verify`, an uninstalled hook, or `git config --unset core.hooksPath`. A PR that patches the gate can't disarm its own check. |
| **Local hooks** (`.githooks/pre-commit`, `pre-push`) | on commit / push | **advisory WARN** | Surfaces problems early. Does **not** block — blocking locally before the one-command capture (mechanism A) exists just drives people to disable hooks. |

> **Current status: the CI check is ADVISORY (non-required)** until mechanisms A
> (real artifact capture), C (independent signed verdict), and D (computed checklist)
> close the forgery holes catalogued in [`RED-TEAM-2026-06-23.md`](./RED-TEAM-2026-06-23.md).
> Do not mark it "required" in branch protection before then — that, plus CODEOWNERS
> review on enforcement paths, are GitHub UI settings the owner must enable.

Local hooks are wired through `core.hooksPath`. One-time setup on a fresh clone:

```bash
npm run hooks:install   # == git config core.hooksPath .githooks
```

## A bundle: `docs/evidence/<slug>/`

`<slug>` is the lowercased component name (e.g. `NavRow` → `navrow`).

| File | What it proves | Who/what produces it |
|------|----------------|----------------------|
| `figma.json` | Figma was actually fetched (raw MCP dump) | `mcp__figma__get_figma_data` |
| `figma.png` | the ground-truth render of the node | `mcp__figma__download_figma_images` |
| `storybook.png` | what we actually shipped | `evidence:capture:story` (Playwright) |
| `capture-stamp.json` | binds `storybook.png` to the source it was rendered from | `evidence:capture:story` |
| `verdict.md` | an **independent** checklist of every verify dimension; `pass` is *computed* | a checker that did NOT build the component |
| `signature.json` | the checker's HMAC over the whole bundle state | `evidence:sign` (token-holder) |
| `manifest.json` | binds the above to the **exact source content** verified | `npm run evidence:record <slug>` |

`manifest.json` records a sha256 of every source file the bundle covers. The gate
recomputes those hashes at commit time: **edit a verified component and its hash
diverges → the bundle is stale → the commit is blocked.** You cannot capture once
and keep editing.

## Recording a bundle (the only honest path)

1. **Capture Figma (script-owned, un-fakeable).** Reads the slug's spec for
   `figma.fileKey` + `verify.figmaExportNode` and fetches `figma.json` + `figma.png`
   directly from the Figma REST API (needs `FIGMA_API_KEY`):
   ```bash
   npm run evidence:capture:figma <slug>      # add --node <id> / --file <key> to override the spec
   ```
   The node id is bound from the spec, and the fetched JSON is asserted to contain
   exactly that node — a wrong-node or junk `figma.json`/`figma.png` cannot pass.
2. **Capture the story** (Playwright, needs Storybook running on `:6006`):
   ```bash
   npm run evidence:capture:story <slug> --story <storyId>   # e.g. atoms-badge--example
   ```
   This writes `storybook.png` **and** `capture-stamp.json`, which binds the screenshot
   to the sha256 of the source it rendered. `evidence:record` then refuses to seal if
   the source has changed since capture — so a stale screenshot can't be re-used.
   Then have an **independent** pass write `verdict.md` (`VERDICT: pass` on its own
   line, only if every discrepancy is resolved). Doer ≠ checker. *(Independent signing
   of the verdict is mechanism C — until it lands, the verdict itself is still
   trust-based.)*
3. **Seal it (doer):**
   ```bash
   npm run evidence:record <slug> --node <figmaNodeId>
   ```
   `evidence-record.js` refuses to seal unless all artifacts exist, are non-empty,
   `verdict.md` says pass, `--node` matches the captured `figma.json`, and the
   `capture-stamp.json` matches the current source.
4. **Sign it (independent checker, mechanism C):**
   ```bash
   EVIDENCE_CHECK_TOKEN=… npm run evidence:sign <slug>
   ```
   A checker who holds `EVIDENCE_CHECK_TOKEN` (which the **doer must not have**) reviews
   the bundle and signs a digest of `{slug, figmaNode, sources, artifacts}`. The gate
   requires this signature (`EV.UNSIGNED`), rejects a forged one wherever the token is
   available (`EV.BAD-SIGNATURE`), and rejects any post-sign change as a digest mismatch
   (`EV.SIGNATURE-STALE`). **The doer≠checker separation is only real when the token is
   isolated from the doer** — set it as a CI secret / give it only to a separate trusted
   checker. A doer who holds the token can self-sign, defeating the purpose.
5. `git add docs/evidence/<slug>/` and commit alongside the component.

The gate additionally re-validates at check time: every artifact hash matches the
manifest (no post-seal swap), both PNGs are decodable real images (`EV.INVALID-PNG`),
and `figma.json` is a captured dump bound to `manifest.figmaNode` (`EV.FIGMA-NODE-MISMATCH`).

## Baseline (grandfathering the back-catalog)

To avoid a day-one wall of blockers on the existing ~60 components, `baseline.json`
records each component's **master**-committed source hashes (`npm run evidence:baseline`).
A component is exempt from full evidence **only while it stays byte-identical to its
master baseline**; the moment it changes, the gate requires real evidence
(`EV.BASELINE-DRIFT`). New components are never baselined — they need evidence from
their first landing.

Scope is **strict (master only)** — in-flight working-tree edits are *not*
grandfathered. Source hashes are line-ending-normalized (`hashSource`), so a working
tree checked out with `autocrlf=true` (CRLF) matches the git blobs (LF).

## Exemptions (explicit, never silent)

Some files legitimately need no Figma evidence. Add them to
[`exemptions.json`](./exemptions.json) **with a reason**. Exemptions live in one
auditable file the checker reviews — they are not a per-commit escape hatch.

## Bypassing

`git commit --no-verify` skips the **local** hooks — but the local hooks are only
advisory WARN anyway. The authoritative check runs **server-side in CI** over the
committed blobs, from the trusted base ref, and is not affected by `--no-verify`,
an uninstalled hook, or `git config --unset core.hooksPath`. The only way to weaken
the CI check is to edit the enforcement scripts — which are CODEOWNER-protected
(`.github/CODEOWNERS`) and require owner review.
