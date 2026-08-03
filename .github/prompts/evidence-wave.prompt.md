---
name: evidence-wave
description: Run the Evidence Protocol over a WHOLE WAVE of components in one command — auto-discovers slugs by atomic level (atoms|molecules|organisms|all) or takes an explicit list, verifies each through the per-component evidence pipeline (scout → 3 reviews → adjudicate → fix-loop → record → sign → gate → commit), then runs a governor-vetted self-refinement retrospective and pushes. Use for "verify all <level>", "run the <level> wave", "seal the organisms". Flags — "no-commit" (stop before committing), "force" (re-verify already-sealed), "no-refine" (skip the retrospective). This is the batch sibling of /evidence-pipeline (one component).
---

# Evidence wave

Verify and seal a whole wave of components with the proven method, then let the protocol
harden itself from the run. The per-component pipeline is unchanged (`/evidence-pipeline` /
`docs/evidence/PIPELINE.md`); this wraps it with discovery, a self-refinement retrospective,
and push. Full design: `docs/evidence/PIPELINE.md`, `docs/evidence/LESSONS.md`, and
`docs/process/SPEC_KERNEL_COMPACT.md`.

Before planning or launching the wave, apply `docs/process/SPEC_KERNEL_COMPACT.md` as the common
execution contract: authority order, approval gates, minimal context, and proof-before-done. If the
skill requires a medium/large manual follow-up outside the sealed workflow, frame it with
`docs/process/TASK_BRIEF_TEMPLATE.md` and close it with `docs/process/VERIFIER_CHECKLIST.md`.

## Steps

1. **Parse the argument** into a target + flags:
   - A **level** — `atoms` | `molecules` | `organisms` | `all`, OR
   - An **explicit slug list** — `railnav sidebarpanel selectdropdown`.
   - Flags anywhere in the arg: `no-commit` → `autoCommit:false`; `no-refine` →
     `refine:false`; `force` → re-verify even already-sealed components.

2. **Discover slugs** (Bash — the workflow can't read the filesystem, so resolve here):
   - **The on-disk directories are SINGULAR** (`docs/atomic/atom`, `molecule`, `organism`,
     `template`). Map the (usually plural) level argument to the singular dir BEFORE globbing —
     `atoms→atom`, `molecules→molecule`, `organisms→organism` (e.g. `lvl=${arg%s}`). Globbing the
     plural path matches nothing and the wave would silently verify zero components.
   - For a level: `ls docs/atomic/$lvl/*.spec.md`, strip the dir + `.spec.md`. For `all`: every
     `docs/atomic/*/`.
   - **Exclude non-component specs:** `*.anim.spec.md`, `_TEMPLATE.spec.md`, and any spec whose
     front-matter is `kind: frame` (aggregate specs like `atomsdark`/`atomslight` have no
     component) — `grep -L 'kind: frame' …`. These are not buildable/verifiable components.
   - De-dup: if the same slug has specs at two atomic levels (e.g. a stale duplicate), keep
     the canonical one and note the collision — do NOT verify both under one slug.
   - For an explicit list: use it verbatim (lowercased).

3. **Filter the list** (this is the "verify existing; skip fresh; report missing" policy):
   - **Missing** — a spec with no matching `src/gallery/<Name>.tsx` (or vice-versa): DROP it
     and report it as *needs creation* (run `/figma-build <slug>` first). Resolve names via
     `node -e "import('./scripts/lib/evidence.js').then(m=>console.log(m.sourcesForSlug('<slug>').join(',')))"`.
   - **Sealed + fresh** — `docs/evidence/<slug>/signature.json` exists AND
     `EVIDENCE_CHECK_TOKEN=<token> node scripts/audit-evidence.js --files src/gallery/<Name>.tsx`
     prints `PASS — 0 findings`: SKIP it (idempotent — no wasted tokens) UNLESS `force`.
   - What remains is the **run list**.
   - **If the run list is EMPTY after filtering** (e.g. every component is already sealed+fresh —
     the common idempotent re-run), report *"all `<level>` already sealed and fresh — nothing to
     verify"* and STOP. Do NOT launch the workflow (it rejects an empty slug list as an error).

4. **Confirm Storybook is up** on `:6006` (probe `http://localhost:6006/index.json`). If down,
   tell the user to `npm run storybook` and stop.

5. **Show the plan and the run list**, then **launch the wave** (background; one
   `/evidence-pipeline` per component sequentially + a retrospective — budget ~250–400k tokens
   per component):
   ```
   Workflow({ scriptPath: "scripts/workflows/evidence-wave.js",
              args: { slugs: [<run list>], autoCommit: <bool>, refine: <bool> } })
   ```

6. **On completion, report the ledger** — `committed`, `needsHuman` (surface each
   `humanEscalations` question for the OWNER; never answer design-authority calls yourself),
   `failed`. Independently re-verify a sample of `committed` with the gate (expect
   `PASS — 0 findings`; a wrong token must give `EV.BAD-SIGNATURE`) — don't trust self-reports.

7. **Handle the retrospective (`refinement`)**:
   - `refinement.applied` — governor-approved, safe (tooling/prompt/process/lesson) changes the
     workflow already wrote (not yet committed). **Re-validate** them (re-run the affected
     capture/script once), then `git add` those files + `docs/evidence/LESSONS.md` and commit
     (`chore(protocol): self-refinements from the <wave> wave`).
   - `refinement.escalated` — refinements the governor would NOT auto-apply (contract/spec
     value or gate-strictness). **Surface these to the owner as decisions**; do not apply them.

8. **Commit + push**: the per-component commits happen inside the pipeline. After the
   retrospective commit, `git push`. Report the pushed range and any escalations awaiting the
   owner.

## Notes

- Prereqs: Storybook on `:6006`, `FIGMA_API_KEY` set, each component's spec carries
  `figma.fileKey` + `verify.figmaExportNode`.
- The self-refinement loop can ONLY tighten/clarify the protocol (the governor hard-blocks any
  loosening, and contract/gate edits are escalated, never auto-applied). See PIPELINE.md
  § "Self-refinement" and `docs/evidence/LESSONS.md`.
- A clean wave (everything committed) runs no retrospective — there is nothing to learn.
- Lifecycle: `/figma-build <slug>` creates a missing component (spec + code), then
  `/evidence-wave <level>` verifies + seals the whole level.
