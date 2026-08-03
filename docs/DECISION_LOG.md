# Decision Log

> **Single source of truth** for decisions taken and pending items across the design system.
> Replaces the scattered approach of tracking decisions in AGENTS.md history notes,
> SELECT_REFINEMENT_LEDGER, and sync/REVIEW comments.
>
> **This file is actively maintained.** Entries are not deleted — they are archived
> (moved to the `## Archived` section at the bottom) when their cleanup condition is met.

---

## How to Use This File

### Entry types
- **Decision** — a choice made, with rationale. Permanent record even after resolved.
- **Pending** — work item not yet completed. Lives here until resolved or deprecated.

### Tiers (for Pending items)
| Tier | Meaning | Example |
|------|---------|---------|
| **T1** | Must complete before the next pipeline phase can begin | ActionMenu submenus must be verified before starting Button |
| **T2** | Important; scheduled for the next 3–5 cycles | Automate SC.* audit IDs in CI |
| **T3** | Deferred; relevant but not blocking | activeIndex=-1 on mouse-open for ActionMenu |

### Status values
| Status | Meaning |
|--------|---------|
| `active` | Currently valid |
| `pending` | Work item waiting to be started |
| `in-progress` | Actively being worked on |
| `resolved` | Completed. Cleanup condition met — move to Archived. |
| `deprecated` | Superseded by a later decision or direction change. |
| `blocked` | Cannot proceed; blocking reason documented in notes |

### Cleanup rule
An entry moves to **Archived** when ALL of:
1. Its `status` is `resolved` or `deprecated`
2. Its `cleanup-condition` text is satisfied (e.g., spec reaches `verified`, or component promoted)
3. At least **one Friday cleanup** has passed after the condition was met (grace period for Governor confirmation)

---

## Active Decisions

### D-007 — RailNav owns a dedicated `Z.rail` stacking level
**Date:** 2026-07-20 | **Type:** Decision | **Status:** `active`

The RailNav root `<aside>` sets `position: relative; zIndex: Z.rail` — a new `rail: 30` token in `src/status.ts`, between `Z.sticky` (20) and `Z.overlay` (50) — so its right-edge elevation shadow is never truncated by a consuming app's opaque sticky header/slicer band. Surfaced when PLG-dashboard's viewport-bounded shell put a sticky band at `Z.sticky` over the (level-0) rail, clipping the shadow across the header row.

