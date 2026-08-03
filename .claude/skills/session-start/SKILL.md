---
name: session-start
description: The first action of any session in this repo. Orients a fresh chat on the factory line, then reports live state before any work begins — uncommitted changes, unpushed commits, STASHES, other branches with unpushed/no-upstream work, open follow-ups (docs/FOLLOWUPS.md), and gate state. Also records a new follow-up (and commits it) when asked. Run this BEFORE starting work. Use for "start session", "orient me", "what's pending", "standup", "session-start", or "record a follow-up: <note>".
---

# /session-start — orient + report before any work

The first thing to run in a new chat. It loads the operating context and gives an honest picture of
**what's unfinished** so nothing is silently dropped between sessions (this repo has lost finished work
to silent reverts and forgotten stashes before — that is the failure this prevents). Read-only by
default; it writes only when you ask it to record a follow-up, and then it commits that write.

## Mode

- **No argument** → full orientation + state report (the default).
- **`record: <note>`** (or "record a follow-up: <note>") → append the note to `docs/FOLLOWUPS.md`
  **immediately after the `## Open` heading line** (before the existing items) as
  `- [ ] <note> (added <today>)`, then **commit it** (`docs(followups): record <note>`) so it isn't
  left as the exact uncommitted WIP this skill warns about. Confirm + STOP (don't run the full report).

## Steps (orientation mode)

1. **Mechanical state — run the brief (single source, don't hand-roll git).**
   `node scripts/session-brief.js`. It reports, in one read-only pass: branch + ahead/behind, uncommitted
   counts, unpushed commits on this branch, **`git stash list`** (plain `git status` never shows these —
   a real false-all-clear path), **OTHER branches with unpushed or no upstream**, **VANISHED BRANCHES**
   (see below), and the open follow-ups count (+ a warning if `docs/FOLLOWUPS.md` is untracked). Treat
   every ⚠ as unfinished work.

   > **⚠⚠ VANISHED BRANCHES is the most serious line the brief can print.** It means `docs/FOLLOWUPS.md`
   > says work is preserved on a branch and **that ref no longer exists** — locally or on origin. The
   > commits survive only as dangling objects that **`git gc` deletes permanently**, and in this state
   > `git status`, `git branch` AND `git stash list` all report clean, so nothing else will warn you.
   > This has happened twice (both found 2026-08-02): `feat/filter-fields` (22 commits) and
   > `chore/molecule-gate-tightenings` (sole carrier of `scripts/audit-story-shape.js`). **Act on it
   > first, before anything else** — the brief prints the exact `git branch <name> <sha>` recovery
   > command when the backlog pinned a SHA; then `git push -u origin <name>` immediately. Recreating a
   > ref is non-destructive, so do it even if you are unsure the work is still wanted.
   > Then verify by CONTENT before concluding anything is missing from master
   > (`git diff --diff-filter=A --name-only master <branch> -- src/ scripts/`) — a branch can be many
   > commits "ahead" and still be a strict subset that was already squash-merged.
   Then run **`node scripts/git-stages.js`** (`npm run git:stages`) and include its per-stage table
   **verbatim** in the report (see Report format). It shows exactly what is sitting at each git stage —
   working tree → untracked → staged → committed-unpushed → pushed-unmerged → master — with COUNT, the
   OLDEST age at that stage, a NEXT-step hint, and the actual ITEMS, so nothing is stranded. Full
   lifecycle recipe: `docs/GIT_WORKFLOW.md`.

2. **Interpret it honestly.** From the brief: for uncommitted work, call out per-file anything that
   looks like *finished work left uncommitted* (don't bury it in the count — that's the silent-revert
   failure mode); name pre-existing WIP (e.g. `AGENTS.md`) separately so it isn't mistaken for yours.
   Surface each stash and each flagged branch as a decision (pop/drop/push/ignore), never as noise.

3. **Context.** Read `docs/process/SPEC_KERNEL_COMPACT.md` first, then `docs/FACTORY_LINE.md`, and give a
  2–3 line reminder of the factory line **summarized from those files** (don't recite a frozen
  paraphrase — derive it from what you just read), plus the one rule (an agent never checks its own
  work; the self-refinement loop can only tighten). Include the kernel's authority order and the fact
  that medium/large tasks must use `docs/process/TASK_BRIEF_TEMPLATE.md` before execution and
  `docs/process/VERIFIER_CHECKLIST.md` before completion. Note `MEMORY.md` is auto-loaded; skim its ⭐
  lines and any `[[...]]` follow-up pointers relevant to today.

4. **Backlog — report BLOCKING, and present PARKED as optional.** Read `docs/FOLLOWUPS.md`.
   - **`## Blocking`** — list every `- [ ]`. This should normally be **empty**. Anything here genuinely
     stops a merge or a deploy and is the session's first priority.
   - **`## Parked`** — report the COUNT only, labelled as optional. **Do NOT enumerate it as a to-do
     list and do NOT rank it by severity.** Pull an item out only when it intersects what the user is
     actually building today.
   - Skip `## Considered + deliberately deferred` and `## Done (recent)` entirely.

   > **Why this split exists (2026-08-02).** The brief used to print one "N open" number and this skill
   > enumerated all of it, which read as a debt gate that had to be paid before new work could start.
   > It never was one: **the only REQUIRED gate is CI (`health:strict`)**; the evidence gate declares
   > itself ADVISORY in `.github/workflows/evidence.yml:7`, and `consumer-sync.yml` is
   > `continue-on-error: true`. Three days went into paying down a list that blocked nothing, while a
   > single sweep found seven items already DONE and never checked off. **An unsigned or stale evidence
   > bundle is not a defect** — the component shipped and works (RailNav is deployed and working in
   > production with an unsigned bundle). Evidence bundles are re-sealed **ON TOUCH**, as part of the
   > next edit to that component — never as standalone backlog. If the user asks "what's pending",
   > the honest answer when CI is green and master is pushed is: **nothing is pending; you can start.**

5. **Gate state (fast, honest — not the full slow suite).** Run `node scripts/audit-specs.js`,
   `node scripts/audit-deploy-lifecycle.js`, `node scripts/audit-deploy-verify.js` (each <0.2s) and
   report red/green + any `needs-human`. Do NOT auto-run `npm run health` or a wave — offer to if the
   user is about to build.

6. **Report** with the format below, then ask what the user wants to work on. If it's a wave, point them
   at the relevant `docs/FACTORY_LINE.md` section + its preconditions FIRST.

## Report format

```markdown
## Session Orientation — <branch> (<ahead>↑ <behind>↓)

<2–3 line factory-line reminder summarized from docs/FACTORY_LINE.md + the one rule>

### ⚠ Unfinished work
- **vanished branches: <list — RECOVER FIRST, these are gc-deletable, or none>**
- uncommitted: <summary; per-file callout of anything FINISHED>
- unpushed (this branch): <list or none>
- stashes: <list — each is hidden WIP needing a decision, or none>
- other branches: <branches with unpushed/no-upstream, or none>

### Git stages (node scripts/git-stages.js)
<paste the git-stages table verbatim — STAGE · N · OLDEST · NEXT · ITEMS, + the trunk-tip + summary line>

### ⛔ Blocking (docs/FOLLOWUPS.md § Blocking)
<list every item, or "none — nothing stands between you and new work">

### 🅿 Parked
<COUNT only + one line saying it's optional. Do NOT enumerate or rank it.>

### Gate state
- specs: <green/blockers> · deploy: <lifecycle+verify green/needs-human> · health: <not run — offer>
- **required gate = CI (`health:strict`) ONLY.** evidence + consumer-sync are advisory/non-blocking.
```

**Closing line.** When Blocking is empty, CI is green and `master` is pushed, say so plainly — e.g.
*"Clean: master green and pushed, nothing blocking, ready for new work."* Do not follow it with a list
of parked items; that is what turned an advisory backlog into three days of cleanup.

## Closing the loop (so the backlog doesn't only grow)
- When YOU land the commit that finishes a follow-up, check it off (`- [x] … (done <sha> <date>)`) and
  move it to `## Done (recent)` in the SAME commit. Prune `## Done (recent)` to entries since the last
  push — older done items live in git history, not in the file.
- Items that are owner decisions (not yours to close) stay open until the owner closes them; surface
  them, don't silently carry them forever.

## Notes
- This is the in-repo session brief; it does NOT replace `/create-wave`, `/evidence-wave`, etc. — it
  tells you *what state you're in* before you pick one. The split between this committed backlog and the
  local `MEMORY.md` pointer index is defined once in `docs/FOLLOWUPS.md` — see there.
- It should also establish the compact execution layer from `docs/process/SPEC_KERNEL_COMPACT.md` so the
  rest of the session inherits the same authority order, approval gates, and proof-before-done contract.
- It is the *instructed* first step (CLAUDE.md "START HERE"), not a mechanically-enforced one. To make it
  fire automatically you can add a SessionStart hook running `node scripts/session-brief.js` to your
  `.claude/settings.local.json` — your call, not auto-added.
- Honesty is the whole point: report audits as they actually ran, surface unfinished work, never paper
  over a red gate (same ethos as the factory line's doer≠checker).
