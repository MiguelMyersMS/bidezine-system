---
name: figma-deploy
description: This skill should be used when the user wants to START a deployment of a Figma assembly to a consumer app — e.g. "deploy <assembly> to <app>", "assemble this Figma for PLG", "start the deployment process", "hand this off to the PLG project". Phase 7 (DEPLOY) of the Figma→Storybook→app pipeline. Runs the DESIGN-SYSTEM side (triage → spec/verify → assemble → handoff) and ENDS by emitting the paste-ready prompt for the consumer project.
version: 1.0.0
---

# /figma-deploy — assemble a Figma release and hand it to a consumer

Runs the design-system side of a deployment end-to-end, then prints the **consumer handoff
prompt** — a self-contained block you paste into the other project so it knows *what to pull, where,
how, when, and why*, and reports back the exact evidence the **sign-off gate** requires.

**Authority/boundaries (do not violate):**
- Figma is the source of truth (GR4). The consumer imports the SHIPPED component — never forks or
  re-implements it (GR5).
- **Gallery = reusable only.** Reusable pieces → the design system; app-specific pages/composition
  stay in the consumer. Triage BEFORE building.
- This skill takes a release only to **`handed-off`**. `deployed` and `signed-off` are the
  consumer's + owner's to report — the sign-off gate (`audit-deploy-lifecycle.js`) enforces the rest.

Read first: `docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md`, `docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md`,
`docs/deploy/_TEMPLATE.deploy.md`.

## Input
`/figma-deploy <figma node/url> <consumer-app>` (e.g. `/figma-deploy 312:1100 PLG_dashboard`).
If either is missing, ask for it. Derive `<project>` (kebab app name), the consumer's workspace dir
`<consumer-dir>` (e.g. `../../apps/PLG-dashboard`), and a stable `<release-id>` (the primary Figma
node, e.g. `312-1100`).

> **The handoff is CONSUMER-OWNED.** It is written into the consumer's OWN workspace at
> `<consumer-dir>/docs/design-system-handoffs/<release-id>/`, **NOT** into this design-language repo.
> Storing a consumer's wiring/snapshot here is what let a tool replicate the consumer app — never do it.
> This repo provides only the generic lifecycle + template as guidance a consumer reads.

## Steps

1. **Guardrail — one active release per project.** Check `<consumer-dir>/docs/design-system-handoffs/`.
   If a non-retired release exists, STOP: the prior one must be signed-off + retired first
   (`DEPLOY_DIR=<consumer-dir>/docs/design-system-handoffs node scripts/audit-deploy-lifecycle.js`
   enforces this). Do not open a second.

2. **Inventory + triage (Phase 1).** Deep-fetch the Figma assembly (depth ≥ 6, save VERBATIM as the
   ground truth). **FIRST export the assembly to a PNG and review the RENDERING** — the node tree
   includes hidden (`visible:false`) layers (placeholders, alt states); reading the tree is not
   reviewing the deliverable. **Build the ground truth + matrix from the VISIBLE state only**: record
   `visible:` per node, and route every `visible:false` node as `ignore` (never as content — a hidden
   node routed as `match`/`inherited`/etc. is a blocker in `audit-deployment.js`). Then produce a
   triage table — every visible frame/node → `[new | changed] × [design-system | consumer-app]`, plus
   token/foundation deltas. **Surface it to the user and get scope agreement before building.**
   Anything app-specific (pages, domain composition) does NOT enter the DS.

3. **Make each reusable piece real (Phases 2–5).** For every design-system node that is new or
   changed: run `/figma-build <slug>` (extract → implement) then `/evidence-pipeline <slug>` (verify
   one) — or `/evidence-wave <slugs>` for a batch — until each carries a signed evidence bundle and
   the behavior gate is green. A token/foundation delta MUST go through
   `docs/atomic/TOKEN_CHANGE_PROPAGATION_PROTOCOL.md` (every layer + Figma-sync). Do not deploy an
   assembly whose pieces aren't verified.

4. **Assemble + inventory.** Ensure the shipped component composes the verified pieces; run
   `npm run registry:refresh`. Run the full behavior gate (`npm run test:behavior`).

