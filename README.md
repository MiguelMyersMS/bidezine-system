# bidezine-system

The **v2 design system** — a fresh start built on the **shadcn/ui foundation** (Radix behaviour +
Tailwind/CVA styling + CSS-variable theming), re-skinned to our own tokens and shipped through our own
pipeline. It supersedes the legacy `@miguel/design-system` (~4% built), which is now frozen as
legacy/harvest reference.

## Read these first

- `docs/decisions/ADR-006-shadcn-foundation.md` — the founding decision.
- `docs/process/SHADCN-V2-FOUNDATION-HANDOFF.md` — the full plan + step-by-step.
- `CLAUDE.md` — AI operating context for this repo.
- `docs/SETUP-MANIFEST.md` — what was copied/adapted/skipped from the legacy repo, and why.

## Repository layout

| Path | What |
|------|------|
| `reference/shadcn-ui/` | The entire shadcn source, vendored read-only for study/extraction (MIT — see `THIRD-PARTY-LICENSES.md`). Never imported, never edited. |
| `docs/` | Method, decisions, governance, process (curated from the legacy repo). |
| `.claude/` | Skills, agents, settings/hooks for Claude Code. |
| `.github/` | Copilot instructions + prompt mirrors of the skills. |
| `../design-system` | **Sibling** legacy repo — read for reference/harvest, never edited from here. |

## Machine setup (three-machine mode)

Clone this repo as a **sibling of `design-system`** on each machine:

- **Laptop A (Miguel):** in the same parent folder as his `design-system`.
- **Laptop B (Blair):** `C:\Users\miguelmyers\GitHub\bidezine-system`.
- **PC (third person):** alongside `design-system`, when enabled.

**Per machine — one-time secret setup** (the values are shared across our repos, so you're *copying*, not
authoring). From inside the `bidezine-system` folder:
```
cp ../design-system/.env .env
cp ../design-system/.env.copilot .env.copilot
```
`.env` / `.env.copilot` are gitignored, so they never travel through git — each machine keeps its own local
copy. The SessionStart hook warns you if they're missing. (Laptop B was set up during scaffolding.)

All three machines then work on **`main`** directly: pull in the morning, push at night, work room-by-room.
See `docs/process/TEAM-SYNC-DISCIPLINE.md`.

## Daily rhythm

`git fetch --all --prune` → `git pull --ff-only` → work → commit + push at each stopping point.
`origin` is the only source of truth; unpushed work does not travel between machines.
