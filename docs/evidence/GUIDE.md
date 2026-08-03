# Evidence Protocol — How To Use It

A practical guide to shipping a component through the evidence lock. For the *why* and
the formal contract, see [`README.md`](./README.md); for the adversarial analysis that
shaped it, see [`RED-TEAM-2026-06-23.md`](./RED-TEAM-2026-06-23.md).

---

## 1. The one idea

"Verified" used to be a word an agent typed for free. Now it is a **bundle of files on
disk, bound by hashes and signed by someone who isn't the builder.** You don't *claim*
a component matches Figma — you *produce the evidence*, and a script decides.

A change to a gallery component, its story, or its spec cannot pass the gate unless
`docs/evidence/<slug>/` holds a **fresh, complete, signed** evidence bundle for it.

---

## 2. The two roles (this is the whole point)

| Role | Who | Does | Has the token? |
|------|-----|------|----------------|
| **Doer** | whoever builds/changes the component | captures Figma + story, fills the checklist, records the bundle | **No** |
| **Checker** | a *different* person/agent/CI job | reviews figma.png vs storybook.png, checks the boxes, signs | **Yes** (`EVIDENCE_CHECK_TOKEN`) |

The doer **cannot** sign their own work — they don't hold the token. That separation is
the heart of the system. If the same person does both, the system gives you nothing.

---

## 3. The happy path, start to finish

You changed `src/gallery/NavRow.tsx`. Here's how to get it through the gate. (`<slug>`
is the lowercased component name, e.g. `navrow`. Commands use the `node scripts/...`
form — npm aliases are in §7.)

### As the DOER

```bash
# 0. Make sure Storybook is running (the story capture needs it)
npm run storybook                      # serves on :6006

# 1. Capture Figma — a script fetches it with your key; nothing to fake
#    (reads fileKey + node from docs/atomic/**/navrow.spec.md)
node scripts/evidence-capture-figma.js navrow

# 2. Capture the story — renders it and binds the screenshot to your code
#    Find the story id from the running Storybook (see §8); ids look like
#    organisms-navrow--example, NOT the old gallery-* ids.
node scripts/evidence-capture-story.js navrow --story organisms-navrow--example

# 3. Create the verdict checklist skeleton (for the checker to fill)
node scripts/evidence-verdict-init.js navrow

# 4. Seal the bundle (binds it to your exact current source)
node scripts/evidence-record.js navrow --node 515:2377
```

At this point the bundle is complete **but unsigned**. The gate will still block it
(`EV.UNSIGNED`) — on purpose. Hand it to a checker.

### As the CHECKER (must be a different actor, holding the token)

```bash
# 5. Actually look. Open both images and compare, dimension by dimension:
#      docs/evidence/navrow/figma.png      (the design — ground truth)
#      docs/evidence/navrow/storybook.png  (what we built)
#    Edit docs/evidence/navrow/verdict.md: cite evidence per row, check a box
#    ONLY when that dimension truly matches. Leave a box unchecked (or write a
#    TODO on a checklist line) and the verdict computes to FAIL.

# 6. Sign it (only works if you hold the token)
EVIDENCE_CHECK_TOKEN=••• node scripts/evidence-sign.js navrow

# 7. Commit the bundle alongside the component
git add src/gallery/NavRow.tsx docs/evidence/navrow/
git commit -m "feat(navrow): ... (+ evidence)"
```

The CI gate re-runs everything over the committed bytes and verifies the signature.
Green = real.

### 3a. Co-recording a light sibling after a dark-run shared-base fix

Any change that edits `src/gallery/<Name>.tsx` or `<Name>.stories.tsx` that `slugForFile`
maps to a **DIFFERENT (light) slug** — typically a `*-dark` run applying a shared-base fix —
MUST, in the SAME change, re-seal the light sibling's bundle *before the gate*. Leaving the
light bundle stale after editing its `.tsx` is the defect, not the gate. Which path you take
depends on whether the changed token's **LIGHT** value moves:

1. **LIGHT value UNCHANGED (surface-aware token, L14/L15)** — the light render is
   byte-identical, so a **lean re-record** is enough:

   ```bash
   node scripts/evidence-capture-story.js <lightSlug> --story atoms-<lightSlug>--example
   node scripts/evidence-record.js <lightSlug>
   node scripts/evidence-sign.js <lightSlug>     # checker, holds the token
   ```

2. **LIGHT value DIVERGES from the token it replaces** — the light render actually CHANGES,
   so a lean re-record would seal a render that contradicts the sealed light spec. In this
   run the dark fix changed the disabled-off track `surface → faintFill`, but on the LIGHT
   set `faintFill = slate2` while `surface = white` (they diverge), so the light disabled-off
   track visibly shifts white → slate2. Here the light sibling needs a **FULL independent
   re-verify against Figma**, AND the light spec's affected value must be **reconciled first**
   — do NOT co-record a render that disagrees with the sealed light spec (that would launder
   a light-surface regression).

---

## 4. The verdict checklist (mechanism D)

`verdict.md` is not prose with a "pass" line — it's a checklist, and `pass` is
**computed**. Every one of these ids must be a checked `- [x]` line, with concrete
evidence, and no `TODO`/`FIXME`/`deferred`/`unverified` markers on any checklist line:

| id | What the checker confirms |
|----|---------------------------|
| `figma-fetched` | figma.json is a real captured dump |
| `node-bound` | its node id matches the spec / manifest |
| `story-rendered` | storybook.png is the real component |
| `dimensions` | rendered size matches Figma |
| `colors` | every slot fill matches its token |
| `typography` | TYPE tokens (size/weight/lineHeight) match |
| `states` | every state in the matrix is covered |
| `icons` | icon identities match Figma exactly |

