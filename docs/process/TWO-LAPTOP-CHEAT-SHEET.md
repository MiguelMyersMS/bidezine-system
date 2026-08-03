# Two-Laptop Cheat Sheet (plain English)

**Who this is for:** anyone working on this project from either laptop — no git expertise needed.
**The whole idea in one sentence:** GitHub is the shared copy in the cloud; each laptop has its own copy,
so we **grab the latest before we start** and **send our work back when we finish**. That's it.

---

## The picture (read this once)

Think of **GitHub** as a filing cabinet in the cloud that holds the *real, official* project.
Each **laptop** is a desk with its *own photocopy* of those files.

- **"Pull"** = go to the cabinet and grab the newest copies before you start (so you're not working on
  yesterday's version).
- **"Push"** = put your finished pages back in the cabinet so the other person can get them.
- **"master"** = the official main copy everyone shares.
- **"branch"** = your own labeled working folder — so you can make changes without scribbling on the shared
  master copy while someone else is using it.

### 👉 Three habits prevent almost every problem:
> # 📥 PULL when you sit down.
> # 🔄 PUSH at natural stopping points — don't wait for end of day.
> # 📤 PUSH when you get up.

If you remember only those three, you'll be fine. The middle one is the one people forget: if you finish a
task at 2pm and don't push until 6pm, the other laptop can't see your 2pm work for four hours. Push often,
in small pieces, any time you finish something — not just once at the end.

**You don't have to remember all of this by yourself.** This project has three automatic safety nets, one
per habit above: when a Claude Code session starts here, it checks GitHub for you automatically; **while
you're working, it nudges you roughly every 45 minutes** to checkpoint (this is the one that covers "in the
middle of the day," not just the start/end); and when a session ends, it'll speak up if you left anything
uncommitted or unpushed. All three are reminders, not autopilot — you (or your AI assistant, if you ask it
to) still have to actually run the commit/push.

---

## Which laptop are you on?

| | **Laptop A — the home laptop** (Miguel's main one) | **Laptop B — the helper's laptop** |
|---|---|---|
| Works on… | stays on **master** | its **own branch**, never master |
| Its job | keep the official copy; merge the helper's work in | do a task, then hand it back for review |

> Both laptops are signed into the **same GitHub account**, so the computer *can't tell you apart*.
> The **branch** is how we keep the two people's work from colliding.

---

## ▶️ When you SIT DOWN to work (both laptops)

Open the terminal (**Git Bash**) inside the project folder and run:
```bash
git fetch --all --prune      # check the cabinet for anything new
git pull --ff-only           # grab the latest onto your copy
git status                   # should say "working tree clean"
```
- ✅ If you see **"Already up to date"** / **"working tree clean"** → you're good to start.
- 🛑 If `git pull --ff-only` prints an error saying **"diverged"** → **STOP. Don't type anything else. Ask
  Miguel (or Claude) first.** It just means both laptops changed the same thing — it's fixable, but not by
  guessing.

---

## ✍️ While you WORK

**Laptop A (home):** just work normally — you're on master.

**Laptop B (helper):** make your own branch **once**, at the start of a task:
```bash
git checkout -b feat/short-name    # example: feat/fix-select-colors
```
Then work normally. Save your progress often (small and frequent beats one giant save):
```bash
git add -A
git commit -m "a few words about what you did"
```

---

## ⏹️ When you're DONE (or stepping away) — both laptops

**Always send your work to the cabinet before you leave the laptop:**
```bash
git add -A
git commit -m "what you did"
git push
git status                   # should say "up to date with origin"
```
📤 **This is the single most important habit.** If you don't push, the other laptop can't see your work —
and you risk both laptops changing the same file and clashing later.

**Laptop B only — hand your work to Miguel:** after `git push`, open the repo on **GitHub.com** and click the
green **"Compare & pull request"** button. That asks Miguel to review your work and add it to master.

---

## 🚦 The five safety rules

1. **Pull when you sit down, push when you get up.** (The big two.)
2. **Laptop B never works on master** — always your own branch.
3. **Never leave work on only one laptop.** If it isn't *pushed* to GitHub, the other laptop doesn't have it.
   (A "stash" does **not** count — it stays stuck on that one machine.)
4. **Never use `--force`** when pushing. If a normal `git push` is refused, stop and ask.
5. **If any message looks scary or confusing, STOP and ask** before typing more. Nothing breaks by *reading*
   a message — only by guessing at fixes.

---

## 🆘 Quick reference (screenshot this)

| I want to… | Type this |
|---|---|
| Start working (both laptops) | `git fetch --all --prune` → `git pull --ff-only` → `git status` |
| Start a new task (Laptop B) | `git checkout -b feat/my-task` |
| Save progress | `git add -A` → `git commit -m "..."` |
| Finish / step away (both) | `git add -A` → `git commit -m "..."` → `git push` |
| Hand work to Miguel (Laptop B) | push, then click **"Compare & pull request"** on GitHub.com |
| Something looks wrong | **STOP** — don't `--force`, don't guess — ask Miguel or Claude |

---

## ⚠️ Note: not every folder is on GitHub

Only some of the projects on these laptops are backed up to GitHub. **`bloodwork-dashboard` and
`data-model-system` are NOT on GitHub yet**, so this pull/push routine does **not** work for them — do not
edit those two on both laptops until Miguel gives them a GitHub home. (Full list: the repo table in
`docs/process/TWO-LAPTOP-WORKFLOW.md`.)

---

*Want the detailed/technical version (branch naming, how to recover from a clash, repo-by-repo sync status)?
See `docs/process/TWO-LAPTOP-WORKFLOW.md`.*
