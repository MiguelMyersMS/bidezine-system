# Production Test — HANDOFF (start here in a new chat)

Two-deployer production test of `@miguel/design-system`. This file + the memory entry
`project_consumer_production_test` are the anti-context-loss handoff: read this first.

## The plan (LEAN — do not over-engineer)
The two deployers **build the component the OWNER chooses**, in their own context, and **communicate** with
the DS side. **The DS side (you) spots the inconsistencies** — read their actual output, compare to the DS,
find the doc/component/bundle gaps. That's it.

> ⚠️ The owner explicitly pulled back the elaborate governor-wave rig (golden-render oracle, isolation frame,
> `golden-props`/`own-data` fixtures, attribution tree). **Do NOT build that.** The right shape is a plain
> "consume + build this component, report what's unclear or breaks." Keep it simple; you investigate.

## Status: ALIGNED ✅ (all 4 readiness items verified against actual files, not chat reports)
1. **RailNav renders** — CD0.1 (`sections=[]`) + CD0.3 (`section.items ?? []`) fixed, gated, on master; bundle `1.0.0+1a573b5`.
2. **Copilot** — B0.5/B0.6 clean (verified in `ADIAS-dashboard`).
3. **Claude Design migration (CD0.2)** — full provider migration verified in its files (provider value-swap via `setState`, live-token foundation pages, `DS.Card` mounted, old `_ds_bundle` gone).
4. **Channel** — both repos pushed + readable via `gh`.

## The two consumers — same component, two deliberately different approaches

> ⚠️ **CHANGED 2026-07-31 — read this before the table.** **GitHub Copilot now operates BOTH deployers.**
> The identities are no longer "which AI" but **which consumption path** (protocol §0). This is a
> strengthening: with the agent held constant, every difference is attributable to the docs and the path,
> not to one AI being better. **Historical findings below keep their old labels** — they are a record of
> who filed what.

Both deployers build the **same** owner-chosen component, but through different consumption paths INTO
different kinds of app. **That contrast is the experiment:** identical component + governance, divergent
approach → the differences that surface are the signal.
- **Raw-TS path** builds it **directly in Rayfin (its live app) with corporate data** — a production integration.
- **Browser-bundle path** builds **the design system's documentation website** — the site explaining the whole
  system, rendered live off the real bundle — while exercising the browser-bundle deployment flow. It grew out
  of the component-collecting storybook, accumulates content round over round, and the deploy path is itself
  under test.

| | **RAW-TS PATH** _(was "Copilot")_ | **BROWSER-BUNDLE PATH** _(was "Claude Design")_ |
|---|---|---|
| Operated by | GitHub Copilot | GitHub Copilot |
| Repo | `MiguelMyersMS/ADIAS-dashboard` (private) + local `Workspaces/apps/ADIAS-dashboard` | `MiguelMyersMS/ds-docs-site` (private) + local `Workspaces/apps/ds-docs-site` |
| Consumes | raw-TS `github:` install, React 19, Vite (`optimizeDeps.include`) | `dist-browser/ds.umd.js` → `window.DS`, React 18, provider theming |
| Approach | **directly in the live Rayfin app**, wired to real corp data | **the DS documentation website** — collects tested components + tests the deploy flow |
| Builds from | a **Figma image (owner pastes)** + its **dataset** (`azureDataInsights`, 49 Direct Lake tables) | generates content where delegated; owner names **stress-test controls** |
| Sees DS source? | **Yes, unavoidably** — the package ships raw TS; that is its consumption contract | **No, by construction** — a built bundle exposes no source |
| Channel | commits its own repo; **DS reads via `gh`** | **pushes directly** — the old owner-export hop is retired (it caused CD1.7) |
| Round scope | one component | **one page/section** — never the whole site (protocol §7.0) |
| Rule source | `.github/copilot-instructions.md`, self-contained | `.github/copilot-instructions.md`, self-contained |
| Reads `CLAUDE.md`? | **No** | **No** — the file was removed from the repo entirely |
| Hosting | — | Cloudflare Pages `ds-storybook` → `https://ds.bidezine.systems`, private behind Access |

> 🚧 **Both deployers are now agents on the owner's own laptop, one folder from the DS tree.** Claude Design's
> isolation used to be physical. It is now the written fence in protocol **§2a** — read the DS via GitHub
> only, never the local working tree. Without that rule you cannot tell "the docs were sufficient" from
> "the agent read `src/`", and the round produces no information.

## The rules (canonical)
- Protocol: [`COMMUNICATION-PROTOCOL.md`](./COMMUNICATION-PROTOCOL.md) — read order, gap→STOP→request,
  doer≠checker, total reset on failure, Rule 8 (consumers never edit the DS repo).
- Ledger (the deliverable): [`CONSUMER-FRICTION-LEDGER.md`](./CONSUMER-FRICTION-LEDGER.md) — one row per defect.
- Build prompts: `prompts/consumer-build/<organism>.build-prompt.md` (both deployers read the same file fresh from master).
- DS→deployer answers: `CLARIFICATIONS/`.

