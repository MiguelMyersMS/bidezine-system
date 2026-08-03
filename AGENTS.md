> ⚠️ **bidezine-system v2 BANNER (read first).** This file was inherited from the legacy
> `@miguel/design-system` and still describes the LEGACY architecture. This repo (`bidezine-system`) runs
> on the **v2 shadcn foundation** — see `CLAUDE.md` and `docs/decisions/ADR-006-shadcn-foundation.md`,
> which are AUTHORITATIVE and OVERRIDE anything below where they conflict. Key reversals vs the text below:
> **(1)** there IS a build step (Tailwind + CSS variables require it); **(2)** styling is Tailwind/CVA, not
> inline `CSSProperties`; **(3)** theming is CSS variables from a DTCG source, not React-context tokens;
> **(4)** GR4 is scoped to a DUAL source of truth — Figma owns the look, code owns behaviour, Code Connect
> binds. Full reconciliation of this file is a follow-up; until then, trust CLAUDE.md + ADR-006 first.

# @miguel/design-system — Agent Instructions

> Canonical instruction source for all coding agents working in this repo.
> CLAUDE.md and other agent entrypoints should reference this file, not duplicate it.

## Repository Overview

Shared design system package for all Miguel Myers reporting/dashboard apps.
Exports raw TypeScript (no build step) — consumer's Vite compiles on import.

## Operational Kernel

The compact execution layer for AI work lives in `docs/process/SPEC_KERNEL_COMPACT.md`.
Use it as the default contract for authority order, approval gates, minimal context loading,
and proof-before-done behavior.

For medium and large tasks:
- frame the task with `docs/process/TASK_BRIEF_TEMPLATE.md` before execution
- close the task with `docs/process/VERIFIER_CHECKLIST.md` before marking it done

This kernel does not replace the Golden Rules, Hard Rules, sync protocol, or wave protocols.
It standardizes how agents enter and exit work under those existing contracts.

### ⛔ CLOSE-ON-LAND (non-negotiable — this rule exists because it was broken repeatedly)

**When work reaches `master`, the agent that landed it MUST close its tracking entry in the SAME
commit.** Check the box, move it to `## Done (recent)` in `docs/FOLLOWUPS.md`, and update any
handoff/status doc that claims it is pending. Landing the code and leaving the tracker saying "open"
is an INCOMPLETE task, not a finished one.

**Why this is a hard rule.** On 2026-08-02 a single sweep found **ten** items that were already done
and never closed — one of them (`Reconcile the 10 needs-human molecules`) had recorded its own
completion in its own text three weeks earlier and still read as pending. The owner spent **three days**
paying down a backlog that was largely already finished. Every unclosed item is debt the agent created
and the owner pays. Do not do this.

**Also non-negotiable:**

- **Never leave a branch as the only home for work.** Push it the moment it exists. Two branches
  (`feat/filter-fields`, `chore/molecule-gate-tightenings`) lost their refs entirely and survived only
  as garbage-collectable dangling objects; `git status`, `git branch` and `git stash list` all showed
  clean the whole time. `scripts/session-brief.js` now flags this, but the fix is to push, not to rely
  on the detector.
- **Verify by CONTENT before claiming work is missing or duplicated** —
  `git diff --diff-filter=A --name-only master <branch> -- src/ scripts/`. Commit counts lie: a branch
  can be 24 commits "ahead" and still be a strict subset already merged by other PRs.
- **Do not report an advisory finding as a blocker.** The ONLY required gate is CI
  (`.github/workflows/ci.yml` → `health:strict`). The evidence gate declares itself
  `STATUS: ADVISORY (non-required)` in `.github/workflows/evidence.yml:7`; `consumer-sync.yml` is
  `continue-on-error: true`. An unsigned or stale evidence bundle means the component shipped and works
  and an optional pixel-diff has not been re-run — it is **not** a defect and must never be presented as
  standing between the owner and new work. Evidence is re-sealed **ON TOUCH**, as part of the next edit
  to that component, never as standalone backlog.

## Multi-Agent Worktrees (read before starting ANY task)

When more than one agent (Claude, Copilot, Codex, sub-agents, etc.) may be working on this repo
concurrently, **work happens in isolated git worktrees, never in the shared main clone**. Full
rules, setup commands, and the helper script live in `docs/process/MULTI-AGENT-WORKTREES.md` +
`scripts/new-worktree.sh`. Read that doc in full before touching the repo if you are unsure
whether another agent may be active.

Compact summary (the doc is authoritative if this drifts):

1. **One folder per agent. Never two agents in the same directory.**
2. **Never `git checkout <branch>` / `git stash` / `git reset` in a tree you don't exclusively
   own.** This is what deletes another agent's in-progress work.
3. **Feature-branch-per-component/concern, always.** Never work directly on `master` or share a
   branch between two live agents.
4. **The consumer-linked main tree stays pinned to `master`.** Only `git pull` there after
   merges — no feature work, no branch switches, no stashes.
5. **PR to `master`, squash-merge only** — never merge directly from a worktree branch.
6. Each worktree runs its **own Storybook port** (not `:6006`, which the main clone owns). Set
   `STORYBOOK_URL=http://localhost:<port>` before running `npm run health` / `health:strict` so
   the behavior gate targets your worktree's own instance, not another agent's.

Setup: `scripts/new-worktree.sh <feature-slug> [base-branch]` from the main clone (creates
`../ds-wt/<feature-slug>` on `feat/<feature-slug>`, off `master` by default).

- **Package:** `@miguel/design-system`
- **Owner:** Miguel Myers (miguelmyers@microsoft.com), IP Analytics, Power BI org
- **Node.js:** ≥18
- **Package manager:** npm
- **No build step** — ships raw `.ts`/`.tsx`

## Repository Structure

```
design-system/
├── AGENTS.md               # ← You are here (canonical agent instructions)
├── CLAUDE.md               # Project context for AI agents (references AGENTS.md)
├── package.json
├── tsconfig.json
├── .claude/skills/         # Agentic skills = Claude slash commands. Single source of truth;
│   │                       #   each mirrored to .github/prompts/<name>.prompt.md (Copilot) via `npm run prompts:sync`
│   ├── token-audit/ icon-audit/ a11y-audit/ consumer-sync/ code-cleanup/ smell/ registry-refresh/ weekly-cleanup/   # audits + hygiene
│   ├── figma-build/        # create: Figma node → spec → code + story
│   ├── evidence-pipeline/ evidence-wave/   # verify (Evidence Protocol — one / a wave)
│   └── figma-deploy/ deployment-verify/    # deployment
├── docs/                   # Structured documentation & knowledge base
│   ├── interaction-patterns.md
│   ├── registry/           # Machine-readable inventories (auto-generated)
│   │   ├── tokens.json     # DTCG-compatible token registry
│   │   ├── components.json # Component metadata with maturity status
│   │   └── icons.json
│   ├── decisions/          # Architecture Decision Records
│   └── audits/             # Audit output logs
├── app/                    # Documentation/management app (React + Vite)
└── src/                    # Design system source code
    ├── index.ts            # Barrel export
    ├── tokens.ts           # Color palette + semantic tokens + typography
    ├── layout.ts           # Spacing, radius, breakpoints, layout constants
    ├── theme.ts            # ThemeContext, useTokens(), useBreakpoint()
    ├── status.ts           # Status colors, elevation, z-index, motion, focus
    ├── icons/              # Fluent UI System Icons (inline SVGs)
    └── gallery/            # Reusable UI controls (DateChip, Segmented, etc.)
```

## Module Map

| Import path | Module | Purpose |
|---|---|---|
| `@miguel/design-system` | `src/index.ts` | Barrel export (prefer deep imports) |
| `@miguel/design-system/tokens` | `src/tokens.ts` | PALETTE, TOKENS_LIGHT/DARK, TYPE, FONT_FAMILY |
| `@miguel/design-system/layout` | `src/layout.ts` | SPACE, BP, LAYOUT, RADIUS |
| `@miguel/design-system/theme` | `src/theme.ts` | ThemeContext, useTokens, useBreakpoint |
| `@miguel/design-system/status` | `src/status.ts` | statusColors, elevation, Z, MOTION, FOCUS, DISABLED, INPUT, SCROLL |
| `@miguel/design-system/icons` | `src/icons/index.ts` | All Fluent UI System Icons |
| `@miguel/design-system/gallery` | `src/gallery/index.ts` | DateChip, Segmented, DarkPillButton, Dots, Placeholder |

## Golden Rules (User-Enforced — Violations Require Explicit User Authorization)

