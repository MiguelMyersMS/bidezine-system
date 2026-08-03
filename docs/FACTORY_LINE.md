# Factory Line — operational runbook (READ BEFORE RUNNING ANY WAVE)

> **First action of any session: run `/session-start`.** It loads this runbook and reports live state
> (uncommitted changes, unpushed commits, open follow-ups in `docs/FOLLOWUPS.md`, gate status) so
> nothing unfinished is dropped between sessions.

The design system is built through three orchestrated multi-agent commands — **create → verify →
deploy**. Each is one `/…-wave` skill that fans out subagents with **doer ≠ checker** (no agent
certifies its own work), a governor adjudicator, a fix-loop, and a governor-vetted self-refinement
retrospective that can only *tighten* the protocol.

This file is the operator's pre-flight: what each wave does, what must be true before you run it,
where a human stays in the loop, and what to do with the result. Architecture detail lives next to the
code (`scripts/workflows/*.js`); the per-stage traps live in the LESSONS files linked below.

---

## 0. The one rule

**An agent never checks its own work, and the self-refinement loop can only tighten.** Everything below
is in service of that. If you find yourself about to let a doer sign off its own output, or to "just
loosen" a gate so something passes — stop. That is the exact failure this system exists to prevent.

---

## 1. The three waves (and the lifecycle order)

Run them in this order — each consumes the previous stage's output:

| # | Command | Does | Ends at | Then |
|---|---------|------|---------|------|
| 1 | **`/create-wave`** | Figma node → schema-complete spec → component + story | `status: implemented` | seal it with /evidence-wave |
| 2 | **`/evidence-wave`** | verify the component against Figma, sign the evidence bundle | sealed + signed (gate-green) | compose it into a release |
| 3 | **`/deploy-wave`** | assemble a Figma release + independently verify it, hand it to a consumer app | `handed-off` | consumer deploys → owner signs off |

A piece must be **implemented** before you verify it, and **sealed** before you deploy a release that
composes it. The deploy wave's scout will REFUSE a release whose pieces aren't already sealed.

