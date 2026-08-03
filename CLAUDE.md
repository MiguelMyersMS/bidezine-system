# @bidezine/system — AI Context (v2, shadcn foundation)

## START HERE (every session, before any work)

🖥️🖥️🖥️ **THREE-MACHINE MODE.** This project is worked from up to three computers under the same GitHub
identity: **Laptop A** (Miguel), **Laptop B** (Blair — a helper), and a **PC** (third person, when enabled).
`origin` on GitHub is the ONLY source of truth — unpushed or stashed work does NOT travel between machines.

> ### 📥 PULL when you sit down · 📤 PUSH when you get up · 🔄 CHECKPOINT while you work
> - **Start of session:** `git fetch --all --prune` → `git pull --ff-only` → confirm a clean `git status`.
>   *(Automated by the `SessionStart` hook in `.claude/settings.json`.)*
> - **During the session:** commit + push at every natural stopping point (finished a component, fixed a
>   bug, about to switch tasks) — small and often. *(A `breakReminder` nudge fires ~every 45 min.)*
> - **End of session / stepping away:** `git add -A` → `git commit -m "…"` → `git push`.
>   *(The `Stop` hook reminds you if you forgot.)*
> - **BRANCH MODEL (decided for this repo):** all three machines work on **`main` directly** — there is no
>   legacy to protect in this fresh repo. Pull in the morning, push at night, and **work room-by-room**
>   (different components = different files) so you rarely touch the same file at once. This differs from
>   the legacy `design-system` repo (where Laptop A owned `master` and others used PR branches).

**Daily discipline (the 5 habits — read `docs/process/TEAM-SYNC-DISCIPLINE.md`, the canonical guide):**
(1) PULL before you touch a new area · (2) work ROOM-BY-ROOM, one person per file · (3) commit + PUSH small
and often · (4) CLAIM your area before you start · (5) PULL again right before you push. **`fetch` only
checks for updates (changes nothing); `pull` applies them.** To SEE when someone else pushed, enable VS Code
**`git.autofetch`** once per machine (Settings → search `git.autofetch` → `true`) — the status-bar ↓/↑ then
shows incoming/outgoing commits. These habits are surfaced automatically at session start, ~every 45 min,
and at session end via `.claude/settings.json`.

Full sync rules: `docs/process/TEAM-SYNC-DISCIPLINE.md` (canonical) · legacy detail:
`docs/process/TWO-LAPTOP-WORKFLOW.md` (read "three machines / shared main" as the current model) ·
Figma per-machine: `docs/process/FIGMA-SETUP-PER-LAPTOP.md`.

⭐ **Founding decision & method:** read `docs/decisions/ADR-006-shadcn-foundation.md` and
`docs/process/SHADCN-V2-FOUNDATION-HANDOFF.md` IN FULL before any work — they define this system.
The operating method is `docs/process/PRIMITIVES-FIRST-METHOD.md` (top-down/demand-driven; borrow proven
primitives — Radix first — own the look via tokens). The execution contract is
`docs/process/SPEC_KERNEL_COMPACT.md`; for medium/large tasks use `TASK_BRIEF_TEMPLATE.md` then
`VERIFIER_CHECKLIST.md`. Run **`/session-start`** first.

## What This Is

`bidezine-system` is the **v2 design system** — a fresh start built on the **shadcn/ui foundation**
(Radix behaviour + Tailwind/CVA styling + CSS-variable theming), **re-skinned to our own tokens** and
shipped through our own pipeline. It supersedes the legacy `@miguel/design-system` (~4% built), which is
frozen as **legacy / harvest reference**.

- **Owner:** Miguel Myers (miguel@bidezine.com).
- **Legacy/reference sibling:** `../design-system` — a sibling folder on every machine. We READ it (specs,
  registry, patterns, Figma files) for reference and harvest. **We never edit `../design-system` from here.**
  Miguel already built ~90 components there (69 atoms · 36 molecules · 19 organisms). The three-way compare
  (old DS ↔ shadcn ↔ v2) + what to harvest vs what's net-new is mapped in `docs/reference/REFERENCE-MAP.md`.
