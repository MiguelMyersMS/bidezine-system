---
name: deploy-wave
description: Take one or more Figma releases through the DEPLOY pipeline in one command — scout → assemble (doer) → 3 independent verifiers open the rendered PNGs element-by-element → adjudicate → fix-loop → sign+gate → handoff — then run a governor-vetted self-refinement retrospective. Enforces doer ≠ checker (the assembler may not sign their own comparison) and STOPS at handed-off (deployed/signed-off stay the consumer's + owner's). Use for "deploy <node> to <app>", "hand off this release", "run the deploy wave". Flags — "no-commit", "no-refine". Batch sibling of /figma-deploy (the single-release skill).
---

# Deploy wave

Assemble and **independently verify** Figma release(s) against their rendering, take each to
`handed-off`, then let the protocol harden itself from the run. This is the deploy-stage analog of
`/evidence-wave`: the same doer≠checker + adjudicator + fix-loop + governor-vetted retrospective, on
the SHARED retrospective machine (`scripts/workflows/retrospective.js`). The per-release pipeline lives
in `scripts/workflows/deploy-pipeline.js`. Design + traps: `docs/deploy/DEPLOY-LESSONS.md`,
`docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md`, `docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md`,
`docs/process/SPEC_KERNEL_COMPACT.md`.

**Boundary (do not violate):** this takes a release only to `handed-off`. `deployed` and `signed-off`
are the consumer's + owner's to report (the sign-off gate `audit-deploy-lifecycle.js` enforces the
rest). The consumer imports the SHIPPED component, never a fork (GR5). Gallery = reusable only.

Before planning or launching the wave, apply `docs/process/SPEC_KERNEL_COMPACT.md` as the common
execution contract: authority order, approval gates, minimal context, and proof-before-done. If the
skill requires a medium/large manual follow-up outside the sealed workflow, frame it with
`docs/process/TASK_BRIEF_TEMPLATE.md` and close it with `docs/process/VERIFIER_CHECKLIST.md`.

## Steps

1. **Parse the argument** into release(s) + flags:
   - `deploy <figma node/url> <app>` → one release `{ node, app }`. Derive `releaseId` (the node with
     `:`→`-`, e.g. `289-4585`) and `project` (kebab app name).
   - Multiple `node→app` pairs → a `releases` list.
   - Flags anywhere: `no-commit` → `autoCommit:false`; `no-refine` → `refine:false`.

2. **Guardrail — one active release per project** (Bash; the workflow can't read the filesystem):
   check `<consumer-dir>/docs/design-system-handoffs/` (the handoff is consumer-owned, in the
   consumer's own workspace — NOT this repo). If a non-retired release exists, STOP — the prior must be
   signed-off + retired first (`audit:deploy:lifecycle` enforces this). Do not open a second.

3. **Confirm preconditions** — Storybook on `:6006` (probe `http://localhost:6006/index.json`),
   `FIGMA_API_KEY` set, and the target app exists under `apps/*` and consumes `@miguel/design-system`
   live. If a precondition fails, tell the user how to fix it and stop.

4. **HUMAN SCOPE GATE (this skill's job — the autonomous workflow cannot pause for input).**
   Deep-fetch the assembly (depth ≥ 6), export the PNG, and produce the **triage table**: every
   visible node → `[new|changed] × [design-system|consumer-app]`, plus token/foundation deltas. For
   each design-system piece, check it already carries a SIGNED, gate-green evidence bundle.
   - **Surface the triage to the user and get scope agreement before launching.** Anything
     app-specific (pages, domain composition) does NOT enter the design system.
   - **Any unverified DS piece is a STOP**, not a deploy task: report it as *needs create+verify*
     (run `/create-wave <slug>` then `/evidence-wave <slug>` first). The deploy pipeline does not
     build or verify components — it refuses a release whose pieces aren't already sealed.

5. **Show the plan**, then **launch the wave** (background; one deploy pipeline per release + a
   retrospective):
   ```
   Workflow({ scriptPath: "scripts/workflows/deploy-wave.js",
              args: { releases: [{ node, app, releaseId, project }], autoCommit: <bool>, refine: <bool> } })
   ```

6. **On completion, report the ledger** — `committed` / `readyToHandoff`, `needsHuman` (surface each
   `humanEscalations` question AND each `upstreamComponentDrift` to the OWNER — a component drift is a
   `/evidence-pipeline` task, never a consumer patch), `failed`. Independently re-run the three deploy
   audits on a handed-off release (`audit:deployment`, `audit:deploy:verify`, `audit:deploy:lifecycle`)
   — expect all green, and `audit:deploy:verify` proves `assembled_by != reviewer`. Don't trust
   self-reports.

7. **Handle the retrospective (`refinement`)** — identical policy to `/evidence-wave`:
   - `refinement.applied` — governor-approved safe (tooling/prompt/process/lesson) changes already
     written (not committed). Re-validate, then `git add` them + `docs/deploy/DEPLOY-LESSONS.md` and
     commit (`chore(protocol): self-refinements from the <release> deploy wave`).
   - `refinement.escalated` — changes the governor would NOT auto-apply (a gate/lifecycle/matrix
     contract or role-separation edit). **Surface to the owner as decisions; do not apply.**

8. **Commit + push**: per-release commits happen inside the pipeline; after the retrospective commit,
   `git push`. Report the pushed range, the handed-off release(s), and the consumer prompt
   (`consumer-snapshot/HANDOFF-PROMPT.md`) the user pastes into the consumer project.

## Notes

- The deploy doer≠checker is **declarative** (no crypto token like the evidence stage): the pipeline
  uses distinct agents and stamps `deploy.md` `assembled_by` vs `comparison.md` `reviewer`, and
  `audit-deploy-verify.js` FAILS if they collide. Authority rests on the orchestration + the
  downstream consumer/owner sign-off gate.
- The self-refinement loop can ONLY tighten/clarify (the governor hard-blocks loosening; gate /
  lifecycle / matrix-contract edits are escalated, never auto-applied).
- A clean wave (everything handed-off + committed) runs no retrospective — nothing to learn.
- Lifecycle: `/create-wave` builds a piece → `/evidence-wave` seals it → `/deploy-wave` assembles +
  hands off the release that composes the sealed pieces.
