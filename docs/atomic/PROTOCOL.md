# Figma → Storybook Pipeline Protocol

---

## 🔴 THE ONLY GATE THAT MATTERS — Read Before Anything Else

**Docs, checkboxes, and text claims of "verified" cannot be trusted. Only what the user sees in the conversation counts.**

Before any `git commit`, three things must happen **in the conversation**, visible to the user right now:

1. Post a **screenshot of the Example story** in the conversation.
2. Post a **screenshot of the Variants story** in the conversation (all states visible simultaneously).
3. Ask: **"Does this look right? Shall I commit?"** — wait for the user to say yes / proceed / looks good.

Only after the user confirms in the chat: run `git commit` and `git push`.

**Nothing substitutes for this:**
- `typecheck` passing ≠ visually verified
- `audit:components` passing ≠ visually verified
- "verified ✅" written in a checkpoint document ≠ visually verified
- Session memory saying it was done ≠ visually verified

**Why this works when docs don't:** Posting a screenshot requires executing real browser tools. Writing "verified" in a doc requires nothing. If no image appears in the conversation, the user sees an empty space where proof should be. That gap is always visible — unlike a missing checkbox in a file no one is looking at.

**Root cause:** AccordionHeaderDark was audited, committed, and pushed on 2026-06-23 with no screenshot shown. The regression was caught only because the user manually opened Storybook themselves. Adding more documentation to an already long protocol does not prevent this — only a step that produces a visible artifact in the conversation does.

---

> How a gallery element goes from a Figma design to a verified Storybook story
> with **near-zero human visual validation in the middle**. The human stays at
> exactly two gates: approving the Figma as authoritative, and final PR sign-off.
> Everything between is schema-enforced and machine-verified.

## The core principle

AI is a great **translator** (Figma → code) and a poor **inspector**. The misses
are not random — they are a finite set of blind spots (read instance vs component
SET, shallow icon reads, untokenized color, unverified claims). So we never rely
on AI "remembering to look." Instead:

1. Every blind spot is a **required field** in the spec schema (`_TEMPLATE.spec.md`)
   or a **checklist id** the audit can challenge.
2. `scripts/audit-specs.js` (in `npm run health`) **fails the build** when a spec
   is incomplete or claims `verified`/`locked` with unsettled findings.
3. VERIFY compares the built story against the **Figma export** (vision) AND a
   **pixel baseline** (regression). Incompleteness and drift become red builds,
   not things a human must catch.

**The fixed-point rule:** IMPLEMENT reads the **spec**, not Figma. The spec is the
single source of truth; VERIFY guards it. This is what stops fixes from regressing —
a change can't drift from the spec without VERIFY going red.

## Triangulation rule

Before changing any visual component, the agent must read and reconcile all three:

1. The **current code** for the component and story.
2. The **current spec** for the element.
3. The **current Figma node**.

The agent must not infer a hidden wrapper, missing slot, or flex behavior from only one source. If code, spec, and Figma disagree, name the delta explicitly and stop to resolve it before applying changes. No story-only, spec-only, or screenshot-only conclusion counts as complete.

Required reporting pattern:

- `code`: what the live component renders now.
- `spec`: what the documented contract says.
- `figma`: what the design node shows.
- `delta`: what differs and which layer owns the fix.

If any layer is skipped, the implementation is incomplete.

## The loop

```
        ┌──────────────────────────────────────────────────────────────┐
        │                                                                │
 (1) TAXONOMY ──> (2) DESIGN ──> (3) BUILD ──────────> (4) VERIFY ──────────> (5) GATE
   Human+AI         Human          AI                    AI                    Governor+Human
   atomic map     Figma frame    spec.md + code+story   signed evidence       approve / loop
        ▲                        /figma-build           /evidence-pipeline           │
        │                                               /evidence-wave               │
        └──────────────────── fail → back to DESIGN/BUILD ───────────────────────────┘
```

| # | Phase | Who | Input | Output | Gate to advance |
|---|-------|-----|-------|--------|-----------------|
| 1 | **TAXONOMY** | Human + AI | gallery inventory | `docs/atomic/<level>/` placement; token↔Figma-variable parity | element assigned a level |
| 2 | **DESIGN** | Human | — | Figma frame using token variables; component SETs for every state | human declares frame authoritative |
| 3 | **BUILD** | AI (`/figma-build`) | Figma node | `docs/atomic/<level>/<el>.spec.md` (schema-complete) **then** `<El>.tsx` + `<El>.stories.tsx` (+ icons) | `audit:specs` + typecheck + health pass |
| 4 | **VERIFY** | AI (`/evidence-pipeline` one · `/evidence-wave` many) | spec + Figma export + story | **signed evidence bundle** (`docs/evidence/<slug>/`): figma.json/png, storybook.png, capture-stamp, computed verdict, HMAC signature; `doer≠checker` | Evidence Gate `PASS — 0 findings` |
| 5 | **GATE** | Governor + Human | evidence bundle + CI Evidence Gate | sync `REVIEW.md`; required server-side check; PR approval | human sign-off |
| 7 | **DEPLOY** | AI + Human | **assembled** Figma node + consumer app | coverage matrix + triangulated screenshots | matrix signed complete → `app == Figma == Storybook` |

> **Phases 1–6 verify a component against the spec/component/story — all inside the
> design system. They do NOT verify the deployed consumer app.** Deploying an
> assembled prototype (RailNav + data) into a consumer (Rayfin/Fabric dashboard) is
> a fourth parallel surface (app data + wired props + app-side assets) that can
> silently diverge while the component and story both pass. **Phase 7 — DEPLOY** is
> governed by [`DEPLOYMENT_VERIFICATION_PROTOCOL.md`](./DEPLOYMENT_VERIFICATION_PROTOCOL.md):
> it reuses the Deep Figma Audit's exhaustive extraction, routes every assembly item
> to a layer (DS-component / DS-asset / app-data / ruling), and gates on a
> **complete, owner-signed coverage matrix before any fix is applied.**

## How it rides the existing sync loop

This pipeline does **not** replace the Implementor↔Governor sync loop in `sync/` —
it runs inside it. See `sync/PROTOCOL.md` and `sync/ROLES.md`.

- **Implementor** owns BUILD (`/figma-build`) + VERIFY (`/evidence-pipeline` / `/evidence-wave`). Its `HANDOFF.md` for an element
  cycle must link the spec file and paste the VERIFY discrepancy summary.
- **Governor** is the GATE. It reads the spec, the `verify` block, and the discrepancy
  report; it does **not** re-derive the design by eye. A spec at `status: implemented`
  with an unresolved discrepancy is `CHANGES_REQUESTED`. A clean VERIFY (vision pass +
  pixel pass + `audit:specs` green) is eligible for `APPROVED`.
- Element specs are `AGENTS.md`-governed like any source change (tokens, icons, a11y).

## IMPLEMENT blind spots (observed failures → checklist guards)

The following failures were caught post-implementation and promoted into required
checklist ids and IMPLEMENT step rules. Each guard exists because a real miss
happened here; do not remove or shortcut them.