- **Vendored reference:** `reference/shadcn-ui/` — the entire shadcn repo (MIT), read-only study material.
  Never imported or edited; it is a reference, not part of our source. See `THIRD-PARTY-LICENSES.md`.

## The v2 foundation — four axes (see ADR-006)

| Axis | Choice | Note |
|------|--------|------|
| **Behaviour** | **Radix** (borrowed) | Focus traps, keyboard nav, ARIA — borrow, never re-solve. |
| **Styling** | **Tailwind + CVA** | Real CSS states/media queries/keyframes. Replaces legacy inline `CSSProperties`. |
| **Theming** | **CSS variables**, authored from one typed **DTCG** token source | Instant theme switch, zero React re-render. |
| **Distribution** | **package** (install & import) | Copy-in stays a LATER, optional decision. |

⚠️ **This foundation REQUIRES a build step** — the opposite of legacy Rule #1. Tailwind + CSS variables
cannot exist without one. We compile source → `dist/` (JS + `.d.ts` + CSS); consumers import built output.

## The one rule (guardrail against mold contamination)

**Borrow behaviour, never styling.** Take shadcn's Radix behaviour; do NOT paste its Tailwind/CVA look.
Everything we take is **re-cast in OUR tokens** and shipped through OUR pipeline. A helper pasting shadcn
styling straight into the source silently fractures the system.

## Dual source of truth

**Figma owns the look** (tokens, layout, variants, states-as-visuals). **Code owns the behaviour** (Radix).
**Code Connect binds** a Figma component to its real code component. GR4's "design-driven" rule is scoped
to the visual layer; behaviour is code + Code-Connect-bound, never redrawn.

## The pipeline & golden path

Copy → **extract** (tokens→DTCG, CVA→variant matrices, registry→atomic graph) → author Figma from one
token source → **Code Connect bind** → re-skin through the evidence/deploy waves. Prove the whole pipeline
on ONE slice first: the **modal-form** (Dialog + Field/Input/Label + Button — walks atoms, molecule,
organism, Radix behaviour, nested Code Connect). Combobox is slice #2. Outliers (Chart, Data Table,
Calendar/Date Picker, Carousel, Sidebar) get their own mini-slices. Full detail: the handoff doc.

## Attribution (MIT)

shadcn/ui and Radix are MIT-licensed. Keep `THIRD-PARTY-LICENSES.md` and the vendored `LICENSE.md`. We may
license our own system as we choose (even proprietary) and keep it closed — the third-party notice stays for
their portions. Ownership deepens as we rewrite internals room-by-room.

## Tooling notes

- **Claude Code** reads this file + `.claude/` (skills, agents, settings). MCP servers (Figma, Google Drive)
  are configured at the account/IDE level and carry over. `.mcp.json` registers the Figma dev MCP.
- **Copilot/Codex** read `AGENTS.md` + `.github/copilot-instructions.md` (both carry a v2 banner pointing here).
- **Secrets** (`.env`, `.env.copilot`) never travel through git. The *values* are shared across all our
  repos, so on each machine just place a copy of the existing `../design-system/.env` (and `.env.copilot`)
  into this folder — you're not authoring new secrets, just giving this project its own local copy.
- ⚠️ **Do NOT install the git hooks yet.** `.githooks/pre-commit` and `pre-push` were copied from the legacy
  repo and run legacy audits against the old source — installing them (`git config core.hooksPath .githooks`
  or the old `hooks:install`) would **fail and block your commits/pushes** until they're adapted to the v2
  build. They are inert unless installed; leave them until v2's build + audits exist.

## What was copied / adapted / skipped from `design-system`

See `docs/SETUP-MANIFEST.md` for the transparent record (curated skills, pruned CI/instance data, secrets
excluded). Skills tied to the legacy architecture (`token-audit`, `icon-audit`, `registry-refresh`, `smell`)
are present but **get adapted as we reach them** — don't assume they match the v2 foundation verbatim yet.