**Rationale:** The rail must paint above in-page chrome, and this is a **sanctioned exception** to the "avoid unnecessary stacking contexts" rule (AGENTS.md § Stacking Contexts #1). It is safe precisely because every menu, dropdown, tooltip, and dialog portals to `<body>` with `position: fixed` per **Golden Rule #3**, escaping `#root`'s stacking context entirely — so `Z.rail` only competes with in-page chrome and can never trap a portaled overlay.

**Consequences:**
- `Z.rail` (and the `<aside>`'s `position:relative`) is **load-bearing** — do not remove it as an "unnecessary stacking context".
- Consumers with a viewport-bounded shell must keep sticky header/slicer bands at `Z.sticky` (20) and MUST NOT raise them to or above `Z.rail` (30).

**References:** `src/status.ts` (`Z.rail`), `src/gallery/RailNav.tsx` (`<aside>`), `AGENTS.md` § Stacking Contexts & Overlays (rule #5) + Golden Rule #3, `CHANGELOG.md`.

---

### D-008 — TreeDataTable delta cells are plain ink text (no trend arrows)
**Date:** 2026-07-20 | **Type:** Decision | **Status:** `active`

The `TreeDataTable` value cells — including the YoY / YoY% **delta** columns — render as plain ink text (`tokens.ink` / `#1C2024`). There is **no `TrendArrow` and no green/red sentiment colour**, matching Figma `Organism.TreeDataTable` 993:872, where every `Molecule.TableCell` is plain text.

**Rationale:** A parity audit (2026-07-20) found the previous code rendered green/red filled `TrendArrow`s on any `isDelta` column, which Figma 993:872 does not show. This is a **GR4 (Figma-authoritative)** conflict, so it was surfaced to the owner as a design ruling rather than resolved in code. **Owner ruling: Figma is authoritative → drop the trend treatment.** If the trend arrows are wanted later, the designer adds them to `Molecule.TableCell` in Figma first, then the code follows.

**Consequences:**
- `TreeColumn.isDelta` is retained as a **deprecated no-op** prop (kept only for source compatibility with existing consumer configs); it has no visual effect.
- `TableCell.tsx` deliberately renders no `TrendArrow` / sentiment colour.

**References:** `src/gallery/TableCell.tsx`, `src/gallery/TreeDataTable.tsx` (`TreeColumn.isDelta`), Figma `993:872` / `Molecule.TableCell` 971:948.

**Update (2026-07-21, see D-009):** the owner reinstated trend arrows as an **opt-in** (`TreeColumn.showTrend`, off by default) and introduced hierarchy-emphasis muting, so value cells are no longer *uniformly* `tokens.ink`. D-008's canonical-default (plain, no-arrow) intent still holds; the uniform-ink premise is relaxed by D-009.

---

### D-009 — TreeDataTable hierarchy emphasis (frontier rows muted, color only)
**Date:** 2026-07-21 | **Type:** Decision | **Status:** `active`

Row labels **and** value cells use `tokens.ink` when the row is **currently showing its children** (an expanded aggregate) and `tokens.textMuted` when the row is a **current-view frontier** — a true leaf **or** a collapsed parent. The **grand total is always `ink`**. Sublabels are always `textMuted` (unchanged). This is a **color-only** treatment — font weight stays role-based (`data` = Inter 400, `subtotal`/`grandTotal` = Inter 500), so a collapsed subtotal reads as *muted + semibold* (a collapsed section header).

**Rationale:** Owner request (2026-07-21) to add hierarchy legibility. Keying the emphasis off the **per-row visible frontier** (`row.getCanExpand() && row.getIsExpanded()`) rather than a global "deepest visible level" keeps it consistent when branches are expanded to different depths, and matches the Power BI matrix convention (the PLG deploy target): aggregates emphasized, detail rows recede.

**Owner decisions (interview):** (1) "Totals always ink" = **grand total only**; subtotals follow the frontier rule (collapsed → muted, expanded → ink). (2) **Keep weight by role** (muted rows are color-only; collapsed subtotals stay semibold). (3) This is the **new default behavior** (not an opt-in prop) → the sealed Figma `993:872` (all-ink rows) must be updated by the owner as design authority to match; this is a deliberate GR4 owner ruling.

**Consequences:**
- `TableCell` + `TableRowHeader` gain a `muted?: boolean` (color only); `TreeDataTable` computes it per body row. Grand total renders un-muted.
- Follow-up: update Figma `993:872` / the TreeDataTable spec so the sealed reference shows the ink/muted frontier treatment (currently all-ink).

**References:** `src/gallery/TableCell.tsx`, `src/gallery/TableRowHeader.tsx`, `src/gallery/TreeDataTable.tsx` (`rowMuted`), `src/gallery/table-types.ts` (`roleTextStyle`).

---

### D-001 — Figma→Storybook Pipeline as Operating Model
**Date:** 2026-06-04 | **Type:** Decision | **Status:** `active`

The design system's primary development model shifted from iterative cycle-based component refinement (SELECT_REFINEMENT_LEDGER paradigm) to the **Figma→Storybook pipeline** defined in `docs/atomic/PROTOCOL.md`.

**Rationale:** AI is a reliable translator (Figma→code) but a poor inspector. Schema-enforced specs + machine-verified VERIFY passes catch Figma drift without requiring human visual inspection on every cycle. The fixed-point rule (IMPLEMENT reads the spec, not Figma) prevents regressions.

**Consequences:**
- Component work now starts with a Figma frame → EXTRACT → spec, not with a verbal description
- SELECT_REFINEMENT_LEDGER paradigm is retired; future component iterations happen through spec updates
- Governor's role expands to include GATE (spec review + VERIFY approval)

**References:** `docs/atomic/PROTOCOL.md`, `sync/history/cycle-126/`

---

### D-002 — Canonical Search Input Treatment (Golden Rule #1)
**Date:** 2026-06-01 | **Type:** Decision | **Status:** `active`

The ONLY allowed search-input visual treatment is borderless input row + edge-to-edge hairline divider. Bordered/filled rounded search box is explicitly retired.

**Rationale:** User reversed an in-flight Cycle 120/121 convergence plan; the borderless+divider pattern from Menu.tsx was established as the sole canonical treatment across the entire system.

**References:** `AGENTS.md` Golden Rule #1, `src/gallery/Menu.tsx`, `src/gallery/Select.tsx`

---

### D-003 — Menu Maximum Two-Level Nesting (Golden Rule #2)
**Date:** 2026-06-03 | **Type:** Decision | **Status:** `active`

Menu is an action-list surface, not a tree. Max depth: category (level 1) + item (level 2). No third level, no sub-menus, no cascading.

**Rationale:** Two levels preserve clean visual hierarchy; uppercase category header provides unmistakable typographic signal. Menu is not a navigation or hierarchical-tree surface.

**References:** `AGENTS.md` Golden Rule #2, `src/gallery/Menu.tsx`

---

### D-004 — ActionMenu Checkmark Color is `tokens.ink` not `tokens.accentText`
**Date:** 2026-06-04 | **Type:** Decision | **Status:** `active` | **Cycle:** 126

Figma-verified at Cycle 126 VERIFY pass. The checkmark in ActionMenu row right-slot renders in `tokens.ink` (#1C2024, black), not `tokens.accentText` (purple). Earlier code was wrong; Figma is authoritative.

**References:** `docs/atomic/organism/actionmenu.spec.md` tokenMap.checkmark, `src/gallery/ActionMenu.tsx:1520`

---

### D-005 — Token Hardcoding `TK.HARDCODED-FONT` at ActionMenu.tsx:651
**Date:** 2026-06-04 | **Type:** Decision | **Status:** `active`

Pre-existing non-blocking finding. A hardcoded font value exists at `src/gallery/ActionMenu.tsx:651`. Not resolved in Cycle 126-127 as it was out of scope during the pipeline baseline work.

**Cleanup condition:** Resolved when ActionMenu.tsx undergoes its next edit cycle and the line is tokenized.

---

### D-006 — Stories Render the Shipped Component; Behavior Is Test-Verified (Golden Rule #5)
**Date:** 2026-06-13 | **Type:** Decision | **Status:** `active`

A UI element is implemented in exactly one shipped component; stories/consumers render it (never a parallel reimplementation). Interactive behavior is a play-test in `npm run test:behavior` (in `npm run health`) — "verified" means behaviorally verified, not static. Replicas diff the full prop/slot surface (composition completeness); elevation must not be clipped by an `overflow:hidden` ancestor.

**Rationale:** RailNav Panel Unification — a deployment "looked done" statically but shipped broken behavior because the complete impl lived in a demo (`SidebarPanelSpec`) and verification certified structure, not behavior. User authorization: *"we can do step two and step three as you are requiring."*

**References:** `AGENTS.md` Golden Rule #5, `docs/decisions/ADR-005-behavioral-verification-single-source-panel.md`, `docs/atomic/_TEMPLATE.spec.md` (`behaviors:` + 4 guards), `docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md`, `npm run test:behavior`.

---

## Pending Items

### P-001 — ActionMenu Submenus through Figma Pipeline
**Date:** 2026-06-04 | **Tier:** T1 | **Status:** `pending`

The Sort by submenu (Figma node `162:2959`) and Presets submenu (`141:3145`) are stub specs in `docs/atomic/organism/`. Both need full `/figma-extract` → `/figma-implement` → `/figma-verify` passes.

**Cleanup condition:** Both specs reach `status: verified` in their spec files.

**References:** `docs/atomic/organism/actionmenu-sort-submenu.spec.md`, `docs/atomic/organism/actionmenu-presets-submenu.spec.md`, `sync/HANDOFF.md` Cycle 127 Next Steps #1

---

### P-002 — Button Through the Figma Pipeline (first atom)
**Date:** 2026-06-04 | **Tier:** T1 | **Status:** `pending`

No Button spec exists in `docs/atomic/`. Running Button through the pipeline would be the first atom-level element, proving the loop works end-to-end on a non-organism.

**Cleanup condition:** `docs/atomic/atom/button.spec.md` reaches `status: verified`.

**References:** `sync/HANDOFF.md` Cycle 127 Next Steps #2

---

### P-003 — ActionMenu `activeIndex=-1` on Mouse Open
**Date:** 2026-06-04 | **Tier:** T3 | **Status:** `pending`

Governor follow-up from Cycle 126 VERIFY: the `FigmaSpec` story captures the menu with `activeIndex=0` (Rename highlighted for keyboard a11y), which differs from Figma's static resting state. Setting `activeIndex=-1` on mouse-open would make the resting capture match Figma exactly.

**Cleanup condition:** Governor confirms the behavior change aligns with a11y requirements, then next ActionMenu edit cycle applies it.

**References:** `docs/atomic/organism/actionmenu.spec.md` verify.discrepancies[active-row-highlight]

---

### P-004 — Automate SC.* and LAY.* Audit IDs in CI
**Date:** 2026-05-24 | **Tier:** T2 | **Status:** `pending`

Four automation candidates from ADR-004:
- P1: `SC.COMPONENT-SPECIFIC-SCROLLBAR` (~20 lines in audit-components.js)
- P1: `LAY.VIEWPORT-UNSAFE-OVERLAY` (Playwright test)
- P2: `LAY.TOOLTIP-CLIPPED-BY-CONTAINER` (Playwright test)
- P2: `SC.SCROLL-PATTERN-VIOLATION` (AST/regex in audit script)

**Cleanup condition:** All P1 candidates wired into `npm run health`; enforcement matrix in AGENTS.md updated from "No" to "Yes".

**References:** `docs/decisions/ADR-004-scroll-overlay-automation-backlog.md`

---

### P-005 — RailNav Figma Spec (Pipeline Entry)
**Date:** 2026-06-08 | **Tier:** T1 | **Status:** `pending` | **Priority order:** before P-002 (Button)

RailNav is the most complex component and has a golden reference (bloodwork-dashboard-prototype). No Figma spec exists yet in `docs/atomic/`. Critical visual details have been captured only in chat sessions — if those conversations are lost, that knowledge is gone. User direction 2026-06-08: T1, prioritized before Button atom (P-002).

**Rationale for T1 over T2:** RailNav is in active production use in bloodwork-dashboard. The golden reference (bloodwork `localhost:5173`) already exists. Deferring risks knowledge loss; proceeding first creates a high-value verified spec on the component that matters most.

**Cleanup condition:** `docs/atomic/organism/railnav.spec.md` exists and reaches at least `status: implemented`. Full `verified` requires visual parity with bloodwork golden reference.

**References:** `docs/audits/railnav-foundation-audit-2026-05-24.md`, `docs/audits/visual-qa-railnav-2026-05-24.md`

---

### P-006 — Fix ADR Index to Match Actual Files
**Date:** 2026-06-08 | **Tier:** T2 | **Status:** `resolved`

`docs/decisions/README.md` ADR index was inaccurate (listed fictional ADRs 001-005 with wrong titles; actual files are ADR-001/002 unnumbered + ADR-003/004). Fixed in Cycle 128.

**Cleanup condition:** ✅ Met — README.md updated this cycle.

---

### P-007 — Migrate Process Evaluation Docs Out of `docs/audits/`
**Date:** 2026-06-08 | **Tier:** T3 | **Status:** `pending`

Two process docs are misplaced in `docs/audits/`:
- `docs/audits/governor-implementor-flow-evaluation-2026-05-26.md` → should be `docs/process/` or converted to an ADR
- `docs/audits/conversation-retention-governance-plan-2026-05-26.md` → should be `docs/process/`

**Cleanup condition:** Files moved or converted during the next `docs/process/` review cycle.

---

### P-008 — Select Component Figma Spec
**Date:** 2026-06-08 | **Tier:** T2 | **Status:** `pending`

Select is fully implemented (SEL-001→055) but has no Figma spec in `docs/atomic/`. The SELECT_REFINEMENT_LEDGER tracked iterative refinements; the Figma pipeline requires an authoritative spec linked to the Figma node.

**Cleanup condition:** `docs/atomic/organism/select.spec.md` exists at `status: verified`.

---

### P-009 — `docs/STABLE_READINESS.md` Updated for Figma Pipeline Era
**Date:** 2026-06-08 | **Tier:** T2 | **Status:** `pending`

STABLE_READINESS.md describes v0.1.0 release gates but predates the Figma pipeline. Needs a "Phase 2+" section noting that Figma-pipeline verification is now a promotion gate for `stable` components.

**Cleanup condition:** STABLE_READINESS.md updated to include Figma pipeline gates.

---

### P-010 — CalendarDay day numbers are NOT tabular (tabular belongs in the TYPE token)
**Date:** 2026-08-01 | **Tier:** T2 | **Status:** `accepted`

The `/evidence-wave` re-seal of `calendarday` (`d9cad4c`) removed an inline
`fontVariantNumeric: "tabular-nums"` from the day-number text as non-Figma. Reviewed and
ACCEPTED rather than restored under an `EX-` deviation. Recorded so it is not silently
re-added by a later pass.

**Why the removal is right for the system:**

1. **This DS expresses "tabular" as a property of a TYPE token, not a component style.**
   `TYPE.displayXl` and `TYPE.numberL` both declare `fontVariantNumeric: "tabular-nums"`
   inside the token (numberL: "tabular-nums so big figures pack cleanly and align in
   columns"). CalendarDay used `TYPE.bodyM` then overrode it inline — a component locally
   diverging from the type system.
2. **The one other inline use is functionally different.** `TableCell.tsx` is the only
   other inline user, and there numbers are compared DOWN A COLUMN where digit-width
   variance visibly rags. Calendar day numbers are centred one-per-cell in fixed 40x40
   boxes, so cell geometry drives alignment, not glyph metrics — the real effect is a
   sub-pixel shift of the glyph visual centre.
3. **An `EX-` entry would be the actual liability.** It is permanent and re-surfaces for
   justification at every future seal of this atom — a standing cost for a cosmetic
   property Figma does not specify and that contradicts the type system.

**If tabular day numbers are ever wanted**, do it systemically — add it to the Figma text
style or to a TYPE token — so every consumer inherits it. Do NOT re-add a single-component
inline override.

**Recorded here rather than in `calendarday.spec.md` on purpose:** the spec is hashed into
the evidence seal (`sourcesForSlug('calendarday')` returns it alongside the two source
files), so putting this in the spec would immediately re-stale the bundle sealed at
`d9cad4c`.

**Cleanup condition:** none — a standing decision, not a deferred task.

---

## Archived

> Entries here are permanently kept as historical record but no longer require action.
> Moved here when: status=resolved or deprecated AND cleanup condition met AND one Friday cleanup passed.

*(No archived entries yet — this log was created 2026-06-08.)*

---

## Changelog
| Date | Change |
|------|--------|
| 2026-06-08 | Log created (Cycle 128). Migrated key decisions from AGENTS.md history, sync/HANDOFF Cycle 127, ADR-004. |
| 2026-08-01 | P-010 added — CalendarDay tabular-nums removal accepted (evidence-wave d9cad4c). |
