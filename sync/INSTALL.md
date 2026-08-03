# Sync Protocol — Installation & Replication Kit

This kit lets any project run a self-driving Implementor↔Governor cycle using the same orchestration shape as `@miguel/design-system` and `data-model-system`.

## What's in the kit

The portable unit is the `sync/` folder:

```
sync/
├── README.md             # front door + how to use
├── PROTOCOL.md           # protocol definition + decision tree
├── ROLES.md              # Implementor and Governor playbooks
├── STOP_CONDITIONS.md    # when AI returns control to user
├── INSTALL.md            # this file
├── HANDOFF.md            # current cycle handoff (project-specific live state)
└── REVIEW.md             # current cycle review (project-specific live state)
```

The auto-driving capability requires one additional piece:

- A `/sync-step` skill installed at the user-global level (`~/.claude/skills/sync-step/SKILL.md`), or at the project level (`.claude/skills/sync-step/SKILL.md`).

The user-global install means: install the skill once, replicate the `sync/` folder to many projects.

## Installation (new project)

### Prerequisites

- Claude Code installed.
- `/sync-step` skill installed globally (one-time; see "Installing the skill" below).

### Steps

1. Copy `sync/README.md`, `sync/PROTOCOL.md`, `sync/ROLES.md`, `sync/STOP_CONDITIONS.md`, `sync/INSTALL.md` into the new project's `sync/` folder.
2. Create empty `sync/HANDOFF.md` and `sync/REVIEW.md` (they will be populated by Cycle 1), OR if you're migrating an existing protocol leave the existing HANDOFF/REVIEW in place.
3. Project-specific decisions to make:
   - **Canonical rule source**: pick one (`AGENTS.md`, `CLAUDE.md`, a `standards/` folder, etc.). Update `ROLES.md` references.
   - **Stop conditions**: review `STOP_CONDITIONS.md` and tune the permissive/conservative/aggressive choice for this project's risk tolerance. The default for code-editing projects (design-system) stops on dependency / canonical-rule edits. For governance-only projects (data-model-system) the default also includes "any file edit outside sync/".
   - **Work-type tags / cycle log**: optional. Add if you want KPI tracking; skip if cycles are about feature delivery instead.
4. Initialize Cycle 1 (if fresh): write `sync/HANDOFF.md` with the initial plan. Status `READY_FOR_REVIEW`.
5. Start the loop: `/loop /sync-step` (or `/sync-step` for one step at a time).

### Migrating an in-progress project (this project's pattern)

If the project already had a sync protocol (e.g., manual switch prompts) and you want to add orchestration without disrupting cycle history:

1. Copy README, PROTOCOL, ROLES, STOP_CONDITIONS, INSTALL into `sync/`.
2. **Do NOT touch HANDOFF.md or REVIEW.md.**
3. Update `PROTOCOL.md` to add Orchestrated mode as the default Mode Selector option; keep Sync-file (manual) as a fallback. Existing switch prompts remain valid for manual mode.
4. Reload Claude Code so the user-global `/sync-step` skill picks up the new sync files.
5. Run `/loop /sync-step` — the decision tree reads the existing HANDOFF/REVIEW state and resumes from the last APPROVED cycle.

### Project-specific replacements

For this project, these references are domain-specific (replace if you're forking elsewhere):

| Reference | Design-system | Replace with |
|---|---|---|
| Canonical rule source | `AGENTS.md` | Whatever holds your team's standards |
| Governor playbook checklist | `.github/prompts/governor.prompt.md` reflected in `ROLES.md` | Your own checklist |
| Validation surfaces | Storybook, foundation stories, docs app build | Your equivalents |
| STOP_CONDITIONS dependency check | `package.json` / `package-lock.json` | Your dependency manifests (`pyproject.toml`, `Cargo.toml`, etc.) |

The role playbooks in `ROLES.md` are protocol-shape, not project-content, but the AGENTS.md compliance checklist inside them IS project-specific. Edit if your conventions differ.

## Installing the skill

The `/sync-step` skill lives at `~/.claude/skills/sync-step/SKILL.md` (user-global) or `.claude/skills/sync-step/SKILL.md` (project-local).

Skill content is the same across all projects — it reads each project's `sync/PROTOCOL.md`, `sync/ROLES.md`, and `sync/STOP_CONDITIONS.md` to drive the project-specific behavior. Install once globally, use everywhere.

To verify install: type `/sync-step` in any Claude Code session inside a project that has a `sync/` folder. The skill reads `sync/HANDOFF.md` and `sync/REVIEW.md`, decides the role, and executes one step.

If the skill isn't installed, the user cannot invoke `/sync-step` and the auto-loop will not work. Falling back to manual switch prompts in `PROTOCOL.md` still works.

## How the loop behaves

- **Steady state**: routine implementation cycles run end-to-end without user prompts. The AI takes Implementor turn, Governor turn, Implementor turn, ... until a STOP condition fires.
- **Dependency changes**: always pause for user authorization. Per `STOP_CONDITIONS.md` condition 1.
- **AGENTS.md / sync edits**: always pause. The canonical rules and the protocol itself are user-driven changes.
- **Blocker / High findings**: pause. The Implementor doesn't auto-attempt a fix without direction.
- **Medium / Low findings**: continue. Governor lists for awareness; Implementor addresses or batches per cadence directive.

## Forking the protocol

If your project diverges (different role names, different cadence directive, different stop conditions), edit `sync/ROLES.md` and `sync/STOP_CONDITIONS.md` in your project's copy. The skill reads these files each step; no skill code change is needed unless the role decision tree itself changes (which lives in `PROTOCOL.md`).

## Reference implementations

- **`data-model-system`** — governance / KPI-tracking project. Uses a cycle log (`methods/kpi2-cycle-log.md`) and recalibration cycles. STOP_CONDITIONS includes "any edit outside sync/" because all real work is documentation/governance.
- **`@miguel/design-system`** — feature-development project (this one). No cycle log. STOP_CONDITIONS focuses on dependency / canonical-rule / protocol edits. Code editing is the work, not a stop trigger.

Use whichever matches your project shape as a starting point.
