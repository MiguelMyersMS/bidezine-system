# Multi-agent parallel work — one worktree per agent

## The problem this solves

Multiple agents (Claude, Copilot, …) working in the **same folder** share one git checkout and one
index. The moment one agent does a `git checkout <other-branch>`, `git stash`, or `git reset`, the files
on disk change **for every agent in that folder** — a file the other agent is editing can vanish
mid-edit. That is exactly how `AccordionBarDark.tsx` appeared to "get deleted": it wasn't removed from
git, another agent switched the shared working tree to a branch that didn't contain it. The recurring
`index.lock` / "another git process" errors are the same collision at the git level.

**Rule zero: one working directory = one agent. Never two agents in the same folder.**

## The layout

```
Workspaces/systems/
  design-system/          ← MAIN clone. Stays on `master`. The INTEGRATION tree.
                            Consumers' `file:../../systems/design-system` link points HERE, so apps
                            always build against stable master. Do NO feature work here — only
                            `git pull` after merges.
  ds-wt/                   ← one isolated worktree per active agent / feature
    accordion-bar/        · on feat/accordion-bar
    z-index-fix/          · on fix/z-index
    <next-feature>/       · …
```

A **worktree** is a second working directory backed by the *same* `.git` history but with its **own
branch, own index, and own `index.lock`**. Branch operations in one worktree cannot touch another's
files, and the lock contention largely disappears.

## Daily flow

**Start a feature (one command):**
```bash
cd Workspaces/systems/design-system
scripts/new-worktree.sh accordion-bar          # → ../ds-wt/accordion-bar on feat/accordion-bar off master
cd ../ds-wt/accordion-bar
npm run storybook -- -p 61XX                    # your OWN Storybook port (the script suggests one)
```

**Work → commit → land:**
1. Edit + commit inside your worktree, on your branch. Never touch another folder.
2. Open a PR to `master`. Squash-merge when CI is green.
3. Keep current with `git merge master` **inside your worktree** (no `-s ours` gymnastics — the branch
   is a normal descendant of master).

**Finish:**
```bash
cd Workspaces/systems/design-system
git pull                                        # main tree advances to the new master
git worktree remove ../ds-wt/accordion-bar
git branch -d feat/accordion-bar
```

## The four rules

1. **One folder per agent.** Never point two agents at the same directory. (Rule zero.)
2. **Never run `git checkout <other-branch>` / `git stash` / `git reset` in a tree you don't exclusively
   own.** Those rewrite on-disk files for whoever else is there.
3. **Feature-branch-per-component, always.** Never work directly on `master` or share one branch between
   two live agents.
4. **The consumer-linked main tree stays pinned to `master`.** App builds must never depend on whatever
   branch some agent is mid-edit on. (Optionally, give apps their own dedicated `ds-wt/consumer` worktree
   pinned to master.)

## Running the health gate in a worktree

`npm run health` / `npm run health:strict` (`scripts/run-audits.js`) includes a Storybook
**behavior gate** (`test-storybook`) that needs a running Storybook instance to talk to. The
script defaults to `http://localhost:6006` — the main clone's port — which is **wrong** for any
worktree, since your worktree runs on its own port (see above). Hitting `:6006` from a worktree
either collides with another agent's Storybook or produces false `MissingStoryAfterHmrError`
failures for stories that only exist on your branch.

**Always set `STORYBOOK_URL` before running the gate from a worktree:**

```bash
STORYBOOK_URL=http://localhost:61XX npm run health:strict   # bash
$env:STORYBOOK_URL="http://localhost:61XX"; npm run health:strict   # PowerShell
```

If `STORYBOOK_URL` is unset, the script falls back to `:6006` unchanged — safe default for the
main clone, but always override it in a worktree.

## `sync/` files are tracked — cycle numbers can diverge across worktrees

`sync/HANDOFF.md` and `sync/REVIEW.md` (the Implementor↔Governor cadence loop, see
`sync/PROTOCOL.md`) are ordinary git-tracked files. Each worktree checks out its own copy from
whatever commit it branched from — so if two worktrees both write new cycles independently, the
cycle numbering will **not** stay globally sequential and a later merge can produce a confusing
history (two different "Cycle 170"s, out-of-order Approvals, etc.).

Guidance until this is formally reconciled:
- Before starting a sync cycle in a worktree, check whether the main clone (or another worktree)
  has already advanced `sync/HANDOFF.md` / `sync/REVIEW.md` past what you branched from — if so,
  treat your cycle numbering as **local to this worktree/PR** and call it out explicitly in the
  PR description so the merge doesn't silently clobber a newer cycle from elsewhere.
- Prefer keeping sync-loop work (protocol/process refinement) on its **own dedicated worktree**,
  separate from component/feature worktrees, so cycle history stays easier to follow.
- A future improvement (not yet done): scope `sync/HANDOFF.md`/`REVIEW.md` per-worktree (e.g.
  under `sync/history/<slug>/`) so cadence tracking doesn't collide across parallel worktrees.

## Notes

- Worktrees share `node_modules` only if you symlink it; otherwise run `npm install` once per worktree.
  Because this package ships raw `.ts` (no build), a fresh `node_modules` per worktree is cheap.
- Each worktree needs a **distinct Storybook port** (`-p 61XX`) so two don't fight over `:6006`.
- Claude Code's own subagents can take `isolation: "worktree"` for parallel *within* one session; this
  doc is for parallelism *across* tools/sessions (Claude ⇄ Copilot), which needs real worktrees.
- To see all worktrees: `git worktree list`. To prune stale ones: `git worktree prune`.
