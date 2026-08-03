#!/usr/bin/env bash
# new-worktree.sh — spin up an ISOLATED working directory for one agent / one feature.
#
# Why: multiple agents (Claude, Copilot, …) sharing ONE checkout stomp each other — a branch
# switch / stash / reset in the shared folder yanks files out from under the other agent (this is
# how AccordionBarDark "disappeared"). A git worktree gives each agent its own folder + branch,
# sharing one history, so branch operations in one CANNOT touch another's files.
#
# Usage:
#   scripts/new-worktree.sh <feature-slug> [base-branch]
#     scripts/new-worktree.sh accordion-bar          # → ../ds-wt/accordion-bar on feat/accordion-bar off master
#     scripts/new-worktree.sh z-index-fix master
#
# Rules (see docs/process/MULTI-AGENT-WORKTREES.md):
#   • One agent per worktree folder. Never two agents in the same directory.
#   • The MAIN clone stays on `master` (consumers' file: link points there) — never do feature work in it.
#   • Each worktree runs its OWN Storybook on its OWN port (prompted below).

set -euo pipefail

slug="${1:?usage: scripts/new-worktree.sh <feature-slug> [base-branch]}"
base="${2:-master}"

root="$(git rev-parse --show-toplevel)"
wt_parent="$(dirname "$root")/ds-wt"
wt_dir="$wt_parent/$slug"
branch="feat/$slug"

if git -C "$root" show-ref --verify --quiet "refs/heads/$branch"; then
  echo "✗ branch $branch already exists — pick another slug or check it out." >&2
  exit 1
fi
if [ -e "$wt_dir" ]; then
  echo "✗ $wt_dir already exists." >&2
  exit 1
fi

mkdir -p "$wt_parent"
git -C "$root" fetch origin --quiet
git -C "$root" worktree add "$wt_dir" -b "$branch" "origin/$base"

# suggest a unique Storybook port derived from the slug (6006 + hash, 6100–6199)
port=$(( 6100 + $(printf '%s' "$slug" | cksum | cut -d' ' -f1) % 100 ))

cat <<EOF

✓ Isolated worktree ready:
    dir:    $wt_dir
    branch: $branch  (off origin/$base)

Next:
    cd "$wt_dir"
    npm install            # once, if node_modules isn't shared
    npm run storybook -- -p $port    # your OWN Storybook, no collision
    # …work, commit, PR to master. When done:
    #   cd "$root" && git worktree remove "$wt_dir" && git branch -d $branch
EOF