## Findings so far (all fixed on master unless noted)
- **CD0.1** `<RailNav/>` no-props crash → `sections=[]` default + `EmptySectionsContract` gate.
- **CD0.3** section without `items` crash → `section.items ?? []` guard + `SectionMissingItemsContract` gate.
- **B0.5** Vite dev interop → `optimizeDeps.include` (not `exclude`) for an installed package (`CLAUDE.md` fixed).
- **CD0.2** Claude Design shell → provider theming (verified).
- **SELF-1** Claude Design self-caught it had re-authored `DS.Card`, fixed it (the verification loop working).

## ✅ Round 1 = RailNav — **CLOSED 2026-07-31, PASSED ON BOTH PATHS**

Owner-graded pass on the raw-TS lane (2026-07-30) and the browser-bundle lane (2026-07-31). No defect is
carried forward from round 1.

## ▶️ Round 2 = PageHeaderTitle — **RELEASED 2026-08-01, ready to run**

Prompt: `prompts/consumer-build/pageheadertitle.build-prompt.md`, forked §3/§4 as usual. The
**⛔ NOT RELEASED banner has been cleared** — the round is open on both paths.

**`DS-2` is FIXED** (PR #65, `708d9b9`) at the root cause, not by another hand-patch. Both release
conditions were verified live before the banner came off:

| Release condition | Verification |
|---|---|
| Barrel omission fixed at root | `src/index.ts` now does `export * from "./gallery"` — the hand-maintained allow-list is gone, so drift is structurally impossible rather than merely corrected |
| Executable parity gate | `scripts/audit-export-parity.js`, wired into `npm run health` (also `npm run audit:export-parity`). Negative-tested: a regressed barrel fails naming 305 missing exports |
| Rebuilt bundle on `master` | `check:umd-fresh` PASS (`1.0.0+520e8dd`) |
| The two components this round needs | Loaded the shipped bundle — `window.DS.PageHeaderTitle` and `window.DS.InfoPill` both **defined** |
| Coverage | **103 of 103** gallery components reachable on `window.DS` (was 46) |

⚠️ **Why the root-cause fix mattered.** `DS-2` was a repeat of `CD1.2`, which had been recorded "FIXED
(root cause)" after only adding four rail atoms by hand while leaving the allow-list in place — it then
drifted by 56 components. Adding `PageHeaderTitle` + `InfoPill` by hand would have been the third
instance of the same patch, so the list itself was deleted and a gate now guards the invariant.

**Caught before the round rather than during it.** Had the prompt shipped as originally written, both
deployers would have burned an attempt discovering a defect the DS side could see from its own repo —
which is §9's job, not theirs.

> **Note the ledger's expected filename differs.** `DS-2` anticipated `scripts/audit-barrel-parity.js`;
> the shipped gate is `scripts/audit-export-parity.js`. Same contract, different name.

---

## Round 1 archive — RailNav (prompt on master)
The round-1 build prompt is live at `prompts/consumer-build/railnav.build-prompt.md` (one file, forked in
§3 ingestion + §4 target). Both deployers consume the SHIPPED RailNav, never re-author it (Rule 8 + SELF-1),
pull master fresh (CD0.1+CD0.3 present since `5e21f53`; bundle `1.0.0+1a573b5`), and report friction.
- **Copilot target (§4A) — PURE PROMPT, no image.** A written IA for **Azure Data Insights** (5 primary
  sections; Alerts/Info & Feedback/Report Settings footer; the "Azure Data Revenue" panel: Overview [active],
  Annual recurring revenue, Fabric workloads → P+F/F/P SKU Allocated + Net Revenue Retention). Copilot makes
  its **own best icon/prop/structure decisions from the repo + docs** and wires the real `azureDataInsights`
  data. The owner's source image is the design intent behind §4A; **Copilot is not given the image.**
- **Claude Design target (§4B) — reproduce the `Organisms/RailNav → Default` Storybook story** in its
  collecting doc app (may read `RailNav.stories.tsx` for the exact config; faithful replica, not generated
  content).

**Chat-reset rule (NEW, encoded in the protocol §4 step 7 / §4a):** the owner **resets the chat every attempt
(pass or fail)**, so each deployer MUST end by writing a **ready-to-paste next-chat prompt** as its
`HANDOFF.md` — findings only, never fix-hints, always re-pointing to the fresh docs.

Deployers build → communicate → **the DS side reads their repos (`gh`) and spots the inconsistencies**,
verifying against the ACTUAL committed files (never the chat summary — that caught a stale export + a
re-authoring here).

## Hard-won lessons
- **Verify against committed files, never the chat report** (doer≠checker). Two real catches this way.
- ~~**Claude Design can't push** → owner exports; beware stale/old download cards.~~ **RETIRED 2026-07-31** —
  `ds-docs-site` pushes directly. Keep the *lesson*, not the workaround: **that manual hop is exactly where
  CD1.7's bundle drift happened** (a 1.05 MB `ds.umd.js` silently failed to ingest, and a whole round died at
  the pin gate). Treat any future manual copy step as reintroducing that defect class.
- **Isolation must be written down once it stops being physical (§2a).** Both deployers now run on the owner's
  laptop beside the DS tree. If a deployer can read `src/`, a passing build no longer proves the docs were
  sufficient — and that proof is the entire product.
- **Keep it lean** — the owner wants sync + communication + inconsistency-spotting, not a measurement harness.
