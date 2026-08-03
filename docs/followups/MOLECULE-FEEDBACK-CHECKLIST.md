# Molecule feedback checklist (owner, 2026-07-11)

Durable tracker for the molecule-polish feedback. Each task has explicit ACCEPTANCE criteria and is
verified by an INDEPENDENT reviewer agent (reject-if-not-as-specified) before it is marked done here.
This file is the source of truth so nothing is dropped across sessions.

Legend: ☐ pending · ◐ in progress · ☑ done+reviewer-approved · ✗ reviewer-rejected (rework)

## 1. Compact molecules — geometry bugs
- ◐ **T1 — Uniform 6px inner padding + caption centered.** CODE DONE + measured (commit `63b59c6`):
  root-caused to the `<legend>` consuming ~11px top flow-height. Extracted shared `CompactTriggerShell`
  (`<div>`, uniform 6px padding, content vertically centered). Playwright-verified topInset==bottomInset
  on all 4 (6/6 triggers+button, 10/10 toggle-centered); caption center offset 0 from top edge.
  **Awaiting T11 seal-review** (evidence-wave re-verify vs Figma).
- ◐ **T2 — Inner-aligned borders, full weight.** CODE DONE + measured (commit `63b59c6`): root cause was
  Chromium rounding `border:1.5px` → 1px; switched to `box-shadow: inset 0 0 0 {1|1.5}px` (true weight,
  atom pattern). Playwright-verified active=1.5px ink / error=1.5px red / hairline=1px inset, inner.
  **Awaiting T11 seal-review.**
- ☐ **T1b (follow-up) — Full compact-spec doc sweep.** The 4 compact specs' EX-registry `Code action`
  rows + ASCII trees still describe the superseded `<fieldset>/<legend>` mechanism (primary paragraphs
  already updated, commit `f115e40`). Rewrite those rows to the CompactTriggerShell mechanism.

## 2. Border alignment breadth
- ◐ **T3/T4 — Audit DONE (2026-07-11).** Grepped the whole gallery. Most focus rings correctly use
  `box-shadow: inset 0 0 0 1.5px` (true weight). **6 components use a real `border: 1.5px solid` for a
  VISIBLE ring/border → snaps to 1px (renders thin):**
    - `InfoIcon.tsx:83` — focus ring (border) → should be inset box-shadow (matches Clear/Ellipsis/Expand siblings)
    - `ChevronCarousel.tsx:79` — focus ring (border) → inset box-shadow
    - `RailButton.tsx:65` — `browsing` state border → inset box-shadow (RailNav.tsx:1361 already uses inset — divergence)
    - `RailButtonDark.tsx:67` — `browsing` state border → inset box-shadow
    - `Tag.tsx:160` — `browsing` variant border → inset box-shadow
    - `AIPill.tsx:86` — animated conic-gradient border (needs a real border for the gradient-clip trick;
      1.5px snaps to 1px). SPECIAL CASE — fix is different (2px integer, or padding technique). Low priority.
  **5 FIXED (commit `d3c34b4`)** — InfoIcon, ChevronCarousel, RailButton, RailButtonDark, Tag converted
  to inset box-shadow (tsc clean); re-seal wave `w0zy6st7c` verifying. AIPill gradient border DEFERRED
  (special case). No MOLECULE had the snapping bug (T3 clean); all 5 fixes were atoms (T4).
  Correct focus rings (no change): BreakdownIcon, ChevronCircleTrigger, ChevronTrigger, ClearButton,
  ClearCircleButton, CommentButton, EllipsisButton, EllipsisCircleButton, ExpandButton, FilterButton,
  FilterIcon, MenuItem, NavRow, SelectRow, TriggerButton, + the compacts (now fixed).

## 3. FigmaSpec + Variants (every molecule)
- ☑ **T5 — Shared molecule FigmaSpec control harness. DONE** (`src/gallery/MoleculeSpecHarness.tsx`,
  commit `72ebb1d`). width/maxWidth/hug sizing, per-text Short/Regular/Long, state checkboxes,
  standalone default + `contained` resizable panel. Playwright-verified on SelectTriggerCompact (fill:
  width+value+caption+open/disabled/error) and FilterButton (hug: state-only, no width). Evidence-exempt
  (story helper, no Figma node). Reviewer = the T6 rollout exercising it across molecules.
