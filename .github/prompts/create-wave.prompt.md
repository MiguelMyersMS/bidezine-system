---
name: create-wave
description: Build one or more NEW design-system components in one command — scout → EXTRACT (spec doer) → 3 independent spec reviewers re-fetch Figma and compare SPEC↔Figma → spec-adjudicate (governor) → spec-fix-loop → spec gate → IMPLEMENT (code doer) → independent code-vs-spec check → health gate → commit — then a governor-vetted self-refinement retrospective. Enforces doer ≠ checker (the extractor never reviews its own spec; the implementer never certifies its own code) and ends at status: implemented. Use for "build <element> from Figma", "create these components", "run the create wave". Flags — "no-commit", "no-refine". Batch sibling of /figma-build (the single-component skill); sealing is a separate /evidence-wave.
---

# Create wave

Build NEW component(s) from Figma with doer≠checker at every step, then let the protocol harden itself
from the run. This is the create-stage analog of `/evidence-wave` and `/deploy-wave`: the same
independent-review + adjudicator + fix-loop + governor-vetted retrospective on the SHARED machine
(`scripts/workflows/retrospective.js`). The per-component pipeline lives in
`scripts/workflows/create-pipeline.js`. Design + traps: `docs/atomic/CREATE-LESSONS.md`,
`docs/atomic/PROTOCOL.md`, `docs/atomic/_TEMPLATE.spec.md`, `docs/icon-protocol.md`,
`docs/process/SPEC_KERNEL_COMPACT.md`.

**Boundary:** create ends at `status: implemented` (built + adjudicated against Figma + health-green).
It does NOT seal the component — that is the verify stage. Lifecycle: `/create-wave` builds →
`/evidence-wave` seals → `/deploy-wave` hands off the release that composes the sealed pieces.

Before planning or launching the wave, apply `docs/process/SPEC_KERNEL_COMPACT.md` as the common
execution contract: authority order, approval gates, minimal context, and proof-before-done. If the
skill requires a medium/large manual follow-up outside the sealed workflow, frame it with
`docs/process/TASK_BRIEF_TEMPLATE.md` and close it with `docs/process/VERIFIER_CHECKLIST.md`.

## Steps

1. **Parse the argument** into component(s) + flags:
   - `build <figma node/url> <slug> <level>` → one component `{ node, fileKey, slug, level }`
     (`level` = atom | molecule | organism | template).
   - Multiple → a `components` list.
   - Flags anywhere: `no-commit` → `autoCommit:false`; `no-refine` → `refine:false`.

2. **GALLERY-VS-DOMAIN TRIAGE (this skill's job — get it right before launching).** For each
   candidate, confirm it is a genuinely REUSABLE control (≥2 consumers, not tied to one data domain).
   A domain-specific component (MarkerCard, LabResultsTable, …) STAYS in its host project
   (`CP.DOMAIN-IN-GALLERY`) — do not build it here. Surface the triage to the user if unsure.

3. **Drop already-existing** components (Bash; the workflow can't read the filesystem): if
   `docs/atomic/<level>/<slug>.spec.md` OR `src/gallery/<Name>.tsx` exists, it is NOT a create task —
   report it as *use /evidence-wave to verify an existing one*. What remains is the run list.

4. **Confirm preconditions** — Storybook on `:6006` (probe `http://localhost:6006/index.json`),
   `FIGMA_API_KEY` set, and each node + fileKey reachable. If a precondition fails, say how to fix it
   and stop.

5. **Show the plan + run list**, then **launch the wave** (background; one create pipeline per
   component + a retrospective):
   ```
   Workflow({ scriptPath: "scripts/workflows/create-wave.js",
              args: { components: [{ node, fileKey, level, slug }], autoCommit: <bool>, refine: <bool> } })
   ```

6. **On completion, report the ledger** — `committed` / `readyToCommit`, `needsHuman` (surface each
   `humanEscalations` question to the OWNER — a token that doesn't exist for a Figma fill, or an
   ambiguous design call, is the owner's decision, never the agent's), `failed` (`spec-gate-failed` /
   `code-check-failed`). Independently re-run `node scripts/audit-specs.js` + `npm run health` on a
   sample — don't trust self-reports.

7. **Handle the retrospective (`refinement`)** — identical policy to `/evidence-wave`:
   - `refinement.applied` — governor-approved safe (tooling/prompt/process/lesson) changes already
     written (not committed). Re-validate, then `git add` them + `docs/atomic/CREATE-LESSONS.md` and
     commit (`chore(protocol): self-refinements from the <wave> create wave`).
   - `refinement.escalated` — changes the governor would NOT auto-apply (a spec-template / PROTOCOL /
     gate edit). **Surface to the owner as decisions; do not apply.**

8. **Commit + push**: per-component commits happen inside the pipeline; after the retrospective commit,
   `git push`. Report the pushed range, the new components (at `status: implemented`), and remind the
   user to **seal them next with `/evidence-wave <level>`**.

## Notes

- The spec content gate (`audit-specs.js`) now BLOCKS a dangling `tokens.<name>` alias (a token that
  isn't a real `TokenSet` key) in addition to the structural checks — a load-bearing static check the
  reviewers complement by re-fetching Figma for hex/identity/state parity.
- The self-refinement loop can ONLY tighten/clarify (the governor hard-blocks loosening; spec-template
  / PROTOCOL / gate edits are escalated, never auto-applied).
- A clean wave (everything implemented + committed) runs no retrospective — nothing to learn.
- Create ≠ verify: a `status: implemented` component is built and Figma-adjudicated but NOT yet sealed
  with a signed evidence bundle. Always follow with `/evidence-wave`.
