# Unattended waves — running the factory line as scheduled cloud agents

> Goal: run `/evidence-wave` (then `/create-wave`, `/deploy-wave`) in a **claude.ai cloud routine**, so a
> long wave finishes **without a local session staying live**. This is the fix for the repeated overnight
> stall (a local Workflow only advances while the session processes turns — see
> `docs/PARALLELISM-AND-UNATTENDED-RUNS.md`). Phase order: **Verify first**, then Create, then Deploy.

## The mechanism (confirmed)

- **Cloud routine = `RemoteTrigger` (claude.ai `/v1/code/triggers`)** — runs a prompt on a schedule in a
  cloud environment; result appears at a claude.ai URL. This is the "scheduled cloud agent." API is
  reachable from Claude Code (`RemoteTrigger list` → HTTP 200).
- **NOT `CronCreate`** — that is session-bound (dies when Claude exits, fires only while the local REPL is
  idle). It is the `/loop` equivalent, not unattended.

## The only gap: the environment, not the wave

The wave already works. Its one hard precondition is that **Storybook is serving on `localhost:6006`
before it runs** — and the scout **refuses to start it** (`scripts/workflows/create-pipeline.js`,
`deploy-pipeline.js`: "do NOT start it"). Interactively a human runs `npm run storybook`; an unattended
routine has no human. So the cloud environment must come up **wave-ready**.

`.github/workflows/ci.yml` already proves the ephemeral-env recipe (`npm ci` → `npm run test:storybook`);
a routine env needs that **plus a running server** and two secrets.

## Build split

| Piece | Owner | Where |
|---|---|---|
| **Env bootstrap** — `npm ci` + launch Storybook on :6006 + block until `/index.json` serves | ✅ in-repo | `scripts/cloud-wave-env.sh` |
| **Cloud environment** for this repo (points its setup step at the bootstrap script) | **owner** | claude.ai environment settings |
| **Secrets** `FIGMA_API_KEY` + `EVIDENCE_CHECK_TOKEN` | **owner** | claude.ai environment secrets |
| **The routine** — schedule + prompt `/evidence-wave <level>` | RemoteTrigger `create` | after env + secrets exist |

## Owner setup steps (claude.ai side — cannot be done from Claude Code)

1. Create a **cloud environment** for `github:miguelmyers/design-system` on a feature branch.
2. Set its **setup/startup command** to `bash scripts/cloud-wave-env.sh` (brings the env to wave-ready).
3. Add environment **secrets**: `FIGMA_API_KEY` (required) and `EVIDENCE_CHECK_TOKEN` (for cryptographic
   signing — this is the SAME provisioning already tracked in `docs/FOLLOWUPS.md`; the cloud upgrade is
   gated on it). Ensure the environment has an Anthropic token budget for the run.
4. Create the routine: `RemoteTrigger create` with the schedule (off-minute cron) + prompt
   `/evidence-wave atoms` (or a slug list). Start with a **manual `run`** to validate before scheduling.

## Dependency + sequencing

- **Gated on `EVIDENCE_CHECK_TOKEN`** — until it is a real cloud secret, the unattended seals sign at the
  advisory/pilot level. Provision it first (it is already an open follow-up); the cloud upgrade rides on
  the same work, and makes the seals cryptographic from day one — exactly when the *doer must not be able
  to read the token* matters most (an unattended run has no human watching).
- **Verify first, then template.** Once one unattended `/evidence-wave` run is green, Create and Deploy
  reuse the SAME `cloud-wave-env.sh` bootstrap; only the routine prompt changes
  (`/create-wave …`, `/deploy-wave …`). Deploy additionally needs the consumer app reachable.

## Validation checklist (before trusting an unattended run)

- [ ] `cloud-wave-env.sh` exits 0 and `/index.json` serves in the cloud env.
- [ ] A manual `RemoteTrigger run` of `/evidence-wave <one slug>` completes and commits a sealed bundle.
- [ ] Re-run the gate independently on the result (`npm run audit:evidence --range …`) — expect green; a
      wrong token must fail. **Never trust the routine's self-report** (same doer≠checker ethos as the
      local waves).
- [ ] Only after that: schedule it (recurring, off-minute cron) or leave it on-demand.
