# Example artifact contract (`docs/examples/<slug>/`)

What the `/example-wave` pipeline produces and `scripts/audit-example.js` gates. **Every artifact is
bound to a source of truth** — the gate re-reads the real spec/`tokens.ts` and the bound Figma dump, so a
fabricated value is caught (existence ≠ honesty). Governor-vetted spec:
`docs/proposals/example-behavior-wave.md`.

## Phase 0 — Ground (Scout + Builder)

| File | Shape | Gate binds it to |
|------|-------|------------------|
| `docs-read.md` | a ` ```json ` fence of `[{file, symbol, value}]` triples actually read | each `value` must literally appear in the cited `file` (`EX.DOCS-READ-FABRICATED`) |
| `figma-raw.json` | the raw `get_figma_data` dump | its `sha256` must equal `figma-layout.rawDumpSha256` (`EX.FIGMA-RAW-TAMPERED`) |
| `figma-layout.json` | `{fileKey, nodeId, capturedAt, rawDumpSha256, surface, layout:{…}, icons:[{slot, figmaIcon, dsIcon}]}` | `nodeId` == the dump's node (`EX.FIGMA-NODE-MISMATCH`); `surface` required; each `figmaIcon` present in the dump (`EX.ICON-NOT-IN-FIGMA`); story uses only declared `dsIcon`s (`EX.ICON-UNDECLARED` / `EX.ICONS-UNGROUNDED` — ledger Case 4) |
| `figma-frame.png` | exported reference frame | valid PNG (`EX.FRAME-INVALID`) |

## Phase 1 — Build (Builder)

| File | Shape | Gate binds it to |
|------|-------|------------------|
| `component-manifest.json` | `{built_by, story, imports:[…], slotTokens:{slot:"tokens.X"}}` | imports used in the story; no dead-import graft (`EX.GRAFT-IMPORT-UNUSED`); no raw hex/rgba (`EX.HARDCODED-COLOR`); every `tokens.*` used ∈ `docs-read.md` (`EX.TOKEN-UNGROUNDED`) |

## Phase 2 — Verify (Reviewers + Adjudicator)

| File | Shape | Gate binds it to |
|------|-------|------------------|
| `views/{atom-light,atom-dark,darkAtom-light,darkAtom-dark}.png` | 4 rendered surface×theme views | valid PNGs, **pairwise-distinct hashes** (`EX.VIEWS-DUPLICATE`) |
| `views/capture-stamps.json` | `{"<view>":{surface,theme,storyId,sha256}}` | each png's sha256 == its stamp (`EX.VIEW-STAMP-MISMATCH`) |
| `contrast.json` | `{view:"darkAtom-dark", region, ratio, pngSha256}` | bound to the darkAtom-dark png; `ratio ≥ 4.5` (`EX.CONTRAST-FAIL` — Case 2 as a computed gate) |
| `comparison.md` | `## Checklist` of `- [x] <id> — <evidence>` + header `built_by:`/`reviewer:`/`adjudicator:` | the three actors must be DISTINCT (`EX.DOER-IS-CHECKER`) |
| `comparison.sig.json` | `{digest, sig}` HMAC over comparison.md | verifies against `EVIDENCE_CHECK_TOKEN` (`EX.BAD-SIGNATURE`); advisory until the token is provisioned |

**— OWNER GATE 1 —** `owner-renders-stamp.json` `{digest, sig}` (HMAC over the 4 render hashes). The wave
CANNOT produce this — only the owner, after playing with the example. `status: verified` is unreachable
without it (`EX.OWNER-STAMP-MISSING`/`-FORGED`).

## Phase 3 — Absorb (`stage:absorb`)

| File | Shape | Gate binds it to |
|------|-------|------------------|
| `owner-behaviors.md` | the owner's VERBATIM quotes, each tagged `[[q-<id>]]` | every accepted `behaviors:` entry must cite a `q-<id>` (`EX.BEHAVIOR-UNSOURCED`) |
| spec `behaviors:` block | entries with `quote: q-<id>` (or `proposal: true` for quarantined AI-inferred) | the play test asserts what the OWNER quote says (independent reviewer) |
| `mutation-proof.json` | `{behaviorId, redRun, greenRun}` | proves each play test FAILS when the behavior is disabled (not a stub) |

**— OWNER GATE 2 —** `owner-behaviors-stamp.json` HMAC — the owner confirms the docs+tests match what they
said. Second hard `status: verified` blocker.

## Statuses

`docs/examples/<slug>/example.json` holds `{status}` (default `example-ready`) — **SEPARATE from the
component spec's evidence-wave status** (an atom can be `verified` against Figma while its example is only
`example-ready`; the gate keys the owner-stamp ceiling on THIS field). It may also hold `specVariants`
(next).

**Documentation-grounded variants** — for a state Figma CANNOT encode (e.g. `loading`), declare
`example.json.specVariants:[{name, authorizedBy:"<EX-id>", specPath, claims:[{value}]}]`. The gate binds it
to the spec: `EX.DOCVARIANT-UNAUTHORIZED` (the EX-id must be in the spec) + `EX.DOCVARIANT-CLAIM-FABRICATED`
(each claim value must be in the spec) + verdict `spec-variants-grounded`. Build with the shipped prop
(`<Button loading>` → its own `<Spinner>`), never hand-rolled. Doc-grounding is NOT a loophole to skip
grounding — it is content-bound to the spec exactly like the Figma path.

`example-ready` (doer ceiling) → `behaviors-proposed` → **`verified`** (only with BOTH owner HMAC stamps +
a computed-pass checklist). The doer can never self-promote.