Single-item siblings (when you don't want a batch): `/figma-build` (create one), `/evidence-pipeline`
(verify one), `/figma-deploy` (deploy one).

> ### The wave IS the loop — run it, don't hand-replicate it
>
> Each wave already runs the doer, the independent reviewers, the governor, and the fix-loop **inside one
> command, in one tab, with no copy-paste.** The only thing that surfaces to you is a genuine design
> decision, batched once as a `needs-human` escalation.
>
> **Anti-pattern (proven slow + unreliable):** building a component by hand in a free chat and relaying
> it to another model across rounds to "verify" it. That recreates — manually, and badly — the exact
> loop the wave automates: a lone single-agent doer makes misleading or partial claims, and *you* end up
> doing the orchestration by copy-paste. It costs more in your time, more in free tokens, and it does not
> converge.
>
> **The right split:** free tabs are for **alignment + intent capture only** — Figma review, layer
> renaming, and design rules Figma can't hold (animations, tooltips, a conditional-padding rule). The
> rigorous **build + verify + fix-loop is the wave's job** — `/create-wave` for a new component,
> `/evidence-wave` for an existing one. Pay for the wave; it is cheaper than the manual grind.

---

## 2. Preconditions (check these FIRST — every wave)

- **Storybook running on :6006** — `npm run storybook`. The reviewers render and read stories; a down
  Storybook makes the scout report `storybookUp:false` and the wave stops.
- **`FIGMA_API_KEY` set in the environment** — captures and the re-fetching reviewers need it.
- **On a feature branch**, not `master` (these waves commit).
- **`npm run health` is green** before you start — so a wave's failures are attributable to the wave.
- Per stage: create needs the Figma node + fileKey + atomicLevel; verify needs each spec's
  `figma.fileKey` + node binding; deploy needs the app under `apps/*` consuming the DS live.

The skills probe these and tell you how to fix a missing one. Don't bypass a failed precondition.

---

## 3. Where a HUMAN stays in the loop (the workflow cannot pause for you)

The autonomous workflow runs to completion without stopping, so the human decisions happen **in the
skill, before launch**, or **on the result, after**:

- **create — gallery-vs-domain triage (before launch).** Only genuinely reusable controls (≥2
  consumers, not tied to one data domain) belong in the gallery. A domain-specific component stays in
  its host project. The skill surfaces the triage; you confirm scope.
- **deploy — the SCOPE GATE (before launch).** The skill deep-fetches the assembly, exports the PNG,
  and shows the triage table (every visible node → new/changed × design-system/consumer). **You agree
  the scope before it builds.** The deploy wave **STOPS at `handed-off`** — `deployed` and
  `signed-off` are the consumer's + owner's to report, never the agent's.
- **All stages — escalations (after).** `needs-human` results and `refinement.escalated` items are
  **owner decisions** (a token that doesn't exist for a Figma fill, an ambiguous design call, a
  gate/contract change). Surface them; never answer a design-authority call yourself.

---

## 4. How to launch

Prefer the **skill** (it resolves args, runs the human gate, filters already-done items), e.g.
`/create-wave build 312:1100 datechip molecule`, `/evidence-wave molecules`,
`/deploy-wave 289:4585 PLG_dashboard`.

**Flags** (anywhere in the argument): `no-commit` → builds but doesn't commit; `no-refine` → skips the
retrospective; `force` → (verify) re-seal even already-sealed components.

The skill then launches the Workflow in the background. Rough cost: **~250–400k tokens per component**
for verify; the 3-reviewer panel roughly doubles a 1-checker run. Scale the batch accordingly.

---

## 5. What to do with the result (don't trust self-reports)

Every wave returns a **ledger** + a **`refinement`** object:

- **Ledger** — `committed` / `readyToCommit`, `needsHuman`, `failed`. Independently re-run the stage's
  gate on a sample (`npm run audit:specs` / `audit:evidence` / `audit:deploy:verify`) — expect green;
  a wrong token must fail. The point of the whole system is that you verify, not assume.
- **`refinement.applied`** — governor-approved, *safe* (tooling/prompt/process/lesson) protocol
  changes the wave already wrote but did NOT commit. Re-validate them, then `git add` + commit
  (`chore(protocol): self-refinements from the <wave> wave`) and `git push`.
- **`refinement.escalated`** — changes the governor would NOT auto-apply (a gate / spec-contract /
  role-separation edit). **These are owner decisions. Surface them; do not apply.**

---

## 6. The shared machine + discipline (don't break these)

- **`scripts/workflows/retrospective.js` is shared by all three waves — NEVER fork it.** A divergent
  copy is exactly how a loosening would slip through. Each stage configures it via args
  (`ownerOnlyPatterns`, `protectedPathsText`, `lessonsPath`, `safeClasses`).
- **doer ≠ checker is enforced differently per stage** (by trust model): verify = a cryptographic
  signature (`audit-evidence.js`); deploy = `audit-deploy-verify.js` FAILS if deploy.md `assembled_by`
  == comparison.md `reviewer`; create = distinct agents + the static `audit-specs.js` content gate
  (blocks a dangling `tokens.<name>` alias). The lighter stages' authority is the orchestration using
  distinct agents + the downstream gates.
- **Owner-only files escalate, never auto-apply**: the gates, `*.spec.md` values, `src/tokens.ts`,
  the spec template / PROTOCOL / lifecycle docs, `.github/workflows`, and the workflow scripts.
- **Mirrors + generated files**: `.claude/workflows/*` are gitignored byte-identical mirrors of
  `scripts/workflows/*` — keep them in sync when you edit a workflow. `.github/prompts/*` are
  **generated** from `.claude/skills/*` via `npm run prompts:sync` (CI-checked with `prompts:check`);
  edit the skill, never the prompt mirror.
- **Workflow sandbox constraint**: workflow scripts have NO filesystem/Node API and cannot `import`
  local libs — share logic via **sub-workflows** (`workflow({scriptPath}, args)`); regexes pass as
  source strings and are rebuilt with `new RegExp`.
- **Validate a workflow edit** with the wrap-validate trick (top-level `return` is legal in a workflow
  body): `node -e "const fs=require('fs');new Function('args','log','phase','agent','parallel','pipeline','workflow','budget','return (async()=>{'+fs.readFileSync('<file>','utf8').replace(/^export const meta[\s\S]*?\n}/,'')+'})')"`.
- **Windows note**: a single-quoted bash heredoc mangles backslashes — write test scripts with the
  Write tool, not a heredoc, when they contain regexes.

---

## 7. Lessons + further reading

- Per-stage traps the waves must catch: `docs/atomic/CREATE-LESSONS.md`, `docs/evidence/LESSONS.md`,
  `docs/deploy/DEPLOY-LESSONS.md`. The retrospective appends to these (class `lesson`).
- Verify protocol: `docs/evidence/GUIDE.md` + `README.md`; the adversarial analysis that shaped the
  fail-closed design: `docs/evidence/RED-TEAM-2026-06-23.md`.
- Deploy lifecycle + coverage contract: `docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md`,
  `docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md`, `docs/deploy/_TEMPLATE.deploy.md`.
- Create/spec contract: `docs/atomic/PROTOCOL.md`, `docs/atomic/_TEMPLATE.spec.md`.

---

## 8. Open owner actions + backlog

Open owner actions, deferred decisions, and recorded follow-ups live in **one place** —
[`docs/FOLLOWUPS.md`](./FOLLOWUPS.md) (surfaced each session by `/session-start`). This runbook links to
it rather than restating items, so there's no second copy to drift. (E.g. provisioning
`EVIDENCE_CHECK_TOKEN` as a CI secret to make verify signing cryptographic is tracked there.)