A missing id, an unchecked box, or a buried marker → the verdict fails and the bundle
can't be recorded or signed. There is no free-text pass to launder.

---

## 5. What the gate is telling you (error codes)

When the gate blocks, the `EV.*` code says exactly what's wrong:

| Code | Meaning | Fix |
|------|---------|-----|
| `EV.NO-EVIDENCE` | changed component has no bundle and isn't baselined | run the happy path |
| `EV.BASELINE-DRIFT` | a grandfathered component changed | it now needs real evidence — run the happy path |
| `EV.STALE-EVIDENCE` | source changed after the bundle was recorded | re-capture the story + re-record |
| `EV.VERDICT-INCOMPLETE` | checklist has a missing/unchecked id or a marker | finish the review honestly |
| `EV.UNSIGNED` | bundle isn't signed by a checker | a token-holder must `evidence:sign` |
| `EV.SIGNATURE-STALE` | bundle changed after it was signed | re-review and re-sign |
| `EV.BAD-SIGNATURE` | signature doesn't verify (forged/wrong key) | sign with the real token |
| `EV.TAMPERED-ARTIFACT` | an artifact changed after recording | re-capture + re-record |
| `EV.INVALID-PNG` | a "screenshot" isn't a real image | re-capture |
| `EV.FIGMA-NODE-MISMATCH` | figma.json is a different node than claimed | re-capture the right node |
| `EV.UNRESOLVED-GALLERY` | a gallery file dodged the slug rules (sub-dir/odd name) | keep gallery files flat `src/gallery/<Name>.tsx` |
| `EV.BAD-EXEMPTION` | an exemption is malformed or expired | fix/renew it in `exemptions.json` |

---

## 6. Where it's enforced (and why local ≠ the lock)

| Layer | What it does | Trust |
|-------|--------------|-------|
| **Local hooks** (`.githooks/`) | warn you early on commit/push | advisory — never blocks |
| **CI check** (`.github/workflows/evidence.yml`) | re-runs the gate over committed blobs, from the trusted base ref, verifies signatures | **the real lock** |

A local hook can't be the lock because the doer controls their own machine
(`--no-verify` exists). The server is the authority. Install local hooks once for the
early warning: `npm run hooks:install`.

---

## 7. Command reference

| npm alias | Script | Role |
|-----------|--------|------|
| `evidence:capture:figma` | fetch figma.json + figma.png by node | doer |
| `evidence:capture:story` | render story → storybook.png + stamp | doer |
| `evidence:verdict:init` | write the checklist skeleton | doer |
| `evidence:record` | seal the bundle to current source | doer |
| `evidence:sign` | sign the bundle (needs token) | **checker** |
| `evidence:baseline` | grandfather the back-catalog vs master | maintainer |
| `audit:evidence` | run the gate on staged changes | anyone |
| `hooks:install` | wire local advisory hooks | anyone |

> npm passes args after `--`, e.g. `npm run evidence:capture:figma -- navrow`. The
> direct `node scripts/<name>.js navrow` form (used above) is equivalent and simpler.

Gate modes: `--staged` (local), `--range <base>..<head>` (CI, committed blobs),
`--files a,b,c`, `--all`.

---

## 8. Troubleshooting

- **"could not load story / waitForSelector timeout"** — wrong story id. List the real
  ids: open `http://localhost:6006/index.json` and search, or:
  ```bash
  node -e '(async()=>{const j=await(await fetch("http://localhost:6006/index.json")).json();console.log(Object.values(j.entries).filter(e=>/navrow/i.test(e.id)).map(e=>e.id))})()'
  ```
  Ids are `atoms-/molecules-/organisms-<name>--<story>` — **not** the legacy `gallery-*`
  ids from the old (retired) visual-test convention.
- **"no Figma fileKey"** — the spec has no `figma.fileKey`. Add it, or pass
  `--file <key> --node <id>` explicitly.
- **`FIGMA_API_KEY` not set** — the capture needs it in the environment.
- **Storybook not running** — `npm run storybook` (serves :6006) before capturing.
- **Everything shows as drifted on Windows** — handled: source hashing normalizes line
  endings (`autocrlf=true` is fine). If you still see it, your `.gitattributes` for
  `.githooks` may be off.

---

## 9. Baseline & exemptions

- **Baseline** grandfathers the existing ~60 components so the gate only fires on the
  *next* change. A component is exempt only while byte-identical to master; change it
  and it needs real evidence. Regenerate after intentional master changes:
  `node scripts/evidence-baseline.js`.
- **Exemptions** (`exemptions.json`) are for components that legitimately need no Figma
  evidence. Each needs `reason`, `by`, `date`, `expires`. They're loud and fail-closed —
  never a silent skip.

---

## 10. Turning enforcement ON (maintainer only — GitHub UI)

The system ships **advisory**. To make it block (do this when you're ready):

1. Set a repo secret **`EVIDENCE_CHECK_TOKEN`** — a random string the doer never sees.
2. Branch protection on `master` → **Require review from Code Owners** (so enforcement
   files can't be weakened without your review).
3. Mark the **Evidence Gate** check **required**.

Until all three are set, the gate reports but does not block — which is correct while
you pilot it.

---

## 11. What this does NOT yet cover (be honest about it)

- **Shared dependencies** (tokens, layout, icons, sub-components) aren't in a component's
  bundle yet — changing `RADIUS.soft` or an icon's SVG can drift a "verified" component
  without tripping the gate. (Dependency-closure hashing is the next build.)
- **The consumer/deployment side** (PLG app wiring, assets) is outside this gate.
- **C is only real with token isolation.** If a doer can read `EVIDENCE_CHECK_TOKEN`,
  they can self-sign. Keep it a CI secret.

When in doubt: the gate failing is the system working. Don't reach for `--no-verify` —
fix the evidence.
