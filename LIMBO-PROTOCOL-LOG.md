# Limbo Transformation Protocol — Working Log

> **TEMPORARY FILE.** Created for the first Limbo transformation (Rail Sidebar) to design and stress-test
> the protocol below in real conditions. Once Rail Sidebar successfully ships into the bidezine system and
> receives final human sign-off, fold any durable refinements into `CLAUDE.md`'s standing rules and
> **delete this file**. Do not treat this as permanent documentation.

## What "Limbo" is

A holding/quarantine area for components sourced from a *different* design system (not shadcn/ui) that
the user wants to bring into `@bidezine/system`. A Limbo component:

- is **never** part of the public showcase nav (`site/src/nav-manifest.ts`) while it's in Limbo,
- is **never** shipped from `src/ui/` while it's in Limbo,
- exists purely as raw source + an active dissection/transformation record,
- only graduates to a real `src/ui/` component after the full gate sequence below, ending in the human's
  final review.

**First occupant: "Rail Sidebar"** — a sidebar the user already built in another project, on a different
design system, to be used as a *structural/behavioral* template only (not as the final visual target —
the whole point of the transformation is to re-express it fully in bidezine's own tokens, icons, and
components).

## The core rule this protocol exists to enforce

**No single agent may both perform a transformation step and approve it.** Every gate must be a distinct
agent instance with a narrow, independent scope, specifically so an AI cannot loosely, quietly, or
"trickily" get sloppy work waved through by grading its own homework. The human's final review is always
required regardless of what any AI gate concludes — AI gates reduce the human's workload, they never
replace the human's authority.

## Agent roster (segregation of duties)

| # | Role | Scope | Must NOT |
|---|---|---|---|
| 1 | **Intake / Dissection agent** | Reads the Rail Sidebar source *and* its documentation file. Produces a full, itemized divergence list: every icon, block, layout choice, animation, effect, gap/padding/spacing value, color, font, or any other element that does not have a clean, obvious 1:1 bidezine equivalent. | Never resolves a divergence itself. Never silently assumes a "close enough" match is acceptable. |
| 2 | **Transformation / Build agent** | Performs the actual port into bidezine idioms — real bidezine tokens (color/font/spacing), Fluent icons per the CLAUDE.md iconography protocol, real bidezine sub-components wherever the sidebar composes other UI (buttons, separators, badges, etc.) — but only executes decisions the human has already made on every flagged divergence. | Never invents a resolution to an unresolved divergence. Never touches an item still awaiting a human decision. |
| 3 | **Escalation / Divergence-check agent** | Independent from the Build agent. Cross-checks the Build agent's output against the Intake agent's original divergence list — confirms every single flagged item was actually resolved by a recorded human decision, not quietly auto-resolved during Build. | Never itself decides a divergence — it only checks whether the *human* decided it. |
| 4 | **Independent Audit agent** | Independent from Build. Runs a full compliance pass: color tokens, font tokens, spacing tokens all sourced from `tokens/*.tokens.json` (no hand-written CSS values), every constituent sub-component is a real `@bidezine/system` component, every icon is a real Fluent slug from `icons/manifest.json`, zero leftover foreign classes/tokens/icons anywhere in the ported code. | Never rubber-stamps based on the Build agent's own self-report — must independently re-inspect the code. |
| 5 | **Human (final review)** | Reviews everything — including the Escalation and Audit agents' findings — and gives (or withholds) final approval to promote the component out of Limbo. | N/A — this is the terminal, non-delegable gate. |

Recommended mapping to available sub-agent types in this environment: Intake → `research`/`general-purpose`
(read-only-ish, structured output); Build → `general-purpose`; Escalation-check → `code-review` (its
read-only, independent-reviewer framing fits naturally); Audit → a second, separately-invoked `code-review`
or `security-review`-style pass focused on the token/icon/component compliance checklist rather than
security. Each must be a **separate agent invocation** — never the same conversation/context reused across
roles.

## Divergence-handling rule (mandatory, no exceptions)

Whenever the Intake agent finds an element in the source that isn't cleanly pairable to an existing
bidezine equivalent — icons, gaps, paddings, blocks, layouts, animations, effects, colors, fonts, anything —
it must be listed **individually**, never batched into a vague summary, and never auto-resolved. The human
decides each one. This is the same spirit as the Fluent iconography protocol's "when no confident match
exists, stop and ask" rule, just generalized to every visual/behavioral aspect of a ported component, not
only icons.

## Factory-line interface requirements (design target, not yet built)

- A dedicated local dev environment, on its own port, distinct from the main showcase (`4188`) and the
  icon-comparison reference tool (`5590`).
- Left-side panel listing the transformation **Phases and Sub-phases** (Intake → divergence list → human
  decisions → Build → Escalation-check → Audit → final human review → promotion) as a checkable progress
  list, so it's visually obvious what stage a component is at and what's been resolved.
- Must be built **only from real `@bidezine/system` components** — same "real components only" rule that
  governs the main site's chrome.
- Must be a **generic, reusable shell** — built once, reused for every future Limbo component, not
  hardcoded to Rail Sidebar specifically.

## Source intake record (Rail Sidebar)

- **Origin:** `RailNav` component in `C:\Users\miguelmyers\Workspaces\systems\design-system` — comes with
  search, an icon-hosted rail-overflow behavior, an overflow menu, and a side/panel menu. Multiple
  sub-components/experiences, not a single simple component.
- **Self-contained copy** (read-only reference, mirrors the `reference/shadcn-ui/` pattern): copied 41
  files (~2.1MB — component source, stories, behavior contract, spec, 5 audits, 1 ADR, consumer-governance
  clarification, 2 QA reports, a consumer-build prompt, a panel-unification ledger, and evidence
  screenshots) into `limbo/rail-sidebar/reference/` inside this repo, preserving the origin project's
  relative folder structure for traceability. Nothing here is wired into `src/ui/`, `site/`, or any build
  step — it exists purely for the Intake agent to read.
- **Intake/Dissection agent dispatched** to read the full reference set + our own current CLAUDE.md,
  icons manifest, tokens, and existing `src/ui/` primitives (including our already-ported shadcn `Sidebar`
  primitive, in case of behavioral overlap), and produce the itemized divergence list per the rule below.

## Flaws / weaknesses log

_(Fill in as Rail Sidebar runs through this protocol for the first time — this is the whole reason this
file exists. Capture anything that didn't work as intended: a gate that was too easy to route around, a
divergence that slipped through undetected, an agent role that needed splitting further, interface
friction, anything.)_

- **Sequencing flaw caught early:** the original todo graph made Intake/Dissection depend on the
  factory-line UI being built first. That's backwards — analysis doesn't need a visualization tool to
  exist, and blocking on it would have stalled real work behind a UI-building side quest. Decoupled:
  dissection can start as soon as the source is gathered; the factory-line UI is built in parallel and
  simply *displays* phase progress after the fact, it never gates the underlying work.

## Exit condition

Once Rail Sidebar is promoted into `src/ui/` and registered in the real showcase, and the human has given
final sign-off: fold any durable process refinements into `CLAUDE.md`, then delete this file.
