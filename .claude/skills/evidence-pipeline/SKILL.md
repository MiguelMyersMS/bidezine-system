---
name: evidence-pipeline
description: Run the autonomous multi-persona evidence-verification pipeline on ONE design-system component (capture → 3 independent reviews → adjudicate → fix-loop → record → sign → gate → commit). Use when the user wants to verify a component against Figma without manual step-by-step relaying. Argument is the component slug (e.g. "ellipsisbutton"); add "no-commit" to stop before committing.
---

# Evidence pipeline

Run the autonomous evidence pipeline for the component the user names. Full design and
persona roster: `docs/evidence/PIPELINE.md`.

Read first: `docs/process/SPEC_KERNEL_COMPACT.md`, `docs/process/TASK_BRIEF_TEMPLATE.md`,
`docs/process/VERIFIER_CHECKLIST.md`, and `AGENTS.md` (repo root).

## Steps

1. **Resolve the slug** from the user's argument — the lowercased component name
   (e.g. `ellipsisbutton`). If none was given, ask which component.
2. **Commit mode:** autonomous commit (`autoCommit: true`) UNLESS the user said
   "no-commit" / "stop before commit" → then `autoCommit: false`.
3. **Check Storybook is up** on `:6006` (the pipeline renders stories). Probe
   `http://localhost:6006/index.json`; if it's down, tell the user to run
   `npm run storybook` first and stop.
4. **Launch the workflow** (it runs in the background, ~7+ agents, ~5–10 min,
   ~250–300k tokens):
   ```
   Workflow({ scriptPath: "scripts/workflows/evidence-pipeline.js",
              args: { slug: "<slug>", autoCommit: <true|false> } })
   ```
5. **On completion, report the `status`:**
   - `committed` — verified and committed autonomously. Share the gate result + sha.
   - `ready-to-commit` — sealed/signed/gate-green but not committed (no-commit mode).
     Offer to commit (show the source diff first).
   - `needs-human` — it refused to guess a genuine design-authority call. Surface the
     `humanEscalations` questions for the user to answer; do NOT answer them yourself.
   - `unresolved` — looped without resolving (report the open checklist).
   - `blocked` — a stage failed. If the `failures` show a transient API error
     (e.g. `529 Overloaded`), resume: `Workflow({ scriptPath, resumeFromRunId })` —
     completed agents (captures, reviews) return from cache.
6. **Independently re-verify** any `committed`/`ready` result before declaring success —
   don't trust the agent's self-report:
   `EVIDENCE_CHECK_TOKEN=<token> node scripts/audit-evidence.js --files src/gallery/<Component>.tsx`
   (expect `PASS — 0 findings`; a wrong token must give `EV.BAD-SIGNATURE`).

## Notes

- Prereqs: Storybook on `:6006`, `FIGMA_API_KEY` set, the component's spec carries
  `figma.fileKey` + `verify.figmaExportNode`.
- The signing token defaults to a local pilot value. For real doer≠checker isolation,
  set a real `EVIDENCE_CHECK_TOKEN` that the building agents cannot read (a CI secret).
- New component *shapes* may surface a tooling gap on first run — that's expected;
  harden the capture tooling, then re-run. See PIPELINE.md § "Refining".
