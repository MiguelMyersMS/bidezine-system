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

## Factory-line interface requirements — live, in `limbo-factory/` (port 4199)

- A dedicated local dev environment, on its own port, distinct from the main showcase (`4188`) and the
  icon-comparison reference tool (`5590`).
- Left-side panel listing the transformation **Phases and Sub-phases** (Intake → divergence list → human
  decisions → Build → Escalation-check → Audit → final human review → promotion) as a checkable progress
  list, so it's visually obvious what stage a component is at and what's been resolved.
- Must be built **only from real `@bidezine/system` components** — same "real components only" rule that
  governs the main site's chrome.
- Must be a **generic, reusable shell** — built once, reused for every future Limbo component, not
  hardcoded to Rail Sidebar specifically.
- **Whole-app light/dark toggle** (`ThemeToggle.tsx`) so color/elevation divergences can be evaluated in
  both modes, not just one.
- **Graphical before/after comparisons for every visual divergence category** (`CompareVisuals.tsx`):
  icons render as real inline SVG side-by-side; colors as swatches (hardcoded hex for "before", live
  `var(--token)` for "after" so they track the real theme toggle); typography as rendered text samples;
  layout/sizing and border-radius as small proportioned shapes; motion as a replayable CSS animation with
  duration/easing labeled; elevation as a shape+shadow pair that responds to theme; z-index as a rendered
  stacking example. Spacing (category E) is intentionally exempt — it doesn't need a visual aid. Every
  value shown is sourced from the real origin project or real bidezine tokens, never invented.
- **Status badges are visually distinct by severity**: "Needs human decision" = solid/high-contrast
  (`bg-foreground text-background`); "Worth noting" = grey (`bg-muted text-muted-foreground`); "Clean
  equivalent" = the existing secondary look, unchanged.
- **Color Token Lab tab**: proposed-but-unapproved token values get their own approval surface before
  anything is written to `tokens/*.tokens.json` — draft swatches only, explicitly labeled as pending.
- **Logo-import slot**: enforces the standing Q3 rule (AI never invents a logo — always asks for an image
  link; empty if none given) as a real UI element, not just a written rule.
- **Notable risks carry a concrete action-item checklist** (`isRiskResolved()`), each item cross-referenced
  to the blocking question or divergence row that resolves it. A risk's status is *computed*, not stored —
  red while any item is undone, green once every item is done.

## Source intake record (Rail Sidebar)

- **Origin:** `RailNav` component in `C:\Users\miguelmyers\Workspaces\systems\design-system` — comes with
  search, an icon-hosted rail-overflow behavior, an overflow menu, and a side/panel menu. Multiple
  sub-components/experiences, not a single simple component.
- **Self-contained copy** (read-only reference, mirrors the `reference/shadcn-ui/` pattern): copied 41
  files (~2.1MB — component source, stories, behavior contract, spec, 5 audits, 1 ADR, consumer-governance
  clarification, 2 QA reports, a consumer-build prompt, a panel-unification ledger, and evidence
  screenshots) into `limbo/rail-sidebar/reference/` inside this repo, preserving the origin project's
  relative folder structure for traceability. Nothing here is wired into `src/ui/`, `site/`, or any build
  step — it exists purely for the Intake agent to read. **Known gap (see flaws log): `ExpandButton.tsx`
  was missing from this copy** and had to be read directly from the origin for the Q4 investigation.
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

