# Git workflow — the lifecycle, best-practices recipe, and the stage ledger

How work moves from your editor to `master`, the discipline that keeps it well-administered, and the
`git:stages` tool that shows what is sitting at each stage. `/session-start` prints the stage table every
session; run `npm run git:stages` any time for the latest.

## The stages (the mental model)

```
working tree  →  untracked  →  staged  →  committed  →  pushed  →  merged to master
 (your edits)   (new files)   (git add)  (git commit)  (git push)   (PR merged)
      └──────────────── all happen ON a short-lived branch ────────────────┘
```

Two INDEPENDENT axes — don't conflate them:
- **Spec status** (`draft → implemented → verified`) = *how true it is* (design/verification; lives in the spec).
- **Git stage** (above) = *where it lives* (version control). This doc is the git axis.

A thing can be `verified` but not merged, or `committed` but still `draft`. Different questions.

## The stage ledger — `npm run git:stages`

`scripts/git-stages.js` prints, for each stage: COUNT · OLDEST age · NEXT-step hint · the actual ITEMS —
so nothing is stranded (a commit that never got pushed = not backed up; an edit sitting unstaged for days
= at risk). Shown at `/session-start` and on demand. Example:

```
STAGE                           N   OLDEST NEXT            ITEMS
working tree (unstaged)         6   1h     stage/discard   src/gallery/RailNav.tsx, docs/atomic/atom/badge.spec.md, +4 more
untracked (new)                 3   2d     add/ignore/del  _crop_tmp.js, scripts/export-transcript-to-html.js, +1 more
staged (uncommitted)            0   —      —               —
committed, not pushed           0   —      —               —
pushed, not merged -> master    0   —      —               —

trunk tip (merged): 33f9b06 ...
summary: 9 loose file(s) in working tree · 0 unpushed · 0 unmerged to master
```

The **OLDEST age** is the lever: a large age on `committed, not pushed` or `pushed, not merged` means work
is aging out of the trunk — push / open a PR. Working-tree items aging for days are usually noise to clean.

## The recipe — start to master (repeat per unit of work)

```bash
# 0. SYNC master first — always branch from the current trunk
git checkout master && git pull origin master

# 1. BRANCH — one short-lived branch per unit of work
git checkout -b feat/molecules

# 2. WORK — on this project the waves do the inner add+commit loop for you, in ONE tab:
#    /create-wave <specs>   /evidence-wave <slugs>
#    (for hand edits, continue with 3-4)

# 3. STAGE — always scoped, never blanket; verify before committing
git add docs/atomic/molecule/cardheader.spec.md
git diff --cached --name-only          # confirm ONLY what you intended is staged

# 4. COMMIT — small, stable steps
git commit -m "verify(cardheader): flip implemented -> verified"

# 5. PUSH — early and often (pushed = backed up, can't be lost)
git push -u origin feat/molecules      # first push sets upstream; then just `git push`

# 6. GO GREEN the way CI does, BEFORE the PR (assume stacked blockers, not one)
npm run health:strict                  # the required CI gate
npm run test:behavior                  # Storybook must be serving on :6006

# 7. PR — the merge + review vehicle; keep it SMALL so it's reviewable
gh pr create --base master --head feat/molecules --title "..." --body "..."

# 8. MERGE — clean fast-forward (you branched from current master)  [owner's call]
gh pr merge --merge

# 9. CLEAN UP — reset for the next loop
git checkout master && git pull origin master
git branch -d feat/molecules && git push origin --delete feat/molecules
```

## Golden rules (what keeps it well-administered)

1. **Branch from current master every time** (step 0). Never build on a stale base.
2. **Short-lived branches, merged often.** Small frequent merges ≫ one giant long-lived branch. (This
   repo once hit 214 commits ahead of master — that is the anti-pattern to avoid.)
3. **Scope every `git add`; verify `--cached` before commit.** Never `git add -A` / `git commit -am`.
   `git commit` commits EVERYTHING staged — a blanket add once swept an unrelated seal into a docs commit.
4. **One tab commits at a time**, or use `git worktree` (its own index). Two tabs on one checkout race on
   `.git/index` — a proven failure here.
5. **Push after each stable step.** Committed = saved locally; pushed = truly safe.
6. **Run the FULL gate locally before the PR** — a required check that has never passed can hide stacked
   blockers behind the first failure. Don't assume the visible failure is the only one.
7. **Commit/push freely; merge to master deliberately** — it is the trunk everyone branches from.

**One-liner:** *sync → branch → work → push often → go green locally → small PR → fast-forward merge →
delete branch → repeat.*
