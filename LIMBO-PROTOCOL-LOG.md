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

- **Isolated swatches are not sufficient evidence for color sign-off, even after the human explicitly
  approves them:** the human tentatively approved all 9 candidate tokens from the swatch-only view, but
  immediately qualified it — full sign-off requires seeing them composed together in an actual rail shape
  (background + border + hover/active/pressed + on-color text all adjacent at once). A swatch grid cannot
  surface real problems like a candidate `--sidebar-rail-surface` being nearly indistinguishable from the
  app's own `--background` in dark mode — that only became visible once RailPreview was built and toggled
  to dark. **Lesson:** for any token family gating a *composed* UI element (not a single flat surface), the
  Human Decisions phase should default to building a lightweight, real-DOM composed preview (interactive
  hover/press, not simulated) alongside the swatch lab from the start, rather than treating swatch approval
  as sufficient and adding the composed view only after being asked. Approval status should also have an
  explicit "tentative, pending composed preview" tier distinct from a final "resolved" — don't let a
  provisional yes get recorded or read back as a final one.

- **"Resolved" note text needs to be rewritten at each approval-tier change, not just the badge:** the Q2
  resolution note and the per-row footer copy in Color Token Lab both said "pending your approval" even
  after the human tentatively approved everything — the badge/tier changed but the prose describing it
  didn't, which is its own source of the same staleness problem noted above for status badges. **Lesson:**
  every place a resolution status is surfaced (badge AND explanatory prose AND blocking-question note)
  needs to be treated as one unit that changes together, not three independent copies that can drift.

- **"Real components only" applies to the factory-line UI itself, and can be silently violated even while
  following it everywhere else — and one instance found is not evidence the rest of the codebase is clean:**
  the "Tentatively approved" pill in the Color Token Lab banner was built as a hand-rolled
  `<span className="rounded-full bg-secondary px-2 py-0.5 ...">` instead of importing the real `Badge` from
  `@bidezine/system` — even though `Badge` was already imported and used correctly elsewhere on the very same
  page (`PhaseRail`'s "Done"/"Pending" pills). The hand-rolled version was missing
  `inline-flex items-center justify-center` (among other things), which made the text render visibly
  uncentered with no real vertical padding — invisible in code review, obvious the moment the human looked
  at a screenshot. Fixing that one instance and moving on was **not sufficient** — when the human asked for
  a full re-inspection of the factory line, three more hand-rolled violations turned up that had gone
  unnoticed because they didn't visibly break like the Badge did (they merely *duplicated* a real
  component's styling instead of importing it, which looks fine at a glance but is still the same rule
  violation and still carries the same drift risk):
  - `PhaseRail.tsx`'s phase-nav item was a raw `<button>` manually re-implementing the exact
    active/hover/focus idiom that `SidebarMenuButton` already encodes (`data-active` → `bg-accent
    text-accent-foreground`). `SidebarMenuButton` itself couldn't be dropped in directly (it requires a
    `SidebarProvider` context via `useSidebar()`, which would mean adopting the whole Sidebar
    provider/mobile/collapse machinery just for a simple phase list) — resolved instead by rebuilding it on
    the real `Button` component (`variant="ghost"`, active state via className override) so at minimum the
    interactive base (focus-visible ring, disabled handling, transition) comes from the real primitive.
  - `CompareVisuals.tsx`'s `MotionCompare`'s "Replay" control was a raw `<button className="rounded-md
    border px-2 py-1 ...">` instead of `Button` (`variant="outline" size="xs"`).
  - `DivergenceView.tsx`'s `RisksList` action-item indicator was a hand-rolled `<span>` with conditional
    border/background classes plus a manually-placed `CheckIcon`, reimplementing what the real `Checkbox`
    component already does — replaced with `<Checkbox checked={item.done} disabled />`.
  **Lesson:** "must be built only from real components" is not self-enforcing just because it's followed in
  most places, and a single caught violation doesn't mean the rest of the file (or the rest of the app) is
  clean — every individual interactive/styled element needs its own conscious check of "does a real
  component already exist for this," and finding one violation should trigger a full sweep of the same
  codebase for the same pattern, not just a fix-and-move-on. A rendered screenshot comparison against a
  known-correct instance of the same component elsewhere on the page catches the *visually broken* cases
  (like the Badge) but not the merely-duplicated-and-still-looks-fine cases (like these three) — those need
  a deliberate code read, not just a render check. This rule has now been elevated into `CLAUDE.md`'s
  standing "Rules that matter" section (not left as a Limbo-only convention), since it's a repo-wide rule,
  not something specific to this protocol. Durable fix/reference: see the new
  [Color Token Import Guide](/docs/COLOR-TOKEN-IMPORT-GUIDE.md), Step 5.

- **Hand-reconstructing an interactive origin component from source reading, however careful, cannot
  reliably reproduce it — each attempt reintroduces new errors instead of converging on accuracy.** The
  "Full divergence list" origin column was rebuilt twice from reading `RailNav.tsx`/`RailNav.stories.tsx`
  and taking screenshots, and was still wrong both times in ways that weren't caught until the human
  pointed them out: no search input in the mock (the real header has none — search is a separate row
  below it), no functioning 3-dot panel menu (the real one is a genuine Radix `DropdownMenu`), and no
  panel resize handle (the real panel has live drag-resize state). Static JSX retyped from memory of a
  1995-line component with real interactive state machines (dropdown open state, drag-resize tracking,
  controlled/uncontrolled search) will always miss something a screenshot alone can't reveal — **the
  fix was to stop reconstructing entirely and vendor the real, unmodified source instead.** All 15
  dependency files (`RailNav.tsx` + its 6 sub-components + `theme.ts`/`tokens.ts`/`layout.ts`/`status.ts`/
  `motion.tsx`/`icons/index.ts`/`icons/fluent.tsx`, plus `RailNav.stories.tsx` kept as an untouched
  reference copy) were copied byte-for-byte into `limbo-factory/src/reference/origin-design-system/`, the
  origin's own `@radix-ui/react-dropdown-menu` dependency was added to `limbo-factory/package.json` (this
  tool's own dependency, never `@bidezine/system`'s), and the exact `Default` story's `DefaultShell` was
  mechanically sliced (not retyped) out of the vendored `.stories.tsx` into a small importable module
  (`gallery/DefaultDemo.tsx`) plus a thin embedding shim (`OriginRailNavLive.tsx`, supplies a
  `ThemeContext.Provider` and a bounded frame in place of the story's `100dvh`/no-provider assumptions —
  the only non-verbatim part, and it changes zero visual/behavioral output). Verified interactively: the
  real search input accepts text, the real dropdown menu opens with its real 3 items
  (Search box/Expand all/Collapse all), and the real resize-drag separator is present — none of these can
  be faked by a static mock, and none needed to be, once the actual code was running instead of being
  redescribed. **Lesson for future Limbo occupants:** if a component has ANY non-trivial interactive
  behavior (menus, drag state, controlled inputs, animation state machines), reach for vendoring the real
  source into a dedicated reference subtree *before* attempting a hand-built comparison mock — a hand-built
  mock is only safe for components that are close to purely static/presentational.

## Exit condition

Once Rail Sidebar is promoted into `src/ui/` and registered in the real showcase, and the human has given
final sign-off: fold any durable process refinements into `CLAUDE.md`, then delete this file.
