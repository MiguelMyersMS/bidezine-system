# Team Sync Discipline — three machines on one `main`

**This is the single canonical guide.** It is surfaced automatically at three moments every day:
- **Session start** — the `SessionStart` hook fetches + pulls, then prints the discipline.
- **~Every 45 min** — the `breakReminder` repeats the checkpoint + habits.
- **End of session** — the `Stop` hook warns if anything is uncommitted/unpushed.

Laptop A (Miguel), Laptop B (Blair), and the PC all work on **`main` directly**. `origin` on GitHub is the
**only** source of truth — work that isn't pushed never reaches the other machines.

## The rhythm

- 📥 **PULL when you sit down.** (The SessionStart hook already runs `git fetch` + `git pull --ff-only` for
  you, so you always start current.)
- 🔄 **CHECKPOINT while you work** — commit + push at every natural stopping point, small and often.
- 📤 **PUSH when you get up / step away.** If it isn't pushed, the other machines can't see it.

## Fetch ≠ Pull

- `git fetch` = "is there anything new?" — downloads the latest info from origin and **changes nothing** in
  your files. Safe to run anytime, even mid-edit.
- `git pull` = fetch **+** merge those changes into your files. Do it when you're ready to take them.

## How you know someone else pushed

1. **Turn on VS Code Auto Fetch (one-time, per machine):** open Settings (`Ctrl+,`), search
   **`git.autofetch`**, and set **Git: Autofetch** to `true` (or `all`). Optionally set
   **Git: Autofetch Period** (default 180s).
2. Then the **Source Control / branch item in the bottom status bar** shows a **↓ number** when there are
   commits to pull and **↑ number** when you have commits to push — a live signal, no action needed.
3. Terminal equivalents: `git fetch` then `git status` ("behind by N"), or
   `git log --oneline HEAD..origin/main` to see exactly what's new.

## The five habits that avoid conflicts

1. **PULL before you start a new area** — begin from the latest.
2. **Work ROOM-BY-ROOM** — one person per component/file area. *Two people editing the same file is the only
   real source of conflicts — this habit does most of the work.*
3. **Commit + PUSH small and often** — short-lived divergence stays easy to merge.
4. **CLAIM your area** — say what you're working on before you start.
5. **PULL again right before you push** — so you merge on your machine, not by surprise.

## If a conflict happens

It's routine, not a disaster. Git pauses the pull and marks the conflicted files; VS Code shows
**Accept Current / Incoming / Both** inline. Choose or blend, then commit. Because we push small and often,
conflicts stay tiny. **Never force-push over someone else's work** to "fix" it — resolve and merge.

> **The one habit:** pull before you touch a new area; push the moment you finish one.
> Small + often beats one big save at 6pm.
