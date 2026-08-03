# Parallelism & unattended wave runs — design note

> Recorded 2026-06-30 after an overnight `/evidence-wave` paused: the interactive session sat idle
> (no turns firing), the wave stalled after the first atom (carouselmark), and ~7 hours were lost. This
> note captures the mental model and the two capabilities that fix it, so we stop relying on the
> interactive terminal for work it structurally cannot do unattended.

## The mental model (why it paused)

An interactive Claude Code session only does work **while a turn is firing**. A background `Workflow`
(what the `/…-wave` skills launch) advances as the session processes turns; when you walk away, no turns
fire, so the wave **pauses losslessly and resumes** when you return. This is not a bug — the interactive
terminal is simply the wrong tool for "kick it off and walk away."

Corollary that bit us once already: **two interactive sessions must not drive evidence/deploy work over
the same checkout** — they write the same `docs/evidence/*` files and race on git. See Capability 1.

---

## Capability 1 — Parallelism *while present*: git worktrees, one Claude each

For running several tracks at once **while you're at the desk** (e.g. an evidence sweep + a feature),
give each Claude its **own working directory + branch** via `git worktree`, so there is zero file/git
collision:

```bash
# from the design-system checkout
git worktree add ../design-system-wt-evidence -b wt/evidence-sweep
git worktree add ../design-system-wt-feature  -b wt/some-feature
# open a terminal + Claude in each worktree dir; merge each branch when done
git worktree remove ../design-system-wt-evidence   # when finished
```

- Each terminal = isolated checkout → no two Claudes stomp the same `docs/evidence/*` or `.git/index`.
- This is the correct shape for the "multiple terminals at once" pattern.
- **It does NOT make work unattended** — it still needs you tabbing between sessions. Walk away and all
  of them pause. For walk-away, see Capability 2.

> Buys parallelism, not unattendedness. Keep the two separate in your head.

---

## Capability 2 — Unattended runs: a *Claude session* that runs without your keystrokes

A long wave (~250–400k tokens/component; a 22-atom run is ~4h) should not depend on the interactive
session staying live. Because the waves are **agent-orchestrated** (the `Workflow` tool inside a live
Claude session — `scripts/workflows/evidence-wave.js`, not a standalone node script), "unattended" means
"a Claude session running somewhere that doesn't need my terminal." Two real paths, in preference order:

### 2a. Scheduled cloud agent / routine (recommended — native fit)
A routine fires a **fresh Claude session in a cloud environment** on a cron (or once at a set time),
runs `/evidence-wave <level>`, and survives you closing the laptop. This is the natural home because the
wave *is* a Claude session.

Needs, before it can run green:
- A cloud environment with the repo checked out and `npm ci` done.
- `FIGMA_API_KEY` available to that environment (captures + re-fetching reviewers need it —
  `scripts/evidence-capture-figma.js`, `scripts/workflows/evidence-pipeline.js`).
- A **Storybook server reachable on :6006** inside that environment (reviewers render stories; a down
  Storybook makes the scout report `storybookUp:false` and the wave stops — see `docs/FACTORY_LINE.md` §2).
- An Anthropic token budget for the run.
- `EVIDENCE_CHECK_TOKEN` provisioned so the seal signing is cryptographic, not advisory (already an open
  follow-up; the doer must not be able to read it).

### 2b. GitHub Actions with headless `claude` (heavier alternative)
Possible but more plumbing: install the `claude` CLI, run it in headless (`-p`) mode in a job, stand up
Storybook in the same job, and feed it the same secrets as 2a. Prefer 2a unless we specifically want the
run gated on a PR.

### What CI already does (and does NOT do)
`.github/workflows/evidence.yml` runs the **evidence GATE** server-side over a PR's committed blobs from
the trusted base ref — it proves a seal is *honest*, it does **not** produce the seal. Running the wave
(capture → review → seal) is the missing unattended capability described above. Don't conflate the two.

---

## Half-measure — `/loop` (local, present-ish)

`/loop` makes a session issue its **own** turns on an interval, so a wave keeps advancing without you
typing — **but only while the machine + the Claude app stay open.** It does not survive closing the
laptop. Use it when you'll be at the desk but not actively driving; it is not a substitute for
Capability 2.

---

## Decision matrix

| You want to… | Use |
|---|---|
| Run ≤5 atoms in a watchable window | one interactive terminal, stay engaged |
| Run several independent tracks at once, while present | **git worktrees**, one Claude each (Cap. 1) |
| Keep one local wave advancing while at the desk, not typing | `/loop` (half-measure) |
| Kick off a long wave and **walk away / sleep** | **scheduled cloud agent** running `/evidence-wave` (Cap. 2a) |
| Gate a wave's result on a PR | headless `claude` in GitHub Actions (Cap. 2b) |

---

## Status / next steps

- Capability 1 (worktrees) is **available today** — adopt it now; it also removes the live
  two-sessions-racing risk.
- Capability 2 is a **real build** (cloud env + Storybook + secrets + `EVIDENCE_CHECK_TOKEN`). Tracked
  in `docs/FOLLOWUPS.md`. Sequence it after `EVIDENCE_CHECK_TOKEN` lands so unattended seals are
  cryptographic from day one.