- **Documentation-vs-code drift caught by the human, not the AI (Q4):** the Intake agent's original
  investigation into the panel-collapse icon trusted a QA doc (`docs/qa/railnav-visual-qa.md`) claiming
  `IconChevronDoubleLeft` was implemented and "visually approved." The user flagged this as wrong from
  memory and attached screenshots. Re-investigation found the actual live component
  (`ExpandButton.tsx`, which the self-contained reference copy was missing entirely) imports
  `IconPanelLeftContract` — the docs were stale relative to the real, currently-shipping source file.
  **Lesson for the protocol:** the Intake/Dissection agent must verify claims against the actual current
  source file, never against accompanying docs/QA notes alone — docs can lag behind real implementation,
  and a stale doc that "sounds authoritative" is exactly the kind of trap this protocol exists to catch.
  Also surfaced a secondary gap: the self-contained reference copy (`limbo/rail-sidebar/reference/`) was
  missing a component the intake report depended on (`ExpandButton.tsx`) — the copy-in step needs a
  completeness check against every import the source docs/behavior descriptions reference, not just the
  files that seemed obviously relevant at copy time.

- **"No auto-deciding" extended to visual mockups, not just decisions:** when building the factory line's
  before/after visual comparisons, one value (`statusRedText`) was initially guessed from a common Radix
  scale value without checking source, then caught and corrected against the real `tokens.ts` before
  being shown to the user. Lesson: the same anti-fabrication discipline applied to written divergence
  rows must also apply to anything rendered as a visual aid — a plausible-looking but unverified swatch
  is just as much an auto-decision as an unverified prose claim.

- **A resolved decision still needs its own status tier, not a reuse of "clean":** once Q1/Q3/Q4 were
  answered, the divergence rows that cascade from them (A-3, A-7, A-8, A-9) kept displaying "Needs human
  decision" / "Worth noting" badges even though nothing was actually still open — the badge reflected the
  row's *history*, not its *current* state. Reusing the "clean" tag for these would have been equally
  wrong in the other direction (it erases the fact that a real decision happened). **Lesson:** a factory
  line needs a fourth tier distinct from clean/decision/note — "resolved" (decided via a cascade, not
  because it never diverged) — or badges silently go stale every time a blocking question closes, and the
  reviewer has to re-verify rows that are actually already settled.

- **An `<img src="data:...">` does not track `currentColor`, even when the underlying SVG uses
  `fill="currentColor"`:** the logo preview was built with an `<img>` tag wrapping a data-URI, which
  visually looked identical to an inline SVG at rest but silently failed the one property that mattered
  (switching color with the theme). **Lesson:** "render as SVG so the color switches" is a requirement
  about the DOM mechanism, not just the file format — an SVG *file* embedded via `<img>`/`background:
  url(...)` is opaque to CSS `currentColor`/`fill`, only an inline `<svg>` element in the document
  responds. The Independent Audit agent should treat "does it respond to the theme toggle" as a literal,
  checked behavior — not inferred from "it's an SVG."

- **Sizing/rendering questions need the actual sourcing rule stated, not re-derived per row:** two
  separate divergence rows (A-2, A-6) both surfaced the same underlying question — "is a 16px-in-a-20px-
  slot render a real icon divergence, or just a display-size choice?" — and both were left open pending an
  answer the codebase already had (100% of `icons/manifest.json` sources from Fluent's `_20_regular` grid;
  on-screen size is a separate, per-component Tailwind concern). **Lesson:** once a standing sourcing rule
  is confirmed for one row, the Intake/Escalation agents should proactively check every other row flagged
  with a similar-shaped concern and resolve them together, rather than making the human re-ask the same
  underlying question row by row.

- **Tab/section ordering is itself a divergence-resolution dependency, not just a UI nicety:** category B
  (and part of C) genuinely cannot be evaluated without the Color Token Lab's proposed swatches, but the
  lab tab was placed after the divergence list in the initial build. **Lesson:** when one tab/section is a
  hard prerequisite for reading another, the factory-line shell should order them by dependency, not by
  the order they happened to be built in — this is a recurring risk for the *next* Limbo occupant's
  factory line too, not a one-off fix specific to Rail Sidebar.

## Exit condition

Once Rail Sidebar is promoted into `src/ui/` and registered in the real showcase, and the human has given
final sign-off: fold any durable process refinements into `CLAUDE.md`, then delete this file.