- ◐ **T6 — Apply interactive FigmaSpec to all molecules. ROLLED OUT** (commit `1d7551e`) across all 23
  (2 by me + 21 via 4 parallel agents). Every FigmaSpec is now the MoleculeSpecHarness; repointed 12
  verify.storyId --figma-spec → --variants. Owner reviewed the 23-up contact sheet (approved). **Sealing
  in evidence-wave `w71ex82ay`** (T11 review).
- ◐ **T7 — Variants present on all 23** (agents added/kept the full grids). Confirmed by the seal wave.

## 4. Containment policy (FEEDBACK 5)
- ◐ **T8 — Standalone default; 12 named contained. DONE** (commit `1d7551e`). The 12 (NavRow, SearchBar,
  Callout, CardHeader, ContentTitle, FeedbackText, MenuItem, MenuItemDark, PanelHeader, SelectButton,
  SelectHeader, SelectRow) pass `contained` → resizable surface panel; all others render bare. MenuItemDark
  + AccordionHeaderDark use `containerTone="dark"`. Confirmed on the contact sheet.

## 5. Examples (FEEDBACK 3)
- ☐ **T9 — Refactor existing molecule Examples** onto current components/docs so code issues surface
  against owner intent. Keep the examples; rebuild on current APIs/tokens.

## 6. SelectTriggerCompact drag (FEEDBACK 4)
- ☐ **T10 — Draggable toggle.** Drag the toggle side-to-side with a clean, smooth, professional style
  transition (reduced-motion fallback) + documentation. Confirm exact target element during impl.

## Review protocol (META)
- ☐ **T11 — Independent per-task review.** A separate reviewer agent verifies each task against its
  ACCEPTANCE criteria (render + Figma + code) and REJECTS if not met; rejected tasks return to rework.
  Verdicts recorded here.

## Owner decisions surfaced (not auto-resolved)
- **OD-1 `railbuttondark` re-seal blocked.** The T4 border fix (correct code) staled railbuttondark, but
  its re-seal fails: verify.storyId `atoms-railbutton--variants` is a SWAP-BY-GLOBAL render
  (`isDarkAtom ? <RailButtonDark/> : <RailButton/>`) — the documented [[project_dark_pair_story_swap_limit]]
  where a story render can't read the surface global, so it silently captures the LIGHT sibling. The
  2026-07-08 "Variants doubles as the dark capture" change re-introduced this. **Recommended fix:** restore
  a dedicated `atoms-railbutton--dark` story rendering `<RailButtonDark/>` UNCONDITIONALLY on a
  tokens.darkSurface panel (`parameters.atomSurface.supported=["darkAtom"]`) + repoint verify.storyId.
  Reverses a dated owner decision → awaiting owner OK. (railbuttondark code is Figma-correct; interim = stale evidence.)
- **OD-2 `railnav` Figma source rot.** Its spec node `166:4494` in file EyYETHXMDDURPGK4PXTU5C returns null —
  the RailNav frame was deleted/moved (file now "Single shape", modified 2026-07-11). NOT caused by this
  work (railnav seal intact). **Owner action:** re-bind railnav.spec figma node to the current RailNav
  frame, or restore it, before railnav can ever be re-verified.

## Border-fix seal ledger (2026-07-11)
Sealed: infoicon `08c1b40`, chevroncarousel `9c19d5e`, railbutton `76da885`, tag `202d4eb`, tag-dark `6c8f813`.
Blocked (owner): railbuttondark (OD-1), railnav (OD-2).

---
### Reviewer verdict log
- 2026-07-11 T1/T2 — APPROVED (evidence-wave `wtklse9kn`: all 4 compacts re-verified vs Figma + re-sealed).
- 2026-07-11 T3/T4 — APPROVED for the 5 sealed atom fixes (evidence-wave `w0zy6st7c`); railbuttondark/railnav → OD-1/OD-2.