5. **Build the handoff folder** `<consumer-dir>/docs/design-system-handoffs/<release-id>/` (in the
   CONSUMER's workspace, not this repo) from this repo's `docs/deploy/_TEMPLATE.deploy.md`:
   - `deploy.md` — fill `assembly`, `app`, and the **coverage matrix** (every ground-truth node,
     exactly once: `match | inherited | gap | ruling | ignore`). Set `lifecycle.status: verified`
     (NOT `handed-off` yet — that requires the independent verify in step 6), `lifecycle.created:
     <today>`. Leave `signoff` empty (it's gated, post-deploy).
   - `consumer-snapshot/` — the reference wiring the consumer copies: `App.tsx` (or the relevant
     composition), `nav-config.ts`/data, `vite.config.ts`, and **`GO-LIVE.md`** (from
     `_TEMPLATE.GO-LIVE.md` if present; else the steps in §HANDOFF below).
   - `verify/figma.png` + `verify/storybook.png` — the two triangulation captures you can take here.
     (`verify/app.png` is the consumer's to produce — it's the deployed view.)

6. **Independent verify → THEN gate.** Before `handed-off`, hand the rendered images to
   **`/deployment-verify` as a SEPARATE pass** (a fresh agent via the Agent tool — NOT this build
   session; the builder must never certify its own output). It OPENS `verify/figma.png` +
   `verify/storybook.png`, itemizes every visible element vs the matrix, and writes
   `verify/comparison.md`. **A file size / hash / byte / node count is NEVER a substitute for opening
   the pixels** (`no-proxy-for-render-compare`). Only on a **PASS** may you set
   `lifecycle.status: handed-off`. Then run `npm run audit:deployment` (coverage) and
   `npm run audit:deploy:lifecycle` — both green. Commit the handoff folder.

7. **Emit the consumer prompt.** Fill the template in §CONSUMER PROMPT with the release's specifics,
   **write it to `consumer-snapshot/HANDOFF-PROMPT.md`**, and **print it to the user** as the final
   output — that is the text they paste into the consumer project.

## HANDOFF (what GO-LIVE.md must contain)
Import path(s) for the shipped component(s) · `package.json` dependency on the DS · the mandatory
`optimizeDeps.exclude: ["@miguel/design-system"]` · `ThemeContext` provider · the exact props/data to
wire (from the matrix) · bust the Vite cache (`rm -rf node_modules/.vite`) · "verify in the deployed
Power BI/host artifact, not localhost" · the report-back checklist (below).

## CONSUMER PROMPT (the final output — fill the <…> and print verbatim)

```text
You are the <consumer-app> project's agent. The design system has assembled a release for you to
deploy. Import the SHIPPED component(s) and go live — do NOT re-implement or fork them (Golden Rule #5).

WHY (context): @miguel/design-system is the single source of truth. Components are assembled and
verified there against Figma; you consume them. This deployment is governed — follow the handoff and
report back the required evidence so the design system can sign off and retire it.

WHERE the handoff lives (in the CONSUMER's own workspace — never in the design-system repo):
  <consumer-dir>/docs/design-system-handoffs/<release-id>/
    • GO-LIVE.md          ← your step-by-step
    • deploy.md           ← coverage matrix: exactly what must render
    • consumer-snapshot/  ← reference wiring (App.tsx, data/config, vite.config.ts)

WHAT to pull:
  import { <Components> } from "@miguel/design-system/<path>";

HOW (per GO-LIVE.md):
  1. package.json depends on the design system: "@miguel/design-system": "file:../../systems/design-system".
  2. vite.config.ts → optimizeDeps.exclude: ["@miguel/design-system"]   (critical: otherwise a stale
     Vite pre-bundle hides the new component).
  3. Wrap the app root in <ThemeContext.Provider value={dark ? TOKENS_DARK : TOKENS_LIGHT}>.
  4. Wire the component with the props/data shown in consumer-snapshot/ and required by deploy.md.
  5. Bust the cache: rm -rf node_modules/.vite, then rebuild.

WHEN: deploy now. This app is only viewable in the deployed <host, e.g. Power BI/Fabric> artifact +
refresh — verify THERE, not on localhost.

REPORT BACK (required by the sign-off gate — the design system cannot sign off without these):
  1. import_proof — the file:line where you import the shipped component(s).
  2. no_fork — confirm (grep your src) you have NO local copy/fork of <Components>.
  3. app.png — a screenshot of the deployed view.
  4. Reply to the design system: "deployed — here is import_proof, no_fork, and app.png."
  Then the owner verifies and signs off; the design system retires the handoff (keep-evidence).

IF anything looks wrong: do NOT patch it in your app. Report it to the design system — the fix is made
upstream in the component, then you re-pull. (Patching/forking in the app is a Golden Rule #5 violation
and the exact failure this process exists to prevent.)
```

## Done when
The handoff folder exists at `lifecycle.status: handed-off` with a green coverage + lifecycle audit
and the two triangulation captures, the handoff is committed, and the filled consumer prompt has been
printed to the user (and saved to `consumer-snapshot/HANDOFF-PROMPT.md`).