Golden Rules sit ABOVE Hard Rules. They cannot be overridden by Hard Rules, Cycle directives, audit findings, convergence proposals, refactors, "cleanup" passes, scope-cap decisions, or any other in-cycle reasoning. A Golden Rule violation is treated as a stop condition (see `sync/STOP_CONDITIONS.md` condition #10).

**Violation-handling protocol — MANDATORY for every agent (Claude, Codex, sub-agents, sync Implementor/Governor):**

1. **STOP** before applying the change. No code edit, doc edit, story edit, or token edit may proceed.
2. **Surface the violation to the user verbatim, in this format:** *"This change would violate Golden Rule #N — {rule name}. {Brief explanation of how it violates}. Do you authorize this Golden Rule violation?"*
3. **Wait for explicit user authorization in the same turn.** Implicit authorization, downstream consequence, "the user already said converge," "this was implied earlier," "previous cycle authorized similar," etc., are **not** sufficient. The user must say something equivalent to *"yes, I authorize the Golden Rule violation"* in the immediate response.
4. **Record the authorization in the cycle HANDOFF (or REVIEW, depending on role) as the durable trail** — quoting the user's exact authorization sentence + the timestamp + the cycle number.
5. **Golden Rules may only be added, modified, or removed by direct user instruction.** No agent may propose adding or rewriting a Golden Rule on its own initiative.

### Golden Rule #1 — Canonical Search Experience

**Statement:** The ONLY allowed search-input visual treatment, anywhere in this repo (gallery components, stories, app surfaces, future surfaces), is the **borderless input row** (`SearchBar` molecule), as codified in the `SearchBar` Figma component set and implemented in `src/gallery/ActionMenu.tsx` and `src/gallery/Select.tsx`.

**Required treatment for every search input:**

- **Borderless input row.** `IconSearch` (16 px, `tokens.textSubtle`) + the `<input>` (no `border`, no `borderRadius`, no `background` of its own; `outline: none`; the row's wrapper uses `background: tokens.surface` or `tokens.darkSurface` on dark variants) + optional clear button (`IconDismiss`, `visibility: hidden` when empty). Row padding: `4px` on all sides (`SELECT.searchPaddingY`). The parent container owns any additional horizontal or vertical spacing around the `SearchBar`.
- **Sticky-header rhythm.** In sticky-header contexts (Menu, Select, RailNav panel, future surfaces with sticky search), the sticky-header container uses `marginBottom: RHYTHM.stickyHeaderGap` (= `SPACE[2]` = 8 px) between the search block and the scroll region beneath.
- **Dividers are parent-container responsibility.** The `SearchBar` molecule does NOT include a built-in divider. If a surface needs a hairline divider below the search row, the parent container adds it as a separate element. This gives each surface full control over whether a divider is needed and its gutter math.

**Forbidden treatments (Golden Rule violations):**

- **Bordered or filled rounded search box** — `border: 1px solid hairline` + `borderRadius: RADIUS.rounded` + `background: tokens.bgSubtle` on the search row. (Legacy pre-Cycle-121 Select pattern, retired by user direction 2026-06-01.)
- **"Context-specific" search variants** that deviate from the borderless row structure — any deviation requires explicit per-instance user authorization under the violation-handling protocol above.

**Enforcement:**

- Audit ID `LAY.STICKY-HEADER-RHYTHM-DRIFT` (Medium) covers the popover sticky-header gap — see "Menu Scroll Geometry" subsection below.
- Audit ID **`GR1.NON-CANONICAL-SEARCH`** (severity: Golden Rule — above Blocker) covers any container with a search input that does not use the borderless row treatment. Cannot land without explicit per-instance user authorization.
- Grep targets across `src/**`: any line matching `IconSearch`, `placeholder=".*[Ss]earch"`, `placeholder=".*[Ff]ilter"`, `role="searchbox"`, `type="search"` that does NOT use the borderless row styling (no border, no borderRadius, background: tokens.surface) triggers `GR1.NON-CANONICAL-SEARCH`.

**Canonical references:**

- `docs/atomic/molecule/searchbar.spec.md` — Figma molecule spec and token mapping.
- `src/gallery/ActionMenu.tsx` (search block) — current code implementation reference.
- `src/gallery/Select.tsx` (sticky-search block) — converged Cycle 121 (user direction 2026-06-01).

**Origin & history:** User direction, 2026-06-01 (borderless row established). Updated 2026-06-09 per user direction: divider removed from `SearchBar` molecule — dividers are now parent-container responsibility, not baked into the search input unit. `SearchBar` Figma molecule codified as the canonical atom. Direction is durable — future cycles MUST NOT propose bordered/filled search treatments without invoking the violation-handling protocol above.

### Golden Rule #2 — Menu Maximum Two-Level Nesting (No Third Level)

**Statement:** Any Menu surface (the `Menu` component and any future ellipsis-triggered menu surface in this design system) MUST be at most **two levels deep** in its list structure:

- **Level 1 — Category (group header).** Optional. Provided via the `groups: MenuGroup[]` prop and items' `group?: string` field. Renders with the uppercase-caption visual treatment per "Popover Container Contract" rule 21c (`TYPE.caption` + `textTransform: uppercase` + `letterSpacing: 0.04em`).
- **Level 2 — List item (`MenuItem`).** The actionable row. Either inside a group (level 2 under a category) OR ungrouped (still level 2 — directly under the List section). Renders with `TYPE.bodyS` per rule 9.

**Forbidden — any third level whatsoever:**

- `MenuItem.children` — items having sub-items (no recursive item nesting).
- `MenuItem.subItems` or any equivalent collection prop on `MenuItem`.
- `MenuGroup.groups` / `subGroups` — groups having nested groups.
- Cascading / fly-out / sub-menus rendered from a parent item.
- Tree-like recursive data structures passed as `items`.
- A list item rendering with an indent beyond rule 21e's single `SPACE[3]` group indent (which is the level-2-inside-a-group indent — NOT a third level).
- A `groupItems` rendering pattern that visually implies nesting under another item.

**Rationale:** Two levels (category + item) preserve a clean visual hierarchy. The category uses uppercase + letter-spacing as an unmistakable typographic signal that "this is a section label, not an actionable row." Adding a third level would muddle that contrast — sub-items would compete visually with category headers, and consumers would lose the at-a-glance clarity of which row is selectable. Menu is an **action-list** surface, not a navigation or hierarchical-tree surface. For genuine hierarchical needs (file trees, navigation drawers, etc.), use a different component (RailNav for nav, a future Tree component for hierarchy) — NOT Menu.

**Enforcement:**

- **API gate.** The `MenuProps` / `MenuItem` / `MenuGroup` types MUST NOT include any field that would enable third-level nesting. Adding such a field is a Golden Rule violation requiring per-instance user authorization via the violation-handling protocol at the top of the "## Golden Rules" section.
- **Runtime audit.** A Menu instance whose rendered output includes an element visually positioned as a child of another item (additional indent depth, sub-list wrapper, etc.) is a `GR2.MENU-THIRD-LEVEL-NESTING` (severity: Golden Rule — above Blocker) finding.
- **Story / consumer audit.** Storybook stories or consumer apps that compose `MenuItem[]` arrays with implicit recursion (e.g., a `description` field encoding nested labels, or a custom `icon` that renders sub-items) trip the same rule.

**Canonical reference:** `src/gallery/Menu.tsx` — the data model (`MenuItem`, `MenuGroup`) is intentionally flat. The rendering path in `renderRows()` walks `groups` × `items` exactly once, never recursively.

**Origin & history:** User direction, 2026-06-03: *"menus will never have a third level nested items (make that a contract as golden rule for menus. in that way there is a visual differentiation between the category and the list items)."* Codifies Menu's role as an action-list surface and locks in the categorical visual hierarchy supported by rule 21c. Direction is durable — future agents MUST NOT propose extending Menu to support nested items / sub-groups / cascading menus without invoking the violation-handling protocol above.

---

### Golden Rule #3 — All Menus, Popovers, and Tooltips MUST Escape Overflow via Portal + Fixed Positioning

**Statement:** Every menu, dropdown popover, tooltip, or overlay in this design system MUST be rendered via `ReactDOM.createPortal(…, document.body)` with `position: fixed` and coordinates calculated from `getBoundingClientRect()` on the trigger element. The **only** allowed overlay positioning strategy is:

1. **On open:** call `triggerRef.current.getBoundingClientRect()` to capture the trigger's viewport-relative position.
2. **Render the overlay via `ReactDOM.createPortal(…, document.body)`** — directly into the document body, outside all component trees.
3. **Position with `position: fixed`** using the captured `DOMRect` values (`top`, `bottom`, `right`, `left` computed from the rect).
4. **Flip / cap** using `window.innerHeight` / `window.innerWidth` comparisons against the anchor rect, inside a `useLayoutEffect` that fires after the portal is mounted.

**Forbidden patterns (Golden Rule violations):**

- **`position: absolute` inside any component tree** — even when the immediate parent has `position: relative`, ancestor `overflow: hidden` containers (cards, panels, scrollable regions, dialogs) will clip it.
- **`position: absolute` with `top: calc(100% + Xpx)` / `bottom: 100%`** — this is the #1 recurring violation. It looks correct in isolation but fails the moment the trigger lives inside any bounded container.
- **Rendering the overlay as a child of the trigger's parent** and relying on `overflow: visible` on intermediate ancestors — not robust; any ancestor with `overflow: hidden` or a stacking context clips it.
- **Using a `position: relative` wrapper `<div>` around the trigger button** to create a positioning context — removes the need for a portal but creates the overflow trap.

**Why this keeps failing:** The trigger button sits inside a panel / card / sidebar that has `overflow: hidden` for layout reasons (flex scroll regions, border-radius clipping, etc.). `position: absolute` is constrained by the nearest `position: relative` ancestor, but `overflow: hidden` on *any* ancestor between the trigger and the viewport clips the absolutely-positioned child. This happened with the overflow menu, Select dropdown, Menu popover, DateChip popover, PanelHeaderMenu, and others — five separate instances before this rule was codified. A portal escapes the entire component tree; `position: fixed` ignores all ancestors entirely.

**Canonical pattern:**

```tsx
// In the trigger component:
const btnRef = useRef<HTMLButtonElement>(null);
const menuRef = useRef<HTMLDivElement>(null);
const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

const handleOpen = () => {
  setAnchorRect(btnRef.current!.getBoundingClientRect());
  setOpen(true);
};

// Outside-click detection must check BOTH trigger AND portal menu:
useEffect(() => {
  if (!open) return;
  const handler = (e: MouseEvent) => {
    if (
      btnRef.current?.contains(e.target as Node) ||
      menuRef.current?.contains(e.target as Node)
    ) return;
    setOpen(false);
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, [open]);

// Render:
{open && anchorRect && ReactDOM.createPortal(
  <MyPopover
    menuRef={menuRef}
    anchorRect={anchorRect}
    onClose={() => setOpen(false)}
    ...
  />,
  document.body,
)}

// Inside MyPopover — position: fixed, flip via useLayoutEffect:
useLayoutEffect(() => {
  const el = menuRef.current;
  if (!el) return;
  const margin = SPACE[3];
  const menuRect = el.getBoundingClientRect();
  const spaceBelow = window.innerHeight - anchorRect.bottom - margin;
  if (menuRect.height > spaceBelow) setFlipUp(true);
}, []);

<div ref={menuRef} style={{
  position: "fixed",
  top: flipUp ? undefined : anchorRect.bottom + SPACE[1],
  bottom: flipUp ? window.innerHeight - anchorRect.top + SPACE[1] : undefined,
  left: anchorRect.left, // or right: window.innerWidth - anchorRect.right for right-align
  zIndex: Z.dropdown,
  ...
}} />
```

**Enforcement:**

- Audit ID **`GR3.OVERLAY-OVERFLOW-TRAP`** (severity: Golden Rule — above Blocker). Triggered by ANY of:
  - An overlay element with `position: absolute` inside a component tree (grep: `position.*absolute` in overlay components — `*Popover`, `*Menu`, `*Dropdown`, `*Tooltip`).
  - An overlay rendered as a React child of the trigger component rather than via `ReactDOM.createPortal`.
  - An outside-click handler that uses `containerRef.contains()` on a `position: relative` wrapper div instead of separately checking trigger and portal refs.
- **Pre-implementation checklist** — before writing ANY menu, popover, or tooltip, an agent MUST confirm in the HANDOFF: *"This overlay uses `ReactDOM.createPortal` to `document.body` with `position: fixed` per Golden Rule #3."* Failure to include this confirmation is itself a stop condition.
- **Existing violations** — as of 2026-06-09, all known `position: absolute` overlay patterns in the codebase have been converted. New implementations must not reintroduce this pattern.

**Canonical reference:** `src/gallery/RailNav.tsx` — `PanelHeaderMenuButton` (portal trigger pattern) + `PanelHeaderMenuPopover` (fixed-positioning + flip logic). Codified 2026-06-09 after five repeated occurrences of menu clipping across the design system.

**Origin & history:** User direction, 2026-06-09: *"this is the fifth time the menus are not being shown completely without being restricted by another container that needs to be fixed by pointing this out, we probably need a golden rule and protocol for these menus."* Five prior occurrences: overflow menu (RailNav rail), Select dropdown, Menu popover, DateChip popover, PanelHeaderMenu. This rule is durable — future agents MUST NOT use `position: absolute` for any overlay without invoking the violation-handling protocol at the top of the Golden Rules section.

---

### Golden Rule #4 — Figma Is the Source of Truth; Code Follows Figma

**Statement:** Every visual property in this design system (dimensions, spacing, color, border-radius, typography, opacity, layout) MUST match the value specified in the Figma design file. **Figma is always authoritative.** Code defers to Figma — not the other way around.

**The only allowed exception:** A property may deviate from Figma's specified value if and only if the user has **explicitly granted an exception** for that specific property on that specific component. The exception must:

1. Be stated by the user verbatim (e.g. *"use 40px for rail button height, Figma is wrong here"*).
2. Be recorded in the relevant `spec.md` under a clearly labeled `# Exception` block, quoting the user's authorization and the date.
3. Be referenced in the component's code via a comment: `// Exception: user direction YYYY-MM-DD — see <spec>.spec.md`.
4. Be listed in the component's `Known Figma discrepancies` table if one exists.

**Forbidden agent behaviors (Golden Rule violations):**

- **Treating a prior code value as authoritative over Figma** — e.g. "code already uses 40px, so 40px must be correct." Code is a snapshot of past decisions; Figma is the live design intent.
- **Inflating a Figma value "for accessibility"** without checking whether it already meets WCAG minimums. WCAG 2.4.11 minimum interactive target is 24×24 CSS px. A Figma-specified 38×38 already exceeds this by a wide margin — no inflation is permitted without user authorization.
- **Assuming a previously-logged "discrepancy" is permanent.** Discrepancy tables exist to track items that NEED to be fixed — not to bless code deviations forever. When a discrepancy is resolved (either Figma is updated or the user grants an exception), it must be removed from the table.
- **Confirming a token, size, or color from spec memory or session context** instead of re-reading the Figma node. The spec itself can be wrong. Figma is always the ground truth.
- **"The code worked before, so it must be right."** Working code that disagrees with Figma is incorrect code until the user grants an exception.

**When encountering a code↔Figma mismatch:**

1. **Default action:** update the code to match Figma. No user authorization needed.
2. **If there is a plausible reason the code value might be correct** (e.g. a functional constraint, a WCAG floor, a token that doesn't exist yet): surface it explicitly — *"Figma shows X, code has Y. I am defaulting to Figma (X). If you want Y, please authorize an exception."*
3. **Never silently keep the code value.** Silence = accepting drift.

**Enforcement:**

- Audit ID **`GR4.FIGMA-DRIFT`** (severity: Golden Rule — above Blocker). Triggered when:
  - A spec `container` block, `states[]` entry, or `tokenMap` value disagrees with the Figma node's actual property AND no user-authorized exception is recorded.
  - A `Known Figma discrepancies` table row has `Action: Fix Figma to X` (meaning code was treated as authoritative over Figma) without a corresponding user authorization.
  - A component dimension, padding, or radius uses a constant whose value disagrees with the Figma spec node without a recorded exception.
- **PROTOCOL.md blind-spot `sizes-not-inflated`** is a direct enforcement point for this rule. Every spec checklist must confirm `sizes-not-inflated: pass: true` against the Figma-specified dimension, not the code dimension.

**Canonical example of this rule being applied:**

- **2026-06-10:** `RailButton` was coded at 40px (`LAYOUT.hitTarget`). Figma specifies 38px. Prior session incorrectly labeled this a "Figma discrepancy — fix Figma to 40px." User direction: *"Figma shows 38px and that's the official size, the code needs to use that as the official size not 40px. Figma is our source of truth unless I explicitly assign an exception or special specification."* Resolution: `LAYOUT.railButton = 38` added; all RailButton usages in `RailNav.tsx` updated; railnav.spec.md discrepancy table corrected; AGENTS.md density rule updated.

**Origin & history:** User direction, 2026-06-10: *"Figma is our source of truth unless I explicitly assign an exception or special specification."* Codified after a prior session incorrectly treated a 40px code value as authoritative over Figma's 38px — then recorded the Figma value as "wrong." This rule closes that class of error permanently.

---

### Golden Rule #5 — Stories Render the Shipped Component; Behavior Is Test-Verified

**Statement:** A UI element is implemented in **exactly one** shipped component. Every story — and every consumer/deployment — **renders that component**, never a parallel reimplementation. A demo must never be ahead of the product. Every interactive **behavior** is a contract test (a `tags:['!dev']` Storybook play function) wired into `npm run test:behavior` (part of `npm run health`); "**verified**" means *behaviorally* verified — a static Figma frame or screenshot proves look, never behavior.

**Forbidden agent behaviors (Golden Rule violations):**

- **Reimplementing a component's UI inside a story/demo** (or a consumer) instead of rendering the shipped component. A story may configure props; it may not re-author the component. (This is the duplication that caused the RailNav demo to be ahead of the product.)
- **Declaring a behavior "done" on a static screenshot / green static matrix** without a passing play-test in `test:behavior`. Static parity ≠ behavior.
- **Replicating only the nav/data** of a reference view while dropping component **prop/slots** (`logo / sections / footerSections / utilityItems / footer / overflow`). Diff the FULL prop surface (composition completeness), not just the data.
- **Shipping an element with elevation (`boxShadow`) clipped by an `overflow:hidden` ancestor** — at component OR consumer level. The shadow must escape when the element is shown.

**Enforcement:**

- Spec template `behaviors:` front-block + checklist guards `behavior-test-gated`, `story-renders-shipped-component`, `composition-slots-complete`, `elevation-not-clipped` (`docs/atomic/_TEMPLATE.spec.md`).
- `npm run test:behavior` (Storybook test-runner) is the runtime gate, required by `npm run health`.
- Deployment protocol (`docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md`): inheritance requires the behavioral suite passing; composition-inventory + elevation-not-clipped blind-spot guards.
- Machine audit-specs.js enforcement of the new checklist ids is an ADR-005 follow-up (currently process-enforced).

**Origin & history:** RailNav Panel Unification, 2026-06-13. A deployment "looked done" in a static Storybook + green matrix yet shipped broken behavior (search, collapse, subtitle, elevation) because the complete implementation lived in a *demo* (`SidebarPanelSpec`) and verification certified *structure, not behavior*. User authorization to codify: *"we can do step two and step three as you are requiring."* See **ADR-005**.

---

## Hard Rules (Agents MUST Follow)

### Consumer Boundary
1. **Consumers never edit the design-system repo.** A consumer app (a demo, PLG, bloodwork, a design
   agent building a screen) CONSUMES the DS — it imports the raw-TS package or the `dist-browser` bundle;
   it does NOT edit `src/`, specs, or tokens in this repo. If a consumer needs a DS change, it goes through
   the DS repo's own flow (spec → build → create/evidence waves), never as an edit made from inside the
   consumer's build. Editing DS source from a consumer session (especially across a migration/branch
   boundary) is how work gets silently reverted and components "break." Per-project data + deploy records
   live in the CONSUMER's workspace, not here (see `docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md`).
2. **Browser-only consumers** use the additive `dist-browser/ds.umd.js` bundle (`window.DS`, React
   external, provider-driven theming) — see `dist-browser/README.md`. Everyone else imports the raw-TS
   package. Regenerate the bundle with `npm run build:umd`; CI's `check:umd-fresh` blocks a stale one.
3. **The production-test governance** (how the two deployers read/hand-off/verify/request-info/reset, and
   how their findings become gated DS changes) is `docs/consumer-governance/COMMUNICATION-PROTOCOL.md`.

### Tokens
1. **PALETTE is private** — components use `useTokens()`, never reference PALETTE directly
2. **Token changes affect all consumers** — test across projects before modifying
3. **Opacity via color alpha** — NEVER use CSS `opacity` property for text
4. **Only approved fonts** — DM Sans, Raleway, Inter (Google Fonts CDN, no proprietary fonts)
5. **Always use TYPE tokens** — never hardcode font-family or font-size
6. **Atom surface semantics are strict** — `atom` MUST read the live `ThemeContext` token set via `useTokens()`. `darkAtom` is the fixed dark-family surface and may use `TOKENS_DARK`. Only explicit fixed-surface variants such as `*Light` components may hard-bind `TOKENS_LIGHT`. Audit ID: `CP.ATOM-THEME-TOKEN-BYPASS`.

### Icons
1. **Fluent UI System Icons ONLY** — no Lucide, Heroicons, FontAwesome, Material
2. **Fill-based inline SVGs** — viewBox always `"0 0 20 20"`
3. **Interactive icons** get `filled` boolean prop (Regular → Filled on hover)
4. **Size tiers:** 20px (all navigation icons — rail, panel, footer, nested), 16px (disclosure chevrons only), 36px (decorative hero)
5. **Uniform nav icon size is CRITICAL** — rail icons, sidebar item icons, footer utility icons, collapse button, and overflow menu ALL must be 20px. Consumer-side footer utilities are the #1 source of drift. **ENFORCEMENT: Every icon size must be explicit `size={20}` in the icon render call, not reliant on Fluent default.** RailNav overflow menu bug (2026-06-10): OverflowMenuItem reserved 20×20px slot but rendered `size={16}`, causing visible shrinking. Lesson: Storybook stories may look correct in isolation but fail in production context — audit the actual component using the icon, not just the story.
6. **Every icon accepting `filled` prop MUST branch on it** — `{filled ? <path.../> : <path.../>}`. Single-path icons with unused `filled` are a BLOCKER (`IC.FILLED-NOT-BRANCHING`).

### Border Radius
1. **Three interactive tiers only** — pill (99), rounded (12), soft (8)
2. **Container radii are separate** — 16–20 for cards/panels
3. **No fourth interactive tier** — choose the closest existing tier

### Components
1. **Gallery = reusable controls only** — domain-specific components stay in host projects
2. **No build step** — package ships raw `.ts`/`.tsx`, consumer compiles
3. **Storybook globals must be normalized** — stories that read `theme` or `atomSurface` from `context.globals` must route them through `src/gallery/storyTheme.ts` helpers (`getStoryThemeTokens`, `getStoryThemeMode`, `getStoryAtomSurface`). Do not hand-roll surface/theme semantics inside stories. Audit ID: `STORY.THEME-HELPER-BYPASS`.

### Motion / Animation
1. **Tokens only** — every animation's duration and easing MUST read a `MOTION.*` token (`src/status.ts`). No raw `ms` or inline `cubic-bezier()` at call sites. Group durations/easings into a named preset in `TRANSITIONS` (`src/motion.ts`); call sites reference the preset.
2. **Reduced-motion fallback is mandatory** — every animation MUST collapse to an instant, non-animated state under `prefers-reduced-motion: reduce` (use the `reducedMotion` flag / `useReducedMotion()` / `cssTransition(..., reduced)`; the `<Collapse>` primitive already does this). A transition with no reduced-motion fallback is a `MO.NO-REDUCED-MOTION` blocker.
3. **Reuse the primitive** — animated auto-height disclosure MUST use the shared `<Collapse>` primitive (`@miguel/design-system/motion`), not a bespoke `max-height`/measurement hack. New shared motion behaviors live in `src/motion.ts`.
4. **Spec + inventory** — each shipped animation has a `docs/atomic/animations/<name>.anim.spec.md` (from `_TEMPLATE.anim.spec.md`) and appears in `docs/registry/animations.json` (regenerated by `registry:refresh` from `src/motion.ts`).
5. **Behavior-verified** — expand/collapse and reveal behaviors MUST be locked by a Storybook play-test (run in `npm run test:behavior`); the test must assert the post-transition DOM (e.g. collapsed content leaves the DOM), not just the trigger.

### Dropdown Triggers

1. **Single source of truth for trigger height** — every Select-family dropdown trigger (single-select, multi-select summary, multi-select pills, future variants) MUST read its height from one shared constant: `SELECT.triggerHeight` in `src/status.ts`. No per-variant height literals, no per-mode aliases.
2. **Mandatory consistency** — single and multi triggers MUST render at the same height. Visual mismatch (e.g., the Cycle 113 issue where single was 36px and multi was 40px) is a `CP.TRIGGER-HEIGHT-MISMATCH` BLOCKER finding and gates `beta` promotion.
3. **New trigger branch requires user authorization** — if a new dropdown variant needs a different height (e.g., a compact density tier, a dark-rail-embedded variant, a custom data-grid filter trigger), it MUST be introduced as a NEW constant on `SELECT.*` (e.g., `SELECT.triggerHeightCompact`), and the new branch requires explicit user approval before merging. Do not silently split the height contract.
4. **Audit requirement** — `audit:components` MUST verify that every dropdown trigger reads from `SELECT.triggerHeight` (or an explicitly authorized variant constant). Grep for `height:.*SELECT\.triggerHeight` in any new dropdown surface; flag literal pixel heights as drift.
5. **Storybook evidence** — capture entries for `Select / Single Select / Default` and `Select / Multi-Select / Default` MUST exist in both light and dark themes so visual regression can detect height divergence between the two on every cycle.

### Tooltips, Menus & Overlays (Golden Rule #3 Enforcement)

**Statement:** Every tooltip, menu popover, dropdown, or overlay MUST be rendered via `ReactDOM.createPortal(..., document.body)` with `position: fixed` (never `position: absolute`). This is Golden Rule #3 — mandatory for preventing overflow clipping.

**Why this matters:** Tooltips and menus rendered with `position: absolute` inside ANY ancestor with `overflow: hidden` or `overflow: clip` will be invisible. A portal + fixed positioning escapes ALL ancestors and renders at the top level.

**Hard rule (component-level):**
1. Any component that renders a tooltip, popover, menu, or dropdown MUST use `ReactDOM.createPortal` to `document.body` with `position: fixed`.
2. Every overlay component MUST include a GR3 citation comment block: `// Overlay positioned via portal + position:fixed per Golden Rule #3`
3. Tooltips and popovers MUST NOT use `position: absolute` on any element inside the component tree.
4. Pre-commit checklist: "Does this component render overlays? Are they portals with position:fixed?"

**Audit ID:** `GR3.OVERLAY-ABSOLUTE-POSITIONING` (severity: Golden Rule — above Blocker)

**Canonical implementations:**
- `src/gallery/RailNav.tsx` lines 1389–1429 (OverflowMenu — portal + fixed)
- `src/gallery/RailNav.tsx` lines 1406–1451 (PanelHeaderMenu — portal + fixed)

**Recent fixes:**
- **(Cycle 2026-06-10):** Removed `overflow: "clip"` from NavColumn wrapper (line 452) to prevent tooltip clipping.
- **(Cycle 2026-06-11):** Removed `overflow: "clip"` from footer container (line 523) — RailButton tooltips in footer were clipped. The footer's `maxHeight` constraint remains; flex layout + `flexShrink: 0` keep footer pinned at bottom without clipping. TypeScript verified, Storybook builds successfully.

### NavRow States Contract

**Statement:** NavRow (Figma 207:3406) is a panel navigation item molecule with depth variants (0–2 levels). The hover and active states use DIFFERENT background tokens to provide clear visual differentiation.

**Visual contract (light surface):**

| State | Background | Text color | Icon fill | Font token | Font weight | Cursor | Notes |
|-------|-----------|-----------|-----------|-----------|-----------|--------|-------|
| Rest (enabled) | transparent | `tokens.textMuted` | regular | `TYPE.bodyM` | 400 | pointer | Default calm state |
| Hover | `tokens.hoverBg` | `tokens.ink` | filled | `TYPE.bodyM` | 400 | pointer | Light engagement |
| **Active** | **`tokens.bgSubtle`** | `tokens.ink` | filled | **`TYPE.labelL`** | **500** | pointer | **DARKER than hover**, weight bump |
| Active-expanded | transparent | `tokens.ink` | filled | `TYPE.labelL` | 500 | pointer | Active-context state, no background (valid with parent expanded or collapsed) |
| Disabled | transparent | `tokens.textDisabled` | regular | `TYPE.bodyM` | 400 | default | No interaction |

**Critical difference:** Active (`bgSubtle`) is visually DARKER than hover (`hoverBg`). This contrast is essential for the "peek before committing" panel UX — users must distinguish between a hovered item and a truly selected/active item.

**Code enforcement:**
- `PanelItem` in `src/gallery/RailNav.tsx`: `background: selected ? tokens.bgSubtle : hovered ? tokens.hoverBg : "transparent"`
- `PanelGroup` / `NestedSubGroup`: `background: hasActiveChild && !expanded ? tokens.bgSubtle : hovered ? tokens.hoverBg : "transparent"` — group headers use `bgSubtle` when an active child exists but the group is COLLAPSED (Figma "active" state). When expanded (Figma "active-expanded"), background is transparent.
- Font weight: `selected ? TYPE.labelL (500) : TYPE.bodyM (400)`

**Audit ID:** `CP.NAVROW-STATE-DRIFT` (Medium) — any NavRow component that uses the same background for hover and active states, or omits the font-weight bump on active, is a finding.

**Audit ID:** `CP.CHEVRON-ROTATION-ACTIVE-LOCK` (Medium) — any chevron direction expression that includes `isActive`, `hasActiveChild`, `hasActiveDescendant`, or equivalent alongside `isExpanded` in a boolean OR. Chevron rotation MUST be driven by **expand/collapse state only** (`isExpanded`) for runtime expand/collapse interactions. When a group contains the active item, `isActive` is always `true`, so `isActive || isExpanded` locks the chevron at `rotate(0deg)` even after the user collapses the group — the chevron appears frozen. The active state drives background color and font weight, NOT chevron direction. Grep target: `chevronDown.*isActive|chevronDown.*hasActive|rotate.*isActive`.

Exception (user direction 2026-06-19): the standalone NavRow molecule variant `state=active-expanded` is a semantic visual state and may be shown with parent expanded OR collapsed; in that specific molecule state, down chevron remains canonical.

**Origin:** 2026-06-12 — Slides sidebar groups with active descendants had frozen chevrons; Documents sidebar (no active descendant) worked correctly.

**Canonical reference:** `docs/atomic/molecule/navrow.spec.md` (Figma 207:3406)

### RailNav Gap Contract

**Statement:** RailNav (Figma 166:4494) has THREE distinct vertical gaps, each serving a different structural purpose. Code MUST use the correct constant for each gap to maintain proper visual rhythm.

**Gap contract:**

| Gap | Location | Figma value | Code constant | Purpose |
|-----|----------|-------------|---------------|---------|
| **Outer** | Between LogoSlot / NavColumn / FooterSlot | 16 px | `SPACE[4]` | Vertical rhythm between major sections |
| **Inner nav** | Between RailButton items within NavColumn | 4 px | `SPACE[1]` | Compact icon-button spacing |
| **Footer** | Between utility button items in FooterSlot | 4 px | `SPACE[1]` | Compact icon-button spacing |

**Code locations:**
- Line 428: `gap: SPACE[4]` on outer flex container (LogoSlot, nav, footer siblings)
- RailNav nav section uses `gap: SPACE[1]` for icon buttons (correct)
- Footer section uses `gap: SPACE[1]` for utility buttons (correct)

**Critical detail:** The outer gap (16 px) is visually distinct from the inner nav gap (4 px). Confusing the two breaks the rail's visual hierarchy. Using `SPACE[1]` for the outer gap results in tightly-stacked sections that collapse the breathing room intended by the design.

**Documentation reference:** `docs/atomic/organism/railnav.spec.md` with "Gap Contract" section mapping each gap to its code location.

**Audit ID:** `CP.RAIL-GAP-DRIFT` (Medium) — any RailNav with outer gap ≠ SPACE[4], or unclear comments about which gap is which, is a finding.

### SidebarPanel Section Padding Model

**Statement:** SidebarPanel (Figma 224:3458) has NO padding on the outer container. Each internal section owns its own padding wrapper. Code MUST replicate this three-section structure.

**Figma structure (layout_49ZVCC — column, no padding, no gap):**

| Section | Layout var | Padding | Content |
|---------|-----------|---------|---------|
| **PanelHeader section** | `layout_T1WEW8` | `SPACE[2]` (8px) uniform | PanelHeader molecule (`layout_4DMLH3`: 4px padding, `RADIUS.soft` borderRadius) |
| **Divider** | — | — | 0.5px `tokens.hairline` edge-to-edge |
| **PanelSearchBar section** | `layout_HNC5RS` | `4px 8px` (`SPACE[1]` / `SPACE[2]`) | SearchBar molecule |
| **Divider** | — | — | 0.5px `tokens.hairline` edge-to-edge |
| **NavPanelShell** | `layout_T1WEW8` | `SPACE[2]` (8px) uniform | NavPanel (column, gap: 2px) + Scrollbar (gap: 8px) |

**Key rules:**
1. **No outer container padding.** The panel container (`overflow: hidden`, `borderRadius: RADIUS.rounded`) has zero padding. Each section provides its own.
2. **Dividers are full-bleed.** Since the parent has no padding, dividers (`borderTop: 0.5px solid tokens.hairline`) naturally span edge-to-edge with no negative margins needed.
3. **PanelHeader molecule has its own 4px internal padding** (`layout_4DMLH3`) INSIDE the 8px section wrapper. Total header inset from panel edge = 8 + 4 = 12px.
4. **PanelHeader molecule has `borderRadius: RADIUS.soft` (8px)** — enables its hover state background to render with rounded corners.
5. **Nav section padding conditional right** — base 8px uniform; when scrollable, `paddingRight` increases by `SPACE[2]` (8px) for scrollbar gutter (translates Figma's `layout_5GDRA6` gap between NavPanel and Scrollbar artifact).

**PanelHeaderMenu pressed bg:** `tokens.bgStrong` (`#E0E1E6` = PALETTE.slate5). NOT `tokens.activeBg` (`#E8E8EC` = PALETTE.slate4). Verified from Figma `fill_45NLP1` on PanelHeader `state=pressed`, 2026-06-10. CollapseButton also uses `tokens.bgStrong` for pressed.

**Audit ID:** `CP.PANEL-SECTION-PADDING-DRIFT` (Medium) — any SidebarPanel with outer container padding, missing section wrappers, or missing dividers between sections is a finding.

**Origin & history:** Figma audit 2026-06-10. Prior code had a flat header with 4px padding (missing the 8px section wrapper) and no dividers. Fixed to match Figma's three-section structure with per-section padding ownership.

### NavIndentLine Atom

Codifies `src/gallery/NavIndentLine.tsx` — the 18 px wide inline slot that renders a vertical nesting line alongside indented sidebar navigation rows.

**Figma source:** `EyYETHXMDDURPGK4PXTU5C`, node `207-3584`
`https://www.figma.com/design/EyYETHXMDDURPGK4PXTU5C/Single-shape?node-id=207-3584`

#### Variants

| Figma name | Prop value | Line width |
|---|---|---|
| `weight=hairline` | `weight="hairline"` | 0.5 px |
| `weight=default` | `weight="default"` | 1 px |

Both variants: 18 px wide container (`NAV_INDENT_LINE_SLOT = 18`), centered line, fill color `tokens.border` (`#D9D9E0`).

#### ⚠ FIGMA BLEED GUIDES — IGNORE IN CODE

Both rectangle nodes in Figma carry a **top+bottom stroke** (`strokeWeight: 10px 0px`, same `#D9D9E0` color as the fill). These are **designer-only visual guides** that approximate the negative-margin bleed behavior, which Figma cannot natively represent. The stroke weight is adjusted by the designer to match different row heights visually and has no stable code meaning.

**Rule: when extracting NavIndentLine from Figma, ignore all strokes on the inner Rectangle nodes entirely.** Only the fill (line body) and container width (18 px) are canonical. Never translate the Figma stroke values into CSS borders, outlines, or padding.

#### Bleed contract (code-only)

Each row segment must extend through the row's padding and the inter-row gap so stacked segments appear as one continuous line. This is implemented with negative margins:

```
marginTop:    -rowPadY              // bleed through top padding
marginBottom: -(rowPadY + rowGap)  // bleed through bottom padding + gap
```

**Props:**

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `weight` | `"hairline" \| "default"` | `"default"` | Line width variant |
| `rowPadY` | `number` | `SPACE[1]` (4 px) | Row's vertical padding — drives bleed |
| `rowGap` | `number` | `SPACE[1]` (4 px) | Gap between sibling rows — extends bleed |
| `isLast` | `boolean` | `false` | Suppresses downward bleed on the last row in a group |

**Group container requirement:** always set `overflow: hidden` on the container that holds the stacked rows. This clips any residual bleed at group boundaries.

#### Reading Figma row molecules that include NavIndentLine

1. Identify the row's vertical padding token → pass as `rowPadY`.
2. Identify the gap between sibling rows → pass as `rowGap`.
3. Pass `isLast={true}` on the last row in the group.
4. Wrap the group container with `overflow: hidden`.
5. **Ignore all strokes** on the NavIndentLine rectangles in Figma.

The Figma frame never shows the bleed — it is always a code-only concern. The top/bottom stroke guides are the designer's approximation of the bleed effect, calibrated for visual reference only.

#### Placement in row molecules

NavIndentLine is the **leftmost flex child** of each nested row. The 18 px slot aligns to the same reservation used by the parent-level icon (`ROW_SLOT = 18` in ActionMenu / Select `INDICATOR_SLOT = 18`), placing the line at the parent icon's horizontal center.

#### RailNav usage note

`RailNav.tsx`'s built-in panel rows render the indent line via the **per-row `NavIndentLine` slot atom** inside `NavRowShell` (depth=N adds N× `NavIndentLine`, capped at 2), matching the `SidebarPanelSpec` reference and Figma NavRow (207:3406). The group children wrapper (`NestedChildren`) uses `overflow: clip` to clip the line bleed at group boundaries without creating a BFC (`SC.BFC-TRUNCATION-TRAP`). *(Updated 2026-06-12: the prior absolute-positioned single-line approach in `NestedSubGroup` was replaced by the per-row slot atom so the built-in panel matches `SidebarPanelSpec` exactly. GR4 — Figma NavRow uses per-row `NavIndentLine`.)*

### Scroll Regions
1. **Use the DS scroll convention (`SCROLL` from status.ts)** — never define component-specific scrollbar CSS
2. **Two-layer structure required** for any bounded scrollable area:
   - **Outer shell** — owns visual styling (bg, border, shadow, radius). Sets `padding: SPACE[2]`, `overflow: hidden`, `display: flex; flex-direction: column`.
   - **Inner scroll** — owns scrolling. `overflow-y: auto`, `flex: 1`, `min-height: 0`, `className={SCROLL.className}`.
3. **Conditional right padding** — inner scroll div gets `paddingRight: scrollable ? SPACE[2] : 0`, detected by ResizeObserver (`scrollHeight > clientHeight`).
4. **Scrollbar gap is CONDITIONAL — never add it unconditionally.** The `paddingRight: SPACE[2]` gap exists ONLY to prevent the browser scrollbar from overlapping row content. When no scrollbar is present (content fits without overflow), `paddingRight` MUST be `0`. A permanently applied `paddingRight: SPACE[2]` on a non-scrolling container introduces a ghost gap on the right side of every row that does not exist in Figma. Audit ID `SC.UNCONDITIONAL-SCROLLBAR-GAP` — any hardcoded `paddingRight` on an inner scroll element without a scrollability check is a Medium finding.
5. **Inject CSS once** — `<style>{SCROLL.css(tokens)}</style>` at the component root. Do NOT duplicate scrollbar CSS.
6. **Component discoveries must be promoted into system primitives before reuse** — if a component invents a scroll pattern, it becomes a `SCROLL` convention, not a component-specific class.
7. **Never use `overflow: hidden` on a direct flex child inside a scroll container — BFC truncation trap.** When a flex column has `overflowY: auto` (or `scroll`) AND a constrained height, any direct flex child with `overflow: hidden` creates a **Block Formatting Context (BFC)**. Browsers compute a BFC's height from the *available space* in the parent, not from the child's *content size*. Result: the child is silently sized to the visible scroll-container area, and its `overflow: hidden` clips everything beyond that edge — items appear truncated at the bottom with no scrollbar, even though the outer scroll chain is architecturally correct. This bug is indistinguishable from a broken `minHeight: 0` chain and has been misdiagnosed as such multiple times.

   **Applies to every surface with a scroll region:** nav panels, menus, tables, filter pickers, dropdowns, data grids, any `overflowY: auto` flex column.

   **The forbidden pattern:**
   ```tsx
   // ✗ WRONG — overflow:hidden on a flex child creates BFC → content is clipped, not scrolled
   <nav style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
     <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
       {/* children — these will be clipped at the nav's visible height, not scrolled */}
     </div>
   </nav>
   ```

   **Allowed alternatives (choose based on the use case):**

   - **`overflow: clip`** — visually clips like `hidden` but does NOT create a BFC. Height is content-sized. Best drop-in replacement when you need visual clipping without scroll interaction.
     ```tsx
     <div style={{ display: "flex", flexDirection: "column", overflow: "clip" }}>
     ```

   - **Component-level boundary mechanism** — e.g., pass `isLast={true}` to `NavIndentLine` on the last sibling to suppress the downward bleed without wrapping in `overflow: hidden`. The `isLast` prop was designed specifically for this case.

   - **Clip at a NON-flex-child level** — if the element needing visual clipping is a *grandchild* (not a direct flex child of the scroll container), `overflow: hidden` is safe because the grandchild's BFC is inside an already-content-sized parent.

   **Audit ID: `SC.BFC-TRUNCATION-TRAP`** (Medium) — any `overflow: hidden` on a direct flex child of an `overflowY: auto` flex container is a finding. Grep target in `src/gallery/*.tsx` and `src/gallery/*.stories.tsx`:  any element with `overflow: "hidden"` whose nearest ancestor flex container uses `overflowY: "auto"` or `"scroll"`.

   **Root cause discovered:** Cycle 133, 2026-06-10 — `SidebarPanelSpec` nav panel in `RailNav.stories.tsx`. The children-group wrapper (`overflow: hidden` for `NavIndentLine` bleed clipping) was a direct flex child of the `<nav overflowY:auto>`. Level 1/2 tree items appeared truncated even with a correct `minHeight:0` chain and correct body-margin reset. Fixed by changing the children wrapper to `overflow: clip` (no BFC) + passing `isLast` to all depth-level `NavIndentLine` instances.

8. **ActionMenu scroll structure — Figma organism `279:3934` (confirmed 2026-06-11).** ActionMenu uses a **different** scroll model than the generic two-layer structure in rule 2. The outer popover owns ALL padding; section containers are padding-free. In code, CSS `overflow-y: auto` replaces the Figma scrollbar artifact. The `ListColumn` gap between sections (4px) is separate from the `SectionList` gap between rows (2px).

   **Figma DOM:**
   ```
   ActionMenu (column, 240px fixed, padding: 4px, borderRadius: 12, elev.mid)
   └── ScrollRegion (ROW, fill width, hug height, gap: 4px, NO padding)
       ├── ListColumn (column, fill width, hug height, gap: 4px, NO padding)
       │   ├── SectionContainer (column, fill width, NO padding, NO gap, NO borderRadius)
       │   │   └── SectionList (column, fill width, gap: 2px)
       │   │       └── rows...
       │   ├── Divider (0.5px, fill width, tokens.hairline)
       │   ├── SectionContainer...
       │   └── ...
       └── ScrollbarWrapper (row, hug width, FILL HEIGHT, NO padding)
           └── Scrollbar (4px wide, fill height)
   ```

   **Padding ownership — outer container only (NO stacking possible):**
   - **ActionMenu (outer popover):** `padding: CONTAINER_PAD` (4px all sides). This is the ONLY element that owns padding. All content is inset by this single layer.
   - **ScrollRegion:** `padding: 0`, `gap: CONTAINER_PAD` (4px — scrollbar separation).
   - **ListColumn:** `padding: 0`, `gap: CONTAINER_PAD` (4px — between sections/dividers).
   - **SectionContainer:** `padding: 0`. NO padding — outer container handles inset.
   - **SectionList:** `padding: 0`, `gap: ROW_GAP` (2px — between rows within a section).
   - **Scroll container (code `listRef`):** `padding: 0`. Its only padding is `paddingRight: scrollable ? CONTAINER_PAD : 0` for the scrollbar gutter.
   - **Dividers:** no negative margins needed — they naturally span the ListColumn width (which is already inset by the outer container's padding).

   **The anti-pattern (deprecated — caused the earlier 2026-06-11 failure):**
   ```tsx
   // ✗ WRONG — outer container has NO padding, section containers each have padding
   // → dividers need negative margins to escape, risk of padding stacking if scroll container also adds padding
   <div style={{ padding: 0 }}>                                    // outer popover
     <div style={{ overflowY: "auto" }}>                           // scroll container
       <div style={{ padding: CONTAINER_PAD }}>{rows}</div>        // section container
     </div>
   </div>
   // ✓ CORRECT — outer container owns ALL padding, sections are padding-free
   <div style={{ padding: CONTAINER_PAD }}>                        // outer popover
     <div style={{ overflowY: "auto", gap: CONTAINER_PAD }}>      // scroll container (ListColumn gap)
       <div style={{ padding: 0 }}>{rows}</div>                    // section container
     </div>
   </div>
   ```

   **Audit ID: `SC.PADDING-STACKING`** (Medium) — a scroll container with `paddingTop` or `paddingBottom` when its children (section containers) already provide equivalent padding. Also triggered when section containers inside an already-padded outer container add their own padding.

   **Canonical reference:** Figma `EyYETHXMDDURPGK4PXTU5C`, node `279:3934`. Code: `src/gallery/ActionMenu.tsx`.

9. **No content-based maxHeight on ActionMenu.** The popover grows to fit ALL rows. The scrollbar appears only when the **viewport** constrains the available space — not when a fixed row count is exceeded. The existing viewport-aware flip/measure logic (`maxHeight = pos.maxHeight`) is the correct height constraint. Do NOT add a content-based cap (e.g., `MAX_MENU_ROWS * ROW_HEIGHT`).

   **Rationale (user direction 2026-06-11):** *"the ActionMenu should not have a length maximum it should allow N numbers of rows, however, if the screen gets reduced or there is not enough canvas to display them all that's where the scrollbar will appear."*

   **Audit ID: `SC.MENU-CONTENT-CAP`** (Medium) — any ActionMenu list section with a `maxHeight` derived from a fixed row count (rather than viewport measurement) is a finding.

10. **Scrollbar gap = section container padding (universal rule).** When a scrollbar appears inside a popover or panel, the conditional `paddingRight` on the scroll container MUST equal the section container's padding scalar. The scrollbar replaces the section container's right padding visually — symmetric rhythm must be preserved.

    | Surface | Section container | Section padding | Scrollbar gap |
    |---|---|---|---|
    | ActionMenu | `SectionContainer` | `CONTAINER_PAD` (`SPACE[1]` = 4 px) | 4 px |
    | SubmenuPortal | `SectionContainer` | `CONTAINER_PAD` (`SPACE[1]` = 4 px) | 4 px |
    | RailNav sidebar | `NavPanelShell` | `SPACE[2]` (8 px) | 8 px |

    **Audit ID: `SC.SCROLLBAR-PADDING-MISMATCH`** (Medium) — any scroll region whose `paddingRight` when scrollable does not equal its section container's padding scalar.

### Menu Scroll Geometry

Codifies the popover-with-sticky-header geometry shared by `Menu`, `Select`, and any future surface that pairs a sticky header (search box, filter row, summary chip) with a bounded scroll region beneath it. Cycle 121 converged **Select's** sticky-search treatment with **Menu** (user direction 2026-06-01, reversing the earlier Cycle 120 default): both surfaces now render a borderless search row with an edge-to-edge hairline divider beneath, and `marginBottom: RHYTHM.stickyHeaderGap` (= `SPACE[2]` = 8 px) between the sticky header and the scroll region.

1. **Two-layer gutter contract still applies** — the outer popover owns `padding: SPACE[2]`; the inner scroll container is `padding: 0` with conditional `paddingRight: scrollable ? SPACE[2] : 0`. The sticky header is a *third* layer that sits inside the outer shell, above the inner scroll container.
2. **Sticky-header → scroll-region gap = `RHYTHM.stickyHeaderGap`** — applied as `marginBottom` on the outer sticky-header container. Resolves to `SPACE[2]` (8 px). Grep target: `marginBottom:\s*SPACE\[2\]` inside any sticky-header block in `src/gallery/*.tsx` is a `LAY.STICKY-HEADER-RHYTHM-DRIFT` Medium finding (use the named token, not the literal). Also: `paddingBottom: SPACE[1]` on the sticky-header container is a `LAY.STICKY-HEADER-RHYTHM-DRIFT` Medium finding (legacy pre-Cycle-121 Select pattern; must use `marginBottom: RHYTHM.stickyHeaderGap`).
3. **Borderless search row** — the canonical sticky-search treatment is a `SearchBar` molecule (borderless input row: `IconSearch` + `<input>` + optional clear button) with `padding: 4px` on all sides (`SELECT.searchPaddingY`) and `background: tokens.surface`. Do NOT use a bordered/filled rounded box (`border: 1px solid hairline` + `borderRadius: RADIUS.rounded` + `background: tokens.bgSubtle`) for the search row — that is the legacy pre-Cycle-121 Select pattern and is a `LAY.STICKY-HEADER-RHYTHM-DRIFT` Medium finding. If the surface needs a divider below the search row, the parent container adds it as a separate element (not baked into `SearchBar`).
4. **Dividers below search are parent-container responsibility** — if a surface renders a hairline below `SearchBar`, that divider's negative horizontal margins MUST equal the outer container's padding scalar exactly (per Golden Rule #1's gutter-math clause). For `SPACE[2]` containers: `marginLeft: -SPACE[2]; marginRight: -SPACE[2]`. For `SPACE[1]` containers: `marginLeft: -SPACE[1]; marginRight: -SPACE[1]`. Off-by-tier negative margins are forbidden. Grep target: any hairline divider immediately after a `SearchBar` block whose negative margins do not match its parent's padding is a `LAY.DIVIDER-GUTTER-MISMATCH` Medium finding.
5. **Sticky-header background MUST equal the popover surface** — `background: tokens.surface` (or `tokens.darkSurface` on dark variants). Transparent or different-token backgrounds break the illusion that the header floats above scrolling content.
6. **Sticky-header `top: 0` and `zIndex: 1`** — relative to the inner scroll container's stacking context. Higher `zIndex` is unnecessary; the popover's own `Z.dropdown` covers cross-component layering.
7. **Canonical implementations** — `src/gallery/Menu.tsx` (source of the borderless + edge-to-edge divider pattern) and `src/gallery/Select.tsx` (post-Cycle-121, converged via user direction 2026-06-01 to adopt Menu's treatment). Both surfaces are interchangeable references for the sticky-search rhythm. When adding a third surface with a sticky search, diff against either; deliberate deviations MUST be called out in the cycle HANDOFF.

### Popover Container Contract — Ellipsis-Triggered Menus

Codifies the visual and behavioral treatment of `Menu` instances opened by an ellipsis-style trigger button (`…` horizontal three-dot or `⋮` vertical three-dot icon button — the conventional "more actions" affordance on cards, rows, headers, toolbars). User direction 2026-06-02 established this contract; rebuilt against **Select's built-in title-menu** (the ellipsis-triggered action menu rendered when the user clicks the icon button on Select's label, `src/gallery/Select.tsx:1578-1658`) as the canonical structural reference. Cycle 122-124 originally used Select's *dropdown* as the reference, which is the wrong surface for this contract; the title-menu rebuild is recorded in Cycle 126 (this codification cycle), with source implementation landing in the same cycle's bundle.

**Scope and carve-outs:**
- This contract codifies `Menu` instances opened by an ellipsis-style trigger. Other trigger shapes (icon-only action buttons, label+chevron triggers, etc.) may use Menu but are not bound by this contract; deliberate alignment with the contract is recommended but not enforced.
- `Select`'s **caret-down dropdown trigger** is explicitly outside this contract's scope. Select's dropdown popover has its own pattern (no row gap, `SPACE[2]` container padding, `TYPE.bodyM` font, left-only checkmark slot, no row fill on selection) and remains governed by Select's own contracts.
- `Select`'s **title-menu** (the ellipsis-triggered action menu inside Select itself, rendering "Hide search box / Group selected / Export to Excel / Advanced filter settings") is the **structural reference** for this contract. The Menu component must visually match the title menu on every shared concept after Cycle 126.

**Rules:**

1. **Container surface** — `border: 1px solid tokens.hairline` (light) / `tokens.darkBorderStrong` (dark), `borderRadius: RADIUS.rounded` (12 px), `boxShadow: elevation(tokens).mid`, `background: tokens.surface` (light) / `tokens.darkSurface` (dark). Container padding is **`SPACE[1]` (4 px) on all four sides** (matches title menu — NOT `SPACE[2]` which is Select dropdown's value). Any surface-token divergence is a `MENU.CONTAINER-SURFACE-DRIFT` (Medium) finding; container-padding drift from `SPACE[1]` is a `MENU.PADDING-NON-UNIFORM` (Medium) finding.
2. **Section model is fixed-order: Header → Search → List → Footer.** List is required; Header, Search, Footer are independently optional (these three are Menu-specific extensions on top of the title-menu pattern, which only has a list). Empty sections collapse fully — not rendered, no surrounding dividers. Out-of-order rendering is a `MENU.SECTION-ORDER-DRIFT` (Medium) finding.
3. **Per-section internal padding: `SPACE[1] SPACE[2]` (4 px vertical, 8 px horizontal) inside each section.** This is the row-padding scalar (matches the title menu's `padding: ${SPACE[1]}px ${SPACE[2]}px` for each item button). The outer `SPACE[1]` container padding (rule 1) plus the row's `SPACE[2]` horizontal padding together give the effective left/right inset for content.
4. **Row gap — 2 px between adjacent rows in the same section.** The List section's scrollable container uses `display: flex; flexDirection: column; gap: 2px` to separate rows (matches the title menu's `gap: 2`). Drift to flush (`gap: 0`) or wider (`gap: SPACE[1]`) is a `MENU.ROW-GAP-DRIFT` (Medium) finding.
5. **Section dividers** — `<div aria-hidden="true">` with `borderTop: 0.5px solid tokens.hairline` (light) / `tokens.darkBorderStrong` (dark), escaping the container's `SPACE[1]` padding via `marginLeft: -SPACE[1]; marginRight: -SPACE[1]` (matches title menu — see Golden Rule #1's clarified gutter-math clause + `LAY.DIVIDER-GUTTER-MISMATCH`). Vertical spacing around the divider: `marginTop: SPACE[1]; marginBottom: SPACE[1]` (4 px above, 4 px below). A divider is auto-inserted iff BOTH adjacent sections are rendered. Off-by-tier divider margins are a `LAY.DIVIDER-GUTTER-MISMATCH` (Medium) finding; missing dividers between adjacent rendered sections are a `MENU.MISSING-SECTION-DIVIDER` (Medium) finding.
6. **Sticky behavior — Header + Search sticky-top; List scrolls; Footer is sticky-bottom.** Header pins topmost, Search beneath Header when both present. List occupies the residual vertical space and scrolls independently when its rows overflow. **Footer is sticky-bottom** — always visible at the bottom of the popover, does NOT scroll with the list. The auto-inserted divider between List and Footer sits OUTSIDE the List's scrollable container (so its negative-margin edge-to-edge extension isn't clipped by the list's overflow context). Footer-divider clipping (e.g., due to placing the divider inside an `overflowX: hidden` container) is a `MENU.FOOTER-DIVIDER-CLIPPED` (Medium) finding. *(Rule rewritten 2026-06-02 per user direction: "the divider line for the menu at the right does not go from side to side, instead it is affected by the padding. Divider lines go from side to side." The prior wording — "List + Footer scroll together; Footer NOT sticky-bottom" — was visually-correct for short lists but caused the footer divider to be clipped by the list's overflow context when footer rendered inside the same scrollable container. Sticky-bottom Footer also keeps action items like Apply always reachable when the list is long.)*
7. **Width — fixed default with override.** Default `width: MENU_DEFAULT_WIDTH` (240 px — matches the title menu's `TITLE_MENU_WIDTH`). Consumer may override via the `minWidth` prop; if `minWidth` exceeds 240, the popover grows to fit. The popover does NOT auto-grow to fit content — long labels truncate via the row's ellipsis behavior.
8. **Height — viewport-clamped via the existing flip/measure logic.** `maxHeight = pos.maxHeight` (Menu's existing computed viewport-aware clamp). Sticky zone (Header + Search) consumes natural heights from the top of `maxHeight`; scrollable zone = `maxHeight − headerHeight − searchHeight − dividerCount × 0.5px`.
9. **Row geometry — two density tiers driven by `density` prop, applying to BOTH single-line and multi-line rows.** All list-item and footer-item rows use `padding: ${SPACE[1]}px ${SPACE[2]}px` (4 vertical / 8 horizontal), `borderRadius: RADIUS.soft` (8 px), and `TYPE.bodyS` (Inter 13 px weight 400) for the label — values shared across all density tiers. **Row `minHeight` varies by `density` prop AND by whether the row is multi-line:**

    | Density | Single-line (`!description`) | Multi-line (`description` present) |
    |---|---|---|
    | `"compact"` (recommended default tier) | `LIST_ROW.compact` (28 px) | 44 px |
    | `"default"` (alias for compact) | `LIST_ROW.compact` (28 px) | 44 px |
    | `"comfortable"` | `LIST_ROW.default` (32 px) | `LIST_ROW.multiline` (48 px) |

    **Multi-line MUST be density-aware** so the density prop produces visibly different rows on every row type — preventing the "compact and comfortable look the same" bug class where a story exercises only multi-line items and density drift becomes silently invisible. Both heights are wired through the `rowHeight` and `rowHeightMulti` props to `MenuRow`. `LIST_ROW.comfortable` (40 px) is NOT used by Menu's tiers; it stays in `src/layout.ts` for other surfaces (RailNav).

    User direction 2026-06-02 (re-introducing density tiers after Cycle 124's deprecation): *"the compact will use the 28px token and the comfortable will use the 32px token for the height... so in the Menu views you are putting the compact and comfortable side by side so if you apply my requirement I should see them different in height when looking at the Menu/default view."* Subsequent user direction (after multi-line items still appeared identical across density): *"this is the second time you fail when giving this instruction, fix it and find out what to do to prevent this error."* The fix: make multi-line height tier-driven too (eliminates the bug class).

    Row-height drift from the per-density mapping is a `MENU.ROW-HEIGHT-DRIFT` (Medium) finding; row-font drift from `TYPE.bodyS` is a `MENU.ROW-FONT-DRIFT` (Medium) finding.

    **Side-by-side density-comparison story authoring checklist** (prevents this error class from recurring):
    - **Both popovers' natural content height MUST fit within `maxHeight`** — otherwise both popovers clamp to the same `maxHeight` value and look visually identical regardless of row-height delta. Either reduce items, or pass an explicit `maxHeight` large enough to accommodate the taller (comfortable) variant.
    - **Avoid items configurations where every row is the same tier** — e.g., all-multi-line items would mask single-line density drift even if multi-line weren't density-aware. Now resolved structurally by making multi-line density-aware too.
10. **Row internal layout — `[icon slot 18px] [gap SPACE[2]] [label flex-1] [gap SPACE[2]] [optional shortcut] [indicator slot 18px]`.** Inline flex layout (no absolute positioning):
    - **Left icon slot — always reserved at 18 px width** (matches title menu — NOT conditional reservation, NOT 16 px). When the item has no `icon`, the slot renders empty (preserves alignment across all rows). Inline `<span>` with `display: inline-flex; alignItems: center; justifyContent: center; width: 18; flexShrink: 0`. The icon itself renders inside at 16 × 16 px (Fluent icon `size={16}` — sometimes 17 for select-all-style oversize icons, per the title menu's `iconSize` parameter).
    - **Gap to text — `SPACE[2]` (8 px)** between icon slot and text block (matches title menu's `gap: SPACE[2]` on the row flex container).
    - **Text block — label uses `TYPE.bodyS`**, truncated with `text-overflow: ellipsis; white-space: nowrap`. Optional description (when item has `description`) uses `TYPE.caption` color `tokens.textSubtle` on the line beneath the label; row uses `LIST_ROW.multiline` (48 px, see rule 12). The text block is `flex: 1` and `minWidth: 0`.
    - **Optional shortcut — to the LEFT of the right indicator slot** (`TYPE.caption` 12 px, `tokens.textSubtle`, `flexShrink: 0`, `marginLeft: SPACE[2]`). User-confirmed standard-pattern reading: `[icon] [label] [shortcut] [indicator]`.
    - **Right indicator slot — always reserved at 18 px width** (matches title menu — always reserved regardless of `checkable` / `checked` state). Inline `<span>` with `width: 18; flexShrink: 0`. Renders the selection-state indicator per rule 11 or empty when no indicator applies.

    Both 18 px slots are always reserved so text and labels align across heterogeneous mixed-state lists (some checkable, some not; some with icons, some without).
11. **Right indicator types — unchecked / checked / mixed.**
    - **Single-select items** (`checkable: true`, `checked: boolean | "mixed"`): unchecked renders nothing visible (slot stays reserved at 18 px); checked renders `IconCheckmark` (16 px, `tokens.accentText` enabled / `tokens.iconDisabled` disabled — matches title menu's selected-row treatment); mixed renders a 10 × 2 px horizontal dash with `borderRadius: 99` (pill stroke), `background: tokens.accentText` (matches title menu's mixed-state pill).
    - **Multi-select items** — same indicator rendering as single-select (title menu uses identical visuals for both modes).
    - **Action-only items** (neither `checkable` nor selection-tracked): right slot stays reserved at 18 px but renders nothing — keeps text alignment consistent across mixed-purpose menus.
12. **Multi-line row tier — density-aware per-item conditional.** Menu-specific extension (NOT in title menu, which is label-only). An item with `description` renders at the **density-appropriate multi-line height** per rule 9's table: 44 px for `"compact"` / `"default"`, 48 px (`LIST_ROW.multiline`) for `"comfortable"`. Items without descriptions in the same list use the single-line height for the same density (28 / 32 px). Heterogeneous mixed rows in one list are accepted — every row is the density-resolved tier for its own type. Label + description block is vertically centered within the multi-line row. Description NEVER wraps; truncates with `text-overflow: ellipsis` on a single line. Description uses `TYPE.caption` + `tokens.textSubtle` (slightly smaller than the label's `TYPE.bodyS`).
13. **Row state tokens — canonical table (drift to any value below is a `MENU.STATE-TOKEN-DRIFT` Medium finding):**

    | State | Background | Label color | Icon color | Icon fill | Font weight | Cursor |
    |---|---|---|---|---|---|---|
    | Rest (enabled) | transparent | `tokens.textMuted` | `tokens.textMuted` (via `currentColor`) | regular | `TYPE.bodyS.fontWeight` (400) | pointer |
    | Highlighted (hover / keyboard) | `tokens.hoverBg` | `tokens.ink` | `tokens.ink` (via `currentColor`) | **filled** | 400 | pointer |
    | Active (mouse-down) | `tokens.activeBg` + `boxShadow: inset 0 0 0 1px tokens.borderStrong` + `transform: translateY(1px)` | `tokens.ink` | `tokens.ink` | filled | 400 | pointer |
    | **Checked (selected) — hybrid title-menu + dropdown pattern** | **`tokens.bgSubtle` (filled background — title menu)** | `tokens.ink` | `tokens.ink` (via `currentColor`) | **filled** (selected state, regardless of hover) | **500 (bumped — dropdown pattern)** | pointer |
    | Mixed | `tokens.bgSubtle` | `tokens.ink` | `tokens.ink` | filled | **500 (same bump as checked)** | pointer |
    | Disabled | transparent | `tokens.textDisabled` | `tokens.iconDisabled` | regular | 400 | `DISABLED.cursor` |
    | Disabled + Checked | transparent (bgSubtle cancelled) | `tokens.textDisabled` | `tokens.iconDisabled` | regular | 400 (500 bump cancelled — matches Select dropdown's `disabled+checked` cancellation) | `DISABLED.cursor` |
    | Disabled + Mixed | transparent (bgSubtle cancelled) | `tokens.textDisabled` | `tokens.iconDisabled` | regular | 400 (bump cancelled) | `DISABLED.cursor` |
    | Danger (when `danger: true`) | transparent rest / `tokens.statusRedSubtle` highlighted | `tokens.statusRedText` rest and highlighted | matches label color (`currentColor`) | regular → filled | 400 | pointer |

    Important divergences from prior cycles:
    - **Selected/mixed rows combine BOTH `tokens.bgSubtle` background fill (title-menu pattern) AND `font-weight: 500` label bump (Select-dropdown pattern).** User direction 2026-06-02: *"use the same approach we did for the text on the dropdown menu list"* — apply Select dropdown's text-state behavior (weight bump on selected) on top of the title-menu's background-fill behavior.
    - Icon fill toggles on `selected` AND `mixed` AND `hovered` (the title menu's `filled={!disabled && (selected || mixedState || hoveredAction)}` logic). The Menu component implements this via `React.cloneElement(item.icon, { filled: !disabled && (isActive || isChecked || isMixed) })` so consumers don't need to manage icon state themselves.
    - Disabled cancels BOTH the bgSubtle fill AND the 500 weight bump (matches Select dropdown's full disabled-cancellation semantics).
    - Danger label uses `tokens.statusRedText` (NOT `tokens.statusRed` — the higher-contrast variant is the accessibility-correct choice for text per Cycle 124 `MED.AGENTS-DANGER-LABEL-TOKEN-DRIFT`).

14. **Focus visible — `data-highlighted` IS the focus signal for rows.** Menu rows are not tab stops (focus stays inside Menu while open); the existing `tokens.hoverBg` background + `tokens.ink` label/icon color on `data-highlighted` serves as the visual focus-visible treatment. No additional focus ring on rows. Footer buttons (when consumer includes a `<Button>` in the footer node) use the `Button` component's own `FOCUS.style` focus-visible treatment unchanged.
15. **Header section** — when provided (`header: { title: string; subtitle?: string; icon?: React.ReactNode }`), renders at the top with `padding: SPACE[1] 0` (vertical only — relies on outer `SPACE[1]` container padding for horizontal). Layout: optional 16 × 16 px leading icon (`tokens.textMuted`, not interactive), `SPACE[1]` gap, text block (title above subtitle when both present). Title: `TYPE.headingS` (Inter 16 px weight 500), color `tokens.ink`. Subtitle: `TYPE.bodyS` (Inter 13 px weight 400), color `tokens.textSubtle`. Vertical gap title→subtitle: `SPACE[1]` (4 px). No close button — clicking outside closes the menu via the existing pattern. Title menu does not have a header section — Menu-specific extension.
16. **Footer section** — when provided (`footer?: MenuItem[]`), footer items render in a divider-separated zone after the list. Footer items use the SAME visual treatment as List items (rules 9–13). Title menu's "Advanced filter settings" item (visually divider-separated from the actions above) is the closest title-menu equivalent to this footer pattern. **Note: AGENTS rule 16 wording refinement** — earlier wording (Cycle 123) typed footer as `React.ReactNode`; Cycle 124 source narrowed to `MenuItem[]` to make rule 17's continuous keyboard nav implementable. This rule confirms the typed-array shape. An Apply-button or other non-MenuItem footer affordance can be composed as a MenuItem with appropriate label/icon.
17. **Footer keyboard navigation — continuous flow with the List.** Arrow-down from the last list item moves focus to the first footer item; arrow-up from the first footer item returns to the last list item. Enter / Space activates whatever has focus (special item, button, etc.). Tab is not used inside Menu (focus trap). Disabled items are skipped on arrow nav per the existing `findFirstEnabled` pattern.
18. **Empty / no-results state** — when `items.length === 0` after filter (or with no items provided), the List section renders the existing `emptyText` (default: "No results") in a single non-interactive row with `LIST_ROW.compact` height, same per-item padding, `color: tokens.textSubtle`, no hover state, `cursor: default`. Behavior unchanged from current Menu.
19. **`density` prop — un-deprecated 2026-06-02; functional row-height tier selector.** The Cycle 124 deprecation + Cycle 130 sunset of the `density` prop is **REVERSED** per user direction 2026-06-02: *"the compact will use the 28px token and the comfortable will use the 32px token for the height."* `density?: MenuDensity` is now a working prop that drives row `minHeight` per the rule 9 mapping (`"compact"` / `"default"` → 28 px; `"comfortable"` → 32 px). The `@deprecated` JSDoc tag is removed; the dev-mode `console.warn` is removed. The `MenuDensity` type continues to export `"compact" | "default" | "comfortable"` for back-compat. No sunset planned. The `MENU.DENSITY-PROP-USE` audit ID is retired (passing `density` is now a valid pattern, not a finding).
20. **Canonical implementations** —
    - **`src/gallery/Menu.tsx`** post-Cycle 126 refactor is the canonical Menu implementation for ellipsis-triggered surfaces.
    - **`src/gallery/Select.tsx:1578-1658`** (Select's built-in title menu) is the **structural reference** for the contract — the Cycle 126 rebuild uses it as the source of truth for container padding, row gap, slot reservations, font, divider geometry, and selected-row background fill.
    - Select's **dropdown** popover (`src/gallery/Select.tsx:1055-1170` outer container, `1476+` row CSS) is NOT the reference and remains governed by Select's own contracts.
    - New ellipsis-triggered menu surfaces in this design system MUST diff against `src/gallery/Menu.tsx` and call out deliberate divergences from this contract in the cycle HANDOFF.

21. **Group headers (collapsible-aware alignment + state styles).** When `groups` is provided, each group renders a header row above its items. Group headers are NOT body rows — they have their own structural rules but MUST follow the same icon-size and state-style contracts as body rows. *(Codified after user direction 2026-06-02 flagged a gap: "the chevron icon doesnt follow the size for icon in the menu as it looks super small and it doesnt follow the icon and font states styles we define for them, i thought we have good rules and contracts about this so we need to check whats going on and why we are still missing this contracts." That gap is closed by this rule.)*

    **a. Alignment — conditional chevron slot reservation (mirrors rule 10's row-level conditional slot logic).** Compute `anyCollapsible = !!groups?.some(g => g.collapsible)`. If `anyCollapsible` is true, **every** group header reserves an 18 px chevron slot (the same `ROW_SLOT` constant used by row icons), so labels align consistently across all headers regardless of which individual group is collapsible. If `anyCollapsible` is false, NO slot is reserved — labels align flush left at the container's left padding. Non-conditional always-reserved or always-omitted slot is a `MENU.GROUP-HEADER-ALIGNMENT-DRIFT` (Medium) finding.

    **b. Chevron icon.** `IconChevronDown` from `../icons`. Size: **16 px** (matches the row icon size per rule 10). Color: `currentColor` (inherits from the header's text color so state-driven label color cascades). Rotation: `rotate(-90deg)` when collapsed, `rotate(0)` when expanded. **State-driven `filled` variant — CSS render-both, NOT React state.** Render BOTH variants (regular + filled) as sibling spans (`<span class="ds-menu-chevron-regular">` and `<span class="ds-menu-chevron-filled">`); CSS toggles which is visible based on the parent header's `:hover` pseudo-class:

    ```css
    .ds-menu-chevron-regular,
    .ds-menu-chevron-filled {
      position: absolute;
      inset: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .ds-menu-chevron-filled { visibility: hidden; }
    .ds-menu-group-header[data-collapsible]:hover .ds-menu-chevron-regular { visibility: hidden; }
    .ds-menu-group-header[data-collapsible]:hover .ds-menu-chevron-filled { visibility: visible; }
    ```

    The wrap (`.ds-menu-chevron`) MUST have explicit `position: relative; width: 16; height: 16` so the absolute children have a sized anchor.

    **Why CSS render-both, not React state** — earlier implementations tracked `hoveredGroup: string | null` via `onMouseEnter` / `onMouseLeave`. That state could get stuck out of sync with the browser's actual hover position when the DOM layout shifted (e.g., on collapse/expand: items below the clicked header collapse, the cursor's element-under-pointer changes, but if the cursor was already on a group header that didn't move, the browser doesn't fire mouseLeave on it — so the React state never clears). CSS `:hover` is browser-managed and ALWAYS reflects the current cursor position. **For any visual-only hover state on a Menu surface element, prefer CSS `:hover` over React state.**

    **Why `visibility` swap with `position: absolute`, not `display` swap** — toggling `display: none ↔ inline-flex` on the variant spans causes a subtle but visible layout shift on the group header's height. Reason: a `<span>` with no explicit `display` defaults to inline, so its SVG child renders as inline content (baseline-aligned within the line-box). The same `<span>` with `display: inline-flex` makes its SVG child a flex item (centered within the flex container). The line-box height calculation differs between the two modes, and that difference cascades up to the group header's height — which moves the items below up/down on hover. Using `position: absolute` (so both variants OVERLAY in the same fixed 16×16 box on the wrap) + `visibility: hidden ↔ visible` (which preserves layout footprint) is the correct robust pattern. Reaching for `display: none` to hide one variant is a `MENU.CHEVRON-LAYOUT-SHIFT` (Medium) finding even if the chevron visually appears correct.

    Chevron drift to a smaller size, missing `currentColor`, fixed-regular `filled`, React-state-based hover tracking that lacks proper mouseLeave clearing, OR a display-swap variant-toggle approach that causes layout shift is a `MENU.GROUP-HEADER-CHEVRON-DRIFT` (Medium) finding.

    **c. Group header state styles** (mirrors rule 13's row state pattern, scoped to collapsible headers only):

    | State | Background | Label color | Chevron fill | Cursor |
    |---|---|---|---|---|
    | Rest (collapsible OR non-collapsible) | transparent | `tokens.textMuted` | regular | non-collapsible: `default` / collapsible: `pointer` |
    | Hover (collapsible only) | `tokens.hoverBg` | `tokens.ink` | **filled** | `pointer` |
    | Non-collapsible | transparent | `tokens.textMuted` (no hover state) | N/A (no chevron renders) | `default` |

    Header text uses `TYPE.caption` (Inter weight 400, line-height 1.5) **with `textTransform: uppercase`, `letterSpacing: 0.04em`, and a `fontSize: 10` override** (overriding caption's default 12 px). Rationale: uppercase glyphs render ~1.2× taller than lowercase, so 10 px uppercase ≈ 12 px plain lowercase visually. Net effect: Menu's categories appear at the same **visual** size as Select's plain dropdown group headers (`Select.tsx:1215-1230` "Selected" header + `Select.tsx:1315-1320` "Available" header, both at plain `TYPE.caption` 12 px without uppercase). The uppercase + letter-spacing is the deliberate visual cue that this row is a CATEGORY, not a list item, supporting the two-level nesting model codified in **Golden Rule #2** (max two levels: category + items).

    User direction history (sequential, recorded as the durable trail):

    1. *"make the categories capital... in that way there is a visual differentiation between the category and the list items"* (uppercase + letter-spacing added).
    2. *"but making it capitals you remove the smallest token font size"* (fontSize: 10 override added to keep small visual size despite uppercase).
    3. *"is that the same token used for the categories used on the select dropdown menu?"* + *"Make BOTH use TYPE.caption (12 px) + uppercase + letter-spacing"* (briefly tried full token parity by adding uppercase to Select dropdown).
    4. *"i think the other way would be better, the font sized used on the dropdwon slect should be used for the menu"* (reverted to current state — visual size parity, Select stays plain at its native 12 px, Menu uses 10 px override + uppercase to match Select's visual size).

    **Cross-surface relationship:** Select's dropdown group headers stay at plain `TYPE.caption` 12 px (no uppercase, no letter-spacing). Menu's group headers use the same `TYPE.caption` family / weight / line-height but override fontSize to 10 and add uppercase + letter-spacing. The two surfaces have DIFFERENT token values for category styling but produce the SAME visual height — visual parity, not token parity. Removing the uppercase transform, removing the letter-spacing, OR removing the `fontSize: 10` override on Menu's group headers is a `MENU.GROUP-HEADER-CASE-DRIFT` (Medium) finding. Adding uppercase to Select's dropdown group headers (re-converging the token treatment) is also caught by this audit because user direction #4 explicitly reverted that path. Header `borderRadius` is `RADIUS.soft` (8 px) so the hover background tints to a soft pill matching body rows. State-style drift (no hover bg, no text color change on hover, fixed `tokens.textMuted` regardless of state) is a `MENU.GROUP-HEADER-STATE-DRIFT` (Medium) finding.

    **d. Padding + gap (alignment math with body rows).** Group header `padding: ${SPACE[2]}px ${SPACE[2]}px ${SPACE[1]}px` (top 8 / right 8 / bottom 4 / left 8 via 3-value CSS shorthand) + `gap: SPACE[2]` (8 px between flex children). When `anyCollapsible`, label text starts at `8 (padding-left) + 18 (chevron slot) + 8 (gap) = 34 px` from the header's left edge — **matching body row label text-left position** (rule 10's `8 + 18 + 8 = 34 px`). Padding mismatch with row labels is a `MENU.GROUP-HEADER-PADDING-DRIFT` (Medium) finding.

    **e. Items inside a group are indented (sidebar nesting pattern).** Items rendered inside a group receive an additional `SPACE[3]` (12 px) added to their `paddingLeft`, so their text starts at `8 (ROW_PAD_X) + 12 (group indent) + 18 (left slot) + 8 (gap) = 46 px` from the row's left edge — visually indented from the group header's text (34 px) by 12 px. This mirrors the RailNav panel item nesting pattern (each depth level adds an indent). Implemented via a `indentLeft: number` prop on `MenuRow` that's added to `paddingLeft`. Ungrouped items receive `indentLeft: 0`. Missing or inconsistent group-item indent is a `MENU.GROUP-ITEM-INDENT-DRIFT` (Medium) finding.

    **f. CORE hover-state principle — applies to ALL Menu surface elements, not just group headers.** Any element whose visual state depends on mouse hover MUST use one of these two patterns:

    1. **CSS `:hover` only** (preferred for visual-only state) — browser-managed, always reflects the cursor's current position, NEVER gets stuck after layout shifts.
    2. **React state with PAIRED `onMouseEnter` + `onMouseLeave`** (when needed for non-visual side effects, e.g., setting `activeIndex` for keyboard nav integration). The `onMouseLeave` MUST conditionally clear the state when the value matches the leaving element's identifier.

    React state hover tracking WITHOUT a paired mouseLeave (the antipattern that caused the stuck-highlight bug on rows after the cursor moved to a group header) is a `MENU.HOVER-STATE-STUCK` (Medium) finding. For any new Menu surface element that needs hover-driven visuals, default to CSS `:hover`. Use React state only when the hover state must drive logic outside the element's own CSS (e.g., the row's `activeIndex` integrates with the keyboard-Enter activation path). When you DO use React state, this rule REQUIRES both enter and leave handlers — paired, never solo.

**Removed rules (formerly Cycle 123 rules 10 + "Cycle 124 symmetric-padding amendment"):**

- ~~Rule 10: Conditional left-icon-slot reservation~~ — REMOVED. The title menu always reserves the left slot at 18 px regardless of whether items have icons. The conditional reservation pattern (from Cycle 124) is retired; `MENU.ICON-SLOT-NON-CONDITIONAL` audit ID is now obsolete and replaced by the always-reserved expectation in rule 10.
- ~~Cycle 125 symmetric 8 px row padding amendment~~ — REVERTED. Symmetric 8 px padding with no reserved slots was a misreading of the contract intent that should have always been based on the title menu. The rebuild restores both reserved slots.

### Stacking Contexts & Overlays
1. **Do not create unnecessary stacking contexts** — avoid `position: relative; z-index: N` unless layering is required within the component. Unnecessary stacking contexts trap dropdowns, tooltips, and popovers.
2. **Menus, popovers, and dropdowns MUST be viewport-aware** — measure available space above/below the trigger with `getBoundingClientRect()`. Flip direction and/or cap `maxHeight` with scroll when the menu would be clipped.
3. **Tooltips and menus must escape parent overflow** — do not place `overflow: hidden` on a container whose children include absolutely-positioned tooltips or menus. If overflow constraint is needed for layout (e.g., flex measurement), use a separate measurement strategy that avoids clipping overlays.
4. **Overflow measurement must be robust** — do not measure an element whose `overflow` or flex behavior makes `clientHeight` unreliable. Prefer measuring a stable ancestor and subtracting sibling heights.
5. **RailNav owns a dedicated `Z.rail` (30) stacking level — a SANCTIONED exception to rule #1.** The rail root (`<aside>` in `RailNav.tsx`) sets `position: relative; zIndex: Z.rail` (above `Z.sticky` = 20) so its right-edge elevation shadow is never truncated by a consumer's sticky header/slicer band. This is both necessary AND safe: every menu, dropdown, tooltip, and dialog portals to `<body>` with `position: fixed` per **Golden Rule #3**, so it escapes `#root`'s stacking context entirely and always paints above the rail — `Z.rail` only competes with in-page chrome, never with portaled overlays. **Do NOT flag `Z.rail` (or the `<aside>`'s `position:relative`) for cleanup under rule #1 — it is load-bearing.** See § "RailNav Panel Header Menu" and Golden Rule #3. (owner-caught 2026-07-20.)
   - **Consumer guidance:** a viewport-bounded app shell (fixed rail as the first flex child + a scrolling content column) must keep its sticky header/slicer band at `Z.sticky` (20) and **MUST NOT raise it to or above `Z.rail` (30)** — doing so re-clips the rail's elevation shadow across the header row.

### RailNav Logo
1. **Logo always has a tooltip** — defaults to "BiDezine", shown on hover
2. **When changing the logo**, always ask the user: (a) tooltip text, (b) whether the logo should be clickable
3. **Interactive logos** get hover/pressed/focus states automatically via `onLogoClick`
4. **`logoLabel` prop** controls both tooltip text and aria-label

### RailButton Tooltip Contract

Codifies the required code structure for tooltips on ALL rail icon buttons (section buttons, footer utility buttons, logo). Established 2026-06-11 after repeated tooltip failures caused by: (a) story utility buttons using browser-native `title` instead of the custom tooltip, (b) tooltip clipping from `overflow: clip` on ancestor containers, (c) multiple story button functions duplicating tooltip logic inconsistently.

**Required code structure — every rail icon button with a tooltip MUST follow this pattern:**

```tsx
// ✅ CORRECT — wrapper div owns position:relative + hover state; tooltip is sibling of button
<div
  style={{ position: "relative" }}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>
  <button
    aria-label={tooltipText}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    style={{ /* button styles — NO title attribute */ }}
  >
    <Icon size={20} color="currentColor" filled={hovered} />
  </button>
  {showTooltip && (
    <span
      role="tooltip"
      style={{
        position: "absolute",
        left: `calc(100% + ${LAYOUT.panelGap}px)`,
        top: "50%",
        transform: "translateY(-50%)",
        height: 24,
        padding: `0 ${SPACE[2]}px`,
        display: "inline-flex",
        alignItems: "center",
        background: tokens.darkSurface,
        border: `0.5px solid ${tokens.darkBorderStrong}`,
        borderRadius: RADIUS.tooltip,
        ...TYPE.labelM,
        color: tokens.onDark,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: Z.dropdown,
        boxShadow: elev.mid,
      }}
    >
      {tooltipText}
    </span>
  )}
</div>
```

**Rules:**

1. **Wrapper `<div style={{ position: "relative" }}>` is MANDATORY.** The tooltip uses `position: absolute` relative to this wrapper. Without it, the tooltip positions relative to a distant ancestor and appears in the wrong location.
2. **`onMouseEnter`/`onMouseLeave` go on the wrapper div, NOT the button.** This ensures the hover state is tracked even when the cursor moves between the button and the tooltip span (which has `pointerEvents: none`).
3. **`onFocus`/`onBlur` go on the button** (for keyboard accessibility).
4. **`showTooltip = (hovered || focused)`** — tooltip appears on both mouse hover and keyboard focus.
5. **No `title` attribute on the button.** Browser-native `title` tooltips look different from the custom design-system tooltip. Using `title` is a `CP.RAIL-TOOLTIP-NATIVE-TITLE` (Medium) finding.
6. **`aria-label` on the button provides accessibility.** The custom tooltip is visual-only (`role="tooltip"` for semantics, but no `aria-describedby` — would double-announce since the tooltip text matches `aria-label`).
7. **Button size MUST be `LAYOUT.railButton` (38 px).** Not `LAYOUT.hitTarget` (40 px). Rail buttons follow Figma source of truth per Golden Rule #4.
8. **Tooltip `borderRadius` MUST be `RADIUS.tooltip` (6 px).** Not `RADIUS.soft` (8 px). Tooltip flyouts have their own radius tier.
9. **Tooltip offset is `LAYOUT.panelGap`** (8 px gap between rail edge and tooltip left edge).

**Disabled buttons MUST NOT show tooltips:**

- Disabled buttons (e.g., a disabled profile icon) do NOT render a tooltip. A disabled button communicates "unavailable" — showing a tooltip on hover contradicts that signal.
- Disabled buttons render as a plain `<button disabled>` with `cursor: "not-allowed"` and `color: tokens.onDarkDisabled`. No wrapper div, no hover tracking, no tooltip span.
- `aria-label` still applies on disabled buttons (screen readers announce the name even on disabled controls).

**Forbidden patterns (audit findings):**

| Pattern | Why it fails | Audit ID |
|---|---|---|
| `<button title="Settings">` | Browser-native tooltip looks different from DS tooltip | `CP.RAIL-TOOLTIP-NATIVE-TITLE` |
| Tooltip `<span>` without wrapper `<div position:relative>` | Tooltip positions relative to wrong ancestor | `CP.RAIL-TOOLTIP-NO-WRAPPER` |
| `onMouseEnter`/`onMouseLeave` on `<button>` instead of wrapper | Hover state inconsistent when cursor crosses button boundary | `CP.RAIL-TOOLTIP-HOVER-ON-BUTTON` |
| `borderRadius: RADIUS.soft` on tooltip | Wrong radius tier — tooltips use `RADIUS.tooltip` (6) | `CP.RAIL-TOOLTIP-RADIUS-DRIFT` |
| `LAYOUT.hitTarget` for button size | Rail buttons are 38 px per Figma, not 40 px | `CP.RAIL-TOOLTIP-SIZE-DRIFT` |
| Tooltip on a disabled button | Disabled controls should not show tooltips | `CP.RAIL-TOOLTIP-ON-DISABLED` |

**Canonical implementations:**
- `src/gallery/RailNav.tsx` — `RailButton` function (section icons) and `LogoSlot` function (logo tooltip)
- `src/gallery/RailNav.stories.tsx` — `FigmaAuditSettingsButton` (footer utility example)

**Ancestor overflow protection:** No ancestor container between the wrapper div and the rail's `<aside>` may use `overflow: hidden` or `overflow: clip`. The footer container (`footerSlotRef`) and nav column (`navColumnRef`) must NOT have overflow constraints that would clip the tooltip. See "Tooltips, Menus & Overlays" hard rule and the 2026-06-11 fix history.

**Origin & history:** User direction, 2026-06-11: *"document this behaviour and how the code needs to be structured so we never run into so much trouble trying to make the tooltip work in the rail in all its sections"* + *"I don't want tooltips for disabled buttons."* Codified after five separate troubleshooting rounds: (1) `overflow: clip` on NavColumn clipping tooltips, (2) `overflow: clip` on footer clipping tooltips, (3) story utility buttons using native `title` instead of custom tooltip, (4) story buttons using wrong functions (`SettingsButton` vs `FigmaAuditSettingsButton`), (5) `borderRadius` drift between story tooltips and canonical RailButton tooltips.

### RailNav Panel Header Menu

Codifies the `PanelHeaderMenu` element — the ellipsis (`⋯`) icon button in the panel header row that opens an action popover. Figma reference: **Single shape / PanelHeader** (node `209-3944`).

**Header row layout (left → right):**
```
[section title  flex:1] [PanelHeaderMenuButton 28×28] [CollapseButton 28×28]
```
The `PanelHeaderMenuButton` sits between the title and the collapse chevron. It is only rendered when `panelMenuItems` is provided and non-empty.

**Trigger button geometry (from Figma `layout_YPU07J`):**
- Size: **28×28 px** (matches `CollapseButton` sibling)
- Border radius: **`RADIUS.xs` (4 px)** — tight icon button tier
- Icon: `IconEllipsis` (More Horizontal), **size 20** within the 28 px button
- Padding: `0` (icon centred via flex)

**State tokens (Button States contract + Figma fill vars):**

| State | Background | Icon color | Icon fill |
|---|---|---|---|
| Rest | transparent | `tokens.textMuted` | regular |
| Hover | `tokens.hoverBg` | `tokens.ink` | filled |
| Pressed | `tokens.bgStrong` | `tokens.ink` | filled |
| Open (menu visible) | `tokens.hoverBg` | `tokens.ink` | filled |
| — open counts as "engaged" so the button stays highlighted while the menu is visible |

**Popover (Popover Container Contract):**
- `background: tokens.surface`, `border: 1px solid tokens.hairline`, `borderRadius: RADIUS.rounded` (12 px), `boxShadow: elev.mid`
- Container `padding: SPACE[1]` (4 px all sides)
- Row gap: **2 px** (flex column, `gap: 2`)
- Positioned: `right: 0`, `top: calc(100% + SPACE[1])` below button; flips to `bottom: calc(100% + SPACE[1])` when near viewport bottom
- `minWidth: 200 px`

**Row geometry (PanelMenuRow):**
- `minHeight: 28 px`, `padding: SPACE[1] SPACE[2]` (4 px × 8 px), `borderRadius: RADIUS.soft` (8 px)
- Font: `TYPE.bodyS` (Inter 13 px weight 400)
- Left icon slot: **18×18 px** (always reserved; icon renders at 16 px)
- Gap icon → label: `SPACE[2]` (8 px)

**Row state tokens:**

| State | Background | Color |
|---|---|---|
| Rest | transparent | `tokens.textMuted` |
| Hover | `tokens.hoverBg` | `tokens.ink` |
| Pressed | `tokens.activeBg` + `inset 0 0 0 1px tokens.borderStrong` | `tokens.ink` |
| Danger (rest) | transparent | `tokens.statusRedText` |
| Disabled | transparent | `tokens.textDisabled` |

**Props on `RailNavProps`:**
- `panelMenuItems?: PanelHeaderMenuItem[]` — items to render; omit to hide the button entirely
- `onPanelMenuAction?: (itemId: string) => void` — called when the user activates an item
- `panelMenuAriaLabel?: string` — aria-label for the trigger button (default: `"Panel actions"`)

**`PanelHeaderMenuItem` type:**
```ts
export interface PanelHeaderMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; color?: string; filled?: boolean }>;
  danger?: boolean;   // renders label in statusRedText
  disabled?: boolean;
}
```

**Keyboard / focus behaviour:**
- Button toggles the menu on Enter/Space/click; `aria-haspopup="menu"`, `aria-expanded={open}`
- Menu auto-focuses first enabled item on open
- Arrow Up/Down navigate items (wraps); Home/End jump to first/last
- **Escape** inside the popover closes the menu and returns focus to the trigger button
- Outside-click closes the menu and returns focus to the trigger button
- Disabled items are skipped (native `disabled` attribute + filtered from arrow-key targets)

**Audit catalog IDs:**
- `CP.PANEL-HEADER-MENU-SIZE-DRIFT` (Medium) — button or icon deviates from 28×28 / `RADIUS.xs` / `IconEllipsis size={20}`
- `CP.PANEL-HEADER-MENU-TOKEN-DRIFT` (Medium) — state tokens diverge from the table above
- `CP.PANEL-HEADER-MENU-ROW-DRIFT` (Medium) — row geometry deviates from 28 px / `SPACE[1]×SPACE[2]` / `TYPE.bodyS`

**Canonical implementation:** `src/gallery/RailNav.tsx` — `PanelHeaderMenuButton`, `PanelHeaderMenuPopover`, `PanelMenuRow`.



The `<aside>` wrapper that contains the rail column (and optional panel) uses asymmetric padding: `SPACE[2]` (8 px) on the **top, bottom, and left** sides, and **0** on the **right** side. This keeps the right edge of the component flush with the adjacent content area — no external right gutter.

- **Canonical value:** `padding: ${SPACE[2]}px 0 ${SPACE[2]}px ${SPACE[2]}px`
- **Right = 0 is intentional.** Do NOT "fix" it to uniform `SPACE[2]`. Adding right padding is a layout contract violation.
- Any drift to `padding: SPACE[2]` (all-sides uniform) or explicit `paddingRight: SPACE[2]` is a `CP.RAIL-OUTER-RIGHT-PADDING-DRIFT` (Medium) finding.

### RailNav Density

1. **Rail computed width = 54px** — `LAYOUT.railW = 54` = `SPACE[2]` (8px pad-left) + 38px (button) + `SPACE[2]` (8px pad-right). Figma `layout_CHBUBF` is `sizing: hug` with `padding: 8px` wrapping a 38px-wide column. GR4 corrected from 56 (2026-06-10).
2. **Two-tier density contract** — the dark rail buttons (toolbar tier) read at `LAYOUT.railButton` (38px — Figma source of truth), while the panel nav items (list tier) read at `LIST_ROW.compact` (28px — Figma NavRow natural height: 4+20+4, GR4 corrected from 32px). The panel header toolbar buttons use `LAYOUT.hitTarget` (40px). The two tiers MUST NOT be conflated; they exist to mirror the contrast between persistent toolbar surfaces and scannable list surfaces (same idiom used by the Select dropdown rows).
2. **Panel item geometry is fixed** — `minHeight: LIST_ROW.default` (32), `padding: SPACE[1] SPACE[2]` (4×8), nested indent `SPACE[4]` (16) per depth. Do NOT introduce per-call overrides. New row variants require a new constant on `LIST_ROW`.
3. **Toolbar tier is reserved for rail / collapse / overflow / logo** — anything that is a "control over a region" rather than "an item within a list" stays at `LAYOUT.hitTarget`. The collapse button, the rail section buttons, the overflow `More` button, and the section title-row all sit in this tier.
4. **Audit requirement** — `audit:components` must flag any RailNav nav-item branch that uses `LAYOUT.hitTarget` for its `minHeight` as a `CP.NAVITEM-TOOLBAR-TIER-MISUSE` Medium finding. Grep target: `minHeight:.*LAYOUT\.hitTarget` inside `PanelItem` / `NestedSubGroup` / `PanelGroup` definitions.

### List Row Geometry (opt-in pattern)

A shared row recipe used by surfaces that present a vertical list of selectable items (Select dropdown rows, RailNav panel items, future menus, future filter pickers). The recipe exists so the design system has one canonical compact list tier instead of each component negotiating its own padding numbers. It is **opt-in**: a component adopts the recipe only when the user explicitly directs it (e.g. "apply the List Row Geometry to X"). Default behavior of any new component is NOT to assume this recipe.

1. **Canonical row recipe** — when applied, a list row reads as:
   - `minHeight`: `LIST_ROW.default` (32 px)
   - Vertical padding: `SPACE[1]` (4 px) on top and bottom
   - Horizontal padding: `SPACE[2]` (8 px) on both sides at depth 0
   - Icon ↔ label gap: `SPACE[2]` (8 px)
   - Border radius: `RADIUS.soft` (8 px)
   - Font: `TYPE.bodyM` (14 px / 1.55 line-height) — NOTE: NavRow and SelectRow Figma specs now use `TYPE.bodyM` (14px) at rest and `TYPE.labelL` (14px/500) at active. Updated 2026-06-13 per user direction. ActionMenu/Menu surfaces retain `TYPE.bodyS` (13px) and `TYPE.labelM` (13px/500).
   - Icon size: 20 px
2. **Nesting indent** — when the surface supports depth, each level adds `SPACE[4]` (16 px) of left padding. When a vertical disclosure line is rendered at the parent icon center, nested rows ALSO add `SPACE[1]` (4 px) of "line clearance" to their left padding so the row content does not visually touch the line. The line itself sits at `SPACE[2] + (depth − 1) × SPACE[4] + 10` from the panel's left edge (the +10 is half the parent icon width).
3. **Density tier swap** — denser surfaces may use `LIST_ROW.compact` (28 px) and looser ones `LIST_ROW.comfortable` (40 px). When swapping, keep the same padding scalars and the same icon size; only the `minHeight` token changes. Do NOT introduce custom row heights outside the `LIST_ROW` set.
4. **Always opt-in** — a component switches to this recipe only on explicit user request, and the request MUST be recorded in the component's HANDOFF for the cycle (so the Governor can audit it). The Implementor MUST NOT silently apply this recipe to a component that has its own established geometry.
5. **Canonical implementations to reference** —
   - Select dropdown rows: `src/gallery/Select.tsx` (`.ds-select-item` CSS block + the indicator slot offset).
   - RailNav panel items: `src/gallery/RailNav.tsx` (`PanelItem`, `NestedSubGroup`, `PanelGroup`). Includes the nesting + line-clearance variant.
   - When adopting the recipe for a new component, the Implementor SHOULD diff against one of these two surfaces and call out any deliberate deviations in the HANDOFF.
6. **Audit catalog ID** — `CP.LIST-ROW-DRIFT`. Triggered when a component that the user has marked as "uses List Row Geometry" defines literal pixel heights, non-`SPACE[1]` vertical padding, non-`SPACE[2]` horizontal padding, non-`SPACE[2]` icon gap, non-`SPACE[4]` indent step, or non-`SPACE[1]` line clearance. Flagged as Medium; gates `beta` promotion.

### Button States

The "calm rest → progressive engagement" contract for interactive controls that present text on a neutral surface. Codified after a Cycle 113 → 114 audit revealed Button rendered its label at full `ink` intensity from the resting state with no progression on hover, breaking parity with every other gallery surface in the same idiom.

1. **Calm rest → progressive engagement** — controls that render text on a neutral surface MUST start at a softer text token (`textMuted` or `textSubtle`) and promote to `ink` only on engagement (`hovered || pressed || open`). The resting tier MUST be perceptibly softer than the engaged tier. `:focus-visible` is an **indicator** signal (use `FOCUS.style(tokens)` outline ring), not an engagement signal; it does NOT promote text color on its own.
2. **Engagement precedence** — `disabled > error > (hovered || pressed || open) > resting`. Disabled always wins (use `textDisabled` / `iconDisabled` per the Cycle 109 disabled-tokens migration). Error wins next where applicable (e.g. TextInput border `statusRed`). Then engagement promotes text/border/bg to their `ink` / `accent` tiers. Resting is the calmest reading.
3. **Saturated-CTA exception** — variants that render text on a saturated accent background (`Button` solid variant, future filled CTAs) keep `tokens.onDark` text at full intensity regardless of state — the white-on-accent identity IS the engagement signal. Do NOT apply the calm-rest → ink progression to these variants.
4. **No `fontWeight` hardcodes** — components MUST let their assigned `TYPE.*` token drive `fontWeight` naturally. Hardcoding `fontWeight` in the inline style object silently violates the TYPE token contract (e.g. bumping `TYPE.bodyS` from 400 → 500 inside Button's `sm` size). If a different weight is genuinely required, use a different TYPE token (`TYPE.strong` / `TYPE.medium` / `TYPE.light` modifiers) rather than a literal number.
5. **Canonical implementations** —
   - Button outline + ghost variants: `src/gallery/Button.tsx` (post-Cycle-114) — `color: isDisabled ? textDisabled : (hovered || pressed) ? ink : textMuted`.
   - Select trigger open state: `src/gallery/Select.tsx` — `borderColor` precedence `error > (focusVisible || open) > hover > resting`, paired with `FOCUS.style` spread under the same `(focusVisible || open)` condition for the double-outline treatment.
   - Select option rows: `src/gallery/Select.tsx` `.ds-select-item` CSS block — `textMuted` resting, promotes to `ink` on `data-highlighted`.
   - RailNav nav items: `src/gallery/RailNav.tsx` — `textMuted` resting, promotes to `ink` on hover / `hasActiveChild`.
   - TextInput border: `src/gallery/TextInput.tsx` — `border` resting, promotes to `borderStrong` on hover, `accent` on `focusVisible`.
6. **Audit catalog IDs** —
   - `CP.STATE-PROGRESSION-MISSING` — a non-saturated-CTA control renders text / border / bg at full `ink` / `accent` intensity in its resting state with no progression on hover (`hovered || pressed || open`). Grep target: any palette/branch object inside a gallery component where `color: tokens.ink` (or equivalent) appears WITHOUT a co-located `hovered` / `pressed` / `open` predicate. Flagged as Medium; gates `beta` promotion.
   - `CP.TYPE-WEIGHT-OVERRIDE` — a component hardcodes `fontWeight` outside its `TYPE.*` token. Grep target: `fontWeight:\s*\d+` inside any `src/gallery/*.tsx` `style={}` object. Flagged as Medium; gates `beta` promotion.

### Documentation
1. **Any token/font/icon change MUST update docs** — CLAUDE.md, registry JSON, and user memory
2. **Architecture decisions go in `docs/decisions/`** as numbered ADRs
3. **Audit results go in `docs/audits/`** with timestamps

## Consumer Projects

| Folder | npm name | Description | Status |
|---|---|---|---|
| `apps/bloodwork-dashboard` | `bloodwork-dashboard-prototype` | Personal health dashboard | Active (pattern source) |
| `apps/databases-dashboard` | `fabric-app-data-template` | Fabric Apps template (Databases reporting) | Active |
| Customer 360 | — | Account analytics | Future |
| My-Ops-Hub | — | Operations hub | Future |

Consumers live at `Workspaces/apps/*/`; this package lives at `Workspaces/systems/design-system/`. The local install path from a consumer is `file:../../systems/design-system`.

## Token Architecture

### Three-Layer Model
```
Primitive tokens   → raw values: color/blue/500, spacing/4, radius/2
Semantic tokens    → intent: text/ink, background/surface, accent/default
Component tokens   → component-specific: button/primary/bg/default (future)
```

### DTCG Compliance (W3C Design Tokens Community Group 2025.10)
- Registry tokens use DTCG shape: `$type`, `$value`, `$description`
- **No `.`, `{`, `}` in token/group names** (dots reserved for alias syntax)
- **No `$`-prefixed group names** (`$` reserved for DTCG keywords)
- Use nested JSON objects for hierarchy (not dot-separated flat keys)
- Source of truth remains `src/tokens.ts` — registry JSON is generated
- Style Dictionary transform pipeline deferred to Phase 4

### Token Layers
| Layer | Purpose | Who consumes |
|---|---|---|
| **Primitive** | Raw values (Radix colors, spacing px, radius px) | Only `tokens.ts` internally |
| **Semantic** | Intent-based aliases of primitives | Components via `useTokens()` |
| **Component** | Component-specific overrides (future) | Individual gallery components |

## Accessibility Standard

### Baseline
**WCAG 2.2 AA** for all shipped components. Native HTML elements preferred before ARIA. Reference WAI-ARIA APG only when native HTML is insufficient.

### Rules
1. Text contrast ≥4.5:1 (normal) or ≥3:1 (large text ≥18pt/14pt bold) — **BLOCKER**
2. Non-text contrast (icons, borders, focus rings, control states) ≥3:1 — HIGH
3. All interactive elements keyboard accessible — **BLOCKER**
4. Click/tap targets ≥24×24 CSS px (AA minimum) — HIGH
5. Focus-visible styles on all interactive elements — HIGH
6. Dialogs: focus inside on open, trap Tab, Escape closes, restore focus on close — **BLOCKER**
7. Inputs must have accessible labels — HIGH
8. Motion must respect `prefers-reduced-motion` — MEDIUM
9. Components must not break in Windows High Contrast / forced-colors — MEDIUM (HIGH for stable core)
10. Drag interactions must have single-pointer or keyboard alternative — HIGH

## Component Maturity Model

```
experimental → beta → stable → deprecated → removed
```

| Status | Requirements |
|---|---|
| **experimental** | Exists in gallery/, props defined, basic example |
| **beta** | + tokenized, + documented, + keyboard tested, + a11y automated test passes |
| **stable** | + screen-reader notes, + Storybook story, + signed evidence bundle (Evidence Gate pass), + migration notes (if replacing), + owner approved |
| **deprecated** | + deprecation date, + replacement component named, + migration guide |
| **removed** | Fully deleted, removal in changelog, consumers migrated |

### Promotion Rules
- Components enter as `experimental`
- BLOCKER a11y findings block promotion to `stable`
- **BLOCKER/HIGH visual QA findings block promotion to `beta`**
- **Scroll/overlay violations block promotion to `beta`:**
  - `SC.SCROLL-PATTERN-VIOLATION` — bounded scroll without approved pattern
  - `SC.COMPONENT-SPECIFIC-SCROLLBAR` — custom scrollbar CSS where `SCROLL` should be used
  - `LAY.STACKING-CONTEXT-TRAP` — unnecessary z-index trapping overlays
  - `LAY.VIEWPORT-UNSAFE-OVERLAY` — dropdown/menu without viewport-aware positioning
  - `LAY.TOOLTIP-CLIPPED-BY-CONTAINER` — tooltip/menu clipped by parent overflow
    - **GR4 Measurement Verification (new in 2026-06-22)** — Golden Rule #4 enforcement gate:
      - Specs with `container`, `padding`, `gap`, `borderRadius`, or `sizing` values MUST have `figma-measurements-verified: pass`
      - This checklist item confirms the **documented values match actual Figma node layout properties** (not just visual screenshot parity)
      - Verification is via Figma MCP: compare documented `SPACE[N]`/`RADIUS.X` tokens to measured pixel values from the Figma node
      - Cannot mark spec `verified` or `locked` without this checklist passing
      - Prevents the recurring bug: specs marked "verified" (screenshot OK) with incorrect measurements (numeric values wrong)
- Components must pass the Evidence Gate (a fresh, signed `doer≠checker` evidence bundle) before promotion
- Resolved findings must be re-checked before every commit/tag (regression protection)
- Minimum 1 version cycle between `deprecated` and `removed`
- All active consumers must be migrated before `removed`

### Design Acceptance Gate — the Evidence Protocol

Technical gates (tsc, health, storybook, consumer sync) are necessary but not sufficient — a
component can pass every automated check and still be visually wrong. Visual correctness is
gated by the **Evidence Protocol** (`docs/evidence/PIPELINE.md`, `docs/evidence/GUIDE.md`):

1. **Verify against Figma, not a stored snapshot.** `/evidence-pipeline <slug>` (one) or
   `/evidence-wave <level|slugs>` (many) renders the story, fetches the Figma node as ground
   truth, and has 3 independent reviewers compare dimensions, colors, typography, states, and
   icons. Figma is the authority (GR4).
2. **doer ≠ checker, signed, computed.** The verdict is computed from a resolved checklist; the
   bundle is HMAC-signed by a checker who did not build it. The **Evidence Gate**
   (`npm run audit:evidence`, CI) blocks any gallery change without a fresh, passing, signed
   bundle in `docs/evidence/<slug>/`. The capture-stamp binds the render to its source, so
   "edit then re-record" cannot reuse a stale screenshot.
3. **tsc/build is not visual approval.** A change to appearance or behavior is accepted only
   when it re-passes the Evidence Gate — never on TypeScript/health alone.
4. **Consumer/deployed verification is a separate surface** — `/deployment-verify` +
   `docs/deploy/` handle app-vs-Figma after handoff (that is where a real-consumer "golden
   reference", e.g. RailNav in the bloodwork dashboard, lives now — not in the component gate).

> The former golden-reference + Playwright `test:visual` baseline gate and the `visual-qa`
> skill were **retired 2026-06-29**, superseded by the Evidence Protocol. The qualities they
> checked (anatomy, state completeness, density, token drift, no-TS-only-visual-change) are now
> covered by the pipeline's independent reviewers comparing the render to Figma.

### Enforcement Matrix — Scroll & Overlay Catalog IDs

> **Honest status:** No executable audit scripts were updated in this session.
> All SC.\* and LAY.\* checks are currently **agent-enforced** (smell skill, figma-build
> pre-check, evidence-pipeline reviewers) or **documentation-only**. None are CI-automated yet.
>
> The existing CI pipeline (`npm run health`) runs 4 audit scripts + `tsc --noEmit`.
> Those scripts check TK.\*, IC.\*, A11.\*, CP.\* IDs only. SC.\* and LAY.\* are not wired in.

| Catalog ID | Enforcement Layer | Blocks | Executable Check? | Fixture/Test Needed? |
|---|---|---|---|---|
| `SC.SCROLL-PATTERN-VIOLATION` | smell skill (pre-PR), figma-build pre-check (creation) | beta promotion (manual gate) | **No** — agent-enforced via smell skill hunk review | Yes — Storybook story with bounded scroll region |
| `SC.COMPONENT-SPECIFIC-SCROLLBAR` | smell skill (pre-PR), figma-build pre-check (creation) | beta promotion (manual gate) | **No** — agent-enforced via smell skill hunk review. Could be automated: grep for scrollbar CSS classes that aren't `ds-scroll-region` | Yes — lint rule or grep script checking `scrollbar-width\|::-webkit-scrollbar` outside `status.ts` |
| `LAY.STACKING-CONTEXT-TRAP` | smell skill (pre-PR), figma-build pre-check (creation), DQA manual review | beta promotion (manual gate) | **No** — requires visual/behavioral inspection. Cannot be reliably detected by static analysis alone (z-index on `position: relative` is sometimes intentional) | Partial — Storybook story with overlay that must escape parent; Playwright test clicking menu and asserting visibility |
| `LAY.VIEWPORT-UNSAFE-OVERLAY` | smell skill (pre-PR), figma-build pre-check (creation), DQA manual review | beta promotion (manual gate) | **No** — agent-enforced. Could be partially automated: check that any `useLayoutEffect` + `getBoundingClientRect` pattern exists near menu/popover render | Yes — Storybook story with menu near viewport bottom; Playwright test asserting menu flips or scrolls |
| `LAY.OVERFLOW-MEASUREMENT-FRAGILE` | smell skill (pre-PR), documentation only | warn only (no promotion gate) | **No** — requires reasoning about measurement strategy. Not automatable with static analysis | No fixture needed — this is a design-review check |
| `LAY.TOOLTIP-CLIPPED-BY-CONTAINER` | smell skill (pre-PR), figma-build pre-check (creation), DQA manual review | beta promotion (manual gate) | **No** — requires visual inspection. Could be partially automated: Playwright test asserting tooltip is visible outside parent bounds | Yes — Storybook story with tooltip near container edge; Playwright `isVisible()` assertion |

#### Enforcement layer definitions

| Layer | Type | When it runs | Who enforces |
|---|---|---|---|
| **CI automated script** | Executable | Every commit / PR via `npm run health` | `scripts/audit-*.js` → `run-audits.js` |
| **Smell skill** | Agent-enforced | Pre-PR diff review (agent invokes skill) | AI agent reading diff hunks against catalog |
| **Component-builder checklist** | Agent-enforced | Component creation/promotion (agent invokes skill) | AI agent following step-by-step checklist |
| **DQA manual review** | Human + agent | Before promotion, visual comparison | Human approves; agent flags discrepancies |
| **Documentation only** | Passive | When agent/human reads AGENTS.md or interaction-patterns.md | Reader's discipline |

#### Automation roadmap (recommended)

| Priority | Catalog ID | Recommended automation | Effort |
|---|---|---|---|
| **P1** | `SC.COMPONENT-SPECIFIC-SCROLLBAR` | Add grep check to `audit-components.js`: flag any `.tsx` file containing `::-webkit-scrollbar` or `scrollbar-width` outside `status.ts` | Low — ~20 lines in existing script |
| **P1** | `LAY.VIEWPORT-UNSAFE-OVERLAY` | Playwright test: render menu story at 400px viewport, click trigger, assert menu `getBoundingClientRect().bottom <= window.innerHeight` | Medium — requires Storybook story + Playwright fixture |
| **P2** | `LAY.TOOLTIP-CLIPPED-BY-CONTAINER` | Playwright test: render tooltip story, hover trigger, assert tooltip element `isVisible()` and not clipped | Medium — requires fixture |
| **P2** | `SC.SCROLL-PATTERN-VIOLATION` | Add check to `audit-components.js`: any gallery component importing `overflow-y: auto` should also import `SCROLL` from status | Medium — AST or regex in audit script |
| **P3** | `LAY.STACKING-CONTEXT-TRAP` | Not reliably automatable. Keep as DQA + smell. | N/A |
| **P3** | `LAY.OVERFLOW-MEASUREMENT-FRAGILE` | Not automatable. Design-review only. | N/A |

### Ownership
- System-level owner configured in registry `_meta.system_owner` (currently: `miguelmyers`)
- Every component, token group, and icon set has an owner (defaults to `system_owner`)
- Owner change requires explicit handoff

### Contribution Flow
1. **Proposal** → ADR in `docs/decisions/`
2. **Implementation** → `experimental` status
3. **Review** → `beta` promotion
4. **Audit passes** → `stable` promotion
5. **Breaking change** → Human approval + migration guide

### Versioning
- Semantic versioning (`major.minor.patch`) in `package.json`
- Breaking token/component changes = major version bump
- New components/tokens (non-breaking) = minor bump
- Bug fixes, docs = patch bump

### Changelog
- `CHANGELOG.md` updated on every version bump
- Auto-generated from audit reports + ADRs where possible

### Deprecation Policy
- Minimum 1 version cycle between `deprecated` and `removed`
- Deprecated items produce `TK.DEPRECATED-IN-USE` / `CP.STABLE-INCOMPLETE` warnings
- Migration guide required before deprecation

## CI Gates

```jsonc
// package.json scripts
{
  "audit:tokens": "...",         // Token audit, exit 1 on BLOCKER
  "audit:icons": "...",          // Icon audit, exit 1 on BLOCKER
  "audit:a11y": "...",           // Accessibility audit, exit 1 on BLOCKER
  "audit:components": "...",     // Component audit, exit 1 on BLOCKER
  "registry:refresh": "...",     // Regenerate docs/registry/*.json
  "test:typecheck": "tsc --noEmit",
  "test:unit": "vitest run",
  "test:storybook": "...",       // Storybook test runner (Phase 2)
  "audit:evidence": "...",       // Evidence Gate — blocks gallery changes without a fresh signed bundle
  "prompts:check": "...",        // assert .github/prompts mirrors are in sync with .claude/skills
  "health": "node scripts/run-audits.js"  // runs the audit suite (tokens/icons/a11y/components/specs/prompts/deploy)
}
```

### CI Failure Rules
| Severity | CI behavior |
|---|---|
| BLOCKER | Fails CI, blocks merge |
| HIGH | Fails CI on `main`, warning on feature branches |
| MEDIUM | Warning only |
| LOW / NIT | Logged, never fails |

## Canonical References

| Resource | Use it for |
|---|---|
| [DTCG Format 2025.10](https://tr.designtokens.org/format/) | Token file structure, aliases, naming rules, $value, $type, $description |
| [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) | AA baseline: contrast, target size, focus, dragging, name/role/value |
| [WAI-ARIA APG Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) | Dialogs, menus, comboboxes, tabs, keyboard behavior |
| [Storybook (latest)](https://storybook.js.org/docs) | Stories, controls, a11y tests, interaction tests, visual tests |
| [Playwright](https://playwright.dev/docs/library) | Headless Storybook capture for the Evidence Protocol (`chromium.launch`) |
| [Microsoft Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons) | Icon source catalog |

## Design System Governor

A role for AI agents acting as local design-system reviewers and release-safety agents.

### Purpose
- Audit implementation steps for design-system compliance.
- Catch visual and governance issues before they reach release.
- Require proof (screenshots, test output, approval) before accepting changes.
- Produce compact structured reports instead of raw logs.

### Non-Negotiable Rules
1. Do not tag, push tags, publish packages, self-sign or alter evidence bundles, or declare a component stable without explicit user approval.
2. Do not treat TypeScript/build success as visual approval — a visual change must re-pass the Evidence Gate.
3. For visual or component behavior changes, require a fresh signed evidence bundle (Evidence Gate pass), not just a Storybook screenshot.
4. Keep scope narrow — make only the changes requested.
5. Report uncertainty instead of guessing.
6. Prefer fixing root causes over documenting workarounds.
7. If a finding affects the active release scope, pause tagging until resolved or explicitly deferred.

### Design-System-Specific Rules
- RailNav remains **beta** unless explicitly promoted by the owner.
- Storybook is the primary visual validation surface for all tokens and components. The Vite docs app (`cd app && npm run build`) is a dogfooding consumer build gate, not a visual review surface.
- Before release decisions, run or request all of:
  - `npm run health:strict`
  - `npm run test:storybook`
  - `npm run audit:evidence` (Evidence Gate — gallery changes need a fresh signed bundle)
  - `npm run consumer:sync`
  - `cd app && npm run build`
- If `registry:refresh` changes generated registry files, summarize exactly what changed before committing.
- Consumer validation supports beta maturity evidence but does not automatically promote a component to stable.

### Operating Modes
1. **Implementation Mode** — use when making code, documentation, or configuration changes.
2. **Evidence-Review Mode** — use when evaluating visual correctness of components or UI changes (via the Evidence Protocol: `/evidence-pipeline` · `/evidence-wave` · `npm run audit:evidence`).
3. **Release-Readiness Mode** — use when preparing or evaluating a release candidate.
4. **External-Review / Reporting Mode** — use when producing a summary for handoff to another session, agent, or human reviewer.
5. **Next-Step Decision Mode** — use when deciding what to do next after a handoff report, failed gate, visual finding, completed task, branch mismatch, release checkpoint, or post-release cleanup.

#### Next-Step Decision Mode
When operating in Next-Step Decision Mode:
1. First classify the current phase: planning, implementation, evidence review, release readiness, post-release cleanup, or component standardization.
2. Then classify the repo state: clean, dirty expected, dirty unexpected, branch mismatch, release candidate, tagged, pushed, or blocked.
3. Then choose exactly one recommended next action: continue implementation, pause and verify, fix narrow issue, commit, push branch, open PR, prepare release notes, request tag approval, stop work, or ask user for decision.
4. If there is any visual or component behavior change, require visual evidence before acceptance.
5. If the issue affects the active release scope, pause tagging until resolved or explicitly deferred.
6. If a branch contains unrelated changes, stop and recommend branch cleanup before push or PR.
7. If a command fails, classify it as blocker, transient, environment/setup issue, or expected no-op.
8. Never tag, push tags, publish packages, alter signed evidence bundles, or declare a component stable without explicit user approval.
9. Always end with: Decision; Reason; Next command or prompt to approve; Approval needed: yes/no.

### Process Documentation
See `docs/process/` for detailed workflow documentation:
- `design-system-governor.md` — agent behavior modes
- `governor-implementor-flow.md` — canonical handoff contract, trigger text, and restart-safe sequence
- `conversation-retention-governance.md` — retention boundaries, deletion levels, and reporting rules
- `release-readiness-checklist.md` — full release gate sequence
- `external-review-report-template.md` — handoff report structure
- `component-absorption-playbook.md` — external component intake, tokenization, and governor gate sequence
- `component-standardization-playbook.md` — standardization template

## Maintenance Rules for Agents

1. Use this file as the canonical instruction source
2. Update `AGENTS.md` when architecture, tokens, components, or rules change
3. Keep `CLAUDE.md` and other agent entrypoints as context files that supplement (not duplicate) this
4. Run the relevant skill (token-audit, icon-audit, etc.) after making changes
5. Update `docs/registry/` JSON files when source files change