| Blind spot | What happened | Guard |
|---|---|---|
| **Slot omission** | `Search/ClearButton` was skipped entirely because it was invisible in the default `empty` state. Code never rendered it. The slot must always be present; conditional slots use `visibility: hidden`. | `optional-slots-visibility` |
| **Size inflation** | `Header/CollapseButton` was rendered at `LAYOUT.hitTarget` (40px) "for accessibility." Figma specified 28×28, which already passes WCAG 2.4.11 (≥24×24). Inflating the visual size misrepresents the design. | `sizes-not-inflated` |
| **Hardcoded border-radius** | `Header/CollapseButton` used `RADIUS.soft` (8px) instead of the Figma-specified 4px because no `RADIUS.*` token existed for 4px. The correct fix is to add the token (`RADIUS.xs = 4`) and use it — never skip or approximate a border-radius. | `radii-tokenized` |
| **Wrong token, correct value** | `Search/Row` padding was `4px` in Figma. The spec's token column said `SELECT.searchPaddingY`. Code used `SPACE[1]` (also = 4). The value matched so the visual looked correct, but `SELECT.searchPaddingY` is the named contract for search row padding — if it ever diverges from `SPACE[1]`, this silently breaks. The spec's token column is authoritative; never substitute a numerically-equal token from a different namespace. | `padding-tokens-not-values` |
| **Spec self-contradiction** | A single spec carried conflicting geometry values across sections (for example, anatomy prose saying one padding while `container`/`tokenMap` declared another). Implementors then "fixed" code back and forth depending on which section they read first. **Rule: a spec must be internally consistent before implementation.** If `LAYER ANATOMY`, `container`, `tokenMap`, and narrative disagree on the same property, treat it as a spec defect and resolve the spec first. | `spec-internal-consistency` |
| **Hidden wrapper assumed instead of verified** | The story looked correct, but the live component did not prove the suspected extra wrapper or flex layer. The agent inferred a container that was never confirmed from code or Figma. **Rule: when a wrapper, slot, or label behavior is unclear, verify the live DOM/flex tree from code first. Never assume an invisible container exists or invent one in your explanation.** | `hidden-wrapper-verified` |
| **Overflow lineup mismatch (story fixture drift)** | Story text or handoff claimed a larger rail icon lineup, but the Storybook fixture still contained fewer sections. This prevented validating overflow behavior and created false completion claims. **Rule: when a story is used to validate rail overflow, verify and document the exact primary section count and the final section ID. Also treat the Figma ellipsis button in assembled frames as a visual overflow placeholder, not a regular section icon.** | `rail-overflow-lineup-verified` |
| **Rail overflow cap hard-coded in story** | The story fixture passed `maxVisibleRailItems={N}` with a small literal, making the rail always show the same fixed number of icons regardless of viewport height. This masked overflow behavior from visual review because the rail never auto-responded to window resizing. **Rule: a Rail overflow validation story MUST NOT hard-code `maxVisibleRailItems` unless the explicit purpose is to test a specific fixed count. Omit the prop so the rail auto-computes from available height, which is the production behavior.** | `rail-overflow-not-hard-capped` |
| **Broken play function using outer document reference** | A Storybook `play` function used `document.body.querySelector(...)` which references the outer Storybook shell document, not the iframe canvas where the story renders. This threw an `AssertionError` on every story load, blocking all user interaction in the story panel. **Rule: Storybook `play` functions MUST use the `within(canvasElement)` helper from `storybook/test` to scope all DOM queries to the correct canvas document. Never call `document.body.querySelector` or `document.querySelector` from a play function.** | `play-fn-canvas-scoped` |
| **Overflow menu clipped by `overflow:clip` container** | RailNav overflow ("More") menu used `position: absolute` inside the nav wrapper with `overflow: clip`. Result: menu rendered but was invisible (clipped). Root cause: `overflow: clip` clips absolutely-positioned children that extend beyond container bounds — a common `position: absolute` anti-pattern in overflow containers. **Rule: ALL dropdown/menu/popover/tooltip overlays MUST use `ReactDOM.createPortal(..., document.body)` with `position: fixed` and viewport-relative positioning from `getBoundingClientRect()`. Do NOT render any overlay as `position: absolute` inside a container with `overflow: hidden \| clip \| auto \| scroll`. See [AGENTS.md § Golden Rule #3](../../AGENTS.md) (full protocol) and [railnav.spec.md Protocol](./organism/railnav.spec.md) (RailNav-specific implementation checklist).** | `overlay-uses-portal-fixed` |
| **`sizing: fill` → `flex: 1` missing `minWidth: 0`** | `Search/Input` had `sizing: fill` in Figma (= `flex: 1; minWidth: 0` in CSS). Code had `flex: 1` but NOT `minWidth: 0`. `<input>` elements have a browser-default intrinsic min-width (~170px) that overrides `flex: 1` without `minWidth: 0`, pushing `ClearButton` outside the container padding boundary. Every `sizing: fill` on a flex child in a spec means **both** `flex: 1` and `minWidth: 0`. | `fill-sizing-min-width` |
| **`textAlignHorizontal` in TYPE tokens not translated to `textAlign` CSS** | `Row/Label` uses `TYPE/bodyS` and `TYPE/labelM`, both of which have `textAlignHorizontal: LEFT` in Figma. Our `TYPE.*` tokens do not include `textAlign` in their CSS property objects. Without an explicit `textAlign: "left"` on the label element, the browser UA applies `text-align: center`. Similarly `Row/Badge` uses `TYPE/caption` which has `textAlignHorizontal: RIGHT` — badge must have `textAlign: "right"`. **Rule: always check the `textAlignHorizontal` property on every TEXT node in Figma and set `textAlign` explicitly in code.** | `text-align-explicit` |
| **Focus ring using wrong token and wrong offset** | Code had `outline: 2px solid tokens.ink; outlineOffset: -1` (inset). Spec says `FOCUS.style(tokens)` = `tokens.accent + outlineOffset: 2` (outside). Figma `state=focus` uses the accent ring per DS contract. Never inline a focus ring — always use `FOCUS.style(tokens)`. | `focus-ring-token` |
| **Static story for interactive component** | All NavRow states were hardcoded via `row.state` prop. There was no actual expand/collapse behavior. A spec story that represents an interactive component MUST wire up the interactive state so it demonstrates all reachable states — not just the initial snapshot. | `interactive-story-state` |
| **Per-row hover state + static `forceHover` flag** | Each `SpecRow` had its own `useState(hovered)` allowing two rows to be highlighted simultaneously. Additionally a `forceHover: true` flag was baked into the tree data — a static flag that never cleared. Both are the stuck-hover antipattern (AGENTS §21f). **Rule: hover state in a list MUST be owned at the parent level as a single `hoveredId: string \| null`. No per-row hover state. No static hover flags.** Starting value of `hoveredId` can be set to show the demo initial state; it clears naturally when the user hovers any other row. | `single-hover-owner` |
| **`FOCUS.style` applied on mouse click** | `onFocus` fires on both keyboard Tab AND mouse click. `FOCUS.style(tokens)` was applied whenever `focused = true`, so clicking a row showed the purple accent ring even though `state=active` in Figma has only a `bgSubtle` background and NO ring. **Rule: add `onMouseDown={(e) => e.preventDefault()}` to EVERY button and interactive element that tracks focus state — not just list rows. Applies to ClearButton, CollapseButton, icon buttons, and any other button that has a focus state in its rendering logic.** | `focus-ring-keyboard-only` |
| **Token confirmed from spec, not from Figma** | `Row/Badge` color was `tokens.textSubtle` in the spec and was confirmed as correct without re-reading Figma. The organism node shows `#B9BBC6 = PALETTE.slate8 = tokens.textDisabled` — a different token entirely. **Rule: when asked "what token are you using vs Figma?", always re-read the Figma organism node fresh. Never confirm from spec or memory. The spec itself can be wrong.** | `organism-not-spec-for-verification` |
| **Partial slot node read — size copied, other properties skipped. Re-occurred after documentation.** | `NavRow` chevron slot and nav icon slot had `borderRadius: 4px` missed. Then `Search/Icon` slot — the SAME 18×18 `Icon/Slot` type — had `borderRadius: 4px` missed again after the rule was documented. **Root cause: the agent remembers slot type properties from context instead of re-reading the Figma node for each slot instance. A slot in context A and the same slot type in context B must BOTH be read independently from Figma.** Rule: every time you write a `<span>` or `<button>` for a named Figma slot, re-read that specific node's properties from Figma — regardless of whether the same slot type appeared earlier in the same component. | `slot-all-properties` |
| **`NavPanelScroll` gap not translated to `paddingRight`** | Figma `NavPanelScroll` is a row container with `gap: 8px` between `NavPanel` and the `Scrollbar` artifact. In code the scrollbar is browser-rendered so the gap becomes `paddingRight: SPACE[2]` on the scroll `<nav>`. Code omitted `paddingRight` entirely, causing the browser scrollbar to overlap row content. **Rule: when Figma uses a sibling-gap to create clearance for a Figma-only artifact (Scrollbar, resize handle, etc.), translate that gap to `paddingRight`/`paddingBottom` on the content element.** | `figma-artifact-gap-translation` |
| **State matrix only covers background + label — badge, icon, chevron assumed constant** | `NavRow` disabled state: code set `labelColor = tokens.textSubtle` (wrong) but never independently verified badge color for the disabled state. Badge was left at rest-state token. **Root cause: the state verification step only checks "background, label, icon fill." It never checks badge_color as a per-state value, so badge silently uses the rest token in all states including disabled.** Rule: `states[]` in the spec MUST capture a color value for EVERY colored slot, not just background and label. | `state-matrix-all-slots` |
| **Disabled state treated as background-only change** | `NavRow` `state=disabled`: label used `tokens.textSubtle` instead of `tokens.textDisabled`. Badge used its rest-state color instead of the disabled color. **Disabled is a FULL color reset — it overrides EVERY colored slot (label, badge, icon, chevron) to its disabled variant. Read every fill in the disabled Figma variant independently. Never assume disabled only changes the cursor and maybe the background.** | `disabled-full-override` |
| **Scrollbar gap applied unconditionally** | `paddingRight: SPACE[2]` was hardcoded on the `<nav>` scroll element regardless of whether a scrollbar was present. When content fits without overflow there is no scrollbar, so the gap produces a phantom right margin on every row — a visual discrepancy vs Figma. **Rule: scrollbar clearance (`paddingRight`) MUST be conditional: `paddingRight: scrollable ? SPACE[2] : 0`, where `scrollable` is derived from a ResizeObserver check (`scrollHeight > clientHeight`). Never apply the scrollbar gap unconditionally.** | `SC.UNCONDITIONAL-SCROLLBAR-GAP` |
| **Story integration never wired** | `SidebarPanelSpec` was a hardcoded static demo. It had no connection to the rail: section label was hardcoded "Slides", content was always SPEC_TREE, collapse button did nothing, search did not filter. **Rule: an organism story that contains interactive sub-components MUST wire them to each other via shared state in the wrapper. Hardcoded label/content in a named prop slot (header title, tree content) is a specification miss — every prop slot that Figma drives from data must be driven from data in code too.** | `organism-integration` |
| **`LAYOUT.panelGap` token wrong** | `LAYOUT.panelGap = SPACE[3] = 12px`. Figma RailNav organism (`221:3457`, `layout_52XY6Q`) shows `gap: 8px = SPACE[2]`. Token was never verified against the organism. **Rule: layout spacing tokens (gaps, margins) between organisms must be verified from the organism-level Figma node, not assumed from prior sessions or neighboring token values.** | `layout-token-organism-verify` |
| **`onPanelChange` missing section ID** | `onPanelChange(open: boolean)` only told consumers whether the panel opened/closed — not WHICH section. This made it impossible to drive external panel content from rail button clicks without adding a separate internal-state probe. **Rule: when a callback's purpose is to sync state to a consumer, it must pass ALL the state the consumer needs to act — not just a boolean. Think "what does the consumer need to react?" and pass that.** | `callback-complete-payload` |
| **Shared `iconFilled` applied to chevron** | `SpecRow` used a single `iconFilled = !isDisabled && engaged` boolean for BOTH the chevron slot (Regular only) and the nav icon slot (Regular→Filled on hover/active). The spec's state table clearly listed `chevron_fill: "regular"` for all states, but the story code reused one variable for all icons. **Rule: every icon slot must have its own fill variable derived from its own spec state-table row. Never share one fill boolean across two different icon slots in the same row.** | `state-matrix-all-slots` (slot-level icon fill) |
| **Colors-only audit (dimensions, structure, effects skipped)** | Five consecutive audit sessions compared Figma typography/colors to code but never extracted dimensions (`minHeight`, slot sizes), structural nesting (column→row→content), elevation (`boxShadow`), or per-section padding models. Row height was inflated by 4px, elevation was missing, panel padding was wrong, badge/disabled/chevron slots were missing — none caught. **Root cause: the agent selectively extracts "important" properties (colors, fonts) and skips "obvious" ones (dimensions, gaps, effects). GR4 requires exhaustive extraction.** Rule: every Figma audit MUST walk the "Deep Figma Audit Procedure" (§ below) — extracting ALL property categories for every node, computing natural heights, and comparing every slot per state. Never audit by sampling — audit by exhaustive enumeration. | `deep-audit-exhaustive` |
| **Computed dimension not verified (hug width)** | `LAYOUT.railW = 56px` had been in code since initial implementation. Figma rail node `layout_CHBUBF` is `sizing: hug` with `padding: 8px` wrapping a `38px` content column, producing a natural width of 8+38+8 = **54px**. The 2px discrepancy was never caught because no audit computed the hug width from Figma's padding + content — they only checked that the constant existed. **Rule: for any container with `sizing: hug`, compute the natural dimension from Figma (`padding + content`) and compare against the code constant. A named constant is not proof of correctness — verify its VALUE matches Figma's layout math.** | `hug-dimension-computed` |
| **Section wrapper nesting flattened in code** | Figma SidebarPanel (`224:3458`) uses a three-section model: each section (PanelHeader, PanelSearchBar, NavPanelShell) has its own wrapper frame with independent padding (`layout_T1WEW8` = 8px, `layout_HNC5RS` = 4px 8px). Code flattened this into a single-level children list — header at 4px padding with no 8px wrapper, missing the section isolation that makes full-bleed dividers work. **Rule: when Figma uses multiple wrapper frames with independent padding around the same parent, code MUST replicate that nesting. Each wrapper is structurally meaningful — it controls padding isolation and enables edge-to-edge dividers between sections. Flattening wrapper nesting is a structural GR4 violation.** | `section-wrapper-nesting` |
| **Wrong pressed-state token (adjacent surface copying)** | PanelHeaderMenuButton used `tokens.activeBg` (`#E8E8EC` = slate4) for its pressed state. Figma shows `fill_45NLP1` = `#E0E1E6` = `tokens.bgStrong` (slate5). The error came from copying the Menu row's pressed treatment (`activeBg` + inset boxShadow) which is correct FOR Menu rows but wrong for the PanelHeader trigger button — Figma uses a darker fill with no boxShadow for that surface. CollapseButton correctly used `bgStrong`. **Rule: every interactive surface's pressed-state token must be individually verified from its own Figma `state=pressed` variant. Do NOT copy pressed tokens from adjacent surfaces (Menu rows, Select triggers, etc.) without verifying the Figma fill var matches.** | `pressed-state-per-surface` |
| **Story icon identity mismatch — visually similar but wrong Fluent icon** | Story used `IconPeopleCommunity` (4-person icon) for a group labeled "Customers" — Figma specified `People` (2-person icon). Four children used placeholder `IconPerson` because the correct icons (`Medal`, `PeopleCheckmark`, `PeopleAdd`, `PersonHeart`) didn't exist in the codebase yet. **Root cause: when the correct Fluent icon isn't available, agents substitute a visually similar icon without flagging it as a known deviation. Similar-sounding icon names (People vs PeopleCommunity) pass casual review.** Rule: every icon used in a story MUST match the exact Fluent icon name shown in the Figma component instance. If the icon doesn't exist in `src/icons/`, create it from the Fluent UI System Icons repo before using a substitute. Substitutes are never acceptable without an explicit `// TODO: replace with IconX when available` comment AND a tracked finding. | `story-icon-figma-identity` |
| **Icon missing `filled` prop branch (`IC.FILLED-NOT-BRANCHING`)** | `IconCart` accepted only `size` and `color` — no `filled` prop, no two-path branch. Used in a NavRow context where hover/active states require Regular→Filled toggle. **Root cause: icon was originally created for a non-interactive context and was never updated when reused in an interactive slot.** Rule: every icon used in an interactive context (NavRow, RailButton, Menu row, any hover-fills surface) MUST accept `filled?: boolean` and branch on two SVG paths. When adding an icon to `fluent.tsx`, always download BOTH Regular and Filled SVGs from the Fluent repo — even if the current use case doesn't need filled. | `icon-filled-branch-interactive` |
| **Story code bypasses DS constants (component passes, story fails)** | `SidebarPanelSpec` hardcoded `width: 240` instead of `LAYOUT.panelW` (300). `SpecRow` hardcoded `minHeight: 32` instead of `LIST_ROW.compact` (28) and `padding: "6px 8px 6px 12px"` instead of `SPACE[1]`/`SPACE[2]`. The COMPONENT code (`RailNav.tsx`) correctly used `LAYOUT.panelW` and `LIST_ROW.compact` — so the Phase 2 audit (Figma → Component code) passed. But the Default story renders the story's `SidebarPanelSpec`, not the built-in panel, so Storybook displayed the wrong values. The audit never compared Figma against story code. **Root cause: the audit protocol's Phase 2 only walks `src/gallery/<El>.tsx` (component source). It does NOT walk `src/gallery/<El>.stories.tsx` (story source). Stories that contain custom sub-component implementations (like `SidebarPanelSpec`, `SpecRow`) are a parallel implementation surface — they can silently diverge from both Figma and the component while the component passes all checks.** Rule: Phase 2 (Figma → Code) MUST include a "**Figma → Story**" comparison sub-step. For any story that renders its own implementation of a sub-component instead of using the gallery component directly, every dimensional value in the story implementation must be compared against the same Figma node AND verified to use DS constants (not hardcoded px). A hardcoded pixel value in a story style object where a DS constant exists is a `STORY.DS-CONSTANT-BYPASS` (Medium) finding. | `story-uses-ds-constants` |
| **Triangulation skipped** | Code, spec, and Figma were not all read together before implementation. The agent made a judgment from a subset of the sources and missed the actual live flex behavior. **Rule: always triangulate code + spec + Figma before acting. If one source is missing, stop and fetch it.** | `code-doc-figma-triangulated` |
| **Hidden wrapper assumed instead of verified** | The story looked correct, but the live component did not prove the suspected extra wrapper or flex layer. The agent inferred a container that was never confirmed from code or Figma. **Rule: when a wrapper, slot, or label behavior is unclear, verify the live DOM/flex tree from code first. Never assume an invisible container exists or invent one in your explanation.** | `hidden-wrapper-verified` |

These correspond to IMPLEMENT step 4 ("Anatomy slot checklist") items.

## IMPLEMENT functional behaviors (non-Figma UX rules)

Figma defines WHAT a component looks like. It does NOT define HOW it behaves
across user action sequences (collapse/expand cycles, state persistence,
keyboard shortcuts, escape handling, toggle memory). These rules come from
UX best practices and are documented in `docs/interaction-patterns.md`.

**The gap this closes:** An agent can implement a pixel-perfect component that
behaves incorrectly — search box resets on collapse, menu preference lost on
section switch, keyboard trap on escape. Figma specs catch none of these
because they are static frames. The visual pipeline (EXTRACT → IMPLEMENT →
VERIFY) only guards appearance. This section guards behavior.

### Source of truth

`docs/interaction-patterns.md` is the canonical behavioral spec.
Each subsection defines an action table: user action → expected response.
When a component has interactive state (toggles, persistence, keyboard,
collapse/expand), the behavioral spec is as authoritative as the Figma spec.

### Required IMPLEMENT step

Before coding any interactive component:

1. **Check `docs/interaction-patterns.md`** for behavioral rules covering
   this component or its parent surface.
2. **If rules exist:** implement against the action table. Every row in the
   action table is a testable assertion.
3. **If NO behavioral spec exists AND the component has user actions beyond
   click→visual-change** (toggles, persistence across mount/unmount, keyboard
   sequences, escape handling): flag it as a `FN.BEHAVIOR-UNDOCUMENTED`
   (Medium) finding and ask the user before inventing behavior.

### What counts as "interactive state" (requires a behavioral spec)

- State that must survive component remount (panel collapse/expand)
- Toggle preferences (show/hide search, show/hide columns)
- Keyboard shortcuts beyond Enter/Space/Escape-to-close
- Multi-step action sequences (search → filter → clear → restore)
- State scoping rules (section-scoped vs session-scoped vs global)

### Blind spots (observed behavioral failures)

| Blind spot | What happened | Guard |
|---|---|---|
| **Search visibility reset on panel collapse/expand** | `searchEnabled` was `useState(true)` inside the panel component. Panel collapse unmounts the component; re-expand remounts it — `useState(true)` resets the preference. User toggled search off, collapsed panel, expanded again: search was back. **Root cause: transient UI state (`useState`) used for a session-level user preference. Session preferences must be lifted to the parent or passed as controlled props so they survive child remounts.** Rule: any toggle that represents a user preference (not a momentary visual state) MUST be a controlled prop or lifted state — never local `useState` inside a component that can unmount. | `state-persistence-verified` |
| **Escape key behavior undefined** | No spec defined what Escape does in the search input. Agent implemented Escape to hide the search box entirely (not just clear text). User expected Escape to clear text, then second Escape to close panel. **Root cause: keyboard behavior was invented during implementation without a behavioral spec to reference.** Rule: every component with a text input or popover MUST have explicit Escape key behavior defined in `interaction-patterns.md` before implementation. | `keyboard-escape-defined` |
| **Search text scope not defined** | Agent preserved search text across section switches. User expected search text to clear when switching sections (search is section-scoped) but visibility preference to persist (preference is session-scoped). **Root cause: the two states (visibility and text) have different scoping rules, but no spec distinguished them.** Rule: when a component has multiple state variables, `interaction-patterns.md` must define the scope and persistence of EACH variable independently. | `state-scope-documented` |
| **Footer button placed in wrong prop slot — no panel opens** | Settings button was passed via `utilityItems` (raw `ReactNode`, no panel association) instead of `footerSections` (`RailSection[]`, panel-opening behavior). The button rendered correctly in the footer zone and looked identical to a section button, but clicking it did nothing because `utilityItems` has no panel routing. **Root cause: `utilityItems` and `footerSections` produce visually identical buttons in the same footer zone, so the wrong slot is invisible during visual review. The distinction is behavioral (opens panel vs doesn't), not visual.** Rule: when implementing a footer button that should open a sidebar panel, use `footerSections` (not `utilityItems`). When reviewing a story, verify that every footer button either (a) opens a panel via `footerSections`, or (b) is intentionally standalone and documented as such. **Severity: HIGH — blocks `beta` promotion.** See `interaction-patterns.md` § "Utility items slot" for the mandatory implementation-time verification question. | `footer-button-panel-slot` |

### Checklist ids (added to `_TEMPLATE.spec.md`)

| id | What it guards |
|---|---|
| `behavior-spec-exists` | Component with interactive state has a behavioral spec in `docs/interaction-patterns.md` |
| `state-persistence-verified` | State that should survive component remount/re-expand does so (controlled prop or lifted state) |
| `keyboard-escape-defined` | Escape key behavior is explicitly defined for every component with a text input or popover |
| `state-scope-documented` | Each state variable's scope (transient / section / session / global) and persistence rules are documented |

## Workspace = spec family (one spec per node)
variations, and its subcomponents. The pipeline mirrors this:

- **One spec verifies one node.** A spec's `figma.thisNode` is the single node it
  owns; `figma.nodeMap` documents every node in the workspace with its `role`
  (element | variation | subcomponent), `nodeId`, layer `path`, and owning `spec`.
- **Siblings get their own specs** in the same family. Example — ActionMenu
  workspace `139:3227`: `actionmenu.spec.md` (main `139:3321`),
  `actionmenu-sort-submenu.spec.md` (`162:2959`),
  `actionmenu-presets-submenu.spec.md` (Presets `141:3145`).
- **Read only the node at its documented path.** The `node-path-verified` checklist
  guard forces EXTRACT to confirm the fetched node sits at its `nodeMap` path —
  never a similarly-named node from elsewhere.
- A spec at `status: draft` is a tracked stub (lenient in `audit:specs`) until
  EXTRACT fills it.

## The single-example + coverage-gap rule

Each element gets the **fewest examples that cover all its options**, not one story
per state. The canonical example is the verified Figma replica (`FigmaSpec`).

Coverage is tracked in the spec's `verify.statesToCapture`. Any state not yet shown
in a captured story is a **coverage gap**. EXTRACT and VERIFY must **report gaps
explicitly** (never silently) so the human decides, per gap:

1. **fold it into the first view** (e.g. mixed-icon row already in the main menu), or
2. **add one more deliberate example** under that element.

`checklist.story-covers-all-states` stays `pass: false` until every
`statesToCapture` entry has a capture. Do not flip it true to "go green" — the
honest false is the signal that drives the human's fold-or-add decision.

## VERIFY mechanics (the Evidence Protocol)

Verification runs through the Evidence Protocol (`docs/evidence/`), not pixel-diff
baselines. The captures and reviews land in `docs/evidence/<slug>/`:

1. **Capture:** the evidence scripts capture both ground truth and build into
   `docs/evidence/<slug>/`:
   - Figma export via `scripts/evidence-capture-figma.js`,
   - Storybook story render via `scripts/evidence-capture-story.js`,
   - per-state captures via `scripts/evidence-capture-states.js`.
2. **3 independent reviews:** three independent reviewers each compare the render
   to Figma against the spec's state matrix and `tokenMap`, emitting per-discrepancy
   verdicts (figma value, code value, severity). Authority = Figma.
3. **Adjudicate:** reconcile the three reviews into a single `verdict.md`, resolving
   each discrepancy in the spec's `verify.discrepancies` with a settled verdict
   (`resolved` / `accepted` / `story-setup`).
4. **Sign + gate:** sign the evidence bundle, then run `npm run audit:evidence`
   (the Evidence Gate) — it must pass before the component is sealed.

Run the pipeline with `/evidence-pipeline <slug>` (one component) or
`/evidence-wave <level|slugs>` (many). See `docs/evidence/PIPELINE.md` and
`docs/evidence/GUIDE.md`.

### Dark Atom Surface Gate (Atoms family)

When validating the dark atom family before promotion to molecules, run a
surface-switch gate that compares Storybook captures of the same atom story under:

- `theme=light; atomSurface=atom`
- `theme=light; atomSurface=darkAtom`
- `theme=dark; atomSurface=atom`
- `theme=dark; atomSurface=darkAtom`

And a cross-theme dark-surface check:

- `theme=light; atomSurface=darkAtom` vs `theme=dark; atomSurface=darkAtom`

Command:

```bash
npm run audit:atoms:dark-visual
```

Artifacts:

- Markdown report: `docs/audits/dark-atoms-visual-latest.md`
- Captures: `test-results/dark-atoms-visual/*.png`

Gate rule:

1. All `Atoms/*` targets in scope must report `PASS` in `dark-atoms-visual-latest.md`.
2. Any `FAIL` (`No visual delta between Atom and Dark Atom`) blocks promotion.
3. `theme=light; atomSurface=atom` and `theme=dark; atomSurface=atom` MUST differ when the theme token family changes. If they are visually identical because the component hard-binds light tokens, treat it as a code/token-context mismatch.
4. `theme=light; atomSurface=darkAtom` and `theme=dark; atomSurface=darkAtom` SHOULD remain visually identical unless the dark-atom spec explicitly says otherwise, because `darkAtom` is the fixed dark-family surface contract.
5. Any cross-theme `FAIL` (`DarkAtom is identical in Theme=light and Theme=dark`) only blocks promotion when the spec expects theme sensitivity on that path; otherwise, the blocking failure is the inverse case: `atom` failing to respond to the live theme.
6. Resolve code/token-context mismatch first, then rerun the command until green.

### Molecules are independent (no dark/light duality)

Unlike atoms, **molecules do NOT have an atom↔darkAtom swap-pair.** An atom ships as a
light atom *and* a dark atom that share one component and swap surfaces (the Dark Atom
Surface Gate above). A molecule does not: it is **either a light molecule OR a dark
molecule**, each a distinct Figma component with its own spec and its own Storybook story.

In Figma this is just two spatial buckets under one file: section `Molecules` (`597:3414`,
light) and section `MoleculesDark` (`597:3415`, dark). Most molecules are light-only; only a
few have a dark sibling, and that sibling is a **separate component set** (e.g. `MenuItem`
`139:3594` in light vs `MenuItemDark` `194:3128` in dark; `AccordionHeaderDark` `378:5004`).

Consequences (enforced):

1. **No surface-switch pill on molecule stories.** The Atom/Dark-Atom pill (`.storybook/
   preview.tsx`) renders only for `Atoms/*` stories (and the rare explicit
   `useAtomSurfaceGlobals` opt-in). A molecule story renders its one surface directly; there
   is nothing to toggle. (Toggling it on a molecule never re-themed anyway — a story render
   cannot read the `atomSurface` global the decorator can — so the pill was dead UI there.)
2. **One story per molecule surface.** `Molecules/MenuItem` renders the light molecule
   (`variant="atom"`); the dark surface lives in its own `Molecules/MenuItemDark` story.
   Do not fold a dark molecule into a light molecule's story via a surface toggle.
3. **A dark molecule spec binds its dark Figma node**, not a `darkAtom` surface of the light
   node. Verify each against its own node in the correct section.

### Molecule composition protocol

When a molecule contains interactive atoms, treat the molecule and each atom as two
different state machines:

1. **Molecule state controls the shell.** The molecule's `default` / `active` /
   `disabled` variants describe the overall container, shared label flow, and any
   cross-slot coordination that belongs to the whole molecule.
2. **Atom state controls the slot.** Every embedded atom must still follow its own
   atom spec and state matrix. A molecule may expose or hide an atom, but it must not
   invent a new visual state for that atom.
3. **State mapping must be explicit.** The molecule spec should document, per slot,
   which atom state is used in each molecule state and which trigger changes it
   (for example: shell hover, direct atom hover, disabled).
4. **Verify from the atom spec first.** If a slot's appearance is wrong, compare it
   against the atom's own spec before changing the molecule shell. If the atom spec
   is correct and the molecule wrapper is wrong, fix the wrapper mapping, not the atom.
5. **Do not collapse the two layers.** A molecule state is not a replacement for an
   atom state. Reusing the same atom in multiple molecule states is valid; forcing all
   slots to mirror the molecule state is not.
6. **When alignment is missing from the written spec, inspect the raw Figma node tree.**
   If the spec omits a shell alignment detail, use the node layout data and direct
   children ordering to determine the container's placement before deployment. Record
   that explicitly in the molecule spec. Callout is the model example: the shell is
   top-aligned, the value stack is a child row, and the trailing TrendSlot is centered
   within its own slot.

AccordionHeaderDark is the canonical example in this repo: the header shell owns the
`default` / `active` / `disabled` molecule state, while `InfoIcon`, `EllipsisButton`,
and `ChevronTrigger` each keep their own documented atom states inside that shell.

### Atom-state inheritance gate (mandatory)

This gate exists because repeated implementation misses came from treating all atoms in
a molecule as if they shared one shell-level visibility/state model.

For every molecule that embeds interactive atoms, complete this sequence before changing
code:

1. Build an atom-state ownership table in the molecule spec with one row per embedded
    atom:
    - atom name
    - atom rest state
    - shell-controlled triggers (if any)
    - atom-controlled triggers
    - forbidden overrides
2. Verify each embedded atom against its own atom spec before touching molecule code.
3. Apply shell logic only where the molecule truly owns behavior (for example, shell
    hover reveals one atom), and leave atom internals to the atom.
4. Prove in Storybook (or Playwright) that each atom still transitions through its own
    documented states after composition.

**STOP CONDITIONS (do not proceed):**

- If an atom state is inferred from another atom's behavior.
- If shell code forces an atom to skip its documented rest/hover/pressed/focus chain.
- If molecule code uses one visibility/state flag to drive multiple atoms with different
   atom contracts.
- If the molecule spec lacks an explicit atom-state ownership table.

**CardHeader rule-of-thumb (explicit):**

- `InfoIcon` and `ChevronTrigger` are both atoms, but they do not share the same
   shell-visibility contract.
- A shell reveal rule applied to `InfoIcon` must not be copied to `ChevronTrigger`
   unless Figma + atom spec explicitly require it.

### ⚠ Capture hazard — stale server

The evidence capture (`chromium.launch` in `scripts/evidence-capture-story.js`)
drives a Storybook on `:6006`. A stale Storybook on `:6006` (old code) will be
silently reused and produce **false captures**. Before any VERIFY capture, **kill
the port first**:

```bash
for pid in $(netstat -ano | grep ":6006" | awk '{print $5}' | sort -u); do taskkill //PID $pid //F; done
```

(This masked the ActionMenu checkmark fix across several runs until diagnosed via a
DOM-fill probe. `/evidence-pipeline` automates the kill.)

## Figma Exception Preservation Protocol

Use this when a visual/property detail in Figma should NOT be implemented literally,
or when shipped behavior intentionally extends beyond what the static Figma node can
express.

Typical cases:

- Figma editor artifacts (component-set scaffold strokes, guide outlines, authoring helpers)
- Platform-limited behaviors (advanced animation semantics, browser-only interaction behavior)
- Intentional code override approved by the owner (for example, AI semantic emphasis effect)

Required handling (mandatory):

1. Record each exception in the element spec under an **Exception Registry** with:
   - stable ID (for example `EX-AIPILL-001`)
   - type (`figma-editor-artifact`, `non-emulable-platform`, `intentional-code-override`)
   - Figma source node/property
   - why literal implementation is wrong/incomplete
   - exact code behavior to preserve
   - fallback behavior (including reduced-motion when applicable)
   - preservation rule (what must never be "cleaned up" later)
2. Reflect the exception in `container` / `states` / `tokenMap` so the front-block is
   internally consistent with shipped behavior.
3. Add the exception to checkpoint audit output (Phase 3 comparison + Phase 4 fix log).
4. If the exception changes token policy (for example hardcoded animation gradient
   stops), include explicit rationale and keep it narrowly scoped.

STOP CONDITIONS:

- If code uses behavior that contradicts Figma/spec and no exception registry entry exists.
- If spec front-block says one behavior and narrative sections describe another.
- If an exception is implied by comments only and missing from spec + checkpoint audit.

This protocol exists to make exceptions durable across sessions so they are not lost
when chat context resets.

## Skills

| Skill | Phase | Skill file | One-liner |
|-------|-------|------------|-----------|
| `/figma-build <slug>` | BUILD (extract→implement) | `.claude/skills/figma-build/SKILL.md` | read Figma at correct depth → fill spec schema (`audit:specs`) → code + story (+ icons) → health |
| `/evidence-pipeline <slug>` | VERIFY (one) | `.claude/skills/evidence-pipeline/SKILL.md` | capture → 3 independent reviews → adjudicate → fix-loop → record → sign → Evidence Gate `PASS — 0 findings` (signed bundle; `doer≠checker`) |
| `/evidence-wave <level or slugs>` | VERIFY (many) | `.claude/skills/evidence-wave/SKILL.md` | discover slugs by level → run the per-component pipeline on each → governor-vetted self-refinement retrospective → push |

## Deep Figma Audit Procedure

> **When to use:** Every time the user requests "review the Figma as source of truth
> and compare to documentation/code." Also used in EXTRACT and VERIFY phases for
> any element that touches multiple sub-molecules. This procedure replaces the prior
> shortcut of "read the spec and assume it's correct."
>
> **Why it exists:** Five consecutive audit sessions (2026-06-10) missed dimensional
> properties, structural nesting, icon slot borderRadius, badge slots, disabled
> states, and elevation — because the agent compared typography and colors only,
> skipping the exhaustive property extraction that GR4 requires. This procedure
> makes every category of property a **required extraction step** so nothing is
> skipped by selective attention.

### Phase 1 — Exhaustive Figma Property Extraction

**STOP CONDITION — Figma MCP gate (mandatory, no exceptions):**

> Before ANY comparison between Figma and code/spec can begin, you MUST have called
> the Figma MCP tool (`get_figma_data`) for EVERY node in the audit scope. Reading
> the spec file, reading code comments, recalling values from session memory, or
> referencing prior audit results is NOT a substitute for calling the Figma MCP tool.
>
> **If you have not fetched Figma node data via MCP for every node in scope, the
> audit has not started. STOP and fetch before proceeding.**
>
> This gate exists because the #1 failure mode across six consecutive audit sessions
> was the agent reading the spec (which is already in the codebase and faster to
> access) instead of calling Figma. The spec can be wrong. Figma is the source of
> truth (GR4). The shortcut of reading the spec is ALWAYS the path of least
> resistance and ALWAYS the wrong path.

**Show-your-work requirement:**

> After fetching Figma data, you MUST present the raw extracted property inventory
> to the user BEFORE presenting any comparison table. This makes the absence of
> Figma data immediately visible. The format is:
>
> ```
> ## Figma extraction — <NodeName> (<nodeId>)
> Fetched via MCP: ✅ (depth: N)
>
> ### Component-level
> - layout: row/column
> - padding: Tpx Rpx Bpx Lpx
> - gap: Npx
> - ...
>
> ### Child: <SlotName>
> - dimensions: W×H
> - borderRadius: N
> - ...
>
> ### State: <state-name>
> - slot_1 fill: #hex → token
> - slot_2 fill: #hex → token
> - ...
> ```
>
> If you skip this presentation step and jump directly to a comparison table,
> you have violated the show-your-work requirement. The user cannot verify that
> you actually read Figma vs. assumed from spec.

For EACH Figma node in the audit scope, extract **every** property into a structured
inventory. Do not skip any category. Do not confirm from spec memory — re-read the
Figma data for every value.

**1a. Component-level properties (the COMPONENT or FRAME node):**

| Category | Properties to extract |
|---|---|
| **Layout** | `mode` (row/column), `justifyContent`, `alignItems`, `alignSelf` |
| **Spacing** | `padding` (all 4 sides — watch for 3-value and 4-value shorthand), `gap` |
| **Sizing** | `horizontal` (fill/fixed/hug), `vertical` (fill/fixed/hug), `width`, `height` |
| **Visual** | `borderRadius`, `fills` (map hex → token), `strokes`, `strokeWeight` |
| **Effects** | `boxShadow` / `elevation` / `effects` |
| **Overflow** | `overflow` (clip/hidden/visible/scroll) |

**1b. For EVERY child node, recursively:**

| Category | Properties to extract |
|---|---|
| **Slot dimensions** | `width × height` (explicit from layout dimensions) |
| **Slot borderRadius** | Always check — even if the same slot type appeared earlier in this component |
| **Slot sizing mode** | `fill × hug`, `fixed × fixed`, etc. → translate to CSS (`flex:1; minWidth:0` for fill) |
| **Gap to siblings** | Parent's `gap` value between this child and the next |
| **Component ID** | For INSTANCE nodes — which component variant is used? (`filled=true` vs `filled=false`, `size=16` vs `size=20`) |

**1c. For EVERY TEXT node:**

| Category | Properties to extract |
|---|---|
| **textStyle** | Which TYPE token? (TYPE/bodyS, TYPE/labelM, TYPE/caption, TYPE/headingS) |
| **fills** | Map hex → token (e.g., `#60646C` → `tokens.textMuted`) |
| **textAlignHorizontal** | LEFT, RIGHT, CENTER — must be explicit in code |
| **textAlignVertical** | TOP, CENTER — verify against code's vertical alignment |
| **Sizing** | `fill × hug` → needs `flex: 1; minWidth: 0` in code |

**1d. For EACH state variant:**

Extract fills/fonts for **every colored slot** — not just background and label:

| Slot | Must extract per state |
|---|---|
| Component fill (background) | hex → token |
| Component stroke (border) | hex → token + strokeWeight |
| Label fill + font | hex → token, TYPE token (weight change?) |
| Badge fill + font | hex → token (badge is often overlooked) |
| Chevron Shape fill | hex → token |
| Chevron component variant | Direction (Right/Down), Theme (Regular/Filled) |
| Nav icon Shape fill | hex → token |
| Nav icon component variant | `filled=true` or `filled=false` |
| Any other colored element | Every SVG shape, rectangle, decorative element |

**1e. Compute natural height:**

For every row/item component with `vertical: hug`:
```
natural height = paddingTop + max(child fixed heights) + paddingBottom
```
Example: `padding: 4px 8px` + `LeadingSlot height: 20px` = 4 + 20 + 4 = **28px**.
This is the Figma source of truth for row height. Do NOT use a code constant
unless it equals this computed value exactly.

**1f. TYPE token verification:**

For every TYPE token referenced in the Figma data, extract the full definition
from `globalVars.styles`:

| Property | Must match code token |
|---|---|
| `fontFamily` | e.g., Inter |
| `fontWeight` | e.g., 400, 500 |
| `fontSize` | e.g., 13px |
| `lineHeight` | e.g., 150%, 140% |
| `textAlignHorizontal` | Must be set explicitly in code |

Compare against `src/tokens.ts` TYPE token definitions. Any mismatch in
`lineHeight`, `fontSize`, or `fontWeight` is a GR4 violation.

**1g. Nested flex-role inventory:**

For every immediate child wrapper inside the component, document the flex role of
each axis explicitly. Do not collapse nested wrappers into one generic "row".

| Required field | What to record |
|---|---|
| Wrapper / slot name | The Figma node name and the matching code element name |
| Flex role | `fill`, `hug`, or `fixed` for horizontal and vertical sizing |
| Code translation | `flex: 1`, `minWidth: 0`, intrinsic hug sizing, or fixed px value |
| Axis behavior | `justifyContent`, `alignItems`, and whether the wrapper owns row or column flow |
| Fixed slots | Explicit width/height for icons, badges, and action buttons |

If Figma names a nested frame (for example `HeaderLeft` or `HeaderActions`), the
spec must preserve that wrapper in the anatomy section and the code must mirror
its flex role. A flat "container renders children" note is not sufficient.

**1h. Text-node role inventory:**

For every visible label or text block, document the text node separately even when
it sits inside a flex wrapper. Record the node's axis behavior and sizing as its
own line item.

| Required field | What to record |
|---|---|
| Text node name | Figma text layer name and matching code element name |
| Axis sizing | `fill × hug`, `hug × hug`, or `fixed × hug` |
| Text alignment | Explicit horizontal and vertical alignment |
| Wrapping behavior | Whether it truncates, wraps, or stays single-line |
| Code translation | `flex: 1`, `minWidth: 0`, `whiteSpace`, `textOverflow`, `overflow` |

If a text node fills the remaining horizontal space in a row, do not call it
"hug-hug" in the spec. Mark it as fill-x / hug-y and verify the code uses the
matching flex behavior.

### Phase 2 — Three-Layer Comparison

With the complete Figma inventory from Phase 1, compare against TWO targets:

**2a. Figma → Spec docs (`docs/atomic/<level>/<el>.spec.md`):**

Walk every property in the Figma inventory. For each:
- Is it present in the spec? (Missing = spec gap)
- Does the spec value match Figma? (Mismatch = spec error, fix the spec)
- Does the spec use the correct token name? (Wrong token = `padding-tokens-not-values`)

**2b. Figma → Code (`src/gallery/<El>.tsx`):**

Walk every property in the Figma inventory. For each:
- Is it implemented in code? (Missing = implementation gap)
- Does the code value match Figma? (Mismatch = GR4 violation)
- Does the code use the correct token? (Literal px where token exists = drift)
- Is the structural nesting correct? (Flat vs nested = structural gap)
- Does every immediate child wrapper preserve its documented flex role? (fill/hug/fixed mismatch = structural gap)

**2c. Figma → Story (`src/gallery/<El>.stories.tsx`):**

**STOP CONDITION — Story implementations are auditable code surfaces.**

> If the story renders a custom sub-component instead of using the gallery component
> directly (e.g., `SidebarPanelSpec` instead of RailNav's built-in panel, `SpecRow`
> instead of `PanelItem`), that custom implementation is a PARALLEL code surface
> that must be audited against Figma with the SAME rigor as the component.
>
> A story that passes visual review while using hardcoded values that diverge from
> DS constants (e.g., `width: 240` instead of `LAYOUT.panelW = 300`, `minHeight: 32`
> instead of `LIST_ROW.compact = 28`) is a **false positive** — the Storybook output
> looks approximately right but uses wrong values.

Walk every style object in the story's custom sub-components. For each numeric value:
- Does a DS constant exist for this value? (`SPACE[N]`, `LAYOUT.*`, `LIST_ROW.*`, `RADIUS.*`)
- If yes, is the story using the constant or a hardcoded literal?
- Does the hardcoded value even MATCH the constant? (`width: 240` ≠ `LAYOUT.panelW = 300`)
- Hardcoded px where a constant exists = `STORY.DS-CONSTANT-BYPASS` (Medium) finding

### Phase 3 — Discrepancy Report

Produce a table with ALL findings, classified by severity:

| Severity | Criteria |
|---|---|
| **GR4 violation** | Any dimensional, color, or typographic value that disagrees with Figma |
| **Medium** | Missing structural element, missing slot property, missing state handling |
| **Low** | Cosmetic difference that doesn't affect visual output |

The report MUST include:
- The exact Figma value (hex/px/token)
- The exact code value (constant/px/token)
- Which protocol blind spot it maps to (from the blind spots table above)
- Whether the spec also has the error or only the code

### Phase 4 — Fix Priority

Fix in this order:
1. **GR4 violations** — dimensional/color/type mismatches (highest priority)
2. **Story DS-constant bypass** — story hardcodes values that diverge from DS constants
3. **Structural gaps** — missing padding model, elevation, nesting
4. **Missing features** — disabled state, badge, search bar, dividers
5. **Spec-only errors** — spec disagrees with Figma but code is correct (or both wrong)

### Mandatory extraction categories (checklist)

Every deep Figma audit MUST confirm extraction of ALL of the following. If any
category is skipped, the audit is incomplete and must be re-run.

```
□ padding (all 4 sides, per component + per child wrapper)
□ gap (between children, per container)
□ dimensions (width × height, per slot)
□ borderRadius (per element — even repeated slot types)
□ fills per state (background, label, badge, icon, chevron, any other)
□ strokes per state (border color + width)
□ textStyle per state (which TYPE token, verify weight/size/lineHeight)
□ textAlign per TEXT node (LEFT/RIGHT/CENTER — explicit)
□ sizing mode per element (fill/fixed/hug → CSS translation)
□ nested flex-role inventory (each immediate child wrapper: fill/hug/fixed + code mapping)
□ text-node role inventory (each visible label/text block: fill/hug/fixed + alignment + wrapping)
□ natural height computation (padding + content for hug containers)
□ hug width computation (padding + content for hug-width containers → compare to layout constants)
□ effects (boxShadow / elevation)
□ component variant IDs (filled vs regular, direction, size)
□ overflow mode
□ disabled state (FULL color reset — every slot)
□ focus state (stroke + fill + which focus mechanism)
□ section wrapper nesting (multi-section padding isolation in Figma → replicate in code)
□ pressed-state token per surface (verify from Figma fill var, not copied from adjacent component)
□ story implementation audit (every story sub-component uses DS constants, not hardcoded px)
```

### Phase 4 — Mandatory Storybook Visual Gate (COMMIT BLOCKER)

**This gate exists because AccordionHeaderDark was audited, called "complete," committed,
and pushed on 2026-06-23 WITHOUT a single Storybook screenshot being shown in the
conversation. The regression was only caught because the user looked at Storybook
themselves. A text claim of "Verified ✅" in a checkpoint document is invisible proof —
it looks identical whether the verification happened or not.**

**The rule: no commit is allowed until the user has seen the screenshots and confirmed.**

#### Required before every molecule/organism commit:

1. **Navigate Storybook to the Example story** — take a screenshot and post it in the conversation.
2. **Navigate Storybook to the Variants story** — take a screenshot and post it in the conversation.
3. **If the component has multiple states (default/active/disabled)** — the Variants story must show all states simultaneously so the user can verify each one.
4. **Ask explicitly:** "Does this match what you expect? Shall I commit?" — and wait for the user to say yes, looks good, or proceed.
5. **Only after user confirmation:** run `git add` and `git commit`.

#### What "verified" must mean:

- The screenshot was taken in this conversation, in the current turn, and the user saw it.
- "Verified" written in a checkpoint document with no screenshot shown = NOT verified.
- Passing typecheck and audit:components = code is correct — NOT visually verified.
- These are two different gates. BOTH must pass before committing.

#### STOP CONDITIONS:

- If you are about to write `git commit` without having posted at least one screenshot in this conversation turn — STOP.
- If the user has not responded to the screenshot with a confirmation — STOP.
- If you posted a screenshot but it shows a loading spinner, blank canvas, or error — STOP, reload and retry.

**Why text-only "verification" will always fail:** The agent can fill in a "PASS" text
field in a document without executing any tool. There is no gap visible to the user.
Screenshots posted in the conversation cannot be fabricated — they require actually
navigating the browser and capturing the result. This makes absence immediately visible.

---

### Anti-patterns (what NOT to do)

**STOP CONDITIONS — these are not suggestions, they are hard stops:**

1. **Spec-as-Figma substitution.** If you are about to compare spec values to code
   WITHOUT having called the Figma MCP tool for the node in question — STOP. You are
   not auditing Figma; you are auditing the spec. The spec can be wrong. This was
   violated in the same session that wrote this protocol (2026-06-10), proving that
   a passive anti-pattern table does not prevent the behavior. Only a stop condition
   prevents it.

2. **Comparison without raw extraction.** If you are about to present a comparison
   table without first presenting the raw Figma property inventory — STOP. The
   show-your-work requirement (Phase 1) is mandatory. Skipping it means neither
   you nor the user can verify the data source.

3. **Selective category extraction.** If you are about to present findings that cover
   only colors and fonts — STOP. Check the mandatory extraction checklist above. If
   any category box is unchecked, the audit is incomplete.

4. **Text-only visual verification.** If you are about to write "Storybook verified ✅"
   in a checkpoint document without having posted a screenshot in the conversation —
   STOP. See Phase 4 Mandatory Storybook Visual Gate above. Text claims cannot be
   verified by the user. Screenshots in the conversation cannot be fabricated.

4. **Component-only audit (story code not checked).** If you have compared Figma
   against the component source (`src/gallery/<El>.tsx`) but NOT against the story
   source (`src/gallery/<El>.stories.tsx`) — STOP. Stories that render custom
   sub-components (e.g., `SidebarPanelSpec`, `SpecRow`) are parallel implementation
   surfaces. A component that uses `LAYOUT.panelW = 300` while its story hardcodes
   `width: 240` will pass the component audit but display wrong values in Storybook.
   Phase 2c is mandatory. This stop condition exists because three consecutive
   findings (panel width 240→300, row height 32→28, row padding 6px→4px) were all
   in story code that the audit never checked.

| Anti-pattern | Why it fails | Correct approach |
|---|---|---|
| Read spec, assume it's Figma | Spec can be wrong. Confirmed in 6 sessions. STOP CONDITION #1. | Always call Figma MCP fresh |
| Check colors only | Misses dimensions, gaps, elevation, borderRadius | Extract ALL categories above |
| Confirm from memory / prior session | Memory drifts. Token names change. | Re-read Figma globalVars every time |
| Skip badge/chevron per state | Badge + chevron have per-state fills that differ from label | Extract every slot per state |
| Skip natural height computation | `minHeight` inflation is the #1 recurring GR4 miss | Compute: padding + content height |
| Skip elevation/boxShadow | "It's just a shadow" — but it defines visual hierarchy | Extract effects from node |
| Assume flat structure = correct | Figma nesting carries borderRadius, fixed heights, gaps | Compare structural depth |
| Jump to comparison without raw inventory | User cannot verify data source. STOP CONDITION #2. | Present raw Figma extraction first |
| Audit component code only, skip story code | Story sub-components bypass DS constants. STOP CONDITION #4. | Phase 2c: compare Figma → story code |
| Hardcode px in story where DS constant exists | Story diverges from component silently. `width:240` vs `LAYOUT.panelW=300`. | Use `LAYOUT.*`, `LIST_ROW.*`, `SPACE[]`, `RADIUS.*` in story code |

## Figma-First Structural Inspection (Pre-Implementation Workflow)

> **When to use:** Before implementing ANY new layout behavior, scroll pattern,
> padding model, or structural change that doesn't yet have a Figma reference.
> Also when an implementation attempt has failed and the root cause was
> assumption-based padding/spacing/overflow decisions.
>
> **Why it exists:** 2026-06-11 — ActionMenu scroll containment was implemented
> from assumptions about padding ownership and maxHeight caps. The result was
> worse than the original. The user proposed a Figma-first workflow: create the
> Figma organism first, extract from it, align on findings, document the contract,
> THEN implement. This workflow caught 4 Figma inconsistencies (gap:10→0,
> borderRadius:12→0 on inner sections, fixed→fill on last section, unnamed frames)
> that the user then fixed — improving both the design AND the implementation spec
> in one pass.

### The workflow

```
(1) DEFINE QUESTIONS → (2) USER CREATES FIGMA → (3) INSPECT + NAME → (4) ALIGN → (5) DOCUMENT → (6) IMPLEMENT → (7) COMPARE
    Agent lists          Human builds              Agent extracts         User confirms    AGENTS.md rules     Code changes        Screenshot
    open decisions       organism in Figma          every property +       or adjusts      before code          from rules          vs Figma
                                                    renames frames
```

### Step 1 — Define open design questions

Before the user builds the Figma organism, the agent MUST enumerate the specific
design decisions needed. Each question should be:
- **Specific** — not "how does padding work" but "what is the horizontal gap between
  row content and the scrollbar track?"
- **Answerable from Figma** — the user can resolve it by building or annotating a frame
- **Numbered** — so the user can respond by number

### Step 2 — User creates Figma organism

The user builds the Figma frame that answers the design questions. This is the
source of truth — not a suggestion, not a wireframe.

### Step 3 — Inspect + name

The agent MUST:
1. **Fetch via MCP at depth ≥ 6** — never assume structure from a screenshot
2. **Download a reference image** — for visual cross-reference
3. **Name every unnamed frame** with a code-equivalent name (e.g., `Frame 2018777065`
   → `ScrollRegion`). Present the suggested names to the user.
4. **Build a full structural tree** with layout properties at every level:
   - Layout mode (row/column), padding (all 4 sides), gap, sizing mode
   - borderRadius, fills, effects
   - Dimensions for fixed-size elements
5. **Report inconsistencies as actionable findings** — not passive observations:
   - Unused gap values (gap: 10 when only 1 child)
   - Inconsistent borderRadius across siblings
   - Mixed sizing modes (fill vs fixed) on siblings that should match
   - Properties that would cause overflow or stacking issues in code

### Step 4 — Align

Present findings to the user with:
- The complete node tree (renamed)
- Each inconsistency as a numbered finding with a recommendation
- Answers to the original design questions, citing specific Figma node IDs and
  layout var names as evidence

The user confirms, adjusts, or overrides. **Re-fetch after the user applies fixes**
to verify the changes landed correctly.

### Step 5 — Document

Update `AGENTS.md` rules and/or `docs/atomic/` specs BEFORE writing any code.
The documentation IS the implementation contract. If the contract is wrong,
the code will be wrong.

### Step 6 — Implement

Code changes follow the documented contract. Every spacing value, padding
direction, and structural decision has a Figma node reference and a user
confirmation behind it.

### Step 7 — Compare

Screenshot the Storybook output and compare against the Figma reference image.
Discrepancies go back to Step 4 (not Step 1 — the design is already confirmed).

### Anti-pattern this replaces

| Old pattern | Problem | New pattern |
|---|---|---|
| Read code → guess padding model → implement | Assumptions cause padding stacking, doubled spacing, wrong ownership | Figma organism → extract → align → document → implement |
| Add maxHeight from "best practice" | Content caps are design decisions, not engineering defaults | Ask user to confirm in Figma → extract confirmed value |
| Name code structures arbitrarily | Figma and code vocabularies diverge, causing miscommunication | Agent proposes code-equivalent names → user applies in Figma → shared vocabulary |
| Fix Figma inconsistencies silently in code | Design file stays broken; next extraction re-introduces the bug | Report inconsistencies to user → user fixes in Figma → re-verify |

### Blind spot this closes

| Blind spot id | What it guards |
|---|---|
| `structural-inspection-before-implementation` | Any new layout/scroll/padding pattern must have a Figma organism inspected and confirmed before code is written |
| `unnamed-frames-renamed` | Every Figma frame used in the extraction must have a code-equivalent name agreed between agent and user |
| `inconsistencies-reported-not-assumed` | Figma inconsistencies (unused gaps, mixed sizing, extra borderRadius) must be reported as findings, not silently worked around |
| `re-fetch-after-user-fixes` | After the user applies Figma fixes, agent must re-fetch via MCP to verify — never assume the fix landed |

> **Origin:** User direction 2026-06-10: *"look at everything one more time going
> into extreme detail in the Figma and then document all aspects you find so then
> you can compare against the code."* Five prior audit rounds missed row height,
> elevation, badge slot, disabled state, chevron slot on leaf items, icon slot
> borderRadius, and panel padding model — all because the agent selectively
> extracted colors and fonts only. This procedure closes that class of error.

> All command prompt files live in `.github/prompts/`. Type `/commands` in any chat for the full index.

## Artifacts

| Path | Role |
|------|------|
| `docs/atomic/_TEMPLATE.spec.md` | canonical schema (copy per element) |
| `docs/atomic/<level>/<el>.spec.md` | element spec of record |
| `docs/evidence/<slug>/` | Figma + Storybook captures, `verdict.md`, signed bundle |
| `docs/evidence/baseline.json` | evidence baseline |
| `scripts/audit-specs.js` | completeness checker (in `npm run health`) |
| `docs/actionmenu-figma-spec.md` | ActionMenu deep-dive narrative (reference) |
