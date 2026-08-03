# Two-Laptop Workflow — one GitHub identity, two machines

**Status:** canonical operating rule whenever this project is worked from two computers.
**Applies to:** BOTH laptops, EVERY session, whichever one you are on. Read this before you start.

> Context: the same GitHub account (**MiguelMyersMS**, Miguel's Microsoft email) is signed in on both
> laptops, and a helper may work on Laptop B *while* the owner works on Laptop A. Same identity + two
> machines + one repo = no permission wall and no way to tell commits apart by author. Discipline, not
> tooling, is what prevents lost work.

---

## TL;DR — the whole protocol in five lines

1. **`origin` on GitHub is the ONLY source of truth.** Local work is invisible to the other laptop until pushed.
2. **Pull when you ARRIVE, push when you LEAVE** — in every repo you touched.
3. **Only Laptop A commits to `master`.** Laptop B always works on a `feat/…` branch → Pull Request.
4. **Never `--force` a branch the other laptop may have. Never hand off work in a `git stash`** (stashes don't travel).
5. If `git pull --ff-only` is refused, histories diverged → **rebase, don't force** (see Recovery).

---

## Why two laptops with the SAME GitHub login is risky

- No permission wall — both machines can push to `master` as "you".
- Commits from both look identical (same name + email) — you can only tell them apart by **branch**.
- Uncommitted edits, untracked files, and `git stash` entries **NEVER travel** between machines.
- This project is **several separate repos**; each syncs independently — "pushed" means pushed in *every*
  repo you changed, not just design-system.

---

## Machine roles (concurrent — helper on B while owner works on A)

**Laptop A = the home / integration machine (the one this file was written on).**
- Keeps `systems/design-system` on **`master` at all times** — the consumer apps link to its *working tree*
  (`file:../../systems/design-system`), so switching its branch breaks the apps.
- Does merges / integration. For its **own** feature work, use a **worktree** so `master` stays checked out:
  `scripts/new-worktree.sh <feature>` (see [MULTI-AGENT-WORKTREES.md](./MULTI-AGENT-WORKTREES.md)).

**Laptop B = the helper's machine.**
- **NEVER commits to `master`.** Always: `git checkout -b feat/<task> origin/master`, work, push, open a PR.
- Pull `origin/master` often and rebase the feature branch on it to stay current.

---

## The rituals — do these EVERY time (muscle memory)

### Arriving at a laptop (before ANY work)
```bash
git fetch --all --prune
git pull --ff-only          # on the branch you're continuing
git status                  # must be clean — deal with leftovers FIRST
```
If `--ff-only` is refused, you have local commits the other laptop didn't → go to **Recovery**.

### Checkpointing mid-session (don't save it all for the end of the day)
The single biggest source of "the other laptop doesn't have my work" is treating push as an end-of-day
event. Instead, run the same commit+push at every natural stopping point:
```bash
git add -A && git commit -m "wip: <what>"
git push
```
Do this after finishing a component, landing a fix, or before you context-switch to something else —
not just when you're about to close the laptop. Small, frequent pushes also make Recovery (below) cheap:
the smaller the divergence, the easier the rebase.

### Leaving a laptop (before you walk away or switch machines)
```bash
git add -A && git commit -m "wip: <what>"   # commit stable work — small + often
git push                                     # push EVERY repo you touched
git status                                   # confirm "working tree clean" + "up to date with origin"
```
**Golden rule:** never leave a laptop with unpushed commits or uncommitted work if the other laptop might
be used next. A stash is **not** a handoff — it stays on that one machine.

### Automation (belt-and-suspenders, not a replacement for the habit)
`.claude/settings.json` (git-tracked, so it's live on both laptops) wires three things — one per ritual:
- **`SessionStart` hook** — runs `git fetch --all --prune` → `git pull --ff-only` → `git status` automatically
  the moment a Claude Code session opens in this repo. Non-destructive: if `--ff-only` is refused it just
  surfaces that (histories diverged → go to Recovery), it never rebases or resets on its own.
- **`breakReminder`** — a dismissible nudge that fires every ~45 minutes of *continuous* work (this is the
  one that covers "throughout the day" — the two hooks only fire at session start/end, never mid-session).
  It re-fires every interval until you take a real break (10+ min idle resets the timer).
- **`Stop` hook** — when a session ends, checks for uncommitted changes or unpushed commits and prints a
  reminder if it finds any. It only reminds — it never runs `git add`/`commit`/`push` itself; that stays a
  human decision.

These reduce forgetting, they don't replace the checkpoint habit above — they're timers and reminders,
the actual `git add`/`commit`/`push` is still something you (or your AI assistant, when asked) does.

---

## Branch discipline

- Author is identical on both machines, so **the branch is the only signal of who/which machine.**
- Naming: `feat/<task>` · `fix/<task>` · `docs/<task>`. When both machines touch the same area, suffix the
  machine: `feat/selectfield-states-b`.
- **One task = one branch = one machine.** Do not edit the same files on both laptops at once — that is the
  one conflict branches can't cheaply save you from. **Divide the work by files/area up front.**

---

## Recovery — "`git pull --ff-only` was refused" (histories diverged)

Both laptops committed to the same branch. Do **NOT** `git reset --hard` or `git push --force`.
```bash
git pull --rebase origin <branch>   # replays YOUR commits on top of origin's
# resolve conflicts → test → then:
git push
```
If **`master` itself** diverged on Laptop A, preserve your work and rebuild onto GitHub's master:
```bash
git branch backup/master-local                       # 1. save your local commits
git reset --hard origin/master                       # 2. match GitHub exactly
git checkout -b fix/reconcile backup/master-local    # 3. your commits, now on a branch → open a PR
```

---

## ⚠️ The repos — sync status (READ THIS before trusting two-laptop work)

| Repo | GitHub remote | Two-laptop syncable? |
|------|---------------|----------------------|
| `systems/design-system` | `MiguelMyersMS/design-system` (private) | ✅ yes — the clean case |
| `apps/databases-dashboard` | `azure-data-intelligence-platform/Lyra-template` | ⚠️ points at a shared **template** org **and has unpushed commits** — needs its own repo or a deliberate push decision before two-laptop use |
| `systems/data-model-system` | **none** | ❌ **not on GitHub** — cannot git-sync between laptops |
| `apps/bloodwork-dashboard` | **none** | ❌ **not on GitHub** — cannot git-sync between laptops |

**The two ❌ repos have no shared remote, so nothing done to them on one laptop reaches the other through
git.** Before relying on two-laptop work for those: create a **private** GitHub repo, `git remote add origin
<url>`, and push all branches. Until then, treat them as **single-laptop-only** and do not edit them on both
machines. `databases-dashboard` must NOT be pushed to the template org — give it its own repo first.

> If there is a 5th repo not listed here, add it to this table with its remote + syncable status.

---

## Where this is wired

- `CLAUDE.md` (START HERE) points here, so every Claude session on either laptop reads it first.
- Unfinished-work handoff between machines goes in [`docs/FOLLOWUPS.md`](../FOLLOWUPS.md) — committed, so it
  travels via GitHub and the next session's `/session-start` picks it up. **This is how the two laptops talk.**
